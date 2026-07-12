export enum TileType {
  EMPTY = 0,
  SWORD = 1, // Warrior melee
  GUN = 2, // Ranger ranged
  BOMB = 3, // Worker splash
  HEART = 4, // Priest heal
  CAKE = 5, // Princess special
  RAINBOW = 6, // Match 5 special
}

export interface Position {
  r: number;
  c: number;
}

export interface Tile {
  id: string; // unique identifier for animations (React keys)
  type: TileType;
  r: number;
  c: number;
  isGlowing?: boolean;
}

export interface Character {
  id: string;
  type: 'warrior' | 'ranger' | 'worker' | 'priest' | 'princess';
  hp: number;
  maxHp: number;
  dead: boolean;
}

export interface Enemy {
  id: string;
  type: string;
  hp: number;
  maxHp: number;
  attack: number;
  attackCooldown: number; // turns until attack
  maxCooldown: number;
  isBoss?: boolean;
  name?: string;
  animalType?: string;
  description?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  accessories?: string[];
}

export interface LevelData {
  level: number;
  waves: Enemy[][];
}
