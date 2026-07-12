import { useState, useEffect, useCallback, useRef } from 'react';
import { Tile, TileType, Position, Character, Enemy } from '../types';
import { createBoard, hasMatches, findMatches, swapTiles, fillEmptySpaces, applyGravity } from './board';
import { getLevelData, INITIAL_CHARACTERS } from './levels';
import { audio } from './audio';

type GameState = 'IDLE' | 'SWAPPING' | 'MATCHING' | 'FALLING' | 'REFILLING' | 'GAME_OVER' | 'LEVEL_COMPLETE' | 'SLOT_MACHINE' | 'LOADING';

export const useGame = (options: { initialLevel?: number, upgrades?: { level: number }, onWin?: (level: number, carrots: number) => void, onLose?: (level: number) => void, onClearTiles?: (counts: Record<TileType, number>) => void } = {}) => {
  const { initialLevel = 1, upgrades = { level: 1 }, onWin, onLose, onClearTiles } = options;
  const [board, setBoard] = useState<Tile[]>([]);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [fever, setFever] = useState(0);
  const [princeAttacks, setPrinceAttacks] = useState(false);
  
  const [level, setLevel] = useState(initialLevel);
  
  useEffect(() => {
    setLevel(initialLevel);
  }, [initialLevel]);
  const [wave, setWave] = useState(0);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [currentLevelData, setCurrentLevelData] = useState<any>(getLevelData(initialLevel));
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialLevel % 10 === 0 ? 180 : 90);
  
  // Update timeLeft when level changes
  useEffect(() => {
    setTimeLeft(level % 10 === 0 ? 180 : 90);
  }, [level]);

  // Handle Level Survival Timer Countdown
  useEffect(() => {
    if (['IDLE', 'SWAPPING', 'MATCHING', 'FALLING', 'REFILLING'].includes(gameState)) {
      const timerInterval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            // End level with LEVEL_COMPLETE when survival timer hits 0
            setGameState('LEVEL_COMPLETE');
            audio.playLevelComplete();
            setTimeout(() => {
              setGameState('SLOT_MACHINE');
            }, 1500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerInterval);
    }
  }, [gameState]);
  
  // Initialize Level
  useEffect(() => {
    // 1. Instantly load local procedural fallback
    const fallbackData = getLevelData(level);
    setCurrentLevelData(fallbackData);
    setWave(0);
    setEnemies(fallbackData.waves[0]);
    setIsAiGenerated(false);
    
    // Scale characters
    const hpMultiplier = Math.pow(1.04, level - 1);
    const upgradeMultiplier = 1 + (upgrades.level * 0.05);
    setCharacters(INITIAL_CHARACTERS.map(c => ({
      ...c,
      hp: Math.floor(c.maxHp * hpMultiplier * upgradeMultiplier),
      maxHp: Math.floor(c.maxHp * hpMultiplier * upgradeMultiplier),
      dead: false
    })));

    // Create initial board (no matches)
    let newBoard = createBoard();
    while(hasMatches(newBoard)) {
      newBoard = createBoard();
    }
    setBoard(newBoard);
    setGameState('IDLE');

    // 2. Fetch customized AI-generated enemies from the Express backend
    let active = true;
    setIsAiLoading(true);
    fetch('/api/level-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level })
    })
      .then(res => {
        if (!res.ok) throw new Error('API error');
        return res.json();
      })
      .then(data => {
        if (active && data && data.waves) {
          setCurrentLevelData(data);
          setIsAiGenerated(!!data.isAiGenerated);
          // Only update active enemies if the player hasn't moved past wave 0 yet
          if (stateRef.current.wave === 0) {
            setEnemies(data.waves[0]);
          }
        }
      })
      .catch(err => {
        console.log('[useGame] Failed to load AI enemies, using hardcoded procedural fallback:', err);
      })
      .finally(() => {
        if (active) {
          setIsAiLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [level]);

  const [recentAttacks, setRecentAttacks] = useState<Record<TileType, number>>({
    [TileType.EMPTY]: 0, [TileType.SWORD]: 0, [TileType.GUN]: 0, 
    [TileType.BOMB]: 0, [TileType.HEART]: 0, [TileType.CAKE]: 0, [TileType.RAINBOW]: 0
  });

  const stateRef = useRef({ board, enemies, characters, level, wave, combo, fever, currentLevelData });
  stateRef.current = { board, enemies, characters, level, wave, combo, fever, currentLevelData };

  const handleCombat = useCallback((counts: Record<TileType, number>) => {
    setRecentAttacks(counts);
    if (onClearTiles) {
      onClearTiles(counts);
    }
    setTimeout(() => {
      setRecentAttacks({
        [TileType.EMPTY]: 0, [TileType.SWORD]: 0, [TileType.GUN]: 0, 
        [TileType.BOMB]: 0, [TileType.HEART]: 0, [TileType.CAKE]: 0, [TileType.RAINBOW]: 0
      });
    }, 600); // clear after animation

    const { level, fever: currentFever } = stateRef.current;
    
    let newFever = currentFever;
    let princeIsAttacking = false;
    if (counts[TileType.CAKE] > 0) {
      newFever += counts[TileType.CAKE] * 20; // Increase fever strictly from Cakes
      if (newFever >= 100) {
        newFever = 100;
        if (currentFever < 100) {
          audio.playFeverActive();
        }
        princeIsAttacking = true;
        setPrinceAttacks(true);
        setTimeout(() => {
          setPrinceAttacks(false);
          setFever(0); // Reset fever after attack
        }, 2500);
      }
      setFever(Math.min(newFever, 100));
    }

    // Calculate damage and healing
    const dmgMultiplier = Math.pow(1.05, level - 1) * (1 + upgrades.level * 0.05);
    const healMultiplier = Math.pow(1.04, level - 1) * (1 + upgrades.level * 0.05);
    
    const dmgWarrior = counts[TileType.SWORD] * 10 * dmgMultiplier;
    const dmgRanger = counts[TileType.GUN] * 8 * dmgMultiplier;
    const dmgBomb = counts[TileType.BOMB] * 15 * dmgMultiplier; // Splash damage
    // Apply dynamic heart healing based on exact match rules:
    // - 3 matches (3 heart tiles): 34% of max health
    // - 4 matches (4 heart tiles): 50% of max health
    // - 5 matches (5+ heart tiles): 100% of max health (rainbow restore)
    const heartCount = counts[TileType.HEART];
    if (heartCount > 0) {
      let healPct = 0;
      if (heartCount === 3) {
        healPct = 0.34;
      } else if (heartCount === 4) {
        healPct = 0.50;
      } else if (heartCount >= 5) {
        healPct = 1.00;
      } else {
        // Safe linear scaling fallback for smaller or unusual counts
        healPct = (heartCount / 3) * 0.34;
      }

      setCharacters(prev => prev.map(c => {
        if (c.dead) return c;
        const healAmt = Math.floor(c.maxHp * healPct);
        return {
          ...c,
          hp: Math.min(c.maxHp, c.hp + healAmt)
        };
      }));
    }

    // Apply damage to enemies
    setEnemies(prev => {
      let newEnemies = prev.map(e => ({...e}));
      let totalDirectDamage = dmgWarrior + dmgRanger;
      
      // Bomb damages all
      const globalDamage = dmgBomb;
      if (globalDamage > 0) {
        newEnemies = newEnemies.map(e => ({ ...e, hp: e.hp - globalDamage }));
      }
      
      if (princeIsAttacking) {
        for (let i = 0; i < Math.min(3, newEnemies.length); i++) {
          newEnemies[i].hp -= 999999;
        }
      }
      
      // Direct damage hits the first enemy
      if (totalDirectDamage > 0 && newEnemies.length > 0) {
        for (let i = 0; i < newEnemies.length; i++) {
          if (newEnemies[i].hp > 0) {
            newEnemies[i].hp -= totalDirectDamage;
            if (newEnemies[i].hp < 0) {
              totalDirectDamage = -newEnemies[i].hp;
              newEnemies[i].hp = 0;
            } else {
              totalDirectDamage = 0;
            }
          }
        }
      }
      
      return newEnemies.filter(e => e.hp > 0);
    });
  }, [upgrades.level, onWin]);

  const processEnemyAttacks = useCallback(() => {
    const { enemies, characters, level, wave, currentLevelData } = stateRef.current;
    // Check if enemies are defeated
    if (enemies.length === 0) {
      const data = currentLevelData || getLevelData(level);
      if (wave + 1 < data.waves.length) {
        // Next wave
        setWave(wave + 1);
        setEnemies(data.waves[wave + 1]);
        setGameState('IDLE');
        return;
      } else {
        // All waves cleared but level survival timer is still running!
        // To keep the player fighting, loop back to Wave 0 with scaled-up enemy stats
        setWave(0);
        const loopCount = Math.floor(Math.random() * 3) + 1;
        const scaledWaves = data.waves.map((waveEnemies: any) => 
          waveEnemies.map((enemy: any) => ({
            ...enemy,
            id: `${enemy.id}_loop_${Date.now()}_${Math.random()}`,
            hp: Math.floor(enemy.maxHp * (1.2 + 0.15 * loopCount)),
            maxHp: Math.floor(enemy.maxHp * (1.2 + 0.15 * loopCount)),
            attack: Math.floor(enemy.attack * (1.1 + 0.05 * loopCount)),
            name: `🌟 ${enemy.name || 'Critter'} II`
          }))
        );
        setEnemies(scaledWaves[0]);
        setGameState('IDLE');
        return;
      }
    }

    // Enemy attacks
    let anyAttack = false;
    let newEnemies = [...enemies];
    let newChars = characters.map(c => ({...c}));
    
    newEnemies = newEnemies.map(enemy => {
      if (enemy.attackCooldown <= 1) {
        anyAttack = true;
        // Hit a random alive character
        const aliveChars = newChars.filter(c => !c.dead);
        if (aliveChars.length > 0) {
          const target = aliveChars[Math.floor(Math.random() * aliveChars.length)];
          const tIdx = newChars.findIndex(c => c.id === target.id);
          newChars[tIdx].hp -= enemy.attack;
          if (newChars[tIdx].hp <= 0) {
            newChars[tIdx].hp = 0;
            newChars[tIdx].dead = true;
          }
        }
        return { ...enemy, attackCooldown: enemy.maxCooldown };
      }
      return { ...enemy, attackCooldown: enemy.attackCooldown - 1 };
    });

    setEnemies(newEnemies);
    setCharacters(newChars);
    
    if (newChars.every(c => c.dead)) {
      setGameState('GAME_OVER');
      audio.playGameOver();
      setTimeout(() => {
        if (onLose) onLose(level);
      }, 1500);
    } else {
      setGameState('IDLE');
    }
  }, [onWin, onLose]);

  const [rainbowTriggered, setRainbowTriggered] = useState(false);

  // Process game state machine
  useEffect(() => {
    let timeoutId: number;

    if (gameState === 'IDLE') {
      setCombo(0);
    } else if (gameState === 'MATCHING') {
      const { board: currentBoard, combo: currentCombo } = stateRef.current;
      
      if (rainbowTriggered) {
        // Clear entire board!
        const counts: Record<TileType, number> = {
          [TileType.EMPTY]: 0, [TileType.SWORD]: 0, [TileType.GUN]: 0, 
          [TileType.BOMB]: 0, [TileType.HEART]: 0, [TileType.CAKE]: 0, [TileType.RAINBOW]: 0
        };
        currentBoard.forEach(t => {
           if (t.type in counts) counts[t.type as TileType]++;
        });
        setCombo(c => c + 1);
        
        setScore(s => {
          const newScore = s + currentBoard.length * 20 + 1000; // Big bonus
          setHighScore(hs => Math.max(hs, newScore));
          return newScore;
        });

        audio.playMatch(currentCombo);
        handleCombat(counts);
        setBoard(prev => prev.map(t => ({ ...t, type: TileType.EMPTY, isGlowing: false })));
        setRainbowTriggered(false);
        timeoutId = window.setTimeout(() => setGameState('FALLING'), 300);
        return;
      }

      const matchResult = findMatches(currentBoard);
      if (matchResult.matchedTiles.length > 0) {
        setCombo(c => c + 1);
        
        setScore(s => {
          let points = matchResult.matchedTiles.length * 10 * (currentCombo + 1);
          if (matchResult.specialSpawns.length > 0) points += 500;
          const newScore = s + points;
          setHighScore(hs => Math.max(hs, newScore));
          return newScore;
        });

        audio.playMatch(currentCombo);
        // Apply effects of matches
        handleCombat(matchResult.counts);
        
        // Remove matched tiles
        const matchedIds = new Set(matchResult.matchedTiles.map(t => t.id));
        setBoard(prev => {
           const updated = prev.map(t => matchedIds.has(t.id) ? { ...t, type: TileType.EMPTY, isGlowing: false } : t);
           // Add special spawns
           if (matchResult.specialSpawns) {
             matchResult.specialSpawns.forEach(spawn => {
               const tIdx = updated.findIndex(t => t.r === spawn.r && t.c === spawn.c);
               if (tIdx !== -1) {
                 updated[tIdx] = { ...updated[tIdx], type: spawn.type, isGlowing: spawn.isGlowing };
               }
             });
           }
           return updated;
        });
        
        timeoutId = window.setTimeout(() => setGameState('FALLING'), 300);
      } else {
        // No more matches, enemies turn to attack
        processEnemyAttacks();
      }
    } else if (gameState === 'FALLING') {
      setBoard(prev => applyGravity(prev));
      timeoutId = window.setTimeout(() => setGameState('REFILLING'), 300);
    } else if (gameState === 'REFILLING') {
      setBoard(prev => fillEmptySpaces(prev));
      timeoutId = window.setTimeout(() => setGameState('MATCHING'), 300);
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [gameState, handleCombat, processEnemyAttacks, rainbowTriggered]);

  const onTileClick = (pos: Position) => {
    if (gameState !== 'IDLE') return;

    if (!selectedPos) {
      setSelectedPos(pos);
      return;
    }

    // Check if adjacent
    const isAdjacent = (Math.abs(selectedPos.r - pos.r) === 1 && selectedPos.c === pos.c) ||
                       (Math.abs(selectedPos.c - pos.c) === 1 && selectedPos.r === pos.r);

    if (isAdjacent) {
      setGameState('SWAPPING');
      audio.playSwap();
      const swappedBoard = swapTiles(board, selectedPos, pos);
      setBoard(swappedBoard);
      setSelectedPos(null);

      const t1 = board.find(t => t.r === selectedPos.r && t.c === selectedPos.c);
      const t2 = board.find(t => t.r === pos.r && t.c === pos.c);
      const isRainbowSwap = t1?.type === TileType.RAINBOW || t2?.type === TileType.RAINBOW;

      // Check if it resulted in a match
      setTimeout(() => {
        if (isRainbowSwap) {
          setRainbowTriggered(true);
          setGameState('MATCHING');
        } else if (hasMatches(swappedBoard)) {
          setGameState('MATCHING');
        } else {
          // Revert swap
          setBoard(board);
          setGameState('IDLE');
          audio.playError();
        }
      }, 300);
    } else {
      setSelectedPos(pos);
    }
  };

  const clearSelection = () => {
    setSelectedPos(null);
  };

  const proceedToNextLevel = (rewardCarrots: number) => {
    if (onWin) onWin(level, rewardCarrots);
    setGameState('LOADING');
    setTimeout(() => {
      setLevel(l => Math.min(l + 1, 1000));
    }, 2000);
  };

  return {
    board,
    gameState,
    selectedPos,
    onTileClick,
    clearSelection,
    proceedToNextLevel,
    level,
    wave,
    enemies,
    characters,
    score,
    highScore,
    recentAttacks,
    fever,
    princeAttacks,
    isAiLoading,
    isAiGenerated,
    timeLeft
  };
};
