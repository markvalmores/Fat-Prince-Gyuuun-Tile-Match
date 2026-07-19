import React, { useRef, useState } from 'react';
import { Tile as TileData, Position } from '../types';
import { TileComponent } from './Tile';
import { GRID_COLS, GRID_ROWS } from '../utils/board';

interface BoardProps {
  board: TileData[];
  selectedPos: Position | null;
  cursorPos?: Position | null;
  hintPositions?: Position[] | null;
  onTileClick: (pos: Position) => void;
  onTileDoubleClick?: (pos: Position) => void;
  width: number;
}

export const Board: React.FC<BoardProps> = ({ board, selectedPos, cursorPos, hintPositions, onTileClick, onTileDoubleClick, width }) => {
  const tileSize = Math.floor(width / GRID_COLS);
  const height = tileSize * GRID_ROWS;
  
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragStartPos, setDragStartPos] = useState<Position | null>(null);
  const [scale, setScale] = useState(1);
  const [lastDist, setLastDist] = useState<number | null>(null);
  const pointers = useRef(new Map<number, React.PointerEvent>());
  const lastClickTime = useRef<number>(0);

  const getPosFromEvent = (clientX: number, clientY: number): Position | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top) / scale;
    
    const c = Math.floor(x / tileSize);
    const r = Math.floor(y / tileSize);
    
    if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
      return { r, c };
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (boardRef.current) {
      try {
        boardRef.current.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
    
    if (e.isPrimary) {
      // Primary touch or mouse click started: safe to clear stale pointers
      pointers.current.clear();
    }
    
    pointers.current.set(e.pointerId, e);
    if (pointers.current.size === 1) {
      const pos = getPosFromEvent(e.clientX, e.clientY);
      if (pos) {
        const now = Date.now();
        if (now - lastClickTime.current < 300) {
            onTileDoubleClick?.(pos);
            lastClickTime.current = 0;
        } else {
            setDragStartPos(pos);
            onTileClick(pos);
            lastClickTime.current = now;
        }
      }
    } else if (pointers.current.size === 2) {
      setDragStartPos(null);
      const pts = Array.from(pointers.current.values()) as React.PointerEvent[];
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      setLastDist(dist);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // Fail-safe: if no buttons are pressed, there are no active pointers dragging!
    if (e.buttons === 0) {
      pointers.current.clear();
      setLastDist(null);
      setDragStartPos(null);
      return;
    }

    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, e);

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values()) as React.PointerEvent[];
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      if (lastDist) {
        const delta = dist / lastDist;
        setScale(s => Math.min(Math.max(s * delta, 0.5), 3));
      }
      setLastDist(dist);
    } else if (pointers.current.size === 1 && dragStartPos) {
      const pos = getPosFromEvent(e.clientX, e.clientY);
      if (pos && (pos.r !== dragStartPos.r || pos.c !== dragStartPos.c)) {
        const isAdj = Math.abs(pos.r - dragStartPos.r) + Math.abs(pos.c - dragStartPos.c) === 1;
        if (isAdj) {
          onTileClick(pos);
          setDragStartPos(null);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (boardRef.current) {
      try {
        if (boardRef.current.hasPointerCapture(e.pointerId)) {
          boardRef.current.releasePointerCapture(e.pointerId);
        }
      } catch (err) {}
    }
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) {
      setLastDist(null);
    }
    setDragStartPos(null);
  };

  return (
    <div 
      ref={boardRef}
      className="relative bg-gray-900 rounded-xl overflow-hidden mx-auto shadow-inner shadow-black touch-none cursor-pointer"
      style={{ width, height, userSelect: 'none', transform: `scale(${scale})`, transformOrigin: 'top center' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Background checkerboard pattern */}
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-20 pointer-events-none">
        {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, i) => (
          <div key={i} className={`w-full h-full ${(i + Math.floor(i / GRID_COLS)) % 2 === 0 ? 'bg-white/10' : 'bg-transparent'}`} />
        ))}
      </div>
      
      {cursorPos && (
        <div 
          className="absolute border-4 border-yellow-400 rounded-lg pointer-events-none z-20 animate-pulse shadow-[0_0_10px_yellow]"
          style={{
            width: tileSize - 4,
            height: tileSize - 4,
            left: cursorPos.c * tileSize + 2,
            top: cursorPos.r * tileSize + 2,
          }}
        />
      )}
      
      {board.map(tile => (
        <TileComponent
          key={tile.id}
          tile={tile}
          tileSize={tileSize}
          isSelected={selectedPos?.r === tile.r && selectedPos?.c === tile.c}
          isHinted={hintPositions?.some(p => p.r === tile.r && p.c === tile.c)}
          onClick={() => {}} // Now handled by Board pointer events
        />
      ))}
    </div>
  );
};
