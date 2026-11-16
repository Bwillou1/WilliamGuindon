// Shader WebGL (GLSL Fragment) — Courbes hydrologiques et topographiques
precision highp float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_dark;
uniform vec2 u_mouse;

float hash21(vec2 p) {
  vec2 q = fract(p * vec2(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 s = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    v += amp * valueNoise(p);
    p = p * 2.03 + vec2(17.1, 31.7);
    amp *= 0.5;
  }
  return v;
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = vec2((v_uv.x - 0.5) * aspect, v_uv.y - 0.5);
  vec2 m = vec2((u_mouse.x - 0.5) * aspect, (1.0 - u_mouse.y) - 0.5);

  float t = u_time * 0.14;
  float distM = length(p - m);
  float ripple = sin(distM * 18.0 - u_time * 2.2) * exp(-distM * 4.5) * 0.05;

  float elevation = fbm(p * 2.4 + vec2(t * 0.35, -t * 0.22)) + ripple;
  float contour = abs(fract(elevation * 11.0) - 0.5);
  float isoLine = 1.0 - smoothstep(0.0, 0.075, contour);

  vec3 deepWater = mix(vec3(0.91, 0.96, 0.94), vec3(0.03, 0.09, 0.08), step(0.5, u_dark));
  vec3 peatTint  = mix(vec3(0.76, 0.91, 0.85), vec3(0.06, 0.22, 0.17), step(0.5, u_dark));
  vec3 lineCol   = mix(vec3(0.05, 0.58, 0.42), vec3(0.16, 0.83, 0.60), step(0.5, u_dark));

  vec3 col = mix(deepWater, peatTint, smoothstep(0.25, 0.78, elevation));
  col = mix(col, lineCol, isoLine * 0.36);

  float vignette = smoothstep(1.25, 0.25, length(p));
  col = mix(deepWater, col, vignette);

  gl_FragColor = vec4(col, 1.0);
}
