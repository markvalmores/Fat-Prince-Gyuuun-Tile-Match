import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

export interface MapScreenProps {
  maxLevel: number;
  carrots: number;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

const TOTAL_LEVELS = 1000;

const LevelNode = ({ 
  level, 
  isUnlocked, 
  isCurrent, 
  onClick 
}: { 
  level: number, 
  isUnlocked: boolean, 
  isCurrent: boolean, 
  onClick: () => void 
}) => {
  return (
    <motion.div 
      className={`relative flex flex-col items-center justify-center cursor-pointer ${!isUnlocked ? 'opacity-80' : ''}`}
      whileHover={isUnlocked ? { scale: 1.05 } : {}}
      whileTap={isUnlocked ? { scale: 0.95 } : {}}
      onClick={() => isUnlocked && onClick()}
    >
      {/* Node House/Castle icon */}
      <div className={`w-10 h-10 ${isUnlocked ? 'bg-orange-400' : 'bg-gray-400'} border-[3px] border-black rounded-t-full rounded-b-md relative flex items-center justify-center z-10 shadow-sm`}>
         <div className="w-3 h-4 bg-black rounded-t-full absolute bottom-0" />
         <div className="w-2 h-2 bg-yellow-200 border-2 border-black rounded-full absolute top-2 left-2" />
         <div className="w-2 h-2 bg-yellow-200 border-2 border-black rounded-full absolute top-2 right-2" />
         {isCurrent && (
            <motion.div 
              className="absolute -top-8 text-2xl drop-shadow-md z-30"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              📍
            </motion.div>
         )}
      </div>

      {/* Scroll Banner */}
      <div className="relative -mt-2 z-20">
        {/* Banner ends */}
        <div className="absolute -left-2 top-1 bottom-1 w-4 bg-[#e8c39e] border-[3px] border-black rounded-l-full shadow-[inset_-2px_0_rgba(0,0,0,0.2)]" />
        <div className="absolute -right-2 top-1 bottom-1 w-4 bg-[#e8c39e] border-[3px] border-black rounded-r-full shadow-[inset_2px_0_rgba(0,0,0,0.2)]" />
        
        {/* Banner body */}
        <div className="px-4 py-1 bg-[#f4dcb8] border-[3px] border-black relative z-10 min-w-[80px] text-center shadow-[0_4px_0_rgba(0,0,0,0.2)]">
          <span className={`font-black uppercase tracking-wider text-sm ${isUnlocked ? 'text-black' : 'text-black/50'}`}>
            {isUnlocked ? level : 'Locked'}
          </span>
        </div>
      </div>
      
      {/* Path connection (visual only) */}
      <div className="absolute top-1/2 -right-8 w-8 h-4 bg-[#d0a775] border-y-[3px] border-black -z-10 hidden sm:block" />
    </motion.div>
  );
}

export const MapScreen: React.FC<MapScreenProps> = ({ maxLevel, carrots, onSelectLevel, onBack }) => {
  const [previewLevel, setPreviewLevel] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const activeElement = containerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
         activeElement.scrollIntoView({ block: 'center', inline: 'center' });
      }
    }
  }, []);

  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#75c6d9] flex flex-col font-sans relative overflow-hidden touch-none select-none">
      
      {/* Map Background Textures */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '32px 32px' }} />
      
      {/* Background Landmass (Decorative) */}
      <div className="absolute top-[10%] left-[5%] right-[5%] bottom-[10%] bg-[#d9c08e] border-8 border-black rounded-3xl pointer-events-none shadow-[0_10px_0_rgba(0,0,0,0.2)] overflow-hidden">
         {/* Grass patch */}
         <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-[#8ec761] border-r-8 border-t-8 border-black rounded-tr-3xl" />
         {/* Water patch */}
         <div className="absolute top-0 right-0 w-1/4 h-full bg-[#64b5f6] border-l-8 border-black" />
         {/* Clouds overlay */}
         <div className="absolute top-[-20px] left-1/2 w-32 h-full bg-white border-x-8 border-black opacity-80" style={{ borderRadius: '40px 40px 40px 40px / 100px 100px 100px 100px' }} />
      </div>

      {/* Header UI */}
      <div className="bg-[#f4dcb8] p-4 flex items-center justify-between sticky top-0 z-50 border-b-[4px] border-black shadow-[0_4px_0_rgba(0,0,0,0.2)] mx-2 mt-2 rounded-xl">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-black font-black hover:bg-red-600 active:scale-95 transition-transform"
        >
          ←
        </button>
        <div className="relative">
          <div className="absolute -inset-2 bg-white border-[3px] border-black rounded-lg -z-10 shadow-[4px_4px_0_rgba(0,0,0,0.2)]" />
          <h2 className="text-xl font-black text-black tracking-widest uppercase px-4 py-1">CAKE COVE</h2>
        </div>
        <div className="w-10 h-10 bg-yellow-400 rounded-full border-2 border-black flex items-center justify-center font-black shadow-inner">
          ★
        </div>
      </div>

      {/* Scrollable Levels Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-8 relative z-20"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="flex flex-wrap gap-8 justify-center max-w-4xl mx-auto pb-32 pt-8">
          {levels.map((level) => {
            const isUnlocked = level <= maxLevel;
            const isCurrent = level === maxLevel;
            return (
              <div key={level} data-active={isCurrent}>
                <LevelNode 
                  level={level}
                  isUnlocked={isUnlocked}
                  isCurrent={isCurrent}
                  onClick={() => isUnlocked && setPreviewLevel(level)}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Level Preview Modal */}
      <AnimatePresence>
        {previewLevel !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={() => setPreviewLevel(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#f4dcb8] border-[6px] border-black p-8 rounded-3xl w-full max-w-sm text-center shadow-[8px_8px_0_rgba(0,0,0,0.3)]"
              onClick={e => e.stopPropagation()}
            >
              <h2 className="text-3xl font-black text-black mb-2">Level {previewLevel}</h2>
              <div className="bg-white p-4 rounded-xl border-2 border-black mb-6">
                <p className="font-bold text-gray-700">Objective:</p>
                <p className="text-xl font-black text-black mb-2">
                  {previewLevel % 10 === 0 ? "Defeat the Boss!" : "Clear the Board!"}
                </p>
                <p className="font-bold text-gray-700">Target Score:</p>
                <p className="text-xl font-black text-black">
                  {previewLevel * 1000 + 5000}
                </p>
              </div>
              <button 
                onClick={() => {
                  setPreviewLevel(null);
                  onSelectLevel(previewLevel);
                }}
                className="w-full bg-emerald-500 border-4 border-black text-white py-3 rounded-xl font-black text-xl hover:bg-emerald-600 active:scale-95 transition-transform"
              >
                START
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Bottom Bar overlay (like the reference image bottom edge) */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#a68a5c] border-t-[4px] border-black z-50 flex items-center justify-around px-4">
        {/* Simple bricks pattern */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(90deg, transparent 48px, #000 48px, #000 50px, transparent 50px), linear-gradient(0deg, transparent 24px, #000 24px, #000 26px, transparent 26px)', backgroundSize: '50px 26px' }} />
        
        <div className="bg-yellow-400 border-2 border-black rounded-full px-4 py-1 font-black flex items-center gap-2 shadow-md">
          <span>⚡ 8</span>
        </div>
        <div className="bg-yellow-400 border-2 border-black rounded-full px-4 py-1 font-black flex items-center gap-2 shadow-md">
          <span className="text-xl">🥕 {carrots}</span>
        </div>
      </div>
    </div>
  );
};
