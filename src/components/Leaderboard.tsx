import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getHighScoreLeaderboard, LeaderboardEntry } from '../utils/firebase';

interface LeaderboardProps {
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getHighScoreLeaderboard().then(data => {
      if (active) {
        setEntries(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-900 border-8 border-yellow-400 p-5 md:p-6 rounded-3xl w-full max-w-md h-[80vh] flex flex-col shadow-2xl relative text-white"
      >
        <button 
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 rounded-full border-4 border-white text-white font-black text-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          X
        </button>

        <div className="text-center mb-4">
          <div className="text-4xl">🏆</div>
          <h2 className="text-2xl md:text-3xl font-black text-yellow-400 tracking-wider uppercase">HALL OF GYUUUN</h2>
          <p className="text-[10px] md:text-xs text-yellow-200 font-bold tracking-widest mt-1">TOP 100 ANIMAL FIGHTERS</p>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-yellow-400 font-bold text-sm tracking-widest animate-pulse">LOADING CODES...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-slate-800">
            {entries.length === 0 ? (
              <div className="text-center py-12 text-gray-500 font-bold">
                No high scores yet! Be the first!
              </div>
            ) : (
              entries.map((entry, index) => {
                const rank = index + 1;
                let rankBadge = `${rank}`;
                let rankBg = "bg-slate-800/80 border-slate-700 text-slate-300";

                if (rank === 1) {
                  rankBadge = "🥇";
                  rankBg = "bg-yellow-500/25 border-yellow-400 text-yellow-300 font-black shadow-[0_0_8px_rgba(234,179,8,0.4)]";
                } else if (rank === 2) {
                  rankBadge = "🥈";
                  rankBg = "bg-slate-300/20 border-slate-300 text-slate-200 font-black";
                } else if (rank === 3) {
                  rankBadge = "🥉";
                  rankBg = "bg-amber-700/25 border-amber-600 text-amber-400 font-black";
                }

                return (
                  <div 
                    key={entry.id || index}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all ${rankBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm">
                        {rankBadge}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-white line-clamp-1">{entry.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold">LVL {entry.level}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="font-mono font-black text-yellow-400 text-sm md:text-base">
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            Your name is saved in local memory
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
