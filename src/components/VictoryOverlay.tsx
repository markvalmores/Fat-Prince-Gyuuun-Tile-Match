import React from 'react';
import { motion } from 'motion/react';
import { Star, Trophy, ArrowRight, Home } from 'lucide-react';

interface VictoryOverlayProps {
  level: number;
  score: number;
  carrots: number;
  stars: number;
  onNext: () => void;
  onHome: () => void;
}

export const VictoryOverlay: React.FC<VictoryOverlayProps> = ({ level, score, carrots, stars, onNext, onHome }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm bg-slate-900 border-4 border-yellow-400 rounded-[2.5rem] p-8 shadow-[0_0_50px_rgba(250,204,21,0.3)] relative overflow-hidden"
      >
        {/* Confetti-like background accents */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-sky-400/10 rounded-full blur-3xl" />

        <div className="text-center relative z-10">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black text-white tracking-tighter mb-1 drop-shadow-lg">VICTORY!</h2>
            <p className="text-yellow-400 font-black text-sm tracking-[0.2em] uppercase">Level {level} Cleared</p>
          </motion.div>

          {/* Stars Section */}
          <div className="flex justify-center gap-2 my-8">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3 + (s * 0.15), type: 'spring' }}
              >
                <Star 
                  size={48} 
                  className={s <= stars ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" : "text-slate-700"} 
                />
              </motion.div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="space-y-4 mb-10">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-black/40 border border-white/10 rounded-2xl p-4 flex justify-between items-center"
            >
              <div className="text-left">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Final Score</p>
                <p className="text-2xl font-black text-white leading-none">{score.toLocaleString()}</p>
              </div>
              <Trophy className="text-yellow-400" size={32} />
            </motion.div>

            <motion.div 
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.0 }}
              className="bg-black/40 border border-white/10 rounded-2xl p-4 flex justify-between items-center"
            >
              <div className="text-left">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Carrots Earned</p>
                <p className="text-2xl font-black text-orange-400 leading-none">+{carrots.toLocaleString()}</p>
              </div>
              <span className="text-3xl">🥕</span>
            </motion.div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-1 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              className="w-full py-5 bg-sky-500 text-white rounded-2xl font-black text-xl shadow-[0_6px_0_rgb(12,146,196)] border-b-2 border-white/20 flex items-center justify-center gap-3 active:translate-y-1 active:shadow-none transition-all"
            >
              NEXT LEVEL <ArrowRight size={24} />
            </motion.button>

            <button 
              onClick={onHome}
              className="w-full py-4 text-gray-400 font-black text-sm tracking-widest uppercase hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Home size={18} /> Back to Map
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
