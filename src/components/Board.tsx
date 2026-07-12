import React, { useRef, useState } from 'react';
import { Tile as TileData, Position } from '../types';
import { TileComponent } from './Tile';
import { GRID_COLS, GRID_ROWS } from '../utils/board';

interface BoardProps {
  board: TileData[];
  selectedPos: Position | null;
  cursorPos?: Position | null;
  onTileClick: (pos: Position) => void;
  width: number;
}

export const Board: React.FC<BoardProps> = ({ board, selectedPos, cursorPos, onTileClick, width }) => {
  const tileSize = Math.floor(width / GRID_COLS);
  const height = tileSize * GRID_ROWS;
  
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragStartPos, setDragStartPos] = useState<Position | null>(null);

  const getPosFromEvent = (clientX: number, clientY: number): Position | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const c = Math.floor(x / tileSize);
    const r = Math.floor(y / tileSize);
    
    if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
      return { r, c };
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const pos = getPosFromEvent(e.clientX, e.clientY);
    if (pos) {
      setDragStartPos(pos);
      onTileClick(pos);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStartPos) return;
    const pos = getPosFromEvent(e.clientX, e.clientY);
    if (pos && (pos.r !== dragStartPos.r || pos.c !== dragStartPos.c)) {
      const isAdj = Math.abs(pos.r - dragStartPos.r) + Math.abs(pos.c - dragStartPos.c) === 1;
      if (isAdj) {
         onTileClick(pos);
         setDragStartPos(null);
      }
    }
  };

  const handlePointerUp = () => {
    setDragStartPos(null);
  };

  return (
    <div 
      ref={boardRef}
      className="relative bg-gray-900 rounded-xl overflow-hidden mx-auto shadow-inner shadow-black touch-none cursor-pointer"
      style={{ width, height, userSelect: 'none' }}
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
          onClick={() => {}} // Now handled by Board pointer events
        />
      ))}
    </div>
  );
};
