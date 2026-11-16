#![no_std]

use core::panic::PanicInfo;

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {}
}

/// Tampon partagé de 64 Ko entre JavaScript et WebAssembly (évite tout allocateur dynamique).
const BUF_CAP: usize = 65536;
static mut SHARED_BUF: [u8; BUF_CAP] = [0u8; BUF_CAP];

#[no_mangle]
pub extern "C" fn wg_buffer_ptr() -> *mut u8 {
    unsafe { core::ptr::addr_of_mut!(SHARED_BUF) as *mut u8 }
}

#[no_mangle]
pub extern "C" fn wg_buffer_cap() -> usize {
    BUF_CAP
}

/// Constantes SHA-256 (FIPS 180-4)
const K: [u32; 64] = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

struct Sha256State {
    h: [u32; 8],
    block: [u8; 64],
    block_len: usize,
    total_len: u64,
}

static mut SHA_STATE: Sha256State = Sha256State {
    h: [0; 8],
    block: [0; 64],
    block_len: 0,
    total_len: 0,
};

#[inline(always)]
fn compress_block(h: &mut [u32; 8], block: &[u8; 64]) {
    let mut w = [0u32; 64];
    let mut i = 0;
    while i < 16 {
        let j = i * 4;
        w[i] = ((block[j] as u32) << 24)
            | ((block[j + 1] as u32) << 16)
            | ((block[j + 2] as u32) << 8)
            | (block[j + 3] as u32);
        i += 1;
    }
    while i < 64 {
        let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
        let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
        w[i] = w[i - 16].wrapping_add(s0).wrapping_add(w[i - 7]).wrapping_add(s1);
        i += 1;
    }

    let [mut a, mut b, mut c, mut d, mut e, mut f, mut g, mut hh] = *h;
    let mut t = 0;
    while t < 64 {
        let s1 = e.rotate_right(6) ^ e.rotate_right(11) ^ e.rotate_right(25);
        let ch = (e & f) ^ ((!e) & g);
        let temp1 = hh
            .wrapping_add(s1)
            .wrapping_add(ch)
            .wrapping_add(K[t])
            .wrapping_add(w[t]);
        let s0 = a.rotate_right(2) ^ a.rotate_right(13) ^ a.rotate_right(22);
        let maj = (a & b) ^ (a & c) ^ (b & c);
        let temp2 = s0.wrapping_add(maj);

        hh = g;
        g = f;
        f = e;
        e = d.wrapping_add(temp1);
        d = c;
        c = b;
        b = a;
        a = temp1.wrapping_add(temp2);
        t += 1;
    }

    h[0] = h[0].wrapping_add(a);
    h[1] = h[1].wrapping_add(b);
    h[2] = h[2].wrapping_add(c);
    h[3] = h[3].wrapping_add(d);
    h[4] = h[4].wrapping_add(e);
    h[5] = h[5].wrapping_add(f);
    h[6] = h[6].wrapping_add(g);
    h[7] = h[7].wrapping_add(hh);
}

/// Initialise un calcul SHA-256 en flux.
#[no_mangle]
pub extern "C" fn wg_sha256_init() {
    unsafe {
        SHA_STATE.h = [
            0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
            0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
        ];
        SHA_STATE.block_len = 0;
        SHA_STATE.total_len = 0;
    }
}

/// Met à jour le hachage SHA-256 avec `len` octets lus depuis `SHARED_BUF`.
#[no_mangle]
pub extern "C" fn wg_sha256_update(len: usize) {
    let n = if len > BUF_CAP { BUF_CAP } else { len };
    unsafe {
        let state = &mut *core::ptr::addr_of_mut!(SHA_STATE);
        let buf = &*core::ptr::addr_of!(SHARED_BUF);
        state.total_len = state.total_len.wrapping_add(n as u64);

        let mut idx = 0;
        while idx < n {
            state.block[state.block_len] = buf[idx];
            state.block_len += 1;
            if state.block_len == 64 {
                compress_block(&mut state.h, &state.block);
                state.block_len = 0;
            }
            idx += 1;
        }
    }
}

/// Finalise le hachage SHA-256 et écrit les 32 octets du condensat au début de `SHARED_BUF`.
#[no_mangle]
pub extern "C" fn wg_sha256_final() {
    unsafe {
        let state = &mut *core::ptr::addr_of_mut!(SHA_STATE);
        let bit_len = state.total_len.wrapping_mul(8);

        state.block[state.block_len] = 0x80;
        state.block_len += 1;

        if state.block_len > 56 {
            while state.block_len < 64 {
                state.block[state.block_len] = 0;
                state.block_len += 1;
            }
            compress_block(&mut state.h, &state.block);
            state.block_len = 0;
        }

        while state.block_len < 56 {
            state.block[state.block_len] = 0;
            state.block_len += 1;
        }

        let len_bytes = bit_len.to_be_bytes();
        let mut i = 0;
        while i < 8 {
            state.block[56 + i] = len_bytes[i];
            i += 1;
        }
        compress_block(&mut state.h, &state.block);

        let buf = &mut *core::ptr::addr_of_mut!(SHARED_BUF);
        let mut w_idx = 0;
        while w_idx < 8 {
            let b = state.h[w_idx].to_be_bytes();
            buf[w_idx * 4] = b[0];
            buf[w_idx * 4 + 1] = b[1];
            buf[w_idx * 4 + 2] = b[2];
            buf[w_idx * 4 + 3] = b[3];
            w_idx += 1;
        }
    }
}

/// Empreinte FNV-1a 32 bits rapide sur les `len` premiers octets de `SHARED_BUF`.
#[no_mangle]
pub extern "C" fn wg_fnv1a_32(len: usize) -> u32 {
    let n = if len > BUF_CAP { BUF_CAP } else { len };
    let mut hash: u32 = 0x811c9dc5;
    unsafe {
        let buf = &*core::ptr::addr_of!(SHARED_BUF);
        let mut i = 0;
        while i < n {
            hash ^= buf[i] as u32;
            hash = hash.wrapping_mul(0x01000193);
            i += 1;
        }
    }
    hash
}

#[inline(always)]
fn to_ascii_lower(b: u8) -> u8 {
    if b >= b'A' && b <= b'Z' { b + 32 } else { b }
}

/// Compte les occurrences insensibles à la casse ASCII d'un motif dans `SHARED_BUF`.
#[no_mangle]
pub extern "C" fn wg_count_term_ci(haystack_len: usize, needle_offset: usize, needle_len: usize) -> u32 {
    if needle_len == 0 || haystack_len < needle_len || needle_offset + needle_len > BUF_CAP || haystack_len > needle_offset {
        return 0;
    }
    let mut count: u32 = 0;
    unsafe {
        let buf = &*core::ptr::addr_of!(SHARED_BUF);
        let limit = haystack_len - needle_len;
        let mut i = 0;
        while i <= limit {
            let mut j = 0;
            let mut matched = true;
            while j < needle_len {
                if to_ascii_lower(buf[i + j]) != to_ascii_lower(buf[needle_offset + j]) {
                    matched = false;
                    break;
                }
                j += 1;
            }
            if matched {
                count += 1;
                i += needle_len;
            } else {
                i += 1;
            }
        }
    }
    count
}
