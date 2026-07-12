import { Enemy, Character } from '../types';

export const BOSS_TYPES = ['bear_kuma', 'cat_nekogyuuun', 'carrot_ninjin', 'lion_king', 'elephant_tank', 'dragon_lord', 'wolf_alpha', 'penguin_emperor'];

const ANIMAL_TYPES = [
  'bear', 'cat', 'fox', 'rabbit', 'pig', 'panda', 'koala', 'frog',
  'bird', 'dragon', 'lion', 'wolf', 'penguin', 'elephant', 'snake', 'badger'
];

const ADJECTIVES = [
  'Sleepy', 'Fierce', 'Clumsy', 'Royal', 'Hyperactive', 'Grumpy', 'Neon', 'Golden',
  'Mystic', 'Chubby', 'Cyber', 'Wild', 'Shadow', 'Fluffy', 'Armored', 'Sassy'
];

const ANIMAL_NAMES: Record<string, string[]> = {
  bear: ['Grizzly', 'Kuma', 'Teddy', 'Honey-Thief', 'Ursa'],
  cat: ['Neko', 'Feline', 'Whiskers', 'Tabby', 'Calico'],
  fox: ['Kitsune', 'Vixen', 'Trickster', 'Swift-Tail', 'Foxy'],
  rabbit: ['Bunny', 'Usagi', 'Hopper', 'Carrot-Chaser', 'Cotton-Tail'],
  pig: ['Snouty', 'Truffle-Hunter', 'Oinker', 'Bacon-Lord', 'Porky'],
  panda: ['Bamboo-Chewer', 'Panda-Bear', 'Zen-Master', 'Chubby-Panda', 'Fluff-Ball'],
  koala: ['Eucalyptus-Muncher', 'Sleepy-Koala', 'Climber', 'Plushy', 'Euca'],
  frog: ['Kero', 'Toad-King', 'Leaper', 'Croaker', 'Fly-Catcher'],
  bird: ['Pecker', 'Songbird', 'Feather-Wing', 'Aviator', 'Pip'],
  dragon: ['Wyvern', 'Drake', 'Fire-Breather', 'Ancient-Scale', 'Lord-Dragon'],
  lion: ['Leo', 'Mane-King', 'Roarer', 'Pride-Leader', 'Golden-Mane'],
  wolf: ['Alpha-Wolf', 'Lupine', 'Howler', 'Fang', 'Shadow-Hunter'],
  penguin: ['Pingu', 'Waddler', 'Ice-slider', 'Tuxedo', 'Flippers'],
  elephant: ['Trunk-Smasher', 'Hathi', 'Mammoth', 'Goliath', 'Tusker'],
  snake: ['Viper', 'Serpent', 'Slitherer', 'Python', 'Cobra'],
  badger: ['Honey-Badger', 'Digger', 'Striper', 'Mustelid', 'Shadow-Badger']
};

const VISUAL_ACCESSORIES = ['glasses', 'hat', 'wings', 'horns', 'crown', 'sword', 'armor', 'cape'];

const ANIMAL_COLORS: Record<string, { primary: string; secondary: string; accent: string }> = {
  bear: { primary: '#8B5A2B', secondary: '#F5DEB3', accent: '#333333' },
  cat: { primary: '#EAEAEA', secondary: '#FFFFFF', accent: '#FFB6C1' },
  fox: { primary: '#FF4500', secondary: '#FFFFFF', accent: '#FFD700' },
  rabbit: { primary: '#F0F8FF', secondary: '#FFE4E1', accent: '#FF69B4' },
  pig: { primary: '#FFC0CB', secondary: '#FFB6C1', accent: '#FF1493' },
  panda: { primary: '#FFFFFF', secondary: '#111111', accent: '#32CD32' },
  koala: { primary: '#A9A9A9', secondary: '#D3D3D3', accent: '#4682B4' },
  frog: { primary: '#32CD32', secondary: '#ADFF2F', accent: '#FF4500' },
  bird: { primary: '#1E90FF', secondary: '#87CEFA', accent: '#FFD700' },
  dragon: { primary: '#B22222', secondary: '#FF4500', accent: '#FFD700' },
  lion: { primary: '#FFD700', secondary: '#FFA500', accent: '#B22222' },
  wolf: { primary: '#708090', secondary: '#C0C0C0', accent: '#FF0000' },
  penguin: { primary: '#000080', secondary: '#FFFFFF', accent: '#FFA500' },
  elephant: { primary: '#808080', secondary: '#A9A9A9', accent: '#FFB6C1' },
  snake: { primary: '#2E8B57', secondary: '#3CB371', accent: '#FF00FF' },
  badger: { primary: '#4F4F4F', secondary: '#FFFFFF', accent: '#000000' }
};

