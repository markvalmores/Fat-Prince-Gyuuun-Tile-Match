import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../utils/useGame';
import { Board } from './Board';
import { BattleScene } from './BattleScene';
import { useGamepad } from '../utils/useGamepad';
import { GRID_COLS, GRID_ROWS } from '../utils/board';
import { Position } from '../types';
import { HighScoreSubmit } from './HighScoreSubmit';

interface GameScreenProps {
  initialLevel: number;
  upgrades?: { level: number };
  onWin: (level: number, carrots: number) => void;
  onLose: (level: number) => void;
  onExit: () => void;
}

const SlotMachine = ({ onComplete }: { onComplete: (carrots: number) => void }) => {
  const [spinning, setSpinning] = useState(false);
  const [results, setResults] = useState<string[]>(['🥕', '🥕', '🥕']);
  const [done, setDone] = useState(false);
  
  const symbols = ['🥕', '💎', '🍒', '⭐'];
  
  const spin = () => {
    if (spinning || done) return;
    setSpinning(true);
    
    // Animate spinning
    let spins = 0;
    const interval = setInterval(() => {
      setResults([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)]
      ]);
      spins++;
      if (spins > 20) {
        clearInterval(interval);
        const finalResults = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ];
        
        // Guarantee at least something good 50% of time
        if (Math.random() > 0.5) {
          finalResults[0] = '🥕';
          finalResults[1] = '🥕';
          finalResults[2] = '🥕';
        }
        
        setResults(finalResults);
        setSpinning(false);
        setDone(true);
      }
    }, 100);
  };

  const getReward = () => {
    let carrots = 50; // base reward
    const counts = results.reduce((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {} as Record<string, number>);
    if (counts['🥕'] === 3) carrots = 500;
    else if (counts['⭐'] === 3) carrots = 1000;
    else if (counts['💎'] === 3) carrots = 2000;
    else if (counts['🍒'] === 3) carrots = 300;
    else if (counts['🥕'] === 2) carrots = 150;
    return carrots;
  };

  return (
    <div className="absolute inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-yellow-100 p-8 rounded-3xl max-w-sm w-full text-center border-8 border-yellow-400">
        <h2 className="text-3xl font-black text-yellow-600 mb-6">BONUS ROULETTE</h2>
        <div className="flex justify-center gap-4 mb-8">
          {results.map((r, i) => (
            <div key={i} className="w-20 h-24 bg-white border-4 border-yellow-300 rounded-xl flex items-center justify-center text-5xl shadow-inner">
              {r}
            </div>
          ))}
        </div>
        
        {!done ? (
          <button 
            onClick={spin}
            disabled={spinning}
            className={`w-full py-4 text-white rounded-xl font-black text-2xl border-b-4 active:translate-y-1 active:border-b-0 ${spinning ? 'bg-gray-400 border-gray-500 cursor-not-allowed' : 'bg-yellow-500 border-yellow-700 hover:bg-yellow-400'}`}
          >
            {spinning ? 'SPINNING...' : 'SPIN!'}
          </button>
        ) : (
          <div className="animate-bounce">
            <p className="text-2xl font-bold text-gray-700 mb-4">YOU WON</p>
            <p className="text-4xl font-black text-yellow-600 mb-6">{getReward()} 🥕</p>
            <button 
              onClick={() => onComplete(getReward())}
              className="w-full py-4 bg-green-500 text-white rounded-xl font-black text-xl border-b-4 border-green-700 active:border-b-0 active:translate-y-1"
            >
              COLLECT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const GameScreen: React.FC<GameScreenProps> = ({ initialLevel, upgrades = { level: 1 }, onWin, onLose, onExit }) => {
  const { board, gameState, selectedPos, onTileClick, clearSelection, proceedToNextLevel, level, wave, enemies, characters, score, highScore, recentAttacks, fever, princeAttacks, isAiLoading, isAiGenerated, timeLeft } = useGame({
    initialLevel,
    upgrades,
    onWin,
    onLose
  });
  
  const [showTutorial, setShowTutorial] = useState(false);
  
  useEffect(() => {
    if (initialLevel === 1) {
      const seen = localStorage.getItem('fatPrinceTutorial');
      if (!seen) {
        setShowTutorial(true);
      }
    }
  }, [initialLevel]);

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('fatPrinceTutorial', 'true');
  };

  const [boardWidth, setBoardWidth] = useState(360);
  const [cursorPos, setCursorPos] = useState<Position | null>(null);

  useGamepad(
    () => { // UP
      setCursorPos(p => {
        if (!p) return { r: Math.floor(GRID_ROWS/2), c: Math.floor(GRID_COLS/2) };
        return { r: Math.max(0, p.r - 1), c: p.c };
      });
    },
    () => { // DOWN
      setCursorPos(p => {
        if (!p) return { r: Math.floor(GRID_ROWS/2), c: Math.floor(GRID_COLS/2) };
        return { r: Math.min(GRID_ROWS - 1, p.r + 1), c: p.c };
      });
    },
    () => { // LEFT
      setCursorPos(p => {
        if (!p) return { r: Math.floor(GRID_ROWS/2), c: Math.floor(GRID_COLS/2) };
        return { r: p.r, c: Math.max(0, p.c - 1) };
      });
    },
    () => { // RIGHT
      setCursorPos(p => {
        if (!p) return { r: Math.floor(GRID_ROWS/2), c: Math.floor(GRID_COLS/2) };
        return { r: p.r, c: Math.min(GRID_COLS - 1, p.c + 1) };
      });
    },
    () => { // SELECT
      if (gameState !== 'IDLE') return;
      if (cursorPos) {
        onTileClick(cursorPos);
      } else {
        setCursorPos({ r: Math.floor(GRID_ROWS/2), c: Math.floor(GRID_COLS/2) });
      }
    },
    () => { // CANCEL
      if (gameState !== 'IDLE') return;
      clearSelection();
    }
  );
  
  useEffect(() => {
    const handleResize = () => {
      const maxWidth = Math.min(window.innerWidth - 32, 450); 
      setBoardWidth(maxWidth);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (gameState === 'GAME_OVER') {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white font-sans relative p-4 overflow-y-auto">
        <h1 className="text-4xl md:text-5xl font-black text-red-500 mb-2 drop-shadow-lg uppercase tracking-wider">DEFEAT</h1>
        <p className="text-base text-gray-400 mb-4 font-semibold">You survived on Level {level}</p>
        
        <HighScoreSubmit 
          score={score} 
          level={level} 
          onClose={() => {
            // Callback once submitted or skipped, can reload or go to map
          }} 
        />

        <div className="flex gap-4 mt-4">
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-2.5 bg-white text-black font-black rounded-full hover:bg-gray-200 transition-colors shadow-lg text-xs uppercase tracking-wider"
          >
            Try Again
          </button>
          <button 
            onClick={onExit}
            className="px-8 py-2.5 bg-gray-800 text-white font-black rounded-full hover:bg-gray-700 transition-colors shadow-lg text-xs uppercase tracking-wider"
          >
            Map
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-gray-950 flex justify-center overflow-hidden touch-none select-none font-sans relative">
      {/* Level Survival Timer HUD */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
        <div className={`px-4 py-1.5 rounded-full border-2 text-center font-mono font-black flex flex-col items-center justify-center transition-all ${
          timeLeft <= 10 
            ? "bg-red-950/90 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-bounce" 
            : "bg-slate-900/90 border-yellow-400 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
        }`}>
          <div className="text-[8px] font-sans font-black tracking-widest uppercase text-white opacity-70">SURVIVE</div>
          <div className="text-lg leading-none">{formatTime(timeLeft)}</div>
        </div>
      </div>

      {showTutorial && (
        <div className="absolute inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(255,255,255,0.2)] border-8 border-sky-400 text-center relative">
            <h2 className="text-3xl font-black text-sky-600 mb-4">HOW TO PLAY</h2>
            <div className="text-left text-lg font-bold text-gray-700 space-y-4 mb-6">
              <p>👆 <strong>Match 3</strong> or more identical tiles to attack!</p>
              <ul className="pl-4 space-y-2 text-base font-medium">
                <li>⚔️ <span className="text-red-500 font-bold">Swords</span> & 🏹 <span className="text-yellow-600 font-bold">Arrows</span>: Hit front enemy</li>
                <li>💣 <span className="text-gray-800 font-bold">Bombs</span>: Splash damage to all!</li>
                <li>❤️ <span className="text-pink-500 font-bold">Hearts</span>: Heal your team</li>
                <li>🎂 <span className="text-purple-500 font-bold">Cake</span>: FAT PRINCE SPECIAL ATTACK</li>
              </ul>
              <p>🌈 Match 5 to get a Rainbow tile!</p>
            </div>
            <button 
              onClick={closeTutorial}
              className="w-full py-4 bg-sky-500 text-white rounded-xl font-black text-xl border-b-4 border-sky-700 active:border-b-0 active:translate-y-1"
            >
              GOT IT!
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={onExit}
        className="absolute top-2 right-2 z-50 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20"
      >
        QUIT
      </button>

      {/* Score Display */}
      <div className="absolute top-2 left-2 z-50 flex flex-col gap-1.5 items-start">
        <div className="flex gap-2">
          <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-black border border-white/10 shadow-lg flex items-center gap-2">
             <span className="text-gray-400">SCORE</span>
             <span className="text-yellow-400">{score.toLocaleString()}</span>
          </div>
          {highScore > 0 && (
            <div className="bg-black/60 text-white px-3 py-1 rounded-full text-xs font-black border border-white/10 shadow-lg flex items-center gap-2">
               <span className="text-gray-400">HI</span>
               <span className="text-orange-400">{highScore.toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border shadow-lg flex items-center gap-1.5 transition-all duration-300 select-none ${
          isAiLoading 
            ? "bg-purple-950/80 border-purple-500/50 text-purple-300"
            : isAiGenerated
              ? "bg-indigo-950/80 border-indigo-500/80 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
              : "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isAiLoading ? "bg-purple-400 animate-ping" : isAiGenerated ? "bg-indigo-400 animate-pulse" : "bg-emerald-400"}`} />
          <span>{isAiLoading ? "AI GENERATING..." : isAiGenerated ? "GEMINI AI POWERED" : "PROCEDURAL ACTIVE"}</span>
        </div>
      </div>

      <div className="w-full max-w-md flex flex-col h-[100dvh] pb-8 pt-2">
        <BattleScene 
          characters={characters} 
          enemies={enemies} 
          level={level}
          wave={wave}
          recentAttacks={recentAttacks}
          fever={fever}
          princeAttacks={princeAttacks}
        />
        
        {/* Fever Progress Bar with special glow animation */}
        <div className="px-4 py-2 flex flex-col gap-1.5 w-full select-none relative">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes moveStripes {
              0% { background-position: 0 0; }
              100% { background-position: 20px 20px; }
            }
            .animate-stripes {
              animation: moveStripes 1s linear infinite;
            }
          `}} />
          
          <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase">
            <span className="text-purple-400">FEVER ENERGY</span>
            <span className={fever >= 100 ? "text-yellow-400 animate-pulse font-black" : "text-pink-400 font-bold"}>
              {fever >= 100 ? "PRINCE USAGYUUUN READY!" : `FEVER ${Math.floor(fever)}%`}
            </span>
          </div>
          <div 
            className={`relative w-full h-5 rounded-full bg-purple-950/85 border-2 overflow-hidden flex items-center transition-all duration-300 ${
              fever >= 100 
                ? "border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.9)] scale-[1.02]" 
                : "border-purple-600 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
            }`}
          >
            {/* Animated active background pulse glow when full */}
            {fever >= 100 && (
              <div className="absolute inset-0 bg-yellow-400/25 animate-pulse pointer-events-none z-10" />
            )}
            
            <motion.div 
              className={`h-full bg-gradient-to-r relative ${
                fever >= 100 
                  ? "from-yellow-500 via-orange-500 to-yellow-300 animate-pulse" 
                  : "from-purple-600 via-pink-500 to-indigo-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${fever}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Internal diagonal stripes moving animation */}
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none animate-stripes"
                style={{ 
                  backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%, transparent 50%, #fff 50%, #fff 75%, transparent 75%, transparent)',
                  backgroundSize: '20px 20px'
                }}
              />
            </motion.div>

            {/* Glowing crown/spark indicator on the slider thumb */}
            {fever > 0 && fever < 100 && (
              <motion.div 
                className="absolute text-xs"
                style={{ left: `calc(${fever}% - 10px)` }}
                animate={{ y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                🥕
              </motion.div>
            )}

            {fever >= 100 && (
              <div className="absolute inset-0 flex justify-center items-center text-[10px] font-black text-white uppercase tracking-widest drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] z-20">
                👑 CROWN UNLEASHED 👑
              </div>
            )}
          </div>
        </div>

        <div className="h-6 flex justify-center items-center mb-2">
          {gameState === 'LEVEL_COMPLETE' && (
            <span className="text-yellow-400 font-bold animate-pulse text-lg tracking-widest">VICTORY!</span>
          )}
        </div>

        <div className="px-4 flex-none flex justify-center">
          <Board 
            board={board} 
            selectedPos={selectedPos}
            cursorPos={cursorPos}
            onTileClick={onTileClick}
            width={boardWidth}
          />
        </div>
      </div>
      
      {gameState === 'SLOT_MACHINE' && (
        <SlotMachine onComplete={(rewardCarrots) => proceedToNextLevel(rewardCarrots)} />
      )}
      
      {gameState === 'LOADING' && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-white font-black text-2xl animate-pulse">LOADING NEXT LEVEL...</h2>
        </div>
      )}
    </div>
  );
};
