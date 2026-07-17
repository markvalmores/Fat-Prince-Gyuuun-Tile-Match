import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  getDocFromServer,
  collection,
  getCountFromServer
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserMissionsData {
  playerId: string;
  playerName: string;
  date: string;
  clearedCakes: number;
  clearedSwords: number;
  winStreak: number;
  claimedCakes: boolean;
  claimedSwords: boolean;
  claimedWinStreak: boolean;
  updatedAt: any;
}

export interface UserProfileData {
  playerId: string;
  playerName: string;
  claimedLoginDays: string[];
  claimedOccasions: string[];
  levelStars?: { [level: string]: number };
  birthday?: string;
  updatedAt: any;
}

export const MISSION_CAKES_TARGET = 50;
export const MISSION_SWORDS_TARGET = 100;
export const MISSION_WINSTREAK_TARGET = 3;

export const MISSION_CAKES_REWARD = 400;
export const MISSION_SWORDS_REWARD = 300;
export const MISSION_WINSTREAK_REWARD = 600;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

/**
 * Handle Firestore errors according to security rules and system diagnostic requirements.
 */
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  };
  console.error('Firestore Error details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Generate or retrieve a stable player device ID.
 */
export function getOrGeneratePlayerId(): string {
  let pid = localStorage.getItem('fatPrincePlayerId');
  if (!pid) {
    // Generate a unique valid alphanumeric string
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'usr_';
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pid = result;
    localStorage.setItem('fatPrincePlayerId', pid);
  }
  return pid;
}

/**
 * Get today's date formatted as YYYY-MM-DD in the local timezone.
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Load or initialize user missions from Firebase Firestore.
 */
export async function loadUserMissions(playerId: string, playerName: string): Promise<UserMissionsData> {
  const todayStr = getTodayDateString();
  const docId = `${playerId}_${todayStr}`;
  const docPath = `userMissions/${docId}`;
  
  try {
    const docRef = doc(db, 'userMissions', docId);
    // Use test connection first or load directly
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        playerId: data.playerId || playerId,
        playerName: data.playerName || playerName,
        date: data.date || todayStr,
        clearedCakes: Number(data.clearedCakes) || 0,
        clearedSwords: Number(data.clearedSwords) || 0,
        winStreak: Number(data.winStreak) || 0,
        claimedCakes: !!data.claimedCakes,
        claimedSwords: !!data.claimedSwords,
        claimedWinStreak: !!data.claimedWinStreak,
        updatedAt: data.updatedAt
      };
    } else {
      // Initialize new document in Firestore
      const newMissions: UserMissionsData = {
        playerId,
        playerName: playerName || 'Knight',
        date: todayStr,
        clearedCakes: 0,
        clearedSwords: 0,
        winStreak: 0,
        claimedCakes: false,
        claimedSwords: false,
        claimedWinStreak: false,
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, {
        ...newMissions,
        updatedAt: serverTimestamp()
      });
      
      return newMissions;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    // Return empty fallback
    return {
      playerId,
      playerName,
      date: todayStr,
      clearedCakes: 0,
      clearedSwords: 0,
      winStreak: 0,
      claimedCakes: false,
      claimedSwords: false,
      claimedWinStreak: false,
      updatedAt: null
    };
  }
}

/**
 * Update user mission progress in Firebase Firestore.
 */
export async function saveUserMissions(
  playerId: string, 
  playerName: string, 
  data: Omit<UserMissionsData, 'updatedAt'>
): Promise<void> {
  const todayStr = getTodayDateString();
  const docId = `${playerId}_${todayStr}`;
  const docPath = `userMissions/${docId}`;
  
  try {
    const docRef = doc(db, 'userMissions', docId);
    await setDoc(docRef, {
      playerId: data.playerId,
      playerName: playerName || data.playerName || 'Knight',
      date: todayStr,
      clearedCakes: Number(data.clearedCakes),
      clearedSwords: Number(data.clearedSwords),
      winStreak: Number(data.winStreak),
      claimedCakes: !!data.claimedCakes,
      claimedSwords: !!data.claimedSwords,
      claimedWinStreak: !!data.claimedWinStreak,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Load or initialize user profile (login history & occasions claimed) from Firebase Firestore.
 */
export async function loadUserProfile(playerId: string, playerName: string): Promise<UserProfileData> {
  const docPath = `userProfiles/${playerId}`;
  try {
    const docRef = doc(db, 'userProfiles', playerId);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        playerId: data.playerId || playerId,
        playerName: data.playerName || playerName,
        claimedLoginDays: Array.isArray(data.claimedLoginDays) ? data.claimedLoginDays : [],
        claimedOccasions: Array.isArray(data.claimedOccasions) ? data.claimedOccasions : [],
        birthday: data.birthday || '',
        updatedAt: data.updatedAt
      };
    } else {
      // Create new profile document
      const newProfile: UserProfileData = {
        playerId,
        playerName: playerName || 'Knight',
        claimedLoginDays: [],
        claimedOccasions: [],
        birthday: '',
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, {
        playerId: newProfile.playerId,
        playerName: newProfile.playerName,
        claimedLoginDays: newProfile.claimedLoginDays,
        claimedOccasions: newProfile.claimedOccasions,
        updatedAt: serverTimestamp()
      });
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return {
      playerId,
      playerName,
      claimedLoginDays: [],
      claimedOccasions: [],
      birthday: '',
      updatedAt: null
    };
  }
}

/**
 * Save user profile updates to Firebase Firestore.
 */
export async function saveUserProfile(
  playerId: string,
  playerName: string,
  data: Omit<UserProfileData, 'updatedAt'>
): Promise<void> {
  const docPath = `userProfiles/${playerId}`;
  try {
    const docRef = doc(db, 'userProfiles', playerId);
    const payload: any = {
      playerId: data.playerId,
      playerName: playerName || data.playerName || 'Knight',
      claimedLoginDays: Array.isArray(data.claimedLoginDays) ? data.claimedLoginDays : [],
      claimedOccasions: Array.isArray(data.claimedOccasions) ? data.claimedOccasions : [],
      levelStars: data.levelStars || {},
      updatedAt: serverTimestamp()
    };
    if (data.birthday) {
      payload.birthday = data.birthday;
    }
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Get total players count registered in userProfiles.
 */
export async function getTotalPlayersCount(): Promise<number> {
  try {
    const coll = collection(db, 'userProfiles');
    const snapshot = await getCountFromServer(coll);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting total players count:", error);
    return 1;
  }
}

/**
 * Validate connection helper on startup.
 */
export async function validateMissionsConnection(): Promise<void> {
  try {
    const docRef = doc(db, 'test', 'connection');
    await getDocFromServer(docRef);
  } catch (error) {
    // Ignore offline errors gracefully as per instructions
    console.warn('Firebase pre-validation ping status:', error);
  }
}
