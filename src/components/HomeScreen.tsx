import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from './SettingsProvider';
import { Leaderboard } from './Leaderboard';
import { useParticles } from './ParticleSystem';
import { useAudio } from './AudioProvider';
import { subscribeToStarLeaderboard } from '../utils/firebase';
import { triggerHaptic } from '../utils/haptics';
import { 
  UserMissionsData,
  UserProfileData,
  MISSION_CAKES_TARGET,
  MISSION_SWORDS_TARGET,
  MISSION_WINSTREAK_TARGET,
  MISSION_CAKES_REWARD,
  MISSION_SWORDS_REWARD,
  MISSION_WINSTREAK_REWARD,
  getTotalPlayersCount
} from '../utils/missions';
import {
  Occasion,
  getOccasionForDate,
  getOccasionsForMonth,
  getDaysInMonth,
  getFirstDayOffset,
  MONTH_NAMES,
  PHILIPPINE_OCCASIONS
} from '../utils/philippineCalendar';

interface Upgrades {
  level: number;
}

interface HomeScreenProps {
  onPlay: () => void;
  carrots?: number;
  upgrades?: Upgrades;
  onUpgrade?: (u: Upgrades) => void;
  onSpendCarrots?: (c: number) => void;
  missionsData?: UserMissionsData | null;
  onClaimReward?: (missionKey: 'cakes' | 'swords' | 'winStreak', amount: number) => void;
  onNameChange?: (name: string) => void;
  onEmailChange?: (email: string) => void;
  userProfileData?: UserProfileData | null;
  onClaimLogin?: (dateStr: string, amount: number) => Promise<void>;
  onClaimOccasion?: (occasionId: string, amount: number) => Promise<void>;
  onSaveBirthday?: (birthdayStr: string) => Promise<void>;
  activePlayerCount?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ 
  onPlay, 
  carrots = 0, 
  upgrades = { level: 1 }, 
  onUpgrade, 
  onSpendCarrots,
  missionsData = null,
  onClaimReward,
  onNameChange,
  onEmailChange,
  userProfileData = null,
  onClaimLogin,
  onClaimOccasion,
  onSaveBirthday,
  activePlayerCount = 1
}) => {
  const { emit } = useParticles();
  const { playSFX } = useAudio();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const { graphicsQuality, setGraphicsQuality } = useSettings();
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('fatPrincePlayerName') || '');
  const [emailInput, setEmailInput] = useState(() => localStorage.getItem('fatPrinceEmail') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [difficulty, setDifficulty] = useState('NORMAL');
  const [dailyAmount, setDailyAmount] = useState(0);

  // Daily Login Calendar states
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const todayDateObj = new Date();
  const [calendarYear, setCalendarYear] = useState(todayDateObj.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(todayDateObj.getMonth() + 1); // 1-12
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [celebrateOccasion, setCelebrateOccasion] = useState<{ name: string; carrots: number } | null>(null);
  const [starEntries, setStarEntries] = useState<{name: string, stars: number}[]>([]);

  // Star leaderboard subscription
  useEffect(() => {
    const unsubscribe = subscribeToStarLeaderboard((entries) => {
      setStarEntries(entries);
    });
    return () => unsubscribe();
  }, []);

  // Birthday & Milestone states
  const [showBirthdayPrompt, setShowBirthdayPrompt] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState('');
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
  const [totalKnightsPlayed, setTotalKnightsPlayed] = useState(1);
  const [isSimulating1000, setIsSimulating1000] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeFor, setPasscodeFor] = useState<'SIMULATION' | 'NAME_LOCK' | null>(null);
  const [passcodeInput, setPasscodeInput] = useState('');

  // Auto-launch Daily Login Calendar on mount if today is unclaimed
  useEffect(() => {
    if (userProfileData) {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${day}`;
      
      const isClaimedToday = userProfileData.claimedLoginDays.includes(todayStr);
      if (!isClaimedToday) {
        setShowCalendarModal(true);
      }
    }
  }, [userProfileData]);

  // Birthday reward check
  useEffect(() => {
    if (userProfileData && userProfileData.birthday && onClaimOccasion) {
      const today = new Date();
      const bdayStr = userProfileData.birthday;
      if (bdayStr) {
        const parts = bdayStr.split('-');
        if (parts.length === 3) {
          const [, bMonth, bDay] = parts.map(Number);
          
          // Check if today matches month and day
          const isBirthdayToday = (today.getMonth() + 1) === bMonth && today.getDate() === bDay;
          if (isBirthdayToday) {
            const currentYear = today.getFullYear();
            const claimId = `birthday_${currentYear}`;
            
            const alreadyClaimed = userProfileData.claimedOccasions.includes(claimId);
            if (!alreadyClaimed) {
              onClaimOccasion(claimId, 34876).then(() => {
                emit(window.innerWidth / 2, window.innerHeight / 2);
                playSFX('playClick');
                setCelebrateOccasion({
                  name: `🎂 Happy Birthday! Prince Gyuuun celebrates you! 🎂`,
                  carrots: 34876
                });
              }).catch(err => {
                console.error("Error claiming birthday reward:", err);
              });
            }
          }
        }
      }
    }
  }, [userProfileData, onClaimOccasion]);

  // Load total players count for milestones
  useEffect(() => {
    getTotalPlayersCount().then(count => {
      setTotalKnightsPlayed(count);
    }).catch(err => {
      console.error("Error loading total players count for milestones:", err);
    });
  }, []);

  const [device, setDevice] = useState('');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      setDevice('Mobile Device');
    } else {
      setDevice('Desktop');
    }
  }, []);

  const upgradeCost = 100 * upgrades.level;
  
  const handleUpgrade = () => {
    if (carrots >= upgradeCost && onSpendCarrots && onUpgrade) {
      onSpendCarrots(carrots - upgradeCost);
      onUpgrade({ level: upgrades.level + 1 });
    }
  };

  const handleClaimMission = (missionKey: 'cakes' | 'swords' | 'winStreak', amount: number) => {
    if (onClaimReward) {
      emit(window.innerWidth / 2, window.innerHeight / 2);
      playSFX('playClick');
      onClaimReward(missionKey, amount);
    }
  };

  const handlePlayClick = () => {
    setShowNamePrompt(true);
  };

  const proceedWithStart = (name: string) => {
    localStorage.setItem('fatPrincePlayerName', name);
    if (onNameChange) {
      onNameChange(name);
    }
    setShowNamePrompt(false);
    
    // Prompt for birthday if it hasn't been inputted yet
    if (!userProfileData || !userProfileData.birthday) {
      setShowBirthdayPrompt(true);
    } else {
      onPlay();
    }
  };

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    const trimmed = playerName.trim();
    
    if (trimmed === "Usagyuun VTuber") {
      setPasscodeFor('NAME_LOCK');
      setShowPasscodeModal(true);
      return;
    }
    
    proceedWithStart(trimmed);
  };

  const handleBirthdaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthdayInput) return;
    
    if (onSaveBirthday) {
      await onSaveBirthday(birthdayInput);
    }
    setShowBirthdayPrompt(false);
    onPlay();
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-sky-900 flex flex-col items-center justify-center font-sans overflow-hidden relative selection:bg-none">
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

      <div className="absolute top-4 left-4 z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowDonateModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-yellow-600 via-stone-950 to-yellow-600 border-2 border-yellow-500 text-yellow-400 font-black text-sm rounded-full shadow-[0_4px_0_#000] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider flex items-center gap-1.5"
        >
          <span>💖</span>
          <span>Donate</span>
        </motion.button>
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
          className="mb-8 flex flex-col items-center"
        >
          <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-tighter leading-tight">
            FAT PRINCE<br/>
            <span className="text-yellow-400 text-6xl md:text-7xl">GYUUUN</span><br/>
            <span className="text-pink-400 text-3xl tracking-widest">TILE MATCH</span>
          </h1>

          {/* Real-time active player count badge */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-black/40 border border-white/10 rounded-full backdrop-blur-sm shadow-sm select-none">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest font-mono">
              {activePlayerCount} {activePlayerCount === 1 ? 'Knight' : 'Knights'} Playing Live
            </span>
          </div>
        </motion.div>

        <motion.button
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ delay: 0.4, type: 'spring' }}
          onClick={handlePlayClick}
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

          {/* Star Leaderboard */}
          <div className="mt-4 w-full max-w-[240px] bg-black/45 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes goldenShimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
              }
              .shimmer-gold {
                background: linear-gradient(120deg, #eab308 10%, #fef08a 45%, #fef08a 55%, #eab308 90%);
                background-size: 200% auto;
                animation: goldenShimmer 3s linear infinite;
              }
              .shimmer-silver {
                background: linear-gradient(120deg, #9ca3af 10%, #f3f4f6 45%, #f3f4f6 55%, #9ca3af 90%);
                background-size: 200% auto;
                animation: goldenShimmer 3.5s linear infinite;
              }
              .shimmer-bronze {
                background: linear-gradient(120deg, #ca8a04 10%, #ffedd5 45%, #ffedd5 55%, #ca8a04 90%);
                background-size: 200% auto;
                animation: goldenShimmer 4s linear infinite;
              }
            `}} />
            <h3 className="text-[11px] font-black text-yellow-300 uppercase tracking-widest mb-3 text-center drop-shadow">🏆 Top 10 Star Leaders 🏆</h3>
            
            <motion.div 
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
              initial="hidden"
              animate="show"
              className="space-y-1.5"
            >
              {starEntries.length === 0 ? (
                  <p className="text-[10px] text-white/50 text-center font-bold py-2">No data yet</p>
              ) : (
                  starEntries.map((e, i) => {
                    let itemStyle = "bg-white/5 text-white/90 border border-white/5";
                    let rankBadge = "";
                    
                    if (i === 0) {
                      itemStyle = "shimmer-gold text-yellow-950 font-black border-2 border-yellow-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]";
                      rankBadge = "🥇";
                    } else if (i === 1) {
                      itemStyle = "shimmer-silver text-slate-900 font-black border-2 border-slate-300 shadow-[0_0_8px_rgba(156,163,175,0.4)]";
                      rankBadge = "🥈";
                    } else if (i === 2) {
                      itemStyle = "shimmer-bronze text-amber-950 font-black border-2 border-amber-600 shadow-[0_0_8px_rgba(202,138,4,0.3)]";
                      rankBadge = "🥉";
                    } else {
                      rankBadge = `${i + 1}`;
                    }

                    return (
                      <motion.div 
                        key={i} 
                        variants={{
                          hidden: { opacity: 0, x: -15, scale: 0.95 },
                          show: { opacity: 1, x: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 14 } }
                        }}
                        className={`flex justify-between items-center text-[10px] px-2.5 py-1.5 rounded-lg font-mono transition-transform duration-300 hover:scale-[1.02] ${itemStyle}`}
                      >
                        <span className="flex items-center gap-1 truncate max-w-[120px]">
                          <span className="font-sans font-black mr-0.5">{rankBadge}</span>
                          <span className="truncate font-sans font-extrabold">{e.name}</span>
                        </span>
                        <span className="font-black whitespace-nowrap">{e.stars} ⭐</span>
                      </motion.div>
                    );
                  })
              )}
            </motion.div>
          </div>

          {/* Daily Missions Button */}
          {(() => {
            const hasUnclaimedMissions = !!missionsData && (
              (!missionsData.claimedCakes && missionsData.clearedCakes >= MISSION_CAKES_TARGET) ||
              (!missionsData.claimedSwords && missionsData.clearedSwords >= MISSION_SWORDS_TARGET) ||
              (!missionsData.claimedWinStreak && missionsData.winStreak >= MISSION_WINSTREAK_TARGET)
            );
            return (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                onClick={() => setShowMissionsModal(true)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full font-black text-lg border-2 border-white shadow-[0_4px_0_#047857] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider relative flex items-center justify-center gap-2"
              >
                📜 DAILY MISSIONS
                {hasUnclaimedMissions && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-black items-center justify-center text-white">!</span>
                  </span>
                )}
              </motion.button>
            );
          })()}

          {/* Daily Calendar Button */}
          {(() => {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dayNum = String(d.getDate()).padStart(2, '0');
            const todayStr = `${y}-${m}-${dayNum}`;
            
            const unclaimedLogin = !userProfileData || !userProfileData.claimedLoginDays.includes(todayStr);
            const todayOccasion = getOccasionForDate(d.getMonth() + 1, d.getDate());
            const unclaimedOccasion = todayOccasion && userProfileData && !userProfileData.claimedOccasions.includes(todayOccasion.id);
            
            const hasAlert = unclaimedLogin || unclaimedOccasion;

            return (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.58 }}
                onClick={() => setShowCalendarModal(true)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black text-lg border-2 border-white shadow-[0_4px_0_#4338ca] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider relative flex items-center justify-center gap-2"
              >
                📅 LOGIN CALENDAR
                {hasAlert && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 text-[9px] font-black items-center justify-center text-white">!</span>
                  </span>
                )}
              </motion.button>
            );
          })()}

          {/* Royal Milestones Button */}
          {(() => {
            const currentCount = isSimulating1000 ? 1005 : totalKnightsPlayed;
            const hasMilestoneUnclaimed = !!userProfileData && !userProfileData.claimedOccasions.includes('milestone_1000') && currentCount >= 1000;
            return (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.59 }}
                onClick={() => setShowMilestonesModal(true)}
                className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-full font-black text-lg border-2 border-white shadow-[0_4px_0_#9d174d] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider relative flex items-center justify-center gap-2"
              >
                🌟 ROYAL MILESTONES
                {hasMilestoneUnclaimed && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 text-[9px] font-black items-center justify-center text-white">!</span>
                  </span>
                )}
              </motion.button>
            );
          })()}

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
          <div className="mt-1 text-[8px] font-mono text-white/40">{device}</div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showPasscodeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[130] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border-4 border-indigo-500 p-6 rounded-3xl w-full max-w-sm text-center text-white shadow-2xl relative"
            >
              <h2 className="text-xl font-black text-indigo-400 mb-4 uppercase tracking-widest">Enter Passcode</h2>
              <input
                type="password"
                placeholder="Passcode"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-white font-black text-lg text-center mb-4 focus:outline-none focus:border-indigo-400 transition-all"
              />
              <div className="flex gap-3">
                <button
                    onClick={() => { setShowPasscodeModal(false); setPasscodeInput(''); }}
                    className="flex-1 py-2 bg-slate-800 text-gray-300 font-bold rounded-xl"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                        if (passcodeFor === 'SIMULATION' && passcodeInput === '121997') {
                            setIsSimulating1000(true);
                            setShowPasscodeModal(false);
                            setPasscodeInput('');
                        } else if (passcodeFor === 'NAME_LOCK' && passcodeInput === '1997') {
                            setShowPasscodeModal(false);
                            setPasscodeInput('');
                            proceedWithStart(playerName.trim());
                        } else {
                            alert("Wrong passcode!");
                        }
                    }}
                    className="flex-1 py-2 bg-indigo-600 text-white font-black rounded-xl"
                >
                    Submit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
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

        {/* Daily Missions Modal */}
        {showMissionsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-6 md:p-8 rounded-3xl w-full max-w-md border-8 border-emerald-500 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowMissionsModal(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 rounded-full border-4 border-white text-white font-black text-xl flex items-center justify-center shadow-lg"
              >
                X
              </button>
              
              <h2 className="text-3xl font-black text-emerald-600 mb-2 text-center uppercase tracking-widest">Daily Missions</h2>
              <p className="text-center text-gray-500 mb-6 text-xs font-bold uppercase tracking-wider">
                Reset daily • Progress saved in Firebase
              </p>

              {!missionsData ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
                  <p className="text-gray-500 font-bold text-sm">Loading missions from Firebase...</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
                  
                  {/* Mission 1: Cakes */}
                  {(() => {
                    const current = missionsData.clearedCakes;
                    const target = MISSION_CAKES_TARGET;
                    const pct = Math.min(100, Math.floor((current / target) * 100));
                    const isCompleted = current >= target;
                    const isClaimed = missionsData.claimedCakes;

                    return (
                      <div className={`p-4 rounded-2xl border-2 ${isClaimed ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-emerald-50/50 border-emerald-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-black text-emerald-950 text-sm">🍰 Princess's Sweet Tooth</h3>
                            <p className="text-xs text-gray-500 font-semibold">Clear {target} Cake tiles today</p>
                          </div>
                          <div className="bg-yellow-400 text-yellow-950 text-xs px-2.5 py-1 rounded-full font-black border border-white shadow-sm flex items-center gap-1 shrink-0">
                            🥕 {MISSION_CAKES_REWARD}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden border border-gray-300">
                              <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-1">
                              <span>{current} / {target} ({pct}%)</span>
                              <span>🍰 Cake Tiles</span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isClaimed ? (
                              <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1.5 rounded-full font-black border border-gray-300">CLAIMED ✓</span>
                            ) : isCompleted ? (
                              <button 
                                onClick={() => handleClaimMission('cakes', MISSION_CAKES_REWARD)}
                                className="text-xs bg-emerald-500 hover:bg-emerald-400 text-white px-4 py-1.5 rounded-full font-black border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 transition-all animate-pulse"
                              >
                                CLAIM
                              </button>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-full font-black border border-gray-200">IN PROGRESS</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Mission 2: Swords */}
                  {(() => {
                    const current = missionsData.clearedSwords;
                    const target = MISSION_SWORDS_TARGET;
                    const pct = Math.min(100, Math.floor((current / target) * 100));
                    const isCompleted = current >= target;
                    const isClaimed = missionsData.claimedSwords;

                    return (
                      <div className={`p-4 rounded-2xl border-2 ${isClaimed ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-amber-50/50 border-amber-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-black text-amber-950 text-sm">⚔️ Warrior's Routine</h3>
                            <p className="text-xs text-gray-500 font-semibold">Clear {target} Sword tiles today</p>
                          </div>
                          <div className="bg-yellow-400 text-yellow-950 text-xs px-2.5 py-1 rounded-full font-black border border-white shadow-sm flex items-center gap-1 shrink-0">
                            🥕 {MISSION_SWORDS_REWARD}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden border border-gray-300">
                              <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-1">
                              <span>{current} / {target} ({pct}%)</span>
                              <span>⚔️ Sword Tiles</span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isClaimed ? (
                              <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1.5 rounded-full font-black border border-gray-300">CLAIMED ✓</span>
                            ) : isCompleted ? (
                              <button 
                                onClick={() => handleClaimMission('swords', MISSION_SWORDS_REWARD)}
                                className="text-xs bg-amber-500 hover:bg-amber-400 text-white px-4 py-1.5 rounded-full font-black border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all animate-pulse"
                              >
                                CLAIM
                              </button>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-full font-black border border-gray-200">IN PROGRESS</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Mission 3: Win Streak */}
                  {(() => {
                    const current = missionsData.winStreak;
                    const target = MISSION_WINSTREAK_TARGET;
                    const pct = Math.min(100, Math.floor((current / target) * 100));
                    const isCompleted = current >= target;
                    const isClaimed = missionsData.claimedWinStreak;

                    return (
                      <div className={`p-4 rounded-2xl border-2 ${isClaimed ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-rose-50/50 border-rose-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-black text-rose-950 text-sm">🏆 Flawless Combat</h3>
                            <p className="text-xs text-gray-500 font-semibold">Win {target} levels in a row</p>
                          </div>
                          <div className="bg-yellow-400 text-yellow-950 text-xs px-2.5 py-1 rounded-full font-black border border-white shadow-sm flex items-center gap-1 shrink-0">
                            🥕 {MISSION_WINSTREAK_REWARD}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden border border-gray-300">
                              <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-500 mt-1">
                              <span>{current} / {target} ({pct}%)</span>
                              <span>🏆 Level Win-Streak</span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isClaimed ? (
                              <span className="text-xs bg-gray-200 text-gray-500 px-3 py-1.5 rounded-full font-black border border-gray-300">CLAIMED ✓</span>
                            ) : isCompleted ? (
                              <button 
                                onClick={() => handleClaimMission('winStreak', MISSION_WINSTREAK_REWARD)}
                                className="text-xs bg-rose-500 hover:bg-rose-400 text-white px-4 py-1.5 rounded-full font-black border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 transition-all animate-pulse"
                              >
                                CLAIM
                              </button>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-full font-black border border-gray-200">IN PROGRESS</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              )}
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

              <div className="mb-6">
                <label className="block text-sm font-black text-sky-800 mb-2 uppercase">Bind Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email to bind..."
                    className="flex-1 px-3 py-2 border-2 border-sky-300 rounded-lg focus:outline-none focus:border-sky-500 font-bold"
                  />
                  <button
                    onClick={() => {
                      localStorage.setItem('fatPrinceEmail', emailInput);
                      if (onEmailChange) onEmailChange(emailInput);
                      alert('Email bound successfully!');
                    }}
                    className="px-4 py-2 bg-sky-600 text-white font-black rounded-lg hover:bg-sky-500 active:scale-95 transition-all uppercase"
                  >
                    Bind
                  </button>
                </div>
              </div>
              
            </motion.div>
          </motion.div>
        )}

        {showNamePrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: "spring", damping: 18 }}
              className="bg-slate-900 border-8 border-yellow-400 p-6 rounded-3xl w-full max-w-sm text-center text-white shadow-2xl relative"
            >
              <button 
                type="button"
                onClick={() => setShowNamePrompt(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 rounded-full border-4 border-white text-white font-black text-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all active:scale-95"
              >
                X
              </button>
              
              <div className="text-4xl mb-3">⚔️</div>
              <h2 className="text-2xl font-black text-yellow-400 tracking-wider uppercase mb-1">CHOOSE YOUR KNIGHT NAME</h2>
              <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-5">FOR THE HALL OF GYUUUN LEADERBOARDS</p>

              <form onSubmit={handleStartGame} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 text-left mb-1.5 uppercase">
                    Your Leaderboard Name:
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={20}
                    placeholder="Enter Name..."
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-700 rounded-xl text-white font-black text-lg placeholder-slate-600 focus:outline-none focus:border-yellow-400 transition-all text-center tracking-wide"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowNamePrompt(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold rounded-xl transition-all active:scale-95 text-sm uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!playerName.trim()}
                    className="flex-1 py-3 bg-gradient-to-b from-yellow-300 to-yellow-500 hover:from-yellow-200 hover:to-yellow-400 text-yellow-950 font-black rounded-xl shadow-[0_4px_0_#a16207] active:shadow-none active:translate-y-1 transition-all text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    START GAME ⚔️
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showDonateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: "spring", damping: 18 }}
              className="bg-gradient-to-b from-stone-900 to-black border-4 border-yellow-500 p-6 rounded-3xl w-full max-w-sm text-center text-white shadow-2xl relative"
            >
              <button 
                type="button"
                onClick={() => setShowDonateModal(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 rounded-full border-4 border-white text-white font-black text-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all active:scale-95"
              >
                X
              </button>
              
              <div className="text-4xl mb-2">💖</div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 bg-clip-text text-transparent tracking-wider uppercase mb-1">SUPPORT VTUBER</h2>
              <p className="text-[10px] text-yellow-500/70 font-bold tracking-widest uppercase mb-5">Your support helps keep Usagyuun going!</p>

              <div className="space-y-3">
                {/* Streamlabs */}
                <div className="bg-stone-950/80 border border-yellow-500/20 rounded-xl p-3 flex flex-col items-center">
                  <div className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase mb-1.5">Streamlabs tips</div>
                  <a 
                    href="https://streamlabs.com/usagyuunvtuber/tip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-stone-950 font-black rounded-lg transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-md"
                  >
                    <span>💸</span> Visit Tip Page
                  </a>
                </div>

                {/* PayPal */}
                <div className="bg-stone-950/80 border border-yellow-500/20 rounded-xl p-3 flex flex-col items-center">
                  <div className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase mb-1">PayPal Email</div>
                  <div className="text-xs font-mono font-bold text-gray-300 break-all mb-2 select-all">
                    makunanami@yahoo.com
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy("makunanami@yahoo.com", "PayPal")}
                    className="px-4 py-1.5 bg-stone-900 hover:bg-stone-850 text-yellow-400 border border-yellow-500/40 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    {copiedText === "PayPal" ? "✅ COPIED!" : "📋 COPY EMAIL"}
                  </button>
                </div>

                {/* GCash */}
                <div className="bg-stone-950/80 border border-yellow-500/20 rounded-xl p-3 flex flex-col items-center">
                  <div className="text-[10px] font-bold text-yellow-500 tracking-wider uppercase mb-1">GCash Number</div>
                  <div className="text-sm font-mono font-black text-white mb-2 select-all tracking-wider">
                    09763329358
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy("09763329358", "GCash")}
                    className="px-4 py-1.5 bg-stone-900 hover:bg-stone-850 text-yellow-400 border border-yellow-500/40 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    {copiedText === "GCash" ? "✅ COPIED!" : "📋 COPY NUMBER"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDonateModal(false)}
                className="mt-4 text-xs font-bold text-gray-500 hover:text-gray-400 transition-colors uppercase tracking-wider"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* Daily Login Calendar Modal */}
        {showCalendarModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-slate-900 border-8 border-indigo-600 p-5 md:p-6 rounded-3xl w-full max-w-lg text-white shadow-2xl relative my-8"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 hover:bg-red-400 text-white font-black text-xl rounded-full border-4 border-white flex items-center justify-center shadow-lg transition-all active:scale-95"
              >
                X
              </button>

              <div className="text-center mb-4">
                <div className="text-3xl mb-1">📅</div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-yellow-400 uppercase tracking-wider">Philippine Calendar</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Daily Login & Occasion Bonuses</p>
              </div>

              {/* Month Navigation Row */}
              <div className="flex justify-between items-center bg-slate-950/80 rounded-xl px-4 py-2 mb-4 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (calendarMonth === 1) {
                      setCalendarMonth(12);
                      setCalendarYear(prev => prev - 1);
                    } else {
                      setCalendarMonth(prev => prev - 1);
                    }
                  }}
                  className="p-1 hover:bg-slate-800 rounded-lg text-indigo-400 font-bold text-lg select-none active:scale-90 transition-all"
                >
                  ◀
                </button>
                <div className="text-center">
                  <span className="font-black tracking-wider uppercase text-sm md:text-base text-yellow-400">
                    {MONTH_NAMES[calendarMonth - 1]} {calendarYear}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (calendarMonth === 12) {
                      setCalendarMonth(1);
                      setCalendarYear(prev => prev + 1);
                    } else {
                      setCalendarMonth(prev => prev + 1);
                    }
                  }}
                  className="p-1 hover:bg-slate-800 rounded-lg text-indigo-400 font-bold text-lg select-none active:scale-90 transition-all"
                >
                  ▶
                </button>
              </div>

              {/* Quick tip */}
              <p className="text-[10px] text-gray-400 text-center mb-4 italic leading-snug">
                ✨ Tap any <span className="text-pink-400 font-extrabold">rainbow-marked occasion</span> to view the celebration and claim random high carrots on that day!
              </p>

              {/* Grid of Calendar Days */}
              <div className="grid grid-cols-7 gap-1.5 text-center mb-4">
                {/* Weekday Titles */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayChar, i) => (
                  <div key={i} className="text-xs font-black text-indigo-400 py-1 uppercase tracking-widest font-mono">
                    {dayChar}
                  </div>
                ))}

                {/* Blank Offsets */}
                {Array.from({ length: getFirstDayOffset(calendarYear, calendarMonth) }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square bg-slate-950/20 rounded-xl" />
                ))}

                {/* Day Boxes */}
                {Array.from({ length: getDaysInMonth(calendarYear, calendarMonth) }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  
                  const isClaimedLogin = !!userProfileData && userProfileData.claimedLoginDays.includes(dateStr);
                  const occasion = getOccasionForDate(calendarMonth, dayNum);
                  const isClaimedOccasion = occasion ? (!!userProfileData && userProfileData.claimedOccasions.includes(occasion.id)) : false;
                  
                  const isToday = todayDateObj.getFullYear() === calendarYear && 
                                  (todayDateObj.getMonth() + 1) === calendarMonth && 
                                  todayDateObj.getDate() === dayNum;

                  if (occasion) {
                    // Rainbow marked occasion tile
                    return (
                      <div 
                        key={`day-${dayNum}`}
                        onClick={() => setSelectedOccasion(occasion)}
                        className={`aspect-square relative p-[3px] rounded-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all select-none bg-gradient-to-br from-pink-500 via-yellow-400 via-green-400 via-blue-400 to-purple-500 ${isClaimedOccasion ? 'opacity-80' : 'animate-pulse shadow-[0_0_12px_rgba(236,72,153,0.5)]'}`}
                      >
                        <div className="w-full h-full bg-slate-950/90 rounded-xl flex flex-col items-center justify-center p-0.5 relative overflow-hidden">
                          {/* Small emoji/icon representing the holiday type */}
                          <span className="text-[9px] absolute top-1 right-1">
                            {occasion.id === 'christmas' ? '🎄' : occasion.id === 'new_year' ? '🎉' : occasion.id === 'gyuuun_feast' ? '👑' : '🌸'}
                          </span>
                          <span className="text-xs md:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-300">
                            {dayNum}
                          </span>
                          
                          {/* Claim Status Indicator */}
                          {isClaimedOccasion ? (
                            <span className="text-[11px] text-yellow-400 font-black absolute bottom-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce">
                              ★
                            </span>
                          ) : (
                            <span className="text-[8px] font-black text-yellow-300 uppercase tracking-tighter bg-pink-500/80 px-1 rounded absolute bottom-1 scale-90">
                              BONUS
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Regular Day tile
                  return (
                    <div 
                      key={`day-${dayNum}`}
                      onClick={() => {
                        if (isToday && !isClaimedLogin && onClaimLogin) {
                          onClaimLogin(dateStr, 200).then(() => {
                            emit(window.innerWidth / 2, window.innerHeight / 2);
                            playSFX('playClick');
                            setCelebrateOccasion({ name: "Daily Login claimed", carrots: 200 });
                          });
                        }
                      }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center relative border-2 select-none text-xs font-bold transition-all ${
                        isToday 
                          ? isClaimedLogin 
                            ? 'bg-slate-950 border-slate-800 text-slate-500' 
                            : 'bg-indigo-600 border-indigo-400 text-white cursor-pointer hover:bg-indigo-500 hover:scale-105 active:scale-95 animate-bounce shadow-lg shadow-indigo-500/40'
                          : isClaimedLogin
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-500'
                            : 'bg-slate-950/60 border-slate-850 text-slate-600'
                      }`}
                    >
                      <span>{dayNum}</span>
                      
                      {isClaimedLogin && (
                        <span className="text-[9px] text-emerald-400 absolute bottom-1 font-black">✓</span>
                      )}
                      {isToday && !isClaimedLogin && (
                        <span className="text-[7px] text-yellow-300 absolute bottom-0.5 uppercase tracking-tighter font-extrabold animate-pulse">CLAIM</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Claim Instructions or Quick Status */}
              <div className="bg-slate-950/60 border border-slate-800/40 rounded-xl p-3 text-center">
                {(() => {
                  const d = new Date();
                  const y = d.getFullYear();
                  const m = String(d.getMonth() + 1).padStart(2, '0');
                  const dayNum = String(d.getDate()).padStart(2, '0');
                  const todayStr = `${y}-${m}-${dayNum}`;
                  const isClaimedToday = !!userProfileData && userProfileData.claimedLoginDays.includes(todayStr);

                  if (isClaimedToday) {
                    return (
                      <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                        <span>✅</span> Today's attendance claimed! Come back tomorrow!
                      </p>
                    );
                  } else {
                    return (
                      <div>
                        <p className="text-xs text-gray-300 font-semibold mb-1.5">Today is unclaimed! Tap today's flashing day box to claim:</p>
                        <button
                          type="button"
                          onClick={() => {
                            if (onClaimLogin) {
                              onClaimLogin(todayStr, 200).then(() => {
                                emit(window.innerWidth / 2, window.innerHeight / 2);
                                playSFX('playClick');
                                setCelebrateOccasion({ name: "Daily Login claimed", carrots: 200 });
                              });
                            }
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-stone-950 font-black rounded-lg text-xs uppercase tracking-widest shadow-md transition-all active:scale-95 animate-bounce"
                        >
                          🎁 Claim Today's 200 🥕
                        </button>
                      </div>
                    );
                  }
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Selected Occasion Tooltip / Details Sub-modal */}
        {selectedOccasion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[130] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.85, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 30 }}
              transition={{ type: "spring", damping: 18 }}
              className="bg-slate-900 border-8 border-pink-500 p-6 rounded-3xl w-full max-w-sm text-center text-white shadow-2xl relative"
            >
              <button 
                type="button"
                onClick={() => setSelectedOccasion(null)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 rounded-full border-4 border-white text-white font-black text-xl flex items-center justify-center shadow-lg hover:scale-105 transition-all active:scale-95"
              >
                X
              </button>
              
              <div className="text-4xl mb-2">🌸</div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-400 to-pink-500 tracking-wide uppercase mb-1">
                {selectedOccasion.name}
              </h2>
              <div className="inline-block bg-pink-500/20 border border-pink-500/30 px-3 py-1 rounded-full text-xs font-bold text-pink-400 mb-4 font-mono uppercase tracking-widest">
                🇵🇭 OCCASION: {MONTH_NAMES[selectedOccasion.month - 1]} {selectedOccasion.day}
              </div>

              <p className="text-sm text-gray-300 leading-relaxed font-medium mb-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                "{selectedOccasion.description}"
              </p>

              {/* Rewards info or Claim controls */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Occasion Bounty Level</div>
                <div className="text-yellow-400 text-lg font-black tracking-wide">
                  🎁 {selectedOccasion.minReward} - {selectedOccasion.maxReward} Carrots!
                </div>
              </div>

              {(() => {
                const isClaimed = !!userProfileData && userProfileData.claimedOccasions.includes(selectedOccasion.id);
                
                const d = new Date();
                const isToday = d.getMonth() + 1 === selectedOccasion.month && 
                                d.getDate() === selectedOccasion.day;

                if (isClaimed) {
                  return (
                    <div className="py-2.5 bg-yellow-500/10 border-2 border-yellow-500/30 text-yellow-400 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-sm">
                      ✨ Claimed with Gold Check! 🌟
                    </div>
                  );
                } else if (isToday) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const min = selectedOccasion.minReward;
                        const max = selectedOccasion.maxReward;
                        const randomCarrots = Math.floor(min + Math.random() * (max - min + 1));
                        if (onClaimOccasion) {
                          onClaimOccasion(selectedOccasion.id, randomCarrots).then(() => {
                            emit(window.innerWidth / 2, window.innerHeight / 2);
                            playSFX('playClick');
                            setSelectedOccasion(null);
                            setCelebrateOccasion({ name: selectedOccasion.name, carrots: randomCarrots });
                          });
                        }
                      }}
                      className="w-full py-3 bg-gradient-to-r from-yellow-400 via-pink-500 to-indigo-500 hover:from-yellow-300 hover:to-indigo-400 text-white font-black text-lg rounded-xl shadow-[0_4px_0_#be185d] active:shadow-none active:translate-y-1 transition-all uppercase tracking-wider animate-bounce flex items-center justify-center gap-2"
                    >
                      🏆 Claim Gold check & carrots!
                    </button>
                  );
                } else {
                  return (
                    <p className="text-[11px] text-gray-400 font-semibold italic">
                      🔒 Log in on this date to claim your Gold Check and amazing carrot bonus!
                    </p>
                  );
                }
              })()}
            </motion.div>
          </motion.div>
        )}

        {showBirthdayPrompt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-[115] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border-8 border-yellow-400 p-6 rounded-3xl w-full max-w-sm text-white shadow-2xl relative"
            >
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">🎂</div>
                <h2 className="text-2xl font-black text-yellow-400 uppercase tracking-wider">Royal Birth Registry</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Declare your birthday, knight!</p>
              </div>

              <p className="text-xs text-slate-300 text-center mb-5 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                To enter Prince Gyuuun's match arenas, you must register your birth date. 
                <span className="text-pink-400 block font-bold mt-1 font-mono">🎉 You will receive 34,876 Carrots on every Birthday! 🎉</span>
              </p>

              <form onSubmit={handleBirthdaySubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-yellow-500 uppercase tracking-wider mb-1.5 text-left">
                    Select Your Birth Date
                  </label>
                  <input 
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={birthdayInput}
                    onChange={(e) => setBirthdayInput(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950 border-2 border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-yellow-400 transition-colors"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={!birthdayInput}
                  className="w-full py-3 bg-gradient-to-r from-yellow-400 to-amber-500 text-stone-950 font-black rounded-xl text-base uppercase tracking-widest shadow-[0_4px_0_#b45309] active:translate-y-0.5 active:shadow-none hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none transition-all border-2 border-white cursor-pointer"
                >
                  Confirm & Play! ⚔️
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {showMilestonesModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[110] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              className="bg-slate-900 border-8 border-pink-600 p-5 md:p-6 rounded-3xl w-full max-w-md text-white shadow-2xl relative"
            >
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setShowMilestonesModal(false)}
                className="absolute -top-4 -right-4 w-10 h-10 bg-red-500 hover:bg-red-400 text-white font-black text-xl rounded-full border-4 border-white flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                X
              </button>

              <div className="text-center mb-6">
                <div className="text-3xl mb-1">🌟</div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-yellow-400 uppercase tracking-wider">Royal Milestones</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Celebrate realm expansion together</p>
              </div>

              {/* Milestone Card */}
              {(() => {
                const currentCount = isSimulating1000 ? 1005 : totalKnightsPlayed;
                const target = 1000;
                const pct = Math.min(100, Math.floor((currentCount / target) * 100));
                const isCompleted = currentCount >= target;
                const isClaimed = !!userProfileData && userProfileData.claimedOccasions.includes('milestone_1000');

                return (
                  <div className={`p-4 rounded-2xl border-2 ${isClaimed ? 'bg-slate-950/40 border-slate-800 opacity-70' : 'bg-pink-950/30 border-pink-500/30'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-black text-pink-300 text-sm">🛡️ Knights Realm Expansion</h3>
                        <p className="text-[11px] text-gray-400 font-semibold">1,000 Total Registered Players Played</p>
                      </div>
                      <div className="bg-yellow-400 text-yellow-950 text-xs px-2.5 py-1 rounded-full font-black border border-white shadow-sm flex items-center gap-1 shrink-0">
                        🥕 100K
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex-1">
                        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                          <div className="bg-gradient-to-r from-pink-500 to-yellow-400 h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 mt-1.5 font-mono">
                          <span>{currentCount.toLocaleString()} / {target.toLocaleString()} ({pct}%)</span>
                          <span>Registered Knights</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isClaimed ? (
                          <span className="text-xs bg-slate-850 text-gray-500 px-3 py-1.5 rounded-full font-black border border-slate-800">CLAIMED ✓</span>
                        ) : isCompleted ? (
                          <button 
                            type="button"
                            onClick={() => {
                              if (onClaimOccasion) {
                                onClaimOccasion('milestone_1000', 100000).then(() => {
                                  setShowMilestonesModal(false);
                                  setCelebrateOccasion({ name: "1,000 Players Milestone Reached!", carrots: 100000 });
                                });
                              }
                            }}
                            className="text-xs bg-pink-500 hover:bg-pink-400 text-white px-4 py-1.5 rounded-full font-black border-b-4 border-pink-700 active:border-b-0 active:translate-y-1 transition-all animate-pulse cursor-pointer"
                          >
                            CLAIM
                          </button>
                        ) : (
                          <span className="text-[10px] bg-slate-850 text-gray-500 px-2 py-1.5 rounded-full font-black border border-slate-800 uppercase">IN PROGRESS</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Graphics Settings */}
              <div className="mt-6 bg-slate-950/60 border border-slate-850 p-3.5 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Graphics Quality</p>
                <div className="flex gap-2">
                    {(['LowRes', 'MidRes', 'HighRes'] as const).map((q) => (
                        <button
                            key={q}
                            onClick={() => setGraphicsQuality(q)}
                            className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase ${graphicsQuality === q ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-gray-400'}`}
                        >
                            {q}
                        </button>
                    ))}
                </div>
              </div>

              {/* Dev Simulation Tool Section */}
              <div className="mt-6 bg-slate-950/60 border border-slate-850 p-3.5 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Dev Sandbox & Sandbox Tools</p>
                <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wide">Simulate 1,000+ Players</span>
                  <button
                    type="button"
                    onClick={() => {
                        setPasscodeFor('SIMULATION');
                        setShowPasscodeModal(true);
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                      isSimulating1000 
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {isSimulating1000 ? 'ACTIVE (1,005)' : 'INACTIVE'}
                  </button>
                </div>
                <p className="text-[9px] text-gray-500 mt-1.5 italic leading-snug">
                  Toggle to easily verify and test the 100,000 golden carrots milestone reward claim animations and database integration!
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Celebration / Victory Success Blast Overlay */}
        {celebrateOccasion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[140] flex items-center justify-center bg-black/90 backdrop-blur-lg p-4 text-center select-none"
          >
            <motion.div 
              initial={{ scale: 0.6, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.6, rotate: 5 }}
              className="bg-slate-950 border-8 border-yellow-400 p-8 rounded-3xl max-w-sm text-white shadow-2xl relative flex flex-col items-center"
            >
              {/* Confetti Emoji explosion particle backgrounds */}
              <div className="absolute -top-12 text-6xl animate-bounce">👑</div>
              <div className="text-5xl my-4">🎉✨🥕✨🎉</div>
              
              <h2 className="text-3xl font-black text-yellow-400 tracking-widest uppercase mb-1">
                AMAZING REWARD!
              </h2>
              <p className="text-xs text-indigo-300 font-extrabold uppercase tracking-widest mb-4">
                {celebrateOccasion.name}
              </p>

              <div className="bg-yellow-400/10 border-2 border-yellow-400/30 rounded-2xl px-6 py-4 mb-6 text-center shadow-lg">
                <span className="text-4xl font-black text-yellow-300 block font-mono">
                  +{celebrateOccasion.carrots}
                </span>
                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest block mt-1">
                  Golden Carrots Gained!
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCelebrateOccasion(null)}
                className="px-8 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-stone-950 font-black rounded-full text-base uppercase tracking-widest shadow-md transition-all active:scale-95 border-2 border-white"
              >
                Salamat! (Thank You!) 💖
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
