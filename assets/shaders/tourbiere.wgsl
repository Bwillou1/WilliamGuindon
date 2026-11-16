// Shader WebGPU (WGSL) — Visualisation hydrologique et topographique
// Grande Tourbière de Blainville · williamguindon.me

struct Uniforms {
  resolution: vec2<f32>,
  time: f32,
  dark: f32,
  mouse: vec2<f32>,
  _pad: vec2<f32>,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VertexOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> VertexOut {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(3.0, -1.0),
    vec2<f32>(-1.0, 3.0)
  );
  var out: VertexOut;
  let p = positions[vid];
  out.pos = vec4<f32>(p, 0.0, 1.0);
  out.uv = p * 0.5 + 0.5;
  return out;
}

fn hash21(p: vec2<f32>) -> f32 {
  let q = fract(p * vec2<f32>(123.34, 456.21));
  let r = q + dot(q, q + 45.32);
  return fract(r.x * r.y);
}

fn value_noise(p: vec2<f32>) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let s = f * f * (3.0 - 2.0 * f);
  let a = hash21(i);
  let b = hash21(i + vec2<f32>(1.0, 0.0));
  let c = hash21(i + vec2<f32>(0.0, 1.0));
  let d = hash21(i + vec2<f32>(1.0, 1.0));
  return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

fn fbm(p_in: vec2<f32>) -> f32 {
  var p = p_in;
  var v = 0.0;
  var amp = 0.5;
  for (var i = 0; i < 4; i = i + 1) {
    v = v + amp * value_noise(p);
    p = p * 2.03 + vec2<f32>(17.1, 31.7);
    amp = amp * 0.5;
  }
  return v;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  let aspect = u.resolution.x / max(u.resolution.y, 1.0);
  let p = vec2<f32>((in.uv.x - 0.5) * aspect, in.uv.y - 0.5);
  let m = vec2<f32>((u.mouse.x - 0.5) * aspect, (1.0 - u.mouse.y) - 0.5);

  let t = u.time * 0.14;
  let dist_m = length(p - m);
  let ripple = sin(dist_m * 18.0 - u.time * 2.2) * exp(-dist_m * 4.5) * 0.05;

  let elevation = fbm(p * 2.4 + vec2<f32>(t * 0.35, -t * 0.22)) + ripple;
  let contour = abs(fract(elevation * 11.0) - 0.5);
  let iso_line = 1.0 - smoothstep(0.0, 0.075, contour);

  let deep_water = select(vec3<f32>(0.91, 0.96, 0.94), vec3<f32>(0.03, 0.09, 0.08), u.dark > 0.5);
  let peat_tint = select(vec3<f32>(0.76, 0.91, 0.85), vec3<f32>(0.06, 0.22, 0.17), u.dark > 0.5);
  let line_col = select(vec3<f32>(0.05, 0.58, 0.42), vec3<f32>(0.16, 0.83, 0.60), u.dark > 0.5);

  var col = mix(deep_water, peat_tint, smoothstep(0.25, 0.78, elevation));
  col = mix(col, line_col, iso_line * 0.36);

  let vignette = smoothstep(1.25, 0.25, length(p));
  col = mix(deep_water, col, vignette);

  return vec4<f32>(col, 1.0);
}
