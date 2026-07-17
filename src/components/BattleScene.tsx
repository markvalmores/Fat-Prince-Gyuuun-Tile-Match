import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Character, Enemy, TileType } from '../types';
import { Bunny, BunnyType } from './Bunny';
import { EnemySprite } from './EnemySprite';
import { getThemeForLevel } from '../utils/themes';

interface BattleProps {
  characters: Character[];
  enemies: Enemy[];
  level: number;
  wave: number;
  recentAttacks?: Record<TileType, number>;
  fever?: number;
  princeAttacks?: boolean;
  bossRequiredTypes?: TileType[];
}

const HeartHP = ({ hp, maxHp }: { hp: number; maxHp: number }) => {
  return (
    <div className="absolute -bottom-3 -left-3 flex items-center justify-center z-30 pointer-events-none">
      <svg width="28" height="28" viewBox="0 0 24 24" className="drop-shadow-md">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#dc2626" stroke="#fff" strokeWidth="1.5" />
      </svg>
      <span className="absolute text-[11px] font-black text-white leading-none mt-0.5 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{hp}</span>
    </div>
  );
};

interface VfxEffect {
  id: string;
  type: 'dmg' | 'heal' | 'slash';
  value?: number;
}

const charToBunnyType: Record<string, BunnyType> = {
  warrior: 'blue_scarf',
  ranger: 'cheerleader',
  worker: 'tank',
  priest: 'wizard',
  princess: 'princess'
};

