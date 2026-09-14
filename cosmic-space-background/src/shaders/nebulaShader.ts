export const VERTEX_SHADER_SOURCE = `#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_SOURCE = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouse_speed;
uniform vec3 u_bg;
uniform vec3 u_primary;
uniform vec3 u_secondary;
uniform vec3 u_highlight;
uniform vec2 u_shock_pos;
uniform float u_shock_radius;
uniform float u_shock_intensity;
uniform float u_warp_factor;

// High quality 2D hash & noise
float hash(vec2 p) {
  p = 50.0 * fract(p * 0.3183099 + vec2(0.71, 0.113));
  return -1.0 + 2.0 * fract(16.0 * p.x * p.y * (p.x + p.y));
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

// 6-octave Fractal Brownian Motion for rich interstellar gas filaments
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.52;
  mat2 m = rot(0.48);
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p = m * p * 2.04 + vec2(0.18, 0.27);
    a *= 0.5;
  }
  return v;
}

// Organic fluid field sampler
float sampleField(vec2 p, float t, out vec2 outQ, out vec2 outR) {
  // Majestic slow-evolving domain warping
  vec2 q = vec2(0.0);
  q.x = fbm(p * 1.5 + vec2(t * 0.18, t * 0.09));
  q.y = fbm(p * 1.5 + vec2(-t * 0.14, t * 0.22));

  vec2 r = vec2(0.0);
  r.x = fbm(p * 1.8 + 1.25 * q + vec2(1.7, 9.2) + 0.08 * t);
  r.y = fbm(p * 1.8 + 1.25 * q + vec2(8.3, 2.8) + 0.065 * t);

  outQ = q;
  outR = r;
  return fbm(p * 1.9 + 1.35 * r);
}

void main() {
  vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec2 mouseNorm = (u_mouse - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
  vec2 shockNorm = (u_shock_pos - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);

  // Elegant, subtle gravitational lensing (dampened, cinematic, not jarring)
  vec2 toMouse = st - mouseNorm;
  float distMouse = length(toMouse);
  float grav = exp(-distMouse * 2.8) * 0.055 * (1.0 + u_mouse_speed * 0.8);
  st -= normalize(toMouse + 0.0001) * grav;

  // Cinematic shockwave ripple with subtle chromatic dispersion
  float shockRefract = 0.0;
  float shockGlow = 0.0;
  if (u_shock_intensity > 0.001) {
    vec2 toShock = st - shockNorm;
    float dShock = length(toShock);
    float diff = abs(dShock - u_shock_radius);
    float wave = exp(-diff * diff * 90.0) * u_shock_intensity;
    st -= normalize(toShock + 0.0001) * wave * 0.09;
    shockRefract = wave * 0.035;
    shockGlow = exp(-diff * 35.0) * u_shock_intensity;
  }

  // Smooth cinematic time progression
  float t = u_time * 0.065 * (1.0 + u_warp_factor * 2.2);

  // Sample with soft chromatic offset for a cinematic optical depth
  vec2 q, r;
  float fR = sampleField(st + vec2(shockRefract * 0.6, 0.0), t, q, r);
  float fG = sampleField(st, t, q, r);
  float fB = sampleField(st - vec2(shockRefract * 0.6, 0.0), t, q, r);
  float f = (fR + fG + fB) * 0.33333;

  // Cloud density with high dynamic range and deep space contrast
  float cloudDensity = clamp((f * f * 3.8 + 0.35 * f), 0.0, 1.0);
  float coreGlow = clamp(pow(f, 3.5) * 2.4, 0.0, 1.0);
  float darkNebulaRift = smoothstep(0.1, 0.5, abs(fbm(st * 3.2 - q * 0.8)));

  // Color composition: Deep space backdrop with glowing gas filaments
  vec3 col = u_bg;
  col = mix(col, u_primary, smoothstep(0.08, 0.72, cloudDensity) * 0.72);
  col = mix(col, u_secondary, smoothstep(0.28, 0.88, cloudDensity) * 0.78);
  col = mix(col, u_highlight, coreGlow * 0.92);

  // Subtle dark cosmic rift carving through the nebula for dramatic structure
  col *= mix(0.72, 1.05, darkNebulaRift);

  // Micro-stardust cosmic grain in the gas clouds
  float microDust = pow(max(0.0, noise(st * 16.0 + q * 2.5)), 5.5) * 0.38;
  col += u_highlight * microDust;

  // Soft, breathing celestial presence around mouse (refined, not blinding)
  float mouseGlow = exp(-distMouse * 3.2) * 0.085;
  col += u_highlight * mouseGlow;

  // Shockwave luminous ion ring
  if (shockGlow > 0.001) {
    vec3 shockColor = mix(u_secondary, u_highlight, 0.75);
    col += shockColor * shockGlow * 0.5;
  }

  // Cinematic camera vignette preserving center clarity for content overlays
  float distVignette = length(v_uv - 0.5);
  float vignette = 1.0 - smoothstep(0.48, 1.35, distVignette * 1.35);
  col *= vignette;

  fragColor = vec4(col, 1.0);
}
`;