export const generateEnemy = (level: number, wave: number, isBoss: boolean = false, index: number = 0): Enemy => {
  const hpMultiplier = Math.pow(1.15, level - 1);
  const baseHp = isBoss ? 250 + (wave * 20) : 50 + (wave * 10 + index * 5);
  
  // Deterministic seed indices based on level, wave, and index
  const seed = level * 100 + wave * 10 + index;
  const animalIdx = seed % ANIMAL_TYPES.length;
  const adjIdx = (seed + 3) % ADJECTIVES.length;
  
  const animalType = ANIMAL_TYPES[animalIdx];
  const adj = ADJECTIVES[adjIdx];
  
  const nameList = ANIMAL_NAMES[animalType] || ['Critter'];
  const nameBase = nameList[seed % nameList.length];
  
  const finalName = isBoss ? `👑 Boss ${adj} ${nameBase}` : `${adj} ${nameBase}`;
  
  const colors = ANIMAL_COLORS[animalType] || { primary: '#888888', secondary: '#CCCCCC', accent: '#FF0000' };
  
  // Choose an accessory if the level/wave match
  const accessories: string[] = [];
  if (isBoss) {
    accessories.push('crown');
  } else if (seed % 3 === 0) {
    accessories.push(VISUAL_ACCESSORIES[seed % VISUAL_ACCESSORIES.length]);
  }

  // Description
  const description = isBoss 
    ? `The legendary leader of the animal rebellion. It claims all the cakes in the land of Gyuuun!`
    : `A fluffy yet formidable creature that wants to stop the Fat Prince Gyuuun.`;

  return {
    id: `enemy_${level}_${wave}_${index}_${Math.random()}`,
    type: `animal_${animalType}`,
    hp: Math.floor(baseHp * hpMultiplier),
    maxHp: Math.floor(baseHp * hpMultiplier),
    attack: Math.floor((isBoss ? 15 : 5) * Math.pow(1.10, level - 1)),
    attackCooldown: isBoss ? 2 : 3,
    maxCooldown: isBoss ? 2 : 3,
    isBoss,
    name: finalName,
    animalType,
    description,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    accessories
  };
};

export const getLevelData = (level: number) => {
  const isBossLevel = level % 10 === 0;
  const numWaves = isBossLevel ? 1 : Math.min(3 + Math.floor(level / 20), 5); // 3 to 5 waves
  const waves: Enemy[][] = [];
  
  for (let w = 0; w < numWaves; w++) {
    if (isBossLevel && w === numWaves - 1) {
      waves.push([generateEnemy(level, w, true, 0)]);
    } else {
      const numEnemies = Math.min(1 + Math.floor(level / 50), 3); 
      const waveEnemies = Array.from({length: numEnemies}).map((_, i) => generateEnemy(level, w, false, i));
      waves.push(waveEnemies);
    }
  }
  return { level, waves, isBossLevel };
};

export const INITIAL_CHARACTERS: Character[] = [
  { id: 'char_warrior', type: 'warrior', hp: 100, maxHp: 100, dead: false },
  { id: 'char_ranger', type: 'ranger', hp: 80, maxHp: 80, dead: false },
  { id: 'char_worker', type: 'worker', hp: 120, maxHp: 120, dead: false },
  { id: 'char_priest', type: 'priest', hp: 70, maxHp: 70, dead: false },
];
