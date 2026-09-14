import React from 'react';
import {
  Palette,
  Zap,
  Radio,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CosmicTheme } from '../types';

interface ControlsDockProps {
  currentTheme: CosmicTheme;
  allThemes: CosmicTheme[];
  onSelectTheme: (theme: CosmicTheme) => void;
  warpSpeed: boolean;
  onToggleWarp: () => void;
  onTriggerPulse: () => void;
  isAudioActive: boolean;
  onToggleAudio: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const ControlsDock: React.FC<ControlsDockProps> = ({
  currentTheme,
  allThemes,
  onSelectTheme,
  warpSpeed,
  onToggleWarp,
  onTriggerPulse,
  isAudioActive,
  onToggleAudio,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const cycleNextTheme = () => {
    const currentIndex = allThemes.findIndex((t) => t.id === currentTheme.id);
    const nextIndex = (currentIndex + 1) % allThemes.length;
    onSelectTheme(allThemes[nextIndex]);
  };

  return (
    <div
      id="cosmic-controls-dock"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 hover:border-white/20 hover:bg-black/60"
    >
      {/* Theme Cycle Button */}
      <button
        id="btn-cycle-theme"
        type="button"
        onClick={cycleNextTheme}
        className="relative p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        aria-label="Cycle Palette"
      >
        <Palette className="w-4 h-4" />
        <span
          className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ring-1 ring-black"
          style={{
            backgroundColor: `rgb(${currentTheme.colors.nebulaHighlight.map((c) => Math.round(c * 255)).join(',')})`,
          }}
        />
      </button>

      {/* Warp Speed Toggle Button */}
      <button
        id="btn-toggle-warp"
        type="button"
        onClick={onToggleWarp}
        className={`p-2.5 rounded-full active:scale-95 transition-all ${
          warpSpeed
            ? 'text-cyan-300 bg-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.5)] ring-1 ring-cyan-400/40'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
        aria-label="Toggle Warp Speed"
      >
        <Zap className="w-4 h-4" />
      </button>

      {/* Cosmic Shockwave Pulse Button */}
      <button
        id="btn-trigger-pulse"
        type="button"
        onClick={onTriggerPulse}
        className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]"
        aria-label="Trigger Shockwave"
      >
        <Radio className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-4 bg-white/10 mx-0.5" />

      {/* Cosmic Audio Ambient Toggle */}
      <button
        id="btn-toggle-audio"
        type="button"
        onClick={onToggleAudio}
        className={`p-2.5 rounded-full active:scale-95 transition-all ${
          isAudioActive
            ? 'text-indigo-300 bg-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.5)] ring-1 ring-indigo-400/40'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
        aria-label="Toggle Ambient Audio"
      >
        {isAudioActive ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4 opacity-50" />
        )}
      </button>

      {/* Fullscreen Toggle */}
      <button
        id="btn-toggle-fullscreen"
        type="button"
        onClick={onToggleFullscreen}
        className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
        aria-label="Toggle Fullscreen"
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};
