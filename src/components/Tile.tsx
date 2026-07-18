import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tile as TileData, TileType } from '../types';

interface TileProps {
  tile: TileData;
  isSelected: boolean;
  isHinted?: boolean;
  onClick: () => void;
  tileSize: number;
}

const tileStyles = {
  [TileType.EMPTY]: 'bg-transparent',
  [TileType.SWORD]: 'bg-red-500 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
  [TileType.GUN]: 'bg-yellow-400 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
  [TileType.BOMB]: 'bg-gray-800 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
  [TileType.HEART]: 'bg-pink-500 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
  [TileType.CAKE]: 'bg-blue-500 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
  [TileType.RAINBOW]: 'bg-gradient-to-br from-red-500 via-green-500 to-blue-500 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
  [TileType.HORIZONTAL_CLEARER]: 'bg-purple-600 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
  [TileType.VERTICAL_CLEARER]: 'bg-indigo-600 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
  [TileType.PLUS_CLEARER]: 'bg-cyan-600 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
  [TileType.CROSS_CLEARER]: 'bg-emerald-600 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
  [TileType.SMILEY_CLEARER]: 'bg-yellow-400 shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]',
};

const tileIcons = {
  [TileType.EMPTY]: null,
  [TileType.SWORD]: '⚔️',
  [TileType.GUN]: '🏹', // Using bow for ranger instead of gun to be more fantasy
  [TileType.BOMB]: '💣',
  [TileType.HEART]: '❤️',
  [TileType.CAKE]: '🍰',
  [TileType.RAINBOW]: '🌈',
  [TileType.HORIZONTAL_CLEARER]: 'https://www.image2url.com/r2/default/images/1784342191955-a0166ece-e241-4eb3-9829-a8d5c7e8d864.jpg',
  [TileType.VERTICAL_CLEARER]: '↕️',
  [TileType.PLUS_CLEARER]: '➕',
  [TileType.CROSS_CLEARER]: '✖️',
  [TileType.SMILEY_CLEARER]: '😊',
};

