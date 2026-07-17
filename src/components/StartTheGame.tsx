import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audio } from '../utils/audio';

interface StartTheGameProps {
  level: number;
  onAnimationComplete: () => void;
}

export const StartTheGame: React.FC<StartTheGameProps> = ({ level, onAnimationComplete }) => {
  const isBoss = level % 10 === 0;

  const onAnimationCompleteRef = React.useRef(onAnimationComplete);
  useEffect(() => {
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  useEffect(() => {
    // Play a start sound if available or a click
    audio.playClick();
    
    // Auto complete the intro after 2 seconds
    const timer = setTimeout(() => {
      onAnimationCompleteRef.current();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Decorative Diagonal Background Stripes */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900" />
      
      <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f43f5e 2px, transparent 2px)', backgroundSize: '24px 24px' }} />
      
      {/* Laser strike beam in background */}
      <motion.div 
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 1.2, 1], opacity: [0, 0.8, 0.4] }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`absolute h-24 left-0 right-0 ${isBoss ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.8)]' : 'bg-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.8)]'} rotate-[-6deg]`}
      />

      {/* Main text animation */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        
        {/* Level Tag */}
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 220, damping: 15 }}
          className="bg-black/80 px-6 py-1.5 rounded-full border-2 border-white/10 text-white font-black text-sm uppercase tracking-widest shadow-lg flex items-center gap-2"
        >
          {isBoss ? '👑 DESTRUCTIVE BOSS' : '🧩 PUZZLE MAZE'} • STAGE {level}
        </motion.div>

        {/* Big Slash Text "BATTLE START" */}
        <div className="relative overflow-visible my-4">
          <motion.h1
            initial={{ scale: 0.2, rotate: -15, opacity: 0 }}
            animate={{ scale: [0.2, 1.4, 1], rotate: [-15, -4, -4], opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`text-6xl md:text-7xl font-black uppercase tracking-wider text-center ${
              isBoss 
                ? 'text-red-500 drop-shadow-[0_4px_0_#450a0a]' 
                : 'text-yellow-400 drop-shadow-[0_4px_0_#451a03]'
            } font-sans`}
            style={{ WebkitTextStroke: '3px black' }}
          >
            {isBoss ? 'VS BOSS!' : 'BATTLE START!'}
          </motion.h1>
          
          {/* Neon Glow behind */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 0.8, 0], scale: 1.2 }}
            transition={{ duration: 1.2, repeat: Infinity, repeatType: 'loop' }}
            className={`absolute inset-0 -z-10 blur-xl filter ${isBoss ? 'bg-red-500' : 'bg-amber-400'} rounded-full`}
          />
        </div>

        {/* Usagyuuun cute helper label */}
        <motion.p
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-gray-300 font-bold text-center text-sm md:text-base tracking-wide flex items-center gap-2 px-4"
        >
          <span>🐰</span> Usagyuuun is powering up! Match 3 tiles to strike!
        </motion.p>
      </div>

      {/* Screen slash/sweep visual overlays */}
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{ duration: 0.9, ease: 'easeInOut' }}
        className="absolute top-0 bottom-0 left-0 w-1/3 bg-white/10 skew-x-[-20deg] pointer-events-none z-20"
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: '-100%' }}
        transition={{ duration: 0.9, ease: 'easeInOut', delay: 0.1 }}
        className="absolute top-0 bottom-0 right-0 w-1/4 bg-white/5 skew-x-[-20deg] pointer-events-none z-20"
      />
    </div>
  );
};
