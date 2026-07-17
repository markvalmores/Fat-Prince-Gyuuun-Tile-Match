import { useState, useEffect, useCallback, useRef } from 'react';
import { Tile, TileType, Position, Character, Enemy } from '../types';
import { createBoard, hasMatches, findMatches, swapTiles, fillEmptySpaces, applyGravity, findPossibleMove, getHorizontalClearTiles, getVerticalClearTiles, getPlusClearTiles, getCrossClearTiles } from './board';
import { getLevelData, INITIAL_CHARACTERS } from './levels';
import { audio } from './audio';
import { triggerHaptic } from './haptics';

type GameState = 'IDLE' | 'SWAPPING' | 'MATCHING' | 'FALLING' | 'REFILLING' | 'GAME_OVER' | 'LEVEL_COMPLETE' | 'SLOT_MACHINE' | 'LOADING';

export const useGame = (options: { initialLevel?: number, upgrades?: { level: number }, onWin?: (level: number, carrots: number, score: number) => void, onLose?: (level: number) => void, onClearTiles?: (counts: Record<TileType, number>) => void } = {}) => {
  const { initialLevel = 1, upgrades = { level: 1 }, onWin, onLose, onClearTiles } = options;
  const [board, setBoard] = useState<Tile[]>([]);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [fever, setFever] = useState(0);
  const [princeAttacks, setPrinceAttacks] = useState(false);
  const [levelCarrots, setLevelCarrots] = useState(0);
  const [comboPopup, setComboPopup] = useState<{ text: string, carrots: number, multiplier: number, id: string } | null>(null);
  
  const [matchTick, setMatchTick] = useState(0);
  const [forcedMatchIds, setForcedMatchIds] = useState<string[]>([]);
  const [level, setLevel] = useState(initialLevel);
  const [bossRequiredTypes, setBossRequiredTypes] = useState<TileType[]>([]);
  const [wave, setWave] = useState(0);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [currentLevelData, setCurrentLevelData] = useState<any>(getLevelData(initialLevel));
  const [isPaused, setIsPaused] = useState(false);

  // Boss OST music loop trigger effect
  useEffect(() => {
    if (level % 10 === 0 && ['IDLE', 'SWAPPING', 'MATCHING', 'FALLING', 'REFILLING'].includes(gameState) && !isPaused) {
      audio.startBossTheme();
    } else {
      audio.stopBossTheme();
    }
    return () => {
      audio.stopBossTheme();
    };
  }, [level, gameState, isPaused]);

  const stateRef = useRef({ board, enemies, characters, level, wave, combo, fever, currentLevelData });
  stateRef.current = { board, enemies, characters, level, wave, combo, fever, currentLevelData };

  const updateBoard = (updater: Tile[] | ((prev: Tile[]) => Tile[])) => {
    setBoard(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      stateRef.current.board = next;
      return next;
    });
  };

  const [retryTrigger, setRetryTrigger] = useState(0);
  const [hintPositions, setHintPositions] = useState<Position[] | null>(null);
  const lastActivityTime = useRef(Date.now());

  const resetInactivity = useCallback(() => {
    lastActivityTime.current = Date.now();
    setHintPositions(null);
  }, []);

  useEffect(() => {
    if (isPaused || gameState !== 'IDLE') {
      lastActivityTime.current = Date.now();
      setHintPositions(null);
      return;
    }

    const interval = setInterval(() => {
      if (Date.now() - lastActivityTime.current >= 10000) {
        const move = findPossibleMove(board);
        if (move) {
          setHintPositions(move);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, isPaused, board]);

  useEffect(() => {
    setLevel(initialLevel);
  }, [initialLevel]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialLevel % 10 === 0 ? 428 : 214);
  
  // Update timeLeft when level changes
  useEffect(() => {
    setTimeLeft(level % 10 === 0 ? 428 : 214);
  }, [level, retryTrigger]);

  // Handle Level Survival Timer Countdown
  useEffect(() => {
    if (['IDLE', 'SWAPPING', 'MATCHING', 'FALLING', 'REFILLING'].includes(gameState) && !isPaused) {
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
  }, [gameState, isPaused]);
  
  // Initialize Level
  useEffect(() => {
    // 1. Instantly load local procedural fallback
    const fallbackData = getLevelData(level);
    setCurrentLevelData(fallbackData);
    setWave(0);
    setEnemies(fallbackData.waves[0]);
    setIsAiGenerated(false);
    setLevelCarrots(0);
    setComboPopup(null);

    // Setup Boss requirements
    if (level % 10 === 0) {
      // Choose 2 distinct required types from 1 to 5 (SWORD, GUN, BOMB, HEART, CAKE)
      const t1 = 1 + (level % 5);
      const t2 = 1 + ((level + 2) % 5);
      setBossRequiredTypes([t1, t2]);
    } else {
      setBossRequiredTypes([]);
    }
    
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

    // Apply random ice and chains locks if boss level
    if (level % 10 === 0) {
      let locksCount = 0;
      const indices = Array.from({ length: newBoard.length }, (_, i) => i);
      // Shuffle indices
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = indices[i];
        indices[i] = indices[j];
        indices[j] = temp;
      }
      
      const lockLimit = Math.min(6 + Math.floor(level / 10), 12); // slightly more locks for higher boss levels
      for (let i = 0; i < indices.length && locksCount < lockLimit; i++) {
        const idx = indices[i];
        newBoard[idx].lockType = Math.random() > 0.5 ? 'ice' : 'chains';
        locksCount++;
      }
    }

    updateBoard(newBoard);
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
  }, [level, retryTrigger]);

  const [recentAttacks, setRecentAttacks] = useState<Record<TileType, number>>({
    [TileType.EMPTY]: 0, [TileType.SWORD]: 0, [TileType.GUN]: 0, 
    [TileType.BOMB]: 0, [TileType.HEART]: 0, [TileType.CAKE]: 0, [TileType.RAINBOW]: 0,
    [TileType.HORIZONTAL_CLEARER]: 0, [TileType.VERTICAL_CLEARER]: 0, [TileType.PLUS_CLEARER]: 0, [TileType.CROSS_CLEARER]: 0, [TileType.SMILEY_CLEARER]: 0
  });

  // Keep stateRef updated on every render
  stateRef.current = { board, enemies, characters, level, wave, combo, fever, currentLevelData };

  const handleCombat = useCallback((counts: Record<TileType, number>) => {
    setRecentAttacks(counts);
    if (onClearTiles) {
      onClearTiles(counts);
    }
    setTimeout(() => {
      setRecentAttacks({
        [TileType.EMPTY]: 0, [TileType.SWORD]: 0, [TileType.GUN]: 0, 
        [TileType.BOMB]: 0, [TileType.HEART]: 0, [TileType.CAKE]: 0, [TileType.RAINBOW]: 0,
        [TileType.HORIZONTAL_CLEARER]: 0, [TileType.PLUS_CLEARER]: 0, [TileType.CROSS_CLEARER]: 0, [TileType.SMILEY_CLEARER]: 0
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
    
    // Check if boss level and boss enemy exists
    const isBossActive = level % 10 === 0 && stateRef.current.enemies.some(e => e.isBoss);
    
    let dmgWarrior = counts[TileType.SWORD] * 10 * dmgMultiplier;
    let dmgRanger = counts[TileType.GUN] * 8 * dmgMultiplier;
    let dmgBomb = counts[TileType.BOMB] * 15 * dmgMultiplier; // Splash damage
    
    let dmgHeartBonus = 0;
    let dmgCakeBonus = 0;
    
    if (isBossActive && bossRequiredTypes.length > 0) {
      if (!bossRequiredTypes.includes(TileType.SWORD)) dmgWarrior = 0;
      if (!bossRequiredTypes.includes(TileType.GUN)) dmgRanger = 0;
      if (!bossRequiredTypes.includes(TileType.BOMB)) dmgBomb = 0;
      
      if (bossRequiredTypes.includes(TileType.HEART)) {
        dmgHeartBonus = counts[TileType.HEART] * 12 * dmgMultiplier;
      }
      if (bossRequiredTypes.includes(TileType.CAKE)) {
        dmgCakeBonus = counts[TileType.CAKE] * 18 * dmgMultiplier;
      }
    }
    
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
      let totalDirectDamage = dmgWarrior + dmgRanger + dmgHeartBonus + dmgCakeBonus;
      
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
      triggerHaptic('error');
      setTimeout(() => {
        if (onLose) onLose(level);
      }, 1500);
    } else {
      // Check if board has possible moves, if not, shuffle!
      const move = findPossibleMove(stateRef.current.board);
      if (!move && stateRef.current.board.length > 0) {
        console.log('[useGame] No moves possible, shuffling board...');
        setGameState('REFILLING');
        setTimeout(() => {
          let shuffledBoard = createBoard();
          while (hasMatches(shuffledBoard) || !findPossibleMove(shuffledBoard)) {
            shuffledBoard = createBoard();
          }
          updateBoard(shuffledBoard);
          setGameState('IDLE');
        }, 1000);
      } else {
        setGameState('IDLE');
      }
    }
  }, [onWin, onLose]);

  const [rainbowTriggered, setRainbowTriggered] = useState(false);

  // Process game state machine
  useEffect(() => {
    if (isPaused) return;
    let timeoutId: number;

    if (gameState === 'IDLE') {
      setCombo(0);
    } else if (gameState === 'MATCHING') {
      const { board: currentBoard, combo: currentCombo } = stateRef.current;
           if (rainbowTriggered) {
        // Clear entire board!
        const counts: Record<TileType, number> = {
          [TileType.EMPTY]: 0, [TileType.SWORD]: 0, [TileType.GUN]: 0, 
          [TileType.BOMB]: 0, [TileType.HEART]: 0, [TileType.CAKE]: 0, [TileType.RAINBOW]: 0,
          [TileType.HORIZONTAL_CLEARER]: 0, [TileType.PLUS_CLEARER]: 0, [TileType.CROSS_CLEARER]: 0, [TileType.SMILEY_CLEARER]: 0
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
        triggerHaptic('heavy');
        updateBoard(prev => fillEmptySpaces(prev.map(t => ({ ...t, type: TileType.EMPTY, isGlowing: false }))));
        setRainbowTriggered(false);
        timeoutId = window.setTimeout(() => {
          if (hasMatches(stateRef.current.board)) {
            setMatchTick(t => t + 1);
          } else {
            processEnemyAttacks();
          }
        }, 300);
        return;
      }

      const matchResult = findMatches(currentBoard, forcedMatchIds);
      setForcedMatchIds([]); // Clear after use
      if (matchResult.matchedTiles.length > 0) {
        setCombo(c => c + 1);
        if (currentCombo >= 1) {
          triggerHaptic('combo');
        } else {
          triggerHaptic('medium');
        }
        
        // Calculate max match group size and any bonus carrots
        let maxGroupSize = 3;
        let bonusCarrotsThisMatch = 0;
        
        if (matchResult.matchGroups) {
          matchResult.matchGroups.forEach(group => {
            const size = group.tiles.length;
            if (size > maxGroupSize) {
              maxGroupSize = size;
            }
            if (size === 4) {
              bonusCarrotsThisMatch += 5;
            } else if (size === 5) {
              bonusCarrotsThisMatch += 15;
            } else if (size >= 6) {
              bonusCarrotsThisMatch += 30;
            }
          });
        }
        
        // Multiplier based on max group size
        let comboSizeMultiplier = 1.0;
        if (maxGroupSize === 4) comboSizeMultiplier = 1.5;
        else if (maxGroupSize === 5) comboSizeMultiplier = 2.0;
        else if (maxGroupSize >= 6) comboSizeMultiplier = 3.0;

        setScore(s => {
          let points = matchResult.matchedTiles.length * 10 * (currentCombo + 1);
          if (matchResult.specialSpawns.length > 0) points += 500;
          
          // Apply combo size multiplier
          points = Math.floor(points * comboSizeMultiplier);
          
          const newScore = s + points;
          setHighScore(hs => Math.max(hs, newScore));
          return newScore;
        });

        if (bonusCarrotsThisMatch > 0) {
          setLevelCarrots(prev => prev + bonusCarrotsThisMatch);
          const label = maxGroupSize === 4 ? "4-IN-A-ROW!" : maxGroupSize === 5 ? "5-IN-A-ROW!" : "MEGA MATCH!";
          setComboPopup({
            text: label,
            carrots: bonusCarrotsThisMatch,
            multiplier: comboSizeMultiplier,
            id: Math.random().toString()
          });
          
          // Clear after 1.8 seconds
          setTimeout(() => {
            setComboPopup(prev => prev && prev.carrots === bonusCarrotsThisMatch ? null : prev);
          }, 1800);
        }

        audio.playMatch(currentCombo);
        // Apply effects of matches
        handleCombat(matchResult.counts);
        
        // Remove matched tiles and instantly fall and refill in place!
        const matchedIds = new Set(matchResult.matchedTiles.map(t => t.id));
        updateBoard(prev => {
           const matchedCoords = prev.filter(t => matchedIds.has(t.id)).map(t => ({ r: t.r, c: t.c }));
           let unlockedAny = false;
           
           const updated = prev.map(t => {
             if (t.lockType && !matchedIds.has(t.id)) {
               const isAdjacent = matchedCoords.some(mc => Math.abs(t.r - mc.r) + Math.abs(t.c - mc.c) === 1);
               if (isAdjacent) {
                 unlockedAny = true;
                 return { ...t, lockType: undefined };
               }
             }
             return t;
           });

           if (unlockedAny) {
             audio.playIceBreak();
             triggerHaptic('medium');
           }

           const nextBoard = updated.map(t => matchedIds.has(t.id) ? { ...t, type: TileType.EMPTY, isGlowing: false } : t);
           
           // Add special spawns
           if (matchResult.specialSpawns) {
             matchResult.specialSpawns.forEach(spawn => {
               const tIdx = nextBoard.findIndex(t => t.r === spawn.r && t.c === spawn.c);
               if (tIdx !== -1) {
                 nextBoard[tIdx] = { ...nextBoard[tIdx], type: spawn.type, isGlowing: spawn.isGlowing };
               }
             });
           }
           return fillEmptySpaces(nextBoard);
        });
        
        timeoutId = window.setTimeout(() => {
          if (hasMatches(stateRef.current.board)) {
            setMatchTick(t => t + 1);
          } else {
            processEnemyAttacks();
          }
        }, 50);
      } else {
        // No more matches, enemies turn to attack
        processEnemyAttacks();
      }
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [gameState, matchTick, handleCombat, processEnemyAttacks, rainbowTriggered, isPaused]);

  const onTileClick = (pos: Position) => {
    resetInactivity();
    if (isPaused) return;
    if (gameState !== 'IDLE') return;

    const clickedTile = board.find(t => t.r === pos.r && t.c === pos.c);
    if (clickedTile?.lockType) {
      audio.playError();
      triggerHaptic('error');
      setSelectedPos(null);
      return;
    }

    if (!selectedPos) {
      setSelectedPos(pos);
      triggerHaptic('light');
      return;
    }

    const selTile = board.find(t => t.r === selectedPos.r && t.c === selectedPos.c);
    if (selTile?.lockType) {
      setSelectedPos(null);
      return;
    }

    // Check if adjacent
    const isAdjacent = (Math.abs(selectedPos.r - pos.r) === 1 && selectedPos.c === pos.c) ||
                       (Math.abs(selectedPos.c - pos.c) === 1 && selectedPos.r === pos.r);

    if (isAdjacent) {
      setGameState('SWAPPING');
      audio.playSwap();
      triggerHaptic('medium');
      const swappedBoard = swapTiles(board, selectedPos, pos);
      updateBoard(swappedBoard);
      setSelectedPos(null);

      const t1 = board.find(t => t.r === selectedPos.r && t.c === selectedPos.c);
      const t2 = board.find(t => t.r === pos.r && t.c === pos.c);
      const isRainbowSwap = t1?.type === TileType.RAINBOW || t2?.type === TileType.RAINBOW;
      
      const specialTypes = [TileType.HORIZONTAL_CLEARER, TileType.VERTICAL_CLEARER, TileType.PLUS_CLEARER, TileType.CROSS_CLEARER, TileType.SMILEY_CLEARER];
      const isSpecialSwap = (t1 && specialTypes.includes(t1.type)) || 
                          (t2 && specialTypes.includes(t2.type));

      // Check if it resulted in a match
      setTimeout(() => {
        if (isRainbowSwap) {
          setRainbowTriggered(true);
          setGameState('MATCHING');
        } else if (isSpecialSwap) {
          // If a special tile was swapped, we FORCE it to activate
          // even if no match-3 was formed.
          const idsToForce = [];
          if (t1 && specialTypes.includes(t1.type)) idsToForce.push(t1.id);
          if (t2 && specialTypes.includes(t2.type)) idsToForce.push(t2.id);
          setForcedMatchIds(idsToForce);
          setGameState('MATCHING');
          setMatchTick(t => t + 1);
        } else if (hasMatches(swappedBoard)) {
          setGameState('MATCHING');
        } else {
          // Revert swap
          updateBoard(board);
          setGameState('IDLE');
          audio.playError();
          triggerHaptic('light');
        }
      }, 300);
    } else {
      setSelectedPos(pos);
      triggerHaptic('light');
    }
  };

  const onTileDoubleClick = (pos: Position) => {
    resetInactivity();
    if (isPaused) return;
    if (gameState !== 'IDLE') return;

    const tile = board.find(t => t.r === pos.r && t.c === pos.c);
    if (!tile) return;

    const specialTypes = [TileType.BOMB, TileType.HORIZONTAL_CLEARER, TileType.VERTICAL_CLEARER, TileType.PLUS_CLEARER, TileType.CROSS_CLEARER, TileType.SMILEY_CLEARER];
    
    if (specialTypes.includes(tile.type)) {
        setForcedMatchIds([tile.id]);
        setGameState('MATCHING');
        setMatchTick(t => t + 1);
    }
  };


  const clearSelection = () => {
    setSelectedPos(null);
  };

  const proceedToNextLevel = (rewardCarrots: number) => {
    if (onWin) onWin(level, rewardCarrots, score);
    setGameState('LOADING');
    setTimeout(() => {
      setLevel(l => Math.min(l + 1, 1000));
    }, 2000);
  };

  const retryLevel = () => {
    setScore(0);
    setFever(0);
    setPrinceAttacks(false);
    setSelectedPos(null);
    setCombo(0);
    setRetryTrigger(prev => prev + 1);
    setIsPaused(false);
  };

  return {
    board,
    gameState,
    selectedPos,
    onTileClick,
    onTileDoubleClick,
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
    timeLeft,
    levelCarrots,
    comboPopup,
    setComboPopup,
    isPaused,
    setIsPaused,
    retryLevel,
    hintPositions,
    combo,
    bossRequiredTypes
  };
};
