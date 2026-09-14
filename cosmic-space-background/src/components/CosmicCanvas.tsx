import React, { useEffect, useRef } from 'react';
import { CosmicTheme, Shockwave } from '../types';
import { FRAGMENT_SHADER_SOURCE, VERTEX_SHADER_SOURCE } from '../shaders/nebulaShader';
import { cosmicAudio } from '../utils/ambientAudio';

interface CosmicCanvasProps {
  theme: CosmicTheme;
  warpSpeed: boolean;
  pulseTrigger?: number;
  onShockwaveTrigger?: () => void;
}

export const CosmicCanvas: React.FC<CosmicCanvasProps> = ({
  theme,
  warpSpeed,
  pulseTrigger,
  onShockwaveTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);

  // Interaction refs
  const mouseRef = useRef({
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5,
    targetX: window.innerWidth * 0.5,
    targetY: window.innerHeight * 0.5,
    speed: 0,
    isDown: false,
  });

  const shockwavesRef = useRef<Shockwave[]>([]);
  const warpFactorRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Create shockwave ripple
  const triggerShockwave = (x: number, y: number) => {
    shockwavesRef.current.push({
      x,
      y,
      radius: 0,
      maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.85,
      speed: 12,
      intensity: 0.9,
      decay: 0.009,
    });

    // Cosmic audio pulse
    cosmicAudio.triggerShockwavePulse(0.85);
    onShockwaveTrigger?.();
  };

  useEffect(() => {
    if (pulseTrigger) {
      triggerShockwave(window.innerWidth * 0.5, window.innerHeight * 0.5);
    }
  }, [pulseTrigger]);

  // Main rendering loop for WebGL fluid cosmic nebula
  useEffect(() => {
    const glCanvas = webglCanvasRef.current;
    if (!glCanvas) return;

    // WebGL setup
    const gl = glCanvas.getContext('webgl2', {
      powerPreference: 'high-performance',
      alpha: false,
      antialias: false,
    });

    if (!gl) return;

    // Compile shaders
    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vert = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const frag = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vert || !frag) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Quad geometry
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uMouseSpeed = gl.getUniformLocation(program, 'u_mouse_speed');
    const uBg = gl.getUniformLocation(program, 'u_bg');
    const uPrimary = gl.getUniformLocation(program, 'u_primary');
    const uSecondary = gl.getUniformLocation(program, 'u_secondary');
    const uHighlight = gl.getUniformLocation(program, 'u_highlight');
    const uShockPos = gl.getUniformLocation(program, 'u_shock_pos');
    const uShockRadius = gl.getUniformLocation(program, 'u_shock_radius');
    const uShockIntensity = gl.getUniformLocation(program, 'u_shock_intensity');
    const uWarpFactor = gl.getUniformLocation(program, 'u_warp_factor');

    // Handle viewport resize (capped DPR for optimal 60fps performance on high-DPI displays)
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = window.innerWidth;
      const h = window.innerHeight;

      glCanvas.width = Math.floor(w * dpr);
      glCanvas.height = Math.floor(h * dpr);
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const startTime = performance.now();

    const render = (time: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const elapsed = (time - startTime) * 0.001;

      // Smooth mouse tracking with heavy, silky cinematic inertia
      const mouse = mouseRef.current;
      const dx = mouse.targetX - mouse.x;
      const dy = mouse.targetY - mouse.y;
      mouse.x += dx * 0.022;
      mouse.y += dy * 0.022;

      const instantSpeed = Math.sqrt(dx * dx + dy * dy);
      mouse.speed += (instantSpeed - mouse.speed) * 0.04;

      // Warp speed factor transition
      const targetWarp = warpSpeed || mouse.isDown ? 1.0 : 0.0;
      warpFactorRef.current += (targetWarp - warpFactorRef.current) * 0.05;
      const currentWarp = warpFactorRef.current;

      // Update shockwaves
      const activeShockwaves = shockwavesRef.current;
      let primaryShock: Shockwave | null = null;

      for (let i = activeShockwaves.length - 1; i >= 0; i--) {
        const sw = activeShockwaves[i];
        sw.radius += sw.speed;
        sw.intensity -= sw.decay;

        if (!primaryShock || sw.intensity > primaryShock.intensity) {
          primaryShock = sw;
        }

        if (sw.intensity <= 0 || sw.radius >= sw.maxRadius) {
          activeShockwaves.splice(i, 1);
        }
      }

      // Render WebGL Cosmic Fluid Nebula
      gl.useProgram(program);
      gl.uniform2f(uResolution, glCanvas.width, glCanvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uMouse, mouse.x * (glCanvas.width / width), (height - mouse.y) * (glCanvas.height / height));
      gl.uniform1f(uMouseSpeed, Math.min(mouse.speed * 0.015, 1.0));

      const c = theme.colors;
      gl.uniform3f(uBg, c.bg[0], c.bg[1], c.bg[2]);
      gl.uniform3f(uPrimary, c.nebulaPrimary[0], c.nebulaPrimary[1], c.nebulaPrimary[2]);
      gl.uniform3f(uSecondary, c.nebulaSecondary[0], c.nebulaSecondary[1], c.nebulaSecondary[2]);
      gl.uniform3f(uHighlight, c.nebulaHighlight[0], c.nebulaHighlight[1], c.nebulaHighlight[2]);

      if (primaryShock) {
        const normX = primaryShock.x * (glCanvas.width / width);
        const normY = (height - primaryShock.y) * (glCanvas.height / height);
        const normRadius = primaryShock.radius / Math.min(width, height);
        gl.uniform2f(uShockPos, normX, normY);
        gl.uniform1f(uShockRadius, normRadius);
        gl.uniform1f(uShockIntensity, primaryShock.intensity);
      } else {
        gl.uniform1f(uShockIntensity, 0.0);
      }

      gl.uniform1f(uWarpFactor, currentWarp);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    };
  }, [theme, warpSpeed]);

  // Pointer & Touch handlers
  const handlePointerMove = (e: React.PointerEvent) => {
    mouseRef.current.targetX = e.clientX;
    mouseRef.current.targetY = e.clientY;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    mouseRef.current.isDown = true;
    triggerShockwave(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    mouseRef.current.isDown = false;
  };

  return (
    <div
      id="cosmic-canvas-container"
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="fixed inset-0 w-full h-full cursor-crosshair overflow-hidden touch-none select-none bg-[#020205]"
    >
      <canvas
        id="nebula-gl-canvas"
        ref={webglCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
