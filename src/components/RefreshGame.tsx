import React from 'react';
import { motion } from 'motion/react';
import { audio } from '../utils/audio';

export const RefreshGame: React.FC = () => {
  return (
    <motion.button
      className="fixed bottom-6 left-6 w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center text-white border-[4px] border-black shadow-[4px_4px_0_#000] z-[100] hover:bg-slate-600 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        audio.playClick();
        setTimeout(() => {
          window.location.reload();
        }, 200);
      }}
      title="Refresh Game"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </motion.button>
  );
};
