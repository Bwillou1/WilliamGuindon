import { useState, useEffect, useCallback } from 'react';
import { CosmicCanvas } from './components/CosmicCanvas';
import { ControlsDock } from './components/ControlsDock';
import { COSMIC_THEMES } from './utils/themes';
import { cosmicAudio } from './utils/ambientAudio';

export default function App() {
  const [currentTheme, setCurrentTheme] = useState(COSMIC_THEMES[0]);
  const [warpSpeed, setWarpSpeed] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  const handleToggleAudio = useCallback(() => {
    const newState = cosmicAudio.toggle();
    setIsAudioActive(newState);
  }, []);

  const [pulseTrigger, setPulseTrigger] = useState(0);

  const handleTriggerPulse = useCallback(() => {
    setPulseTrigger((prev) => prev + 1);
  }, []);

  // Keyboard controls for power users (zero text UI)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setWarpSpeed((prev) => !prev);
      } else if (e.code === 'KeyC') {
        setCurrentTheme((prev) => {
          const idx = COSMIC_THEMES.findIndex((t) => t.id === prev.id);
          return COSMIC_THEMES[(idx + 1) % COSMIC_THEMES.length];
        });
      } else if (e.code === 'KeyM') {
        handleToggleAudio();
      } else if (e.code === 'KeyF') {
        handleToggleFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [handleToggleAudio, handleToggleFullscreen]);

  return (
    <main
      id="cosmic-experience-app"
      className="relative w-screen h-screen overflow-hidden bg-[#020205] select-none"
    >
      {/* Background Interactive Cosmic Canvas */}
      <CosmicCanvas
        theme={currentTheme}
        warpSpeed={warpSpeed}
        pulseTrigger={pulseTrigger}
      />

      {/* Ultra-minimalist Glass Controls Dock (strictly no text) */}
      <ControlsDock
        currentTheme={currentTheme}
        allThemes={COSMIC_THEMES}
        onSelectTheme={setCurrentTheme}
        warpSpeed={warpSpeed}
        onToggleWarp={() => setWarpSpeed((prev) => !prev)}
        onTriggerPulse={handleTriggerPulse}
        isAudioActive={isAudioActive}
        onToggleAudio={handleToggleAudio}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />
    </main>
  );
}
