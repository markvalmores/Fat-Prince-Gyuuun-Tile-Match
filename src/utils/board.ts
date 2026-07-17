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
  matchGroups: { tiles: Tile[], type: TileType }[];
}

export const findMatches = (board: Tile[], forcedIds: string[] = []): MatchResult => {
  const matchedSet = new Set<string>(forcedIds);
  const specialSpawns: SpecialSpawn[] = [];
  const counts: Record<TileType, number> = {
    [TileType.EMPTY]: 0,
    [TileType.SWORD]: 0,
    [TileType.GUN]: 0,
    [TileType.BOMB]: 0,
    [TileType.HEART]: 0,
    [TileType.CAKE]: 0,
    [TileType.RAINBOW]: 0,
    [TileType.HORIZONTAL_CLEARER]: 0,
    [TileType.VERTICAL_CLEARER]: 0,
    [TileType.PLUS_CLEARER]: 0,
    [TileType.CROSS_CLEARER]: 0,
    [TileType.SMILEY_CLEARER]: 0,
  };

  const getTile = (r: number, c: number) => board.find(t => t.r === r && t.c === c);

  // We need to find match groups to determine length 4 or 5
  const matchGroups: { tiles: Tile[], type: TileType, isHorizontal: boolean }[] = [];

  // Horizontal matches
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS - 2; c++) {
      const t1 = getTile(r, c);
      if (!t1 || t1.type === TileType.EMPTY) continue;
      
      let matchLength = 1;
      while (c + matchLength < GRID_COLS) {
        const next = getTile(r, c + matchLength);
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
        matchGroups.push({ tiles: groupTiles, type: t1.type, isHorizontal: true });
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
        matchGroups.push({ tiles: groupTiles, type: t1.type, isHorizontal: false });
        r += matchLength - 1;
      }
    }
  }

  // Process match groups for special spawns (size 4 or 5+)
  // Detect intersections for special spawns (T/L shapes or plus shapes)
  const tileMatchesCount: Record<string, number> = {};
  for (const group of matchGroups) {
    for (const t of group.tiles) {
      tileMatchesCount[t.id] = (tileMatchesCount[t.id] || 0) + 1;
    }
  }

  const intersections = Object.keys(tileMatchesCount).filter(id => tileMatchesCount[id] > 1);

  for (const group of matchGroups) {
    // If a group has an intersection and total unique tiles in intersecting groups is 5+
    const groupIntersections = group.tiles.filter(t => intersections.includes(t.id));
    
    if (groupIntersections.length > 0) {
      // It's part of a T/L/Plus shape
      // We only want to spawn one special per complex match
      const intersectionTile = groupIntersections[0];
      // Check if we already planned a spawn here
      if (!specialSpawns.some(s => s.r === intersectionTile.r && s.c === intersectionTile.c)) {
        specialSpawns.push({ r: intersectionTile.r, c: intersectionTile.c, type: TileType.SMILEY_CLEARER });
        continue; // Move to next group
      }
    }

    if (group.tiles.length === 4) {
      const spawnTile = group.tiles[1]; // middle-ish
      const rand = Math.random();
      let type: TileType;
      if (rand < 0.25) {
        type = TileType.HORIZONTAL_CLEARER;
      } else if (rand < 0.5) {
        type = TileType.VERTICAL_CLEARER;
      } else if (rand < 0.75) {
        type = TileType.PLUS_CLEARER;
      } else {
        type = TileType.CROSS_CLEARER;
      }
      specialSpawns.push({ r: spawnTile.r, c: spawnTile.c, type });
    } else if (group.tiles.length >= 5) {
      const spawnTile = group.tiles[2]; // middle
      specialSpawns.push({ r: spawnTile.r, c: spawnTile.c, type: TileType.RAINBOW });
    }
  }

  // Handle explosions and special pattern clearers
  let changed = true;
  while (changed) {
    changed = false;
    const currentMatches = Array.from(matchedSet);
    for (const id of currentMatches) {
      const tile = board.find(t => t.id === id);
      if (!tile) continue;

      if (tile.isGlowing) {
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
        tile.isGlowing = false;
      }

      if (tile.type === TileType.HORIZONTAL_CLEARER) {
        const rowTiles = getHorizontalClearTiles({ r: tile.r, c: tile.c }, board);
        rowTiles.forEach(t => {
          if (!matchedSet.has(t.id)) {
            matchedSet.add(t.id);
            changed = true;
          }
        });
      } else if (tile.type === TileType.VERTICAL_CLEARER) {
        const colTiles = getVerticalClearTiles({ r: tile.r, c: tile.c }, board);
        colTiles.forEach(t => {
          if (!matchedSet.has(t.id)) {
            matchedSet.add(t.id);
            changed = true;
          }
        });
      } else if (tile.type === TileType.PLUS_CLEARER) {
        const plusTiles = getPlusClearTiles({ r: tile.r, c: tile.c }, board);
        plusTiles.forEach(t => {
          if (!matchedSet.has(t.id)) {
            matchedSet.add(t.id);
            changed = true;
          }
        });
      } else if (tile.type === TileType.CROSS_CLEARER) {
        const crossTiles = getCrossClearTiles({ r: tile.r, c: tile.c }, board);
        crossTiles.forEach(t => {
          if (!matchedSet.has(t.id)) {
            matchedSet.add(t.id);
            changed = true;
          }
        });
      } else if (tile.type === TileType.SMILEY_CLEARER) {
        const nonEmpty = board.filter(t => t.type !== TileType.EMPTY && !matchedSet.has(t.id));
        const countToClear = Math.floor(nonEmpty.length / 2);
        const shuffled = [...nonEmpty].sort(() => Math.random() - 0.5);
        shuffled.slice(0, countToClear).forEach(t => {
          matchedSet.add(t.id);
          changed = true;
        });
      }
    }
  }

  const matchedTiles = board.filter(t => matchedSet.has(t.id));
  
  matchedTiles.forEach(t => {
    if (t.type in counts) {
        counts[t.type as TileType] = (counts[t.type as TileType] || 0) + 1;
    }
  });

  return { matchedTiles, counts, specialSpawns, matchGroups };
};

