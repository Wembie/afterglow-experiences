import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ParticlePresetName } from '../engine/schema';
import { ParticleEngine } from './ParticleEngine';

const ParticlesContext = createContext<ParticleEngine | null>(null);

/** Access to the shared particle engine (null when canvas is unavailable). */
export function useParticles(): ParticleEngine | null {
  return useContext(ParticlesContext);
}

interface Props {
  preset: ParticlePresetName;
  colors: string[];
  reduced: boolean;
  quality: 'high' | 'low';
  children: ReactNode;
}

/**
 * Fixed decorative canvas behind the scenes. It never receives pointer events
 * (it listens on window), so it can never block scrolling or clicks.
 */
export function ParticleField({ preset, colors, reduced, quality, children }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<ParticleEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvas.getContext('2d')) return;
    let instance: ParticleEngine | null = null;
    try {
      instance = new ParticleEngine(canvas);
    } catch {
      return; // Decorative only; the experience works without it.
    }
    setEngine(instance);
    return () => {
      instance?.destroy();
      setEngine(null);
    };
  }, []);

  const colorKey = colors.join(',');
  useEffect(() => {
    engine?.configure({ preset, colors: colorKey.split(','), reduced, quality });
  }, [engine, preset, colorKey, reduced, quality]);

  return (
    <ParticlesContext.Provider value={engine}>
      <canvas ref={canvasRef} className="particle-field" aria-hidden="true" />
      {children}
    </ParticlesContext.Provider>
  );
}
