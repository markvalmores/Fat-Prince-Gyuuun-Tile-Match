import React from 'react';
import { motion } from 'motion/react';

export type BunnyType = 'pink_hood' | 'blue_scarf' | 'tank' | 'wizard' | 'cheerleader' | 'princess';

export const Bunny = ({ type, flip, isDead, isAttacking }: { type: BunnyType, flip?: boolean, isDead?: boolean, isAttacking?: boolean }) => {
  // Common body
  const body = (
    <div className={`w-12 h-14 bg-white rounded-[24px] border-[2.5px] border-black flex flex-col items-center relative z-10 overflow-hidden ${type === 'pink_hood' ? 'bg-pink-100' : ''}`}>
       <div className="flex gap-3 mt-4">
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
       </div>
       <div className="w-1 h-1 bg-black rounded-full mt-0.5" />
       <svg width="16" height="12" viewBox="0 0 16 12" className="mt-0.5 relative z-10">
         <polygon points="1,1 15,1 8,11" fill="white" stroke="black" strokeWidth="2" strokeLinejoin="round" />
         <polygon points="3.5,6 12.5,6 8,11" fill="black" />
       </svg>
    </div>
  );

  const ears = (
    <>
      <div className={`absolute -top-5 left-1 w-3 h-8 bg-white border-[2.5px] border-black rounded-t-full rounded-b-sm rotate-[-15deg] origin-bottom z-0 ${type === 'pink_hood' ? 'bg-pink-100' : ''}`} />
      <div className={`absolute -top-5 right-1 w-3 h-8 bg-white border-[2.5px] border-black rounded-t-full rounded-b-sm rotate-[15deg] origin-bottom z-0 ${type === 'pink_hood' ? 'bg-pink-100' : ''}`} />
    </>
  );

  const renderOutfit = () => {
    switch (type) {
      case 'pink_hood':
        return (
          <>
            <div className="absolute -bottom-1 -left-1 -right-1 h-4 bg-pink-300 border-[2.5px] border-black rounded-full z-20" />
            <motion.div 
              animate={isAttacking ? { rotate: -45, x: 10 } : { rotate: 0, x: 0 }}
              className="absolute top-2 -right-4 w-12 h-2 bg-orange-500 border-2 border-black rounded-full rotate-[-45deg] z-0 flex items-center justify-end pr-1 origin-bottom-left"
            >
              <div className="w-3 h-3 bg-green-500 rounded-full"/>
            </motion.div>
          </>
        );
      case 'blue_scarf':
        return (
           <div className="absolute top-8 -left-1 -right-1 h-4 bg-sky-400 border-[2px] border-black rounded-full z-20" />
        );
      case 'tank':
        return (
           <div className="absolute -bottom-2 -left-2 w-16 h-8 bg-green-700 border-[2.5px] border-black rounded-md z-20 flex items-center justify-center shadow-lg">
             <motion.div 
               animate={isAttacking ? { x: 5, scaleX: 1.2 } : { x: 0, scaleX: 1 }}
               className="absolute top-1 -right-4 w-6 h-3 bg-green-800 border-2 border-black rounded-sm origin-left" 
             />
             <div className="w-14 h-4 bg-gray-800 rounded-full flex gap-1 px-1 items-center mt-3 border border-black">
               <div className="w-3 h-3 bg-gray-400 rounded-full border border-black" />
               <div className="w-3 h-3 bg-gray-400 rounded-full border border-black" />
               <div className="w-3 h-3 bg-gray-400 rounded-full border border-black" />
             </div>
           </div>
        );
      case 'wizard':
        return (
           <>
             <div className="absolute -top-3 -left-3 -right-3 h-4 bg-purple-700 border-[2.5px] border-black rounded-full z-20" />
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-12 bg-purple-700 border-[2.5px] border-black rounded-t-full z-10" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
             <div className="absolute -bottom-2 -left-2 -right-2 h-8 bg-purple-600 border-[2.5px] border-black rounded-b-xl z-20" />
             <motion.div 
               animate={isAttacking ? { rotate: 45, scale: 1.2 } : { rotate: 0, scale: 1 }}
               className="absolute top-0 -right-6 w-1.5 h-10 bg-yellow-700 border-2 border-black z-30 origin-bottom"
             >
               <div className="absolute -top-4 -left-3 text-xl drop-shadow-md">⭐</div>
             </motion.div>
           </>
        );
      case 'cheerleader':
        return (
           <>
             <motion.div 
               animate={isAttacking ? { y: -10, rotate: -20 } : { y: 0, rotate: 0 }}
               className="absolute top-4 -left-4 w-7 h-7 bg-yellow-400 border-[2px] border-black rounded-full z-20 shadow-inner" 
             />
             <motion.div 
               animate={isAttacking ? { y: -10, rotate: 20 } : { y: 0, rotate: 0 }}
               className="absolute top-4 -right-4 w-7 h-7 bg-yellow-400 border-[2px] border-black rounded-full z-20 shadow-inner" 
             />
           </>
        );
      case 'princess':
        return (
           <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl z-20 drop-shadow-md">👑</div>
        );
    }
  }

  return (
    <motion.div 
      animate={{ opacity: isDead ? 0.3 : 1, rotate: isDead ? 90 : 0, y: isAttacking ? -5 : 0 }}
      transition={{ type: 'spring' }}
      className={`relative ${flip ? 'scale-x-[-1]' : ''}`}
    >
      {ears}
      {body}
      {renderOutfit()}
    </motion.div>
  )
}
