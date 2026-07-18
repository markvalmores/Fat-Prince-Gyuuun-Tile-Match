import React from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Home, Skull } from 'lucide-react';

interface DefeatOverlayProps {
  level: number;
  score: number;
  onRetry: () => void;
  onHome: () => void;
}

export const DefeatOverlay: React.FC<DefeatOverlayProps> = ({ level, score, onRetry, onHome }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[300] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-slate-950 border-4 border-red-600 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(220,38,38,0.3)] relative overflow-hidden"
      >
        {/* Dark background accents */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-900/20 rounded-full blur-3xl" />

        <div className="text-center relative z-10">
          <motion.div
            animate={{ 
              rotate: [0, -2, 2, -2, 2, 0],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 4,
              ease: "easeInOut"
            }}
            className="mb-6 flex justify-center"
          >
            <div className="bg-red-600/20 p-6 rounded-full border-2 border-red-600/30">
              <Skull size={64} className="text-red-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black text-white tracking-tighter mb-1 uppercase">DEFEATED</h2>
            <p className="text-red-500 font-black text-sm tracking-[0.2em] uppercase">Level {level} Failed</p>
          </motion.div>

          <div className="my-8 space-y-4">
             <div className="bg-black/60 border border-white/5 rounded-2xl p-6">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Final Score</p>
                <p className="text-3xl font-black text-white leading-none">{score.toLocaleString()}</p>
             </div>
             <p className="text-gray-400 text-xs font-medium px-4">
                "Don't give up! The Prince needs more carrots to maintain his power."
             </p>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(153,27,27)] border-b-2 border-white/20 flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none transition-all"
            >
              RETRY LEVEL <RotateCcw size={24} />
            </motion.button>

            <button 
              onClick={onHome}
              className="w-full py-4 text-gray-500 font-black text-sm tracking-widest uppercase hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Home size={18} /> Back to Map
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