export const TileComponent: React.FC<TileProps> = ({ tile, isSelected, isHinted, onClick, tileSize }) => {
  const [showVfx, setShowVfx] = useState(false);
  const [prevType, setPrevType] = useState<TileType>(tile.type);
  
  useEffect(() => {
    if (tile.type !== TileType.EMPTY) {
      setPrevType(tile.type);
    } else {
      // Trigger VFX when it becomes empty (just matched)
      setShowVfx(true);
      const t = setTimeout(() => setShowVfx(false), 800);
      return () => clearTimeout(t);
    }
  }, [tile.type]);

  if (tile.type === TileType.EMPTY && !showVfx) return null;

  // 1. SWORD VFX (Slash + Sparks)
  const renderSwordVfx = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
        <motion.div 
          initial={{ width: 0, rotate: 45, opacity: 1 }}
          animate={{ width: tileSize * 2.2, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute h-1.5 bg-gradient-to-r from-red-500 via-orange-400 to-transparent shadow-[0_0_8px_rgba(239,68,68,0.9)] rounded-full"
        />
        <motion.div 
          initial={{ width: 0, rotate: -45, opacity: 1 }}
          animate={{ width: tileSize * 2.2, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
          className="absolute h-1.5 bg-gradient-to-r from-yellow-500 via-amber-400 to-transparent shadow-[0_0_8px_rgba(245,158,11,0.9)] rounded-full"
        />
        {Array.from({ length: 8 }).map((_, idx) => {
          const angle = (idx * 360) / 8 + Math.random() * 15;
          const distance = tileSize * (0.8 + Math.random() * 0.4);
          const radians = (angle * Math.PI) / 180;
          const targetX = Math.cos(radians) * distance;
          const targetY = Math.sin(radians) * distance;
          return (
            <motion.div
              key={idx}
              initial={{ x: 0, y: 0, scale: 0.2, opacity: 1, rotate: 0 }}
              animate={{ 
                x: targetX, 
                y: targetY, 
                scale: [0.2, 1.3, 0], 
                opacity: 0,
                rotate: angle + 180
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute text-xs text-orange-400 font-bold select-none"
            >
              ⚡
            </motion.div>
          );
        })}
      </div>
    );
  };

  // 2. GUN / RANGER VFX (Crosshair arrows + Golden shockwave)
  const renderGunVfx = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
        {[0, 90, 180, 270].map((angle, i) => {
          const rads = (angle * Math.PI) / 180;
          const destX = Math.cos(rads) * tileSize * 1.6;
          const destY = Math.sin(rads) * tileSize * 1.6;
          return (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: destX, y: destY, opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.45, ease: "circOut" }}
              className="absolute text-lg font-black text-yellow-400 select-none drop-shadow-[0_2px_5px_rgba(234,179,8,0.8)]"
              style={{ transform: `rotate(${angle + 95}deg)` }}
            >
              🏹
            </motion.div>
          );
        })}
        <motion.div 
          initial={{ scale: 0.1, opacity: 1 }}
          animate={{ scale: 2.3, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border-2 border-yellow-400 bg-yellow-400/10 shadow-[0_0_12px_#fbbf24]"
        />
      </div>
    );
  };

  // 3. BOMB VFX (Fire Shockwave + Explosion items)
  const renderBombVfx = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.2, opacity: 1 }}
          animate={{ scale: 2.8, opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="absolute rounded-full border-4 border-orange-500 bg-orange-600/30 shadow-[0_0_20px_#ea580c] w-full h-full"
        />
        {Array.from({ length: 10 }).map((_, idx) => {
          const angle = (idx * 360) / 10 + Math.random() * 20;
          const distance = tileSize * (0.9 + Math.random() * 0.6);
          const radians = (angle * Math.PI) / 180;
          const targetX = Math.cos(radians) * distance;
          const targetY = Math.sin(radians) * distance;
          const items = ['🔥', '💥', '💨', '⚡'];
          const symbol = items[idx % items.length];
          return (
            <motion.div
              key={idx}
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
              animate={{ 
                x: targetX, 
                y: targetY, 
                scale: [0.4, 1.8, 0], 
                opacity: 0,
                rotate: Math.random() * 360
              }}
              transition={{ duration: 0.55, ease: "backOut" }}
              className="absolute text-base drop-shadow-lg select-none"
            >
              {symbol}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // 4. HEART VFX (Rising heart bubbles + pink expansion rings)
  const renderHeartVfx = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.3, opacity: 1 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute rounded-full border-2 border-pink-450 bg-pink-500/10 shadow-[0_0_15px_#f472b6] w-full h-full"
        />
        {Array.from({ length: 7 }).map((_, idx) => {
          const angle = (idx * 360) / 7;
          const distance = tileSize * (0.8 + Math.random() * 0.4);
          const radians = (angle * Math.PI) / 180;
          const targetX = Math.cos(radians) * distance * 0.7;
          const targetY = Math.sin(radians) * distance * 0.7 - tileSize * 0.5; // rising drift bias
          const heartIcons = ['💖', '💗', '❤️', '💕', '✨'];
          return (
            <motion.div
              key={idx}
              initial={{ x: 0, y: 0, scale: 0.2, opacity: 1 }}
              animate={{ 
                x: targetX, 
                y: targetY, 
                scale: [0.2, 1.4, 0], 
                opacity: 0 
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute text-sm select-none drop-shadow-md"
            >
              {heartIcons[idx % heartIcons.length]}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // 5. CAKE VFX (Sweets explosion + Sky blue dotted ring)
  const renderCakeVfx = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.1, rotate: 0, opacity: 1 }}
          animate={{ scale: 2.3, rotate: 180, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute border border-dashed border-sky-400 rounded-full w-full h-full shadow-[0_0_10px_#38bdf8]"
        />
        {Array.from({ length: 8 }).map((_, idx) => {
          const angle = (idx * 360) / 8;
          const distance = tileSize * (0.8 + Math.random() * 0.5);
          const radians = (angle * Math.PI) / 180;
          const targetX = Math.cos(radians) * distance;
          const targetY = Math.sin(radians) * distance;
          const cakeSweets = ['🧁', '🍬', '🎂', '🍒', '✨', '⭐'];
          return (
            <motion.div
              key={idx}
              initial={{ x: 0, y: 0, scale: 0.3, opacity: 1, rotate: 0 }}
              animate={{ 
                x: targetX, 
                y: targetY, 
                scale: [0.3, 1.4, 0], 
                opacity: 0,
                rotate: 360
              }}
              transition={{ duration: 0.55, ease: "backOut" }}
              className="absolute text-sm select-none"
            >
              {cakeSweets[idx % cakeSweets.length]}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // 6. RAINBOW VFX (Spectrum spiral + high energy magical stars)
  const renderRainbowVfx = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.2, rotate: 0, opacity: 1 }}
          animate={{ scale: 3.2, rotate: 360, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="absolute rounded-full border-4 border-pink-500 bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 opacity-25 w-full h-full shadow-[0_0_25px_#ec4899]"
        />
        {Array.from({ length: 12 }).map((_, idx) => {
          const angle = (idx * 360) / 12;
          const distance = tileSize * (1.1 + Math.random() * 0.6);
          const radians = (angle * Math.PI) / 180;
          const targetX = Math.cos(radians) * distance;
          const targetY = Math.sin(radians) * distance;
          const rainbowIcons = ['🌈', '✨', '⭐', '🔮', '🌟', '💎'];
          return (
            <motion.div
              key={idx}
              initial={{ x: 0, y: 0, scale: 0.3, opacity: 1, rotate: 0 }}
              animate={{ 
                x: targetX, 
                y: targetY, 
                scale: [0.3, 1.7, 0], 
                opacity: 0,
                rotate: angle * 2
              }}
              transition={{ duration: 0.65, ease: "backOut" }}
              className="absolute text-base select-none"
            >
              {rainbowIcons[idx % rainbowIcons.length]}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Default stars fallback
  const renderDefaultVfx = () => {
    return (
      <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
        <motion.div 
          initial={{ scale: 0.1, opacity: 1 }}
          animate={{ scale: 2.1, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute rounded-full border-2 border-yellow-300 w-full h-full shadow-[0_0_10px_#fde047]"
        />
        {Array.from({ length: 6 }).map((_, idx) => {
          const angle = (idx * 360) / 6;
          const distance = tileSize * 0.85;
          const radians = (angle * Math.PI) / 180;
          const targetX = Math.cos(radians) * distance;
          const targetY = Math.sin(radians) * distance;
          return (
            <motion.div
              key={idx}
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
              animate={{ 
                x: targetX, 
                y: targetY, 
                scale: [0.4, 1.3, 0], 
                opacity: 0 
              }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute text-xs text-yellow-300 font-bold select-none drop-shadow-md"
            >
              {idx % 2 === 0 ? '✨' : '⭐'}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderVfxContent = () => {
    switch (prevType) {
      case TileType.SWORD:
        return renderSwordVfx();
      case TileType.GUN:
        return renderGunVfx();
      case TileType.BOMB:
        return renderBombVfx();
      case TileType.HEART:
        return renderHeartVfx();
      case TileType.CAKE:
        return renderCakeVfx();
      case TileType.RAINBOW:
        return renderRainbowVfx();
      default:
        return renderDefaultVfx();
    }
  };

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        x: tile.c * tileSize,
        y: tile.r * tileSize,
        scale: isSelected ? 1.15 : (tile.type === TileType.EMPTY ? 1.4 : 1),
        opacity: tile.type === TileType.EMPTY ? 0 : 1,
        zIndex: isSelected ? 10 : (tile.type === TileType.EMPTY ? 5 : 1),
      }}
      transition={{
        layout: { type: "spring", stiffness: 350, damping: 20 },
        x: { type: "spring", stiffness: 350, damping: 20 },
        y: { type: "spring", stiffness: 350, damping: 20 },
        scale: { type: "spring", stiffness: 450, damping: 15 },
        opacity: { duration: 0.25 }
      }}
      className={`absolute flex items-center justify-center rounded-lg pointer-events-none border-2 
        ${tile.type === TileType.EMPTY ? 'bg-yellow-100 border-yellow-300' : tileStyles[tile.type]} 
        ${isSelected ? 'border-white' : 'border-black/20'}`}
      style={{
        width: tileSize - 4,
        height: tileSize - 4,
        margin: 2
      }}
    >
      <span className="text-2xl drop-shadow-md select-none flex items-center justify-center w-full h-full p-1">
        {tile.type === TileType.EMPTY ? '✨' : (
          tileIcons[tile.type]?.startsWith('http') ? (
            <img src={tileIcons[tile.type]} alt="special tile" className="w-full h-full object-contain rounded-md" referrerPolicy="no-referrer" />
          ) : tileIcons[tile.type]
        )}
      </span>
      {tile.lockType === 'ice' && (
        <div className="absolute inset-0 rounded-md bg-sky-300/40 backdrop-blur-[1px] border border-sky-200 flex items-center justify-center shadow-[inset_0_0_8px_rgba(14,165,233,0.7)] z-10 pointer-events-none">
          <span className="text-xl drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.6)] animate-pulse select-none">❄️</span>
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-sky-200/5 to-transparent pointer-events-none" />
        </div>
      )}
      {tile.lockType === 'chains' && (
        <div className="absolute inset-0 rounded-md bg-slate-950/45 border border-slate-500 flex items-center justify-center shadow-[inset_0_0_8px_rgba(0,0,0,0.85)] z-10 pointer-events-none">
          <span className="text-xl drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.8)] select-none">⛓️</span>
        </div>
      )}
      {tile.isGlowing && (
        <motion.div 
           animate={{ opacity: [0.5, 1, 0.5] }}
           transition={{ repeat: Infinity, duration: 1 }}
           className="absolute inset-0 rounded-lg border-2 border-yellow-300 shadow-[0_0_15px_rgba(253,224,71,0.8)]"
        />
      )}
      {isHinted && (
        <motion.div 
           animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
           transition={{ repeat: Infinity, duration: 0.8 }}
           className="absolute inset-0 rounded-lg border-4 border-yellow-300 shadow-[0_0_20px_rgba(253,224,71,0.9)] z-20 pointer-events-none"
        />
      )}
      {tile.type === TileType.EMPTY && (
        <motion.div 
           initial={{ scale: 0, opacity: 1 }}
           animate={{ scale: 3, opacity: 0 }}
           transition={{ duration: 0.4 }}
           className="absolute inset-0 rounded-full border-4 border-yellow-400"
        />
      )}
      {showVfx && renderVfxContent()}
    </motion.div>
  );
};