export const getHorizontalClearTiles = (pos: Position, board: Tile[]): Tile[] => {
  return board.filter(t => t.r === pos.r);
};

export const getVerticalClearTiles = (pos: Position, board: Tile[]): Tile[] => {
  return board.filter(t => t.c === pos.c);
};

export const getPlusClearTiles = (pos: Position, board: Tile[]): Tile[] => {
  return board.filter(t => t.r === pos.r || t.c === pos.c);
};

export const getCrossClearTiles = (pos: Position, board: Tile[]): Tile[] => {
  return board.filter(t => Math.abs(t.r - pos.r) === Math.abs(t.c - pos.c));
};

export const applyGravity = (board: Tile[]): Tile[] => {
  const result: Tile[] = [];
  
  for (let c = 0; c < GRID_COLS; c++) {
    // Filter to get only non-empty tiles in this column
    const colTiles = board
      .filter(t => t.c === c && t.type !== TileType.EMPTY)
      // Sort them by r ascending to preserve top-to-bottom order
      .sort((a, b) => a.r - b.r);
      
    const K = colTiles.length;
    // Assign them to the bottom-most rows: (GRID_ROWS - K) to (GRID_ROWS - 1)
    for (let i = 0; i < K; i++) {
      const targetRow = GRID_ROWS - K + i;
      result.push({
        ...colTiles[i],
        r: targetRow
      });
    }
  }
  
  return result;
};

export const fillEmptySpaces = (board: Tile[]): Tile[] => {
  const result: Tile[] = [];
  
  for (let c = 0; c < GRID_COLS; c++) {
    // Get all existing non-empty tiles in this column
    const existingColTiles = board
      .filter(t => t.c === c && t.type !== TileType.EMPTY)
      .sort((a, b) => a.r - b.r);
      
    const K = existingColTiles.length;
    const missing = GRID_ROWS - K;
    
    // Add missing tiles at the top (rows 0 to missing-1)
    for (let r = 0; r < missing; r++) {
      result.push({
        id: generateId(),
        type: getRandomTileType(),
        r,
        c
      });
    }
    
    // Add existing tiles (rows missing to GRID_ROWS-1)
    for (let i = 0; i < K; i++) {
      result.push({
        ...existingColTiles[i],
        r: missing + i
      });
    }
  }
  
  return result;
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

export const findPossibleMove = (board: Tile[]): [Position, Position] | null => {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const pos1 = { r, c };
      // Check right neighbor
      if (c < GRID_COLS - 1) {
        const pos2 = { r, c: c + 1 };
        const testBoard = swapTiles(board, pos1, pos2);
        if (hasMatches(testBoard)) {
          return [pos1, pos2];
        }
      }
      // Check down neighbor
      if (r < GRID_ROWS - 1) {
        const pos2 = { r: r + 1, c };
        const testBoard = swapTiles(board, pos1, pos2);
        if (hasMatches(testBoard)) {
          return [pos1, pos2];
        }
      }
    }
  }
  return null;
};

