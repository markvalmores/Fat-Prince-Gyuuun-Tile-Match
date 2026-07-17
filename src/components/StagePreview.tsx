import React from 'react';
import { motion } from 'motion/react';
import { audio } from '../utils/audio';

interface StagePreviewProps {
  level: number;
  onClose: () => void;
  onStart: () => void;
  carrotsReward?: number;
}

export const StagePreview: React.FC<StagePreviewProps> = ({
  level,
  onClose,
  onStart,
  carrotsReward = level * 10 + 20,
}) => {
  const isBoss = level % 10 === 0;
  const targetScore = level * 1000 + 5000;

  return (
    <motion.div
      key="stage-preview-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/65 z-[300] flex items-center justify-center p-4 backdrop-blur-[2.5px] select-none pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          audio.playClick();
          onClose();
        }
      }}
    >
      <motion.div
        key="stage-preview-card"
        initial={{ scale: 0.88, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.82, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="bg-[#f4dcb8] border-[6px] border-black p-8 rounded-3xl w-full max-w-sm text-center shadow-[10px_10px_0_rgba(0,0,0,0.55)] relative z-[310] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ribbon decoration at top */}
        <div className={`absolute top-0 left-0 right-0 h-4 ${isBoss ? 'bg-red-500' : 'bg-amber-400'} border-b-[4px] border-black`} />
        
        {/* Close Button */}
        <button
          onClick={() => {
            audio.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-black font-black text-sm hover:bg-red-600 active:scale-90 transition-transform shadow-[2px_2px_0_#000]"
        >
          ✕
        </button>

        {/* Level Display */}
        <div className="mt-2">
          <span className="text-sm font-black tracking-widest text-amber-900/80 uppercase">STACE {level}</span>
          <h2 className="text-4xl font-black text-black leading-none mt-1 drop-shadow-sm">
            {isBoss ? '👑 BOSS' : 'LEVEL ' + level}
          </h2>
        </div>

        {/* Level details content box */}
        <div className="bg-white p-4 rounded-2xl border-[3px] border-black my-6 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] flex flex-col gap-4 text-left">
          
          <div>
            <p className="text-xs font-black text-amber-900/60 uppercase tracking-wider">Objective</p>
            <p className={`text-xl font-black ${isBoss ? 'text-red-600' : 'text-slate-800'}`}>
              {isBoss ? '🔥 Defeat the Titan Boss!' : '🧩 Clear all locked tiles!'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t-2 border-dashed border-gray-200 pt-3">
            <div>
              <p className="text-xs font-black text-amber-900/60 uppercase tracking-wider">Target Score</p>
              <p className="text-lg font-black text-black">{targetScore.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs font-black text-amber-900/60 uppercase tracking-wider">Reward</p>
              <p className="text-lg font-black text-amber-600 flex items-center gap-1">
                🥕 <span className="text-black">{carrotsReward}</span>
              </p>
            </div>
          </div>
          
          <div className="border-t-2 border-dashed border-gray-200 pt-3 flex flex-col gap-1">
            <p className="text-xs font-black text-amber-900/60 uppercase tracking-wider">Preparation</p>
            <p className="text-xs text-slate-600 font-bold">
              {isBoss 
                ? 'Boss shields bypass required! Match the glowing indicator types to strike down the Titan.' 
                : 'Chains and Ice locked tiles cannot be swapped until they are adjacent matched!'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              audio.playClick();
              onStart();
            }}
            className="w-full bg-emerald-500 hover:bg-emerald-400 border-[4px] border-black text-white py-3.5 px-6 rounded-2xl font-black text-2xl active:scale-95 transition-transform shadow-[4px_4px_0_#000] cursor-pointer flex items-center justify-center gap-2"
          >
            🚀 START GAME
          </button>
          
          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            className="w-full bg-slate-300 hover:bg-slate-200 border-[3px] border-black text-slate-800 py-2 rounded-xl font-black text-sm active:scale-95 transition-transform"
          >
            BACK TO MAP
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
