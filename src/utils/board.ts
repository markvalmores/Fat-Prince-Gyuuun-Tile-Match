import { Tile, TileType, Position } from '../types';

export const GRID_ROWS = 8;
export const GRID_COLS = 8;

let tileIdCounter = 0;
export const generateId = () => `tile_${tileIdCounter++}`;

export const getRandomTileType = (): TileType => {
  return Math.floor(Math.random() * 5) + 1; // 1 to 5
};

export const createBoard = (): Tile[] => {
  let board: Tile[] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      let type: TileType;
      do {
        type = getRandomTileType();
      } while (
        (c >= 2 && board[r * GRID_COLS + c - 1].type === type && board[r * GRID_COLS + c - 2].type === type) ||
        (r >= 2 && board[(r - 1) * GRID_COLS + c].type === type && board[(r - 2) * GRID_COLS + c].type === type)
      );
      
      board.push({
        id: generateId(),
        type,
        r,
        c
      });
    }
  }
  return board;
};

export const hasMatches = (board: Tile[]): boolean => {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tile = board.find(t => t.r === r && t.c === c);
      if (!tile || tile.type === TileType.EMPTY) continue;
      
      // Check right
      if (c < GRID_COLS - 2) {
        const t1 = board.find(t => t.r === r && t.c === c + 1);
        const t2 = board.find(t => t.r === r && t.c === c + 2);
        if (t1?.type === tile.type && t2?.type === tile.type) return true;
      }
      // Check down
      if (r < GRID_ROWS - 2) {
        const t1 = board.find(t => t.r === r + 1 && t.c === c);
        const t2 = board.find(t => t.r === r + 2 && t.c === c);
        if (t1?.type === tile.type && t2?.type === tile.type) return true;
      }
    }
  }
  return false;
};

export interface SpecialSpawn {
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
};

export const applyGravity = (board: Tile[]): Tile[] => {
  const newBoard = [...board];
  
  for (let c = 0; c < GRID_COLS; c++) {
    let emptyRow = GRID_ROWS - 1;
    for (let r = GRID_ROWS - 1; r >= 0; r--) {
      const tileIdx = newBoard.findIndex(t => t.r === r && t.c === c);
      if (tileIdx !== -1) {
        const tile = newBoard[tileIdx];
        if (tile.type !== TileType.EMPTY) {
          if (r !== emptyRow) {
            newBoard[tileIdx] = { ...tile, r: emptyRow };
          }
          emptyRow--;
        } else {
          // Remove empty tiles so they can be replaced
          newBoard.splice(tileIdx, 1);
        }
      }
    }
  }
  
  return newBoard;
};

export const fillEmptySpaces = (board: Tile[]): Tile[] => {
  const newBoard = [...board];
  for (let c = 0; c < GRID_COLS; c++) {
    // Count how many tiles are in this column
    const tilesInCol = newBoard.filter(t => t.c === c && t.type !== TileType.EMPTY).length;
    const missing = GRID_ROWS - tilesInCol;
    for (let i = 0; i < missing; i++) {
      newBoard.push({
        id: generateId(),
        type: getRandomTileType(),
        r: i, // Will animate falling to proper empty space, actually better to start above
        c: c
      });
    }
  }
  
  // Re-adjust rows so they are completely sorted top-to-bottom
  // The gravity function already pushed everything down, so new tiles should be 0 to missing-1
  for (let c = 0; c < GRID_COLS; c++) {
    const colTiles = newBoard.filter(t => t.c === c).sort((a, b) => a.r - b.r);
    for (let r = 0; r < GRID_ROWS; r++) {
      const tile = colTiles[r];
      if (tile) {
        tile.r = r;
      }
    }
  }
  return newBoard;
};

export const swapTiles = (board: Tile[], pos1: Position, pos2: Position): Tile[] => {
  const newBoard = [...board];
  const t1Idx = newBoard.findIndex(t => t.r === pos1.r && t.c === pos1.c);
  const t2Idx = newBoard.findIndex(t => t.r === pos2.r && t.c === pos2.c);
  
  if (t1Idx !== -1 && t2Idx !== -1) {
    const tempR = newBoard[t1Idx].r;
    const tempC = newBoard[t1Idx].c;
    
    newBoard[t1Idx] = { ...newBoard[t1Idx], r: newBoard[t2Idx].r, c: newBoard[t2Idx].c };
    newBoard[t2Idx] = { ...newBoard[t2Idx], r: tempR, c: tempC };
  }
  return newBoard;
};
