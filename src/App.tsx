/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HomeScreen } from './components/HomeScreen';
import { MapScreen } from './components/MapScreen';
import { GameScreen } from './components/GameScreen';
import { StartTheGame } from './components/StartTheGame';
import { ParticleProvider } from './components/ParticleSystem';
import { SettingsProvider } from './components/SettingsProvider';
import { AudioProvider } from './components/AudioProvider';
import { CustomerService } from './components/CustomerService';
import { RefreshGame } from './components/RefreshGame';
import { 
  getOrGeneratePlayerId, 
  loadUserMissions, 
  saveUserMissions, 
  loadUserProfile,
  saveUserProfile,
  UserMissionsData,
  UserProfileData,
  validateMissionsConnection 
} from './utils/missions';
import { TileType } from './types';
import { triggerHaptic } from './utils/haptics';

type AppState = 'HOME' | 'MAP' | 'GAME';

export interface Upgrades {
  level: number;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('HOME');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [isStartingGame, setIsStartingGame] = useState<boolean>(false);
  
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(1);
  const [carrots, setCarrots] = useState<number>(0);
  const [upgrades, setUpgrades] = useState<Upgrades>({ level: 1 });

  const navigateTo = (newState: AppState) => {
    if (
      (appState === 'HOME' && newState === 'MAP') ||
      (appState === 'MAP' && newState === 'GAME') ||
      (appState === 'HOME' && newState === 'GAME')
    ) {
      setDirection('forward');
    } else {
      setDirection('backward');
    }
    triggerHaptic('medium');
    setAppState(newState);
  };

  const [playerId, setPlayerId] = useState<string>('');
  const [missionsData, setMissionsData] = useState<UserMissionsData | null>(null);
  const [userProfileData, setUserProfileData] = useState<UserProfileData | null>(null);
  const [activePlayerCount, setActivePlayerCount] = useState<number>(1);

