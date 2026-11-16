;; Micro-module WebAssembly Text Format (.wat) — Somme de contrôle Adler-32
(module
  (memory (export "memory") 1)

  ;; Calcule Adler-32 sur `len` octets situés à l'adresse 0
  (func (export "adler32") (param $len i32) (result i32)
    (local $a i32)
    (local $b i32)
    (local $i i32)
    (local $mod i32)

    (local.set $a (i32.const 1))
    (local.set $b (i32.const 0))
    (local.set $i (i32.const 0))
    (local.set $mod (i32.const 65521))

    (block $break
      (loop $loop
        (br_if $break (i32.ge_u (local.get $i) (local.get $len)))
        (local.set $a
          (i32.rem_u
            (i32.add (local.get $a) (i32.load8_u (local.get $i)))
            (local.get $mod)))
        (local.set $b
          (i32.rem_u
            (i32.add (local.get $b) (local.get $a))
            (local.get $mod)))
        (local.set $i (i32.add (local.get $i) (i32.const 1)))
        (br $loop)
      )
    )

    (i32.or
      (i32.shl (local.get $b) (i32.const 16))
      (local.get $a))
  )
)