export const BattleScene: React.FC<BattleProps> = ({ characters, enemies, level, wave, recentAttacks, fever = 0, princeAttacks = false, bossRequiredTypes = [] }) => {
  const prevCharsRef = useRef(characters);
  const prevEnemiesRef = useRef(enemies);
  const [charVfx, setCharVfx] = useState<Record<string, VfxEffect[]>>({});
  
  // Track attack animations briefly
  const [attackingIds, setAttackingIds] = useState<Set<string>>(new Set());

  const addVfx = (targetId: string, effect: Omit<VfxEffect, 'id'>) => {
    const id = Math.random().toString();
    setCharVfx(prev => ({
      ...prev,
      [targetId]: [...(prev[targetId] || []), { ...effect, id }]
    }));
    setTimeout(() => {
      setCharVfx(prev => ({
        ...prev,
        [targetId]: prev[targetId].filter(v => v.id !== id)
      }));
    }, 1000);
  };

  useEffect(() => {
    let anyAttack = false;
    const attackerIds = new Set<string>();

    const handleEntity = (current: Character | Enemy, prevList: any[], isEnemy: boolean) => {
      const prev = prevList.find(p => p.id === current.id);
      if (prev) {
        if (current.hp < prev.hp) {
           addVfx(current.id, { type: 'dmg', value: prev.hp - current.hp });
           // If an enemy takes damage, assume party attacked
           if (isEnemy) {
              characters.forEach(c => { if (!c.dead) attackerIds.add(c.id); });
           } else {
              enemies.forEach(e => attackerIds.add(e.id));
           }
        } else if (current.hp > prev.hp) {
           addVfx(current.id, { type: 'heal', value: current.hp - prev.hp });
           if (!isEnemy) {
              const priest = characters.find(c => c.type === 'priest');
              if (priest && !priest.dead) attackerIds.add(priest.id);
           }
        }
      }
    };

    characters.forEach(c => handleEntity(c, prevCharsRef.current, false));
    enemies.forEach(e => handleEntity(e, prevEnemiesRef.current, true));

    if (attackerIds.size > 0) {
      setAttackingIds(attackerIds);
      setTimeout(() => setAttackingIds(new Set()), 300);
    }

    prevCharsRef.current = characters;
    prevEnemiesRef.current = enemies;
  }, [characters, enemies]);

  const theme = getThemeForLevel(level);

  interface Projectile {
    id: string;
    type: 'sword' | 'arrow' | 'bomb' | 'cake' | 'horizontal' | 'plus' | 'cross';
  }
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  interface Particle {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    emoji?: string;
  }
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (princeAttacks) {
      const count = 45;
      const initialParticles: Particle[] = Array.from({ length: count }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        const isEmoji = Math.random() > 0.55;
        return {
          id: `${i}-${Date.now()}`,
          x: 40 + Math.random() * 20,
          y: 45 + Math.random() * 15,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: isEmoji ? 16 + Math.random() * 16 : 4 + Math.random() * 10,
          color: ['#FBBF24', '#F59E0B', '#EF4444', '#EC4899', '#3B82F6', '#10B981'][Math.floor(Math.random() * 6)],
          emoji: isEmoji ? ['✨', '⭐', '🥕', '👑', '💖', '💥', '🌈'][Math.floor(Math.random() * 7)] : undefined
        };
      });
      setParticles(initialParticles);

      let animFrame: number;
      let current = [...initialParticles];
      const update = () => {
        current = current.map(p => ({
          ...p,
          x: p.x + p.vx * 0.35,
          y: p.y + p.vy * 0.35,
          vy: p.vy + 0.22
        })).filter(p => p.x >= -30 && p.x <= 130 && p.y >= -30 && p.y <= 130);

        setParticles(current);
        if (current.length > 0) {
          animFrame = requestAnimationFrame(update);
        }
      };
      animFrame = requestAnimationFrame(update);
      return () => cancelAnimationFrame(animFrame);
    } else {
      setParticles([]);
    }
  }, [princeAttacks]);

  useEffect(() => {
    if (recentAttacks) {
      const p: Projectile[] = [];
      if (recentAttacks[TileType.SWORD] > 0) p.push({ id: Math.random().toString(), type: 'sword' });
      if (recentAttacks[TileType.GUN] > 0) p.push({ id: Math.random().toString(), type: 'arrow' });
      if (recentAttacks[TileType.BOMB] > 0) p.push({ id: Math.random().toString(), type: 'bomb' });
      if (recentAttacks[TileType.HORIZONTAL_CLEARER] > 0) p.push({ id: Math.random().toString(), type: 'horizontal' });
      if (recentAttacks[TileType.PLUS_CLEARER] > 0) p.push({ id: Math.random().toString(), type: 'plus' });
      if (recentAttacks[TileType.CROSS_CLEARER] > 0) p.push({ id: Math.random().toString(), type: 'cross' });
      
      if (p.length > 0) {
        setProjectiles(prev => [...prev, ...p]);
        setTimeout(() => {
          setProjectiles(prev => prev.filter(pr => !p.some(newP => newP.id === pr.id)));
        }, 600); // clear projectiles after flight time
      }
    }
  }, [recentAttacks]);

  const bossEnemy = enemies.find(e => e.isBoss);

  return (
    <div 
      className="flex-1 w-full flex flex-col relative overflow-hidden shadow-2xl rounded-b-2xl mb-4 border-b-4 transition-colors duration-1000"
      style={{ backgroundColor: theme.skyTop, borderColor: theme.ground }}
    >
      
      {/* Fever Bar / Boss HP Bar */}
      {bossEnemy ? (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[92%] bg-slate-950/95 border-2 border-red-500 rounded-xl p-2 z-[105] shadow-[0_0_15px_rgba(239,68,68,0.6)] flex flex-col gap-1 select-none pointer-events-none">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest animate-pulse flex items-center gap-1">
              👑 BOSS: {bossEnemy.name || "DESTRUCTIVE TITAN"}
            </span>
            <span className="text-[9px] font-mono text-gray-400 font-black">
              HP: {bossEnemy.hp} / {bossEnemy.maxHp}
            </span>
          </div>
          
          {/* Neon Boss HP Bar */}
          <div className="w-full h-2 bg-red-950/80 rounded-full border border-red-900 overflow-hidden relative">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-red-500 shadow-[0_0_8px_#f43f5e]"
              initial={{ width: '100%' }}
              animate={{ width: `${(bossEnemy.hp / bossEnemy.maxHp) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:15px_15px] pointer-events-none opacity-20" />
          </div>

          {/* Weakness Requirements */}
          {bossRequiredTypes && bossRequiredTypes.length > 0 && (
            <div className="flex justify-between items-center mt-0.5 bg-black/40 px-1.5 py-0.5 rounded border border-red-500/20">
              <span className="text-[8px] font-black text-gray-300 tracking-wide">
                🔥 MATCH TO BYPASS SHIELD:
              </span>
              <div className="flex gap-1.5 items-center">
                {bossRequiredTypes.map(type => {
                  const icons: Record<number, string> = {
                    1: '⚔️ Sword',
                    2: '🏹 Arrow',
                    3: '💣 Bomb',
                    4: '❤️ Heart',
                    5: '🍰 Cake'
                  };
                  const colors: Record<number, string> = {
                    1: 'bg-red-500/30 text-red-300 border-red-500/50',
                    2: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
                    3: 'bg-gray-700/30 text-gray-300 border-gray-500/50',
                    4: 'bg-pink-500/30 text-pink-300 border-pink-500/50',
                    5: 'bg-blue-500/30 text-blue-300 border-blue-500/50'
                  };
                  return (
                    <span 
                      key={type} 
                      className={`text-[8px] font-black px-1.5 py-0.2 rounded border ${colors[type] || 'bg-slate-700/30 text-slate-300 border-slate-500/50'} shadow-sm`}
                    >
                      {icons[type] || '❓'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-64 h-6 bg-black/50 border-2 border-yellow-400 rounded-full overflow-hidden z-[100] shadow-[0_0_10px_rgba(250,204,21,0.5)] flex items-center justify-center">
          <div className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-orange-500 to-yellow-400 transition-all duration-300" style={{ width: `${fever}%` }} />
          <span className="relative text-[10px] font-black text-white tracking-widest drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] z-10 uppercase">
            {fever! >= 100 ? 'USAGYUUUN READY!' : `FEVER ${Math.floor(fever || 0)}%`}
          </span>
        </div>
      )}

      {/* Prince Attack Overlay */}
      <AnimatePresence>
        {princeAttacks && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.1, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="absolute inset-0 z-[200] flex items-center justify-center pointer-events-none"
          >
            <div className="relative transform scale-[3] origin-bottom">
               <div className="absolute inset-0 bg-yellow-400 rounded-full blur-[20px] opacity-50 animate-pulse" />
               <Bunny type="fever_prince" isAttacking />
               <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: [1, 1.2, 1] }}
                 transition={{ repeat: Infinity, duration: 0.5 }}
                 className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black text-yellow-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]"
               >
                 ULTIMATE SMASH!
               </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fever Attack Particles Layer */}
      <div className="absolute inset-0 z-[210] overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div 
            key={p.id}
            style={{ 
              position: 'absolute',
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.emoji ? 'auto' : `${p.size}px`,
              height: p.emoji ? 'auto' : `${p.size}px`,
              backgroundColor: p.emoji ? 'transparent' : p.color,
              borderRadius: '50%',
              fontSize: p.emoji ? `${p.size}px` : undefined,
              transform: 'translate(-50%, -50%)',
              boxShadow: p.emoji ? 'none' : `0 0 10px ${p.color}`,
              pointerEvents: 'none'
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Background Environment */}
      <div className="absolute inset-0 bg-gradient-to-b opacity-50 pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${theme.skyBottom})` }} />
      <div className="absolute top-4 right-8 w-16 h-16 bg-white/40 rounded-full blur-xl pointer-events-none" />
      
      {/* Distant Hills / Background layer 1 */}
      <div 
        className="absolute top-1/4 left-[-10%] w-[120%] h-[40%] rounded-t-[50%] border-t-4 transition-colors duration-1000"
        style={{ backgroundColor: theme.ground, borderColor: theme.path, opacity: 0.8 }} 
      />
      
      {/* Decor Elements based on theme */}
      {theme.decorType === 'village' && (
        <div className="absolute top-[25%] left-[5%] w-20 h-20 bg-[#e8c39e] border-4 border-[#8b5a2b] shadow-lg">
          <div className="absolute -top-12 -left-2 w-24 h-12 bg-[#d35400] border-4 border-[#8b5a2b]" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-10 bg-[#8b5a2b] border-2 border-black rounded-t-sm" />
        </div>
      )}
      {theme.decorType === 'farm' && (
        <div className="absolute top-[28%] left-[10%] w-16 h-16 bg-red-600 border-4 border-black shadow-lg">
          <div className="absolute -top-10 -left-2 w-20 h-10 bg-red-800 border-4 border-black" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
        </div>
      )}
      {theme.decorType === 'city' && (
        <>
          <div className="absolute top-[10%] left-[10%] w-16 h-40 bg-gray-800 border-4 border-black" />
          <div className="absolute top-[20%] left-[25%] w-12 h-32 bg-gray-700 border-4 border-black" />
        </>
      )}
      {theme.decorType === 'space' && (
        <>
           <div className="absolute top-[10%] left-[20%] w-4 h-4 bg-yellow-100 rounded-full animate-pulse" />
           <div className="absolute top-[30%] right-[30%] w-2 h-2 bg-white rounded-full animate-pulse" />
           <div className="absolute top-[15%] right-[10%] w-12 h-12 bg-gray-300 rounded-full shadow-[inset_-4px_-4px_rgba(0,0,0,0.5)]" />
        </>
      )}

      {/* Trees / Decor layer 2 */}
      {(theme.decorType === 'village' || theme.decorType === 'farm') && (
        <>
          <div className="absolute top-[20%] right-[15%] w-16 h-40 bg-[#2d5a27] rounded-full border-4 border-black/20" />
          <div className="absolute top-[25%] right-[20%] w-20 h-32 bg-[#3a7533] rounded-full border-4 border-black/20 shadow-lg" />
        </>
      )}
      {theme.decorType === 'snow' && (
        <>
          <div className="absolute top-[20%] right-[15%] w-16 h-40 bg-white rounded-full border-4 border-blue-200" />
          <div className="absolute top-[25%] right-[20%] w-20 h-32 bg-blue-50 rounded-full border-4 border-blue-200 shadow-lg" />
        </>
      )}

      {/* Path */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[45%] border-t-[12px] shadow-[inset_0_20px_20px_rgba(0,0,0,0.15)] transition-colors duration-1000"
        style={{ backgroundColor: theme.path, borderColor: theme.ground }}
      >
         <div className="w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #000 2px, transparent 2px)', backgroundSize: '16px 12px' }} />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full p-4 pointer-events-none">
        
        {/* Header UI */}
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 bg-orange-200 border-4 border-orange-400 rounded-full flex items-center justify-center shadow-lg font-black text-orange-800">
            ||
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="bg-white/90 text-[#8b5a2b] px-6 py-1.5 rounded-full font-black uppercase tracking-widest text-sm shadow-md border-4 border-[#d0a775] flex gap-4 items-center">
              <span>LV {level}</span>
              <span className="opacity-50">|</span>
              <span className="text-orange-500">WAVE {wave + 1}</span>
            </div>
            <div className="bg-black/50 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
              {theme.name}
            </div>
          </div>
        </div>

        {/* Battle Entities */}
        <div className="w-full flex-1 flex justify-between items-end pb-4 px-2 relative">
          
          {/* Projectiles */}
          <div className="absolute inset-0 pointer-events-none z-30">
            {projectiles.map(p => (
              <motion.div
                key={p.id}
                className="absolute top-1/2 left-[20%]"
                initial={{ x: 0, y: -20, scale: 0.5, rotate: p.type === 'arrow' ? 0 : 0 }}
                animate={{ x: 200, y: 20, scale: 1.5, rotate: p.type === 'arrow' ? 45 : 360 }}
                transition={{ duration: 0.5, ease: "easeIn" }}
              >
                {p.type === 'sword' && <div className="text-4xl filter drop-shadow-md">⚔️</div>}
                {p.type === 'arrow' && <div className="text-4xl filter drop-shadow-md">🏹</div>}
                {p.type === 'bomb' && <div className="text-4xl filter drop-shadow-md">💣</div>}
                {p.type === 'cake' && <div className="text-5xl filter drop-shadow-md">🎂</div>}
                {p.type === 'horizontal' && <div className="text-4xl filter drop-shadow-md">↔️</div>}
                {p.type === 'plus' && <div className="text-4xl filter drop-shadow-md">➕</div>}
                {p.type === 'cross' && <div className="text-4xl filter drop-shadow-md">✖️</div>}
              </motion.div>
            ))}
          </div>

          {/* Party (Left) */}
          <div className="flex gap-4 items-end relative z-20">
            {characters.map(char => {
              const vfxList = charVfx[char.id] || [];
              const isAttacking = attackingIds.has(char.id);
              return (
                <div key={char.id} className="relative flex flex-col items-center">
                  <AnimatePresence>
                    {vfxList.map(v => (
                      <motion.div
                        key={v.id}
                        initial={{ opacity: 1, y: 0, scale: 0.5 }}
                        animate={{ opacity: 0, y: -40, scale: 1.2 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`absolute -top-8 whitespace-nowrap font-black text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-50 ${v.type === 'dmg' ? 'text-red-500' : 'text-green-400'}`}
                      >
                        {v.type === 'dmg' ? `-${v.value}` : `+${v.value}`}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {princeAttacks && !char.dead && (
                    <div className="absolute bottom-0 w-12 h-3 bg-yellow-400/60 rounded-full blur-sm animate-ping z-0 pointer-events-none" />
                  )}

                  <motion.div
                    animate={
                      princeAttacks && !char.dead
                        ? { y: [0, -25, 0], scale: [1, 1.2, 1], rotate: [0, 12, -12, 0] }
                        : { y: char.dead ? 0 : [0, -4, 0] }
                    }
                    transition={
                      princeAttacks && !char.dead
                        ? { repeat: Infinity, duration: 0.45, ease: "easeInOut" }
                        : { repeat: char.dead ? 0 : Infinity, duration: 2, delay: Math.random() }
                    }
                  >
                    <Bunny type={charToBunnyType[char.type]} isDead={char.dead} isAttacking={isAttacking || princeAttacks} />
                  </motion.div>
                  <HeartHP hp={char.hp} maxHp={char.maxHp} />
                </div>
              );
            })}
          </div>

          {/* Enemies (Right) */}
          <div className="flex gap-3 items-end flex-row-reverse relative z-10">
            <AnimatePresence>
              {enemies.map((enemy, idx) => {
                const vfxList = charVfx[enemy.id] || [];
                const isAttacking = attackingIds.has(enemy.id);
                return (
                  <motion.div 
                    key={enemy.id}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0, scale: 0.5, rotate: -45 }}
                    transition={{ type: 'spring' }}
                    className="relative flex flex-col items-center"
                    style={{ zIndex: 10 - idx }}
                  >
                    {enemy.attackCooldown <= 1 && (
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity }}
                        className="absolute -top-8 text-red-500 font-black text-2xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-50"
                      >
                        !
                      </motion.div>
                    )}

                    <AnimatePresence>
                      {vfxList.map(v => (
                        <motion.div
                          key={v.id}
                          initial={{ opacity: 1, y: 0, scale: 0.5 }}
                          animate={{ opacity: 0, y: -40, scale: 1.2 }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="absolute -top-8 whitespace-nowrap font-black text-xl text-red-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-50"
                        >
                          -{v.value}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    <motion.div 
                      animate={{ y: [0, enemy.isBoss ? -12 : -6, 0] }}
                      transition={{ repeat: Infinity, duration: enemy.isBoss ? 2 : 1.2, ease: "easeInOut", delay: idx * 0.2 }}
                      className={enemy.isBoss ? "scale-150 transform origin-bottom drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] z-20" : ""}
                    >
                       <EnemySprite enemy={enemy} isAttacking={isAttacking} />
                    </motion.div>
                    <HeartHP hp={enemy.hp} maxHp={enemy.maxHp} />
                    <div className="mt-1 px-1.5 py-0.5 bg-black/60 border border-white/20 text-white text-[9px] rounded font-mono font-black uppercase tracking-wider text-center max-w-[90px] truncate shadow-sm">
                      {enemy.name || `Level ${enemy.type}`}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