  // Live presence EventSource listener for SSE
  useEffect(() => {
    const eventSource = new EventSource('/api/presence');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && typeof data.count === 'number') {
          setActivePlayerCount(data.count);
        }
      } catch (err) {
        console.error("Error parsing live presence count:", err);
      }
    };
    eventSource.onerror = (err) => {
      console.warn("Presence SSE connection error. Reconnecting...", err);
    };
    return () => {
      eventSource.close();
    };
  }, []);

  // Load progress from localStorage and Firebase on mount
  useEffect(() => {
    const savedLevel = localStorage.getItem('fatPrinceMaxLevel');
    if (savedLevel) setMaxUnlockedLevel(parseInt(savedLevel, 10));
    
    const savedCarrots = localStorage.getItem('fatPrinceCarrots');
    if (savedCarrots) setCarrots(parseInt(savedCarrots, 10));

    const savedUpgrades = localStorage.getItem('fatPrinceUpgrades');
    if (savedUpgrades) setUpgrades(JSON.parse(savedUpgrades));

    // Pre-warm / Validate Firestore connection
    validateMissionsConnection();

    // Load user missions and profile
    const pid = getOrGeneratePlayerId();
    setPlayerId(pid);
    const name = localStorage.getItem('fatPrincePlayerName') || 'Knight';
    
    const initializeData = async () => {
      try {
        const [missions, profile] = await Promise.all([
          loadUserMissions(pid, name),
          loadUserProfile(pid, name)
        ]);
        
        setMissionsData(missions);
        
        let activeProfile = profile;
        if (profile && !profile.claimedOccasions.includes('birthday_bonus_34197')) {
          const bonusAmount = 34197;
          const updatedProfile = {
            ...profile,
            claimedOccasions: [...profile.claimedOccasions, 'birthday_bonus_34197']
          };
          activeProfile = updatedProfile;
          
          // Save to local state and storage
          setCarrots(prev => {
            const newVal = prev + bonusAmount;
            localStorage.setItem('fatPrinceCarrots', newVal.toString());
            return newVal;
          });
          
          // Save to Firestore
          await saveUserProfile(pid, name, updatedProfile);
          console.log(`[App] Birthday Bonus of ${bonusAmount} Carrots applied!`);
        }
        
        setUserProfileData(activeProfile);
      } catch (err) {
        console.error("Error initializing user data:", err);
        setUserProfileData({
          playerId: pid,
          playerName: name,
          claimedLoginDays: [],
          claimedOccasions: [],
          levelStars: {},
          cumulativeStars: 0,
          birthday: '',
          email: '',
          updatedAt: null
        });
      }
    };

    initializeData();
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

  const handleNameChange = async (newName: string) => {
    if (!playerId) return;
    
    // Update daily mission name
    const currentMissions = missionsData || await loadUserMissions(playerId, newName);
    const updatedMissions = {
      ...currentMissions,
      playerName: newName
    };
    setMissionsData(updatedMissions);
    try {
      await saveUserMissions(playerId, newName, updatedMissions);
    } catch (e) {
      console.error(e);
    }

    // Update general user profile name
    const currentProfile = userProfileData || await loadUserProfile(playerId, newName);
    const updatedProfile = {
      ...currentProfile,
      playerName: newName
    };
    setUserProfileData(updatedProfile);
    try {
      await saveUserProfile(playerId, newName, updatedProfile);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmailChange = async (email: string) => {
    if (!playerId) return;
    const currentProfile = userProfileData || await loadUserProfile(playerId, 'Knight');
    const updatedProfile = {
      ...currentProfile,
      email
    };
    setUserProfileData(updatedProfile);
    
    try {
      await saveUserProfile(playerId, updatedProfile.playerName, updatedProfile);
    } catch (error) {
      console.error("Failed to save player email", error);
    }
  };

  const handleClaimLogin = async (dateStr: string, amount: number) => {
    if (!userProfileData) return;
    if (userProfileData.claimedLoginDays.includes(dateStr)) return;

    const updated = {
      ...userProfileData,
      claimedLoginDays: [...userProfileData.claimedLoginDays, dateStr]
    };
    setUserProfileData(updated);
    saveCarrots(carrots + amount);
    await saveUserProfile(playerId, userProfileData.playerName, updated);
  };

  const handleClaimOccasion = async (occasionId: string, amount: number) => {
    if (!userProfileData) return;
    if (userProfileData.claimedOccasions.includes(occasionId)) return;

    const updated = {
      ...userProfileData,
      claimedOccasions: [...userProfileData.claimedOccasions, occasionId]
    };
    setUserProfileData(updated);
    saveCarrots(carrots + amount);
    await saveUserProfile(playerId, userProfileData.playerName, updated);
  };

  const handleSaveBirthday = async (birthdayStr: string) => {
    if (!userProfileData) return;
    const updated = {
      ...userProfileData,
      birthday: birthdayStr
    };
    setUserProfileData(updated);
    try {
      await saveUserProfile(playerId, userProfileData.playerName, updated);
    } catch (err) {
      console.error("Failed to save birthday:", err);
    }
  };

  const handleWin = (level: number, rewardCarrots: number, score: number) => {
    const nextLevel = Math.min(level + 1, 1000);
    if (nextLevel > maxUnlockedLevel) {
      setMaxUnlockedLevel(nextLevel);
      localStorage.setItem('fatPrinceMaxLevel', nextLevel.toString());
    }
    saveCarrots(carrots + rewardCarrots);

    // Calculate stars
    let stars = 0;
    if (score >= 6000) stars = 3;
    else if (score >= 4000) stars = 2;
    else if (score >= 2000) stars = 1;
    
    // Save stars
    if (userProfileData) {
      const updatedProfile = {
        ...userProfileData,
        levelStars: {
          ...userProfileData.levelStars,
          [level]: Math.max(stars, userProfileData.levelStars?.[level] || 0)
        }
      };
      setUserProfileData(updatedProfile);
      saveUserProfile(playerId, userProfileData.playerName, updatedProfile).catch(err => {
        console.error("Error saving level stars:", err);
      });
    }

    // Update daily mission winStreak
    if (missionsData) {
      const updated = {
        ...missionsData,
        winStreak: missionsData.winStreak + 1
      };
      setMissionsData(updated);
      saveUserMissions(playerId, missionsData.playerName, updated).catch(err => {
        console.error("Error saving missions streak increase:", err);
      });
    }
  };

  const handleLose = (level: number) => {
    // Reset daily mission winStreak to 0
    if (missionsData) {
      const updated = {
        ...missionsData,
        winStreak: 0
      };
      setMissionsData(updated);
      saveUserMissions(playerId, missionsData.playerName, updated).catch(err => {
        console.error("Error saving missions streak reset:", err);
      });
    }
  };

  const handleClearTiles = (counts: Record<number, number>) => {
    if (!missionsData) return;
    const cakes = counts[TileType.CAKE] || 0;
    const swords = counts[TileType.SWORD] || 0;

    if (cakes === 0 && swords === 0) return;

    const updated = {
      ...missionsData,
      clearedCakes: missionsData.clearedCakes + cakes,
      clearedSwords: missionsData.clearedSwords + swords
    };
    setMissionsData(updated);
    saveUserMissions(playerId, missionsData.playerName, updated).catch(err => {
      console.error("Error saving missions tile progress:", err);
    });
  };

  const handleClaimReward = async (missionKey: 'cakes' | 'swords' | 'winStreak', amount: number) => {
    if (!missionsData) return;
    
    const updated = {
      ...missionsData,
      claimedCakes: missionKey === 'cakes' ? true : missionsData.claimedCakes,
      claimedSwords: missionKey === 'swords' ? true : missionsData.claimedSwords,
      claimedWinStreak: missionKey === 'winStreak' ? true : missionsData.claimedWinStreak
    };
    
    setMissionsData(updated);
    saveCarrots(carrots + amount);
    await saveUserMissions(playerId, missionsData.playerName, updated);
  };

  const slideVariants = {
    initial: (dir: 'forward' | 'backward') => ({
      opacity: 0,
      x: dir === 'forward' ? 120 : -120,
      scale: 0.98,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 280,
        damping: 26,
      },
    },
    exit: (dir: 'forward' | 'backward') => ({
      opacity: 0,
      x: dir === 'forward' ? -120 : 120,
      scale: 0.98,
      transition: {
        duration: 0.25,
      },
    }),
  };

  return (
    <SettingsProvider>
      <AudioProvider>
        <ParticleProvider>
          <AnimatePresence mode="wait" custom={direction}>
          {appState === 'HOME' && (
              <motion.div 
                key="home" 
                custom={direction} 
                variants={slideVariants} 
                initial="initial" 
                animate="animate" 
                exit="exit" 
                className="absolute inset-0"
              >
                <HomeScreen 
                  onPlay={() => navigateTo('MAP')} 
                  carrots={carrots}
                  upgrades={upgrades}
                  onUpgrade={saveUpgrades}
                  onSpendCarrots={saveCarrots}
                  missionsData={missionsData}
                  onClaimReward={handleClaimReward}
                  onNameChange={handleNameChange}
                  onEmailChange={handleEmailChange}
                  userProfileData={userProfileData}
                  onClaimLogin={handleClaimLogin}
                  onClaimOccasion={handleClaimOccasion}
                  onSaveBirthday={handleSaveBirthday}
                  activePlayerCount={activePlayerCount}
                />
              </motion.div>
            )}
            
            {appState === 'MAP' && (
              <motion.div 
                key="map" 
                custom={direction} 
                variants={slideVariants} 
                initial="initial" 
                animate="animate" 
                exit="exit" 
                className="absolute inset-0"
              >
                <MapScreen 
                  maxLevel={maxUnlockedLevel}
                  carrots={carrots}
                  levelStars={userProfileData?.levelStars}
                  onSelectLevel={(level) => {
                    setSelectedLevel(level);
                    setIsStartingGame(true);
                  }}
                  onBack={() => navigateTo('HOME')}
                />
              </motion.div>
            )}
            
            {appState === 'GAME' && (
              <motion.div 
                key="game" 
                custom={direction} 
                variants={slideVariants} 
                initial="initial" 
                animate="animate" 
                exit="exit" 
                className="absolute inset-0"
              >
                <GameScreen 
                  key={selectedLevel} // Remounts if level changes
                  initialLevel={selectedLevel}
                  upgrades={upgrades}
                  onWin={handleWin}
                  onLose={handleLose}
                  onExit={() => navigateTo('MAP')}
                  onClearTiles={handleClearTiles}
                />
              </motion.div>
            )}
          </AnimatePresence>

        {isStartingGame && (
          <StartTheGame 
            level={selectedLevel} 
            onAnimationComplete={() => {
              setIsStartingGame(false);
              navigateTo('GAME');
            }}
          />
        )}

        <CustomerService />
        <RefreshGame />
      </ParticleProvider>
    </AudioProvider>
  </SettingsProvider>
  );
}

