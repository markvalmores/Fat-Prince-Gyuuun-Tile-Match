const fs = require('fs');

let content = fs.readFileSync('src/utils/board.ts', 'utf8');

// Replace MatchResult and findMatches
const matchResultStr = `export interface MatchResult {
  matchedTiles: Tile[];
  counts: Record<TileType, number>;
}

export const findMatches = (board: Tile[]): MatchResult => {`;

const newFindMatches = `export interface SpecialSpawn {
  r: number;
  c: number;
  type: TileType;
  isGlowing?: boolean;
}

export interface MatchResult {
  matchedTiles: Tile[];
  counts: Record<TileType, number>;
  specialSpawns: SpecialSpawn[];
}

export const findMatches = (board: Tile[]): MatchResult => {
  const matchedSet = new Set<string>();
  const specialSpawns: SpecialSpawn[] = [];
  const counts: Record<TileType, number> = {
    [TileType.EMPTY]: 0,
    [TileType.SWORD]: 0,
    [TileType.GUN]: 0,
    [TileType.BOMB]: 0,
    [TileType.HEART]: 0,
    [TileType.CAKE]: 0,
    [TileType.RAINBOW]: 0,
  };

  const getTile = (r: number, c: number) => board.find(t => t.r === r && t.c === c);

  // We need to find match groups to determine length 4 or 5
  const matchGroups: { tiles: Tile[], type: TileType }[] = [];

  // Horizontal matches
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS - 2; c++) {
      const t1 = getTile(r, c);
      if (!t1 || t1.type === TileType.EMPTY) continue;
      
      let matchLength = 1;
      while (c + matchLength < GRID_COLS) {
        const next = getTile(r, c + matchLength);
        if (next && (next.type === t1.type || next.type === TileType.RAINBOW || t1.type === TileType.RAINBOW)) {
          // Wait, making RAINBOW act as wildcard is complex for match length.
          // The prompt says "if you match 5 tiles a rainbow tile will show up and it clears the whole entire tile"
          // We'll just check exact type match for spawning.
        }
        if (next && next.type === t1.type) {
          matchLength++;
        } else {
          break;
        }
      }
      
      if (matchLength >= 3) {
        const groupTiles: Tile[] = [];
        for (let i = 0; i < matchLength; i++) {
          const t = getTile(r, c + i);
          if (t) {
            matchedSet.add(t.id);
            groupTiles.push(t);
          }
        }
        matchGroups.push({ tiles: groupTiles, type: t1.type });
        c += matchLength - 1; // skip the matched tiles
      }
    }
  }

  // Vertical matches
  for (let c = 0; c < GRID_COLS; c++) {
    for (let r = 0; r < GRID_ROWS - 2; r++) {
      const t1 = getTile(r, c);
      if (!t1 || t1.type === TileType.EMPTY) continue;
      
      let matchLength = 1;
      while (r + matchLength < GRID_ROWS) {
        const next = getTile(r + matchLength, c);
        if (next && next.type === t1.type) {
          matchLength++;
        } else {
          break;
        }
      }
      
      if (matchLength >= 3) {
        const groupTiles: Tile[] = [];
        for (let i = 0; i < matchLength; i++) {
          const t = getTile(r + i, c);
          if (t) {
            matchedSet.add(t.id);
            groupTiles.push(t);
          }
        }
        matchGroups.push({ tiles: groupTiles, type: t1.type });
        r += matchLength - 1;
      }
    }
  }

  // Process match groups for special spawns (size 4 or 5+)
  for (const group of matchGroups) {
    if (group.tiles.length === 4) {
      const spawnTile = group.tiles[1]; // middle-ish
      specialSpawns.push({ r: spawnTile.r, c: spawnTile.c, type: spawnTile.type, isGlowing: true });
    } else if (group.tiles.length >= 5) {
      const spawnTile = group.tiles[2]; // middle
      specialSpawns.push({ r: spawnTile.r, c: spawnTile.c, type: TileType.RAINBOW });
    }
  }

  // Handle explosions (glowing tiles)
  let changed = true;
  while (changed) {
    changed = false;
    const currentMatches = Array.from(matchedSet);
    for (const id of currentMatches) {
      const tile = board.find(t => t.id === id);
      if (tile && tile.isGlowing) {
        // Explode 3x3 area
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const expTile = getTile(tile.r + dr, tile.c + dc);
            if (expTile && !matchedSet.has(expTile.id)) {
              matchedSet.add(expTile.id);
              changed = true;
            }
          }
        }
        tile.isGlowing = false; // Prevent infinite loop
      }
    }
  }

  const matchedTiles = board.filter(t => matchedSet.has(t.id));
  
  matchedTiles.forEach(t => {
    if (t.type in counts) {
        counts[t.type as TileType] = (counts[t.type as TileType] || 0) + 1;
    }
  });

  return { matchedTiles, counts, specialSpawns };
};`;

// replace from `export interface MatchResult {` to the end of `findMatches`
const startIndex = content.indexOf('export interface MatchResult {');
const endIndex = content.indexOf('export const applyGravity');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newFindMatches + "\n\n" + content.substring(endIndex);
  fs.writeFileSync('src/utils/board.ts', content);
  console.log('Success');
} else {
  console.log('Could not find indices');
}
