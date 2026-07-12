/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { MapScreen } from './components/MapScreen';
import { GameScreen } from './components/GameScreen';

type AppState = 'HOME' | 'MAP' | 'GAME';

export interface Upgrades {
  level: number;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(1);
  const [carrots, setCarrots] = useState<number>(0);
  const [upgrades, setUpgrades] = useState<Upgrades>({ level: 1 });

  // Load progress from localStorage
  useEffect(() => {
    const savedLevel = localStorage.getItem('fatPrinceMaxLevel');
    if (savedLevel) setMaxUnlockedLevel(parseInt(savedLevel, 10));
    
    const savedCarrots = localStorage.getItem('fatPrinceCarrots');
    if (savedCarrots) setCarrots(parseInt(savedCarrots, 10));

    const savedUpgrades = localStorage.getItem('fatPrinceUpgrades');
    if (savedUpgrades) setUpgrades(JSON.parse(savedUpgrades));
  }, []);

  const saveCarrots = (amount: number) => {
    const capped = Math.min(amount, 378378378);
    setCarrots(capped);
    localStorage.setItem('fatPrinceCarrots', capped.toString());
  };

  const saveUpgrades = (newUpgrades: Upgrades) => {
    setUpgrades(newUpgrades);
    localStorage.setItem('fatPrinceUpgrades', JSON.stringify(newUpgrades));
  };

  const handleWin = (level: number, rewardCarrots: number) => {
    const nextLevel = Math.min(level + 1, 1000);
    if (nextLevel > maxUnlockedLevel) {
      setMaxUnlockedLevel(nextLevel);
      localStorage.setItem('fatPrinceMaxLevel', nextLevel.toString());
    }
    saveCarrots(carrots + rewardCarrots);
  };

  const handleLose = (level: number) => {
    // optional logic
  };

  return (
    <>
      {appState === 'HOME' && (
        <HomeScreen 
          onPlay={() => setAppState('MAP')} 
          carrots={carrots}
          upgrades={upgrades}
          onUpgrade={saveUpgrades}
          onSpendCarrots={saveCarrots}
        />
      )}
      
      {appState === 'MAP' && (
        <MapScreen 
          maxLevel={maxUnlockedLevel}
          carrots={carrots}
          onSelectLevel={(level) => {
            setSelectedLevel(level);
            setAppState('GAME');
          }}
          onBack={() => setAppState('HOME')}
        />
      )}
      
      {appState === 'GAME' && (
        <GameScreen 
          key={selectedLevel} // Remounts if level changes
          initialLevel={selectedLevel}
          upgrades={upgrades}
          onWin={handleWin}
          onLose={handleLose}
          onExit={() => setAppState('MAP')}
        />
      )}
    </>
  );
}

