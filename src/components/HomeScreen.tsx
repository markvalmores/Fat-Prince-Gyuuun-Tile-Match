import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Leaderboard } from './Leaderboard';

interface Upgrades {
  level: number;
}

interface HomeScreenProps {
  onPlay: () => void;
  carrots?: number;
  upgrades?: Upgrades;
  onUpgrade?: (u: Upgrades) => void;
  onSpendCarrots?: (c: number) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onPlay, carrots = 0, upgrades = { level: 1 }, onUpgrade, onSpendCarrots }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [volume, setVolume] = useState(50);
  const [difficulty, setDifficulty] = useState('NORMAL');
  const [dailyAmount, setDailyAmount] = useState(0);

  useEffect(() => {
    // Check daily reward
    const lastDaily = localStorage.getItem('fatPrinceLastDaily');
    const today = new Date().toDateString();
    
    if (lastDaily !== today) {
      setDailyAmount(500);
      setShowDaily(true);
      if (onSpendCarrots) {
        onSpendCarrots(carrots + 500);
      }
      localStorage.setItem('fatPrinceLastDaily', today);
    }
  }, [carrots, onSpendCarrots]);

  const upgradeCost = 100 * upgrades.level;
  
  const handleUpgrade = () => {
    if (carrots >= upgradeCost && onSpendCarrots && onUpgrade) {
      onSpendCarrots(carrots - upgradeCost);
      onUpgrade({ level: upgrades.level + 1 });
    }
  };

  return (
    <div className="min-h-screen bg-sky-900 flex flex-col items-center justify-center font-sans overflow-hidden relative selection:bg-none touch-none">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-700 to-sky-950 opacity-80" />
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({length: 20}).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/10 rounded-full"
            style={{
              width: Math.random() * 100 + 20,
              height: Math.random() * 100 + 20,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="absolute top-4 right-4 bg-yellow-400 border-2 border-black rounded-full px-4 py-1 font-black flex items-center gap-2 shadow-md z-20">
        <span className="text-xl">🥕 {carrots}</span>
      </div>

      <div className="relative z-10 flex flex-col items-center p-6 text-center max-w-md w-full">
        
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.5 }}
          className="mb-8"
        >
          <img 
            src="https://stickershop.line-scdn.net/stickershop/v1/product/22454003/LINEStorePC/main.png?v=1" 
            alt="Mascot Bunny" 
            className="w-48 h-48 object-contain mx-auto drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
          />
        </motion.div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-tighter leading-tight">
            FAT PRINCE<br/>
            <span className="text-yellow-400 text-6xl md:text-7xl">GYUUUN</span><br/>
            <span className="text-pink-400 text-3xl tracking-widest">TILE MATCH</span>
          </h1>
        </motion.div>

        <motion.button
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 0.4, type: 'spring' }}
          onClick={onPlay}
          className="w-full max-w-[240px] py-4 bg-gradient-to-b from-yellow-300 to-yellow-500 rounded-full border-4 border-white text-yellow-950 font-black text-2xl shadow-[0_10px_0_#a16207,0_15px_20px_rgba(0,0,0,0.5)] active:shadow-[0_0px_0_#a16207,0_0px_0px_rgba(0,0,0,0.5)] active:translate-y-[10px] mb-4"
        >
          PLAY
        </motion.button>
        
        <div className="flex flex-col gap-3 w-full max-w-[240px] mb-4">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={() => setShowLeaderboard(true)}
            className="w-full py-2.5 bg-yellow-400 text-yellow-950 rounded-full font-black text-lg border-2 border-white shadow-[0_4px_0_#a16207] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider"
          >
            🏆 LEADERBOARDS
          </motion.button>

          <div className="flex gap-3 w-full">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => setShowUpgrades(true)}
              className="flex-1 py-2 bg-pink-500 text-white rounded-full font-bold text-sm border-2 border-white shadow-[0_4px_0_#be185d] active:shadow-none active:translate-y-1 transition-all uppercase"
            >
              UPGRADES
            </motion.button>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={() => setShowSettings(true)}
              className="flex-1 py-2 bg-black/40 text-white rounded-full font-bold text-sm border-2 border-white/20 hover:bg-black/60 active:scale-95 transition-all uppercase"
            >
              SETTINGS
            </motion.button>
          </div>
        </div>

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-xs text-white/60 font-black tracking-widest bg-black/30 px-4 py-1.5 rounded-full border border-white/5 uppercase"
        >
          Created by Usagyuun VTuber
        </motion.div>
      </div>

      <AnimatePresence>
        {showLeaderboard && (
          <Leaderboard onClose={() => setShowLeaderboard(false)} />
        )}

        {showDaily && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.5, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-yellow-100 p-8 rounded-3xl text-center border-8 border-yellow-400"
            >
              <h2 className="text-4xl font-black text-yellow-600 mb-4">DAILY REWARD!</h2>
              <div className="text-6xl mb-4">🎁</div>
              <p className="text-2xl font-bold text-gray-700 mb-8">+ {dailyAmount} 🥕 Carrots!</p>
              <button 
                onClick={() => setShowDaily(false)}
                className="px-8 py-3 bg-yellow-400 text-yellow-900 rounded-full font-black text-xl border-4 border-yellow-600 hover:scale-105 active:scale-95 transition-all"
              >
                CLAIM
              </button>
            </motion.div>
          </motion.div>
        )}

        {showUpgrades && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-sm border-8 border-pink-500 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowUpgrades(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 rounded-full border-4 border-white text-white font-black text-xl flex items-center justify-center shadow-lg"
              >
                X
              </button>
              
              <h2 className="text-3xl font-black text-pink-600 mb-2 text-center uppercase tracking-widest">TEAM UPGRADE</h2>
              <p className="text-center text-gray-500 mb-6 text-sm font-bold">Max Level 1000</p>
              
              <div className="bg-gray-100 rounded-xl p-4 mb-6 border-2 border-gray-200 text-center">
                <div className="text-xl font-bold text-gray-600">Current Level</div>
                <div className="text-5xl font-black text-pink-500 my-2">{upgrades.level}</div>
                <div className="text-sm font-bold text-gray-500">HP & DMG Bonus: +{upgrades.level * 5}%</div>
              </div>

              <button 
                onClick={handleUpgrade}
                disabled={carrots < upgradeCost || upgrades.level >= 1000}
                className={`w-full py-4 rounded-xl font-black text-2xl border-b-4 transition-all flex items-center justify-center gap-2 ${
                  carrots >= upgradeCost && upgrades.level < 1000
                  ? 'bg-green-400 text-green-900 border-green-600 hover:bg-green-300 active:translate-y-1 active:border-b-0' 
                  : 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                }`}
              >
                {upgrades.level >= 1000 ? 'MAXED OUT' : (
                  <>
                    UPGRADE <span className="text-lg bg-black/20 px-2 rounded-full font-bold">🥕 {upgradeCost}</span>
                  </>
                )}
              </button>
              
            </motion.div>
          </motion.div>
        )}
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-sm border-8 border-sky-900 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 rounded-full border-4 border-white text-white font-black text-xl flex items-center justify-center shadow-lg"
              >
                X
              </button>
              
              <h2 className="text-3xl font-black text-sky-900 mb-6 text-center uppercase tracking-widest">Settings</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-black text-sky-800 mb-2 uppercase">Volume: {volume}%</label>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-full h-4 bg-sky-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-black text-sky-800 mb-2 uppercase">Difficulty</label>
                <div className="flex gap-2">
                  {['EASY', 'NORMAL', 'HARD'].map(diff => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff)}
                      className={`flex-1 py-2 rounded-lg font-black text-sm border-b-4 transition-all ${difficulty === diff ? 'bg-sky-600 border-sky-800 text-white translate-y-1 border-b-0' : 'bg-sky-100 border-sky-300 text-sky-900 hover:bg-sky-200'}`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
              
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
