/* Moteur C compilé en WebAssembly : calcul CRC-32 (IEEE 802.3) en flux pour archives ZIP */
#include <stdint.h>
#include <stddef.h>

#define WG_C_BUF_CAP 65536u

static uint8_t wg_c_buf[WG_C_BUF_CAP];

uint8_t* wg_c_buffer_ptr(void) {
  return wg_c_buf;
}

uint32_t wg_c_buffer_cap(void) {
  return WG_C_BUF_CAP;
}

uint32_t wg_crc32_update(uint32_t crc, uint32_t len) {
  if (len > WG_C_BUF_CAP) {
    len = WG_C_BUF_CAP;
  }
  crc = ~crc;
  for (uint32_t i = 0; i < len; i++) {
    crc ^= (uint32_t)wg_c_buf[i];
    for (int b = 0; b < 8; b++) {
      uint32_t mask = (uint32_t)(-(int32_t)(crc & 1u));
      crc = (crc >> 1) ^ (0xEDB88320u & mask);
    }
  }
  return ~crc;
}
