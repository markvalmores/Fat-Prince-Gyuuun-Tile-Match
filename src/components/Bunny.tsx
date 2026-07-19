import React from 'react';
import { motion } from 'motion/react';

export type BunnyType = 'pink_hood' | 'blue_scarf' | 'tank' | 'wizard' | 'cheerleader' | 'princess' | 'fever_prince';

interface BunnySVGProps {
  type: BunnyType;
  isDead?: boolean;
  isAttacking?: boolean;
}

const getBunnyGif = (type: BunnyType, isAttacking?: boolean) => {
  if (isAttacking) {
    if (type === 'blue_scarf') {
      return 'https://media.tenor.com/CbV12azvZZMAAAAi/usagyuuun-usagyuuun-sticker.gif';
    }
    if (type === 'fever_prince') {
      return 'https://media.tenor.com/xaqeGOSg62MAAAAi/usagyuuun-martillo.gif';
    }
    return 'https://media1.tenor.com/m/QxE-o0_qzbYAAAAC/usagyuuun-laptop.gif'; // Laptop slam high-speed action!
  }
  switch (type) {
    case 'pink_hood':
      return 'https://media1.tenor.com/m/vXmudVdY3qQAAAAC/usagyuuun-usagyuuun-sticker.gif';
    case 'blue_scarf':
      return 'https://media.tenor.com/CbV12azvZZMAAAAi/usagyuuun-usagyuuun-sticker.gif';
    case 'tank':
      return 'https://media.tenor.com/XJ5K8layHSwAAAAi/%E8%85%B9%E7%AD%8B-%E3%81%86%E3%81%95%E3%81%8E%E3%82%85%E3%83%BC%E3%82%93.gif';
    case 'wizard':
      return 'https://media.tenor.com/N-XZDw1edt4AAAAi/%E5%A4%A7%E5%A5%BD%E3%81%8D-%E3%81%86%E3%81%95%E3%81%8E%E3%82%85%E3%83%BC%E3%82%93.gif';
    case 'cheerleader':
      return 'https://media.tenor.com/BZJLoYs2TwEAAAAi/usagyuuun-usagyuuun-sticker.gif';
    case 'princess':
      return 'https://media.tenor.com/N-XZDw1edt4AAAAi/%E5%A4%A7%E5%A5%BD%E3%81%8D-%E3%81%86%E3%81%95%E3%81%8E%E3%82%85%E3%83%BC%E3%82%93.gif';
    case 'fever_prince':
      return 'https://media.tenor.com/xaqeGOSg62MAAAAi/usagyuuun-martillo.gif';
    default:
      return 'https://media1.tenor.com/m/vXmudVdY3qQAAAAC/usagyuuun-usagyuuun-sticker.gif';
  }
};

const getRoleBadge = (type: BunnyType) => {
  switch (type) {
    case 'blue_scarf':
      return { emoji: '⚔️', label: 'ATK', bg: 'bg-red-500' };
    case 'cheerleader':
      return { emoji: '🏹', label: 'RNG', bg: 'bg-green-500' };
    case 'tank':
      return { emoji: '🛡️', label: 'DEF', bg: 'bg-blue-600' };
    case 'wizard':
      return { emoji: '🪄', label: 'HEAL', bg: 'bg-purple-500' };
    case 'princess':
      return { emoji: '👑', label: 'PRN', bg: 'bg-amber-400 text-black' };
    case 'fever_prince':
      return { emoji: '🔥', label: 'FEVER', bg: 'bg-orange-500' };
    default:
      return null;
  }
};

const BunnySVG: React.FC<BunnySVGProps> = ({ type, isDead, isAttacking }) => {
  const gifUrl = getBunnyGif(type, isAttacking);
  const badge = getRoleBadge(type);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img 
        src={gifUrl} 
        alt={type} 
        className={`w-full h-full object-contain drop-shadow-md select-none transition-all duration-300 ${isDead ? 'opacity-35 grayscale scale-95' : ''}`}
        referrerPolicy="no-referrer"
      />
      {badge && !isDead && (
        <span className={`absolute -top-1 -right-1 text-[9px] font-bold px-1 py-0.5 rounded shadow-sm flex items-center gap-0.5 ${badge.bg} text-white border border-white/20 select-none z-10 scale-90 sm:scale-100 origin-top-right`}>
          <span>{badge.emoji}</span>
          <span className="hidden sm:inline text-[8px]">{badge.label}</span>
        </span>
      )}
    </div>
  );
};

export const Bunny = ({ type, flip, isDead, isAttacking }: { type: BunnyType, flip?: boolean, isDead?: boolean, isAttacking?: boolean }) => {
  return (
    <motion.div 
      animate={{ opacity: isDead ? 0.3 : 1, rotate: isDead ? 90 : 0, y: isAttacking ? -5 : 0 }}
      transition={{ type: 'spring' }}
      className={`relative w-20 h-20 flex items-center justify-center ${flip ? 'scale-x-[-1]' : ''}`}
    >
      <BunnySVG type={type} isDead={isDead} isAttacking={isAttacking} />
    </motion.div>
  );
};
