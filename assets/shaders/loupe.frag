// Fragment Shader WebGL (GLSL) — Loupe optique x2.4 + netteté locale
precision highp float;

varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_mouse;
uniform vec2 u_resolution;
uniform float u_active;
uniform float u_zoom;

void main() {
  vec4 base = texture2D(u_tex, v_uv);
  if (u_active < 0.5) {
    gl_FragColor = base;
    return;
  }

  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 delta = v_uv - u_mouse;
  vec2 deltaAspect = vec2(delta.x * aspect, delta.y);
  float dist = length(deltaAspect);
  float radius = 0.16;

  if (dist < radius) {
    vec2 zoomedUv = clamp(u_mouse + delta / max(u_zoom, 1.0), 0.0, 1.0);
    vec2 px = 1.0 / max(u_resolution, vec2(1.0));
    vec4 center = texture2D(u_tex, zoomedUv);
    vec4 blur = (
      texture2D(u_tex, zoomedUv + vec2(px.x, 0.0)) +
      texture2D(u_tex, zoomedUv - vec2(px.x, 0.0)) +
      texture2D(u_tex, zoomedUv + vec2(0.0, px.y)) +
      texture2D(u_tex, zoomedUv - vec2(0.0, px.y))
    ) * 0.25;
    vec4 sharpened = clamp(center + (center - blur) * 0.45, 0.0, 1.0);
    float ring = smoothstep(radius - 0.008, radius - 0.002, dist);
    gl_FragColor = mix(sharpened, vec4(0.06, 0.72, 0.50, 1.0), ring * 0.85);
  } else {
    gl_FragColor = base;
  }
}
