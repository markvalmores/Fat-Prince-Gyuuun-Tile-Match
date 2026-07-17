import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from './SettingsProvider';

interface Particle {
  id: string;
  x: number;
  y: number;
}

const ParticleContext = createContext({ emit: (x: number, y: number) => {} });

export const ParticleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const { graphicsQuality } = useSettings();

  const emit = (x: number, y: number) => {
    if (graphicsQuality === 'LowRes') return; // Disable particles for LowRes
    const count = graphicsQuality === 'HighRes' ? 20 : 10;
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: `${Date.now()}_${i}_${Math.random()}`,
      x: x + (Math.random() - 0.5) * 50,
      y: y + (Math.random() - 0.5) * 50,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 1000);
  };

  return (
    <ParticleContext.Provider value={{ emit }}>
      {children}
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 0 }}
            exit={{ opacity: 0 }}
            className="fixed w-2 h-2 bg-yellow-400 rounded-full pointer-events-none z-[9999]"
            style={{ left: p.x, top: p.y }}
          />
        ))}
      </AnimatePresence>
    </ParticleContext.Provider>
  );
};

export const useParticles = () => useContext(ParticleContext);
