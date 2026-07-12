import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tile as TileData, TileType } from '../types';

interface TileProps {
  tile: TileData;
  isSelected: boolean;
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
};

const tileIcons = {
  [TileType.EMPTY]: null,
  [TileType.SWORD]: '⚔️',
  [TileType.GUN]: '🏹', // Using bow for ranger instead of gun to be more fantasy
  [TileType.BOMB]: '💣',
  [TileType.HEART]: '❤️',
  [TileType.CAKE]: '🍰',
  [TileType.RAINBOW]: '🌈',
};

export const TileComponent: React.FC<TileProps> = ({ tile, isSelected, onClick, tileSize }) => {
  const [showVfx, setShowVfx] = useState(false);
  
  useEffect(() => {
    if (tile.type === TileType.EMPTY) {
      // Trigger VFX when it becomes empty (just matched)
      setShowVfx(true);
      const t = setTimeout(() => setShowVfx(false), 500);
      return () => clearTimeout(t);
    }
  }, [tile.type]);

  if (tile.type === TileType.EMPTY && !showVfx) return null;

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        x: tile.c * tileSize,
        y: tile.r * tileSize,
        scale: isSelected ? 1.1 : (tile.type === TileType.EMPTY ? 1.5 : 1),
        opacity: tile.type === TileType.EMPTY ? 0 : 1,
        zIndex: isSelected ? 10 : (tile.type === TileType.EMPTY ? 5 : 1),
      }}
      transition={{
        type: tile.type === TileType.EMPTY ? 'tween' : 'spring',
        stiffness: 300,
        damping: 25,
        mass: 0.8,
        duration: tile.type === TileType.EMPTY ? 0.3 : undefined
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
      <span className="text-2xl drop-shadow-md select-none">
        {tile.type === TileType.EMPTY ? '✨' : tileIcons[tile.type]}
      </span>
      {tile.isGlowing && (
        <motion.div 
           animate={{ opacity: [0.5, 1, 0.5] }}
           transition={{ repeat: Infinity, duration: 1 }}
           className="absolute inset-0 rounded-lg border-2 border-yellow-300 shadow-[0_0_15px_rgba(253,224,71,0.8)]"
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
    </motion.div>
  );
};
