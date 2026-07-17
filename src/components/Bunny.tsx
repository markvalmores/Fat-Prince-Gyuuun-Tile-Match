import React from 'react';
import { motion } from 'motion/react';

export type BunnyType = 'pink_hood' | 'blue_scarf' | 'tank' | 'wizard' | 'cheerleader' | 'princess' | 'fever_prince';

export const Bunny = ({ type, flip, isDead, isAttacking }: { type: BunnyType, flip?: boolean, isDead?: boolean, isAttacking?: boolean }) => {
  const getImage = () => {
    switch (type) {
      case 'pink_hood':
      case 'fever_prince':
        return 'https://www.image2url.com/r2/default/images/1784319348662-4541cdc0-492d-47a5-81d9-d21c2510c6a0.gif'; // Fever Prince / Cake
      case 'blue_scarf':
        return 'https://www.image2url.com/r2/default/images/1784319237275-90d43393-2ba0-4b73-9519-3e2e5b2764a4.png'; // Sword
      case 'wizard':
        return 'https://www.image2url.com/r2/default/images/1784319196695-6746fbf5-1d33-4596-950b-ade99dbaaff8.png'; // Healer
      case 'tank':
        return 'https://www.image2url.com/r2/default/images/1784319309048-5892bbec-c224-4a92-9757-288560184e96.png'; // Bomb
      case 'cheerleader':
        return 'https://www.image2url.com/r2/default/images/1784319272089-1c4726ed-57e7-4e65-bb46-99a451d95311.png'; // Archer
      case 'princess':
      default:
        return 'https://www.image2url.com/r2/default/images/1784319237275-90d43393-2ba0-4b73-9519-3e2e5b2764a4.png';
    }
  }

  return (
    <motion.div 
      animate={{ opacity: isDead ? 0.3 : 1, rotate: isDead ? 90 : 0, y: isAttacking ? -5 : 0 }}
      transition={{ type: 'spring' }}
      className={`relative w-20 h-20 flex items-center justify-center ${flip ? 'scale-x-[-1]' : ''}`}
    >
      <img src={getImage()} alt={type} className="w-full h-full object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
    </motion.div>
  )
}
