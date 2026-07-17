/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { MapScreen } from './components/MapScreen';
import { GameScreen } from './components/GameScreen';
import { ZoomWrapper } from './components/ZoomWrapper';
import { ParticleProvider } from './components/ParticleSystem';
import { SettingsProvider } from './components/SettingsProvider';
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
    
    loadUserMissions(pid, name).then(data => {
      setMissionsData(data);
    }).catch(err => {
      console.error("Error loading user missions on mount:", err);
    });

    loadUserProfile(pid, name).then(profile => {
      setUserProfileData(profile);
    }).catch(err => {
      console.error("Error loading user profile on mount:", err);
    });
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
    await saveUserMissions(playerId, newName, updatedMissions);

    // Update general user profile name
    const currentProfile = userProfileData || await loadUserProfile(playerId, newName);
    const updatedProfile = {
      ...currentProfile,
      playerName: newName
    };
    setUserProfileData(updatedProfile);
    await saveUserProfile(playerId, newName, updatedProfile);
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
    await saveUserProfile(playerId, userProfileData.playerName, updated);
  };

  const handleWin = (level: number, rewardCarrots: number) => {
    const nextLevel = Math.min(level + 1, 1000);
    if (nextLevel > maxUnlockedLevel) {
      setMaxUnlockedLevel(nextLevel);
      localStorage.setItem('fatPrinceMaxLevel', nextLevel.toString());
    }
    saveCarrots(carrots + rewardCarrots);

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

  return (
    <SettingsProvider>
      <ParticleProvider>
        <ZoomWrapper>
          {appState === 'HOME' && (
          <HomeScreen 
            onPlay={() => setAppState('MAP')} 
            carrots={carrots}
            upgrades={upgrades}
            onUpgrade={saveUpgrades}
            onSpendCarrots={saveCarrots}
            missionsData={missionsData}
            onClaimReward={handleClaimReward}
            onNameChange={handleNameChange}
            userProfileData={userProfileData}
            onClaimLogin={handleClaimLogin}
            onClaimOccasion={handleClaimOccasion}
            onSaveBirthday={handleSaveBirthday}
            activePlayerCount={activePlayerCount}
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
            onClearTiles={handleClearTiles}
          />
        )}
      </ZoomWrapper>
    </ParticleProvider>
  </SettingsProvider>
  );
}

