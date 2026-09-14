export interface CosmicTheme {
  id: string;
  name: string;
  colors: {
    bg: [number, number, number];
    nebulaPrimary: [number, number, number];
    nebulaSecondary: [number, number, number];
    nebulaHighlight: [number, number, number];
    starColors: string[];
  };
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  intensity: number;
  decay: number;
}

export interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  baseSize: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  vx: number;
  vy: number;
  hasSpikes?: boolean;
  energyGlow?: number;
}

export interface CosmicSpark {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  vx: number;
  vy: number;
}

export interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  thickness: number;
  opacity: number;
  decay: number;
  color: string;
}
