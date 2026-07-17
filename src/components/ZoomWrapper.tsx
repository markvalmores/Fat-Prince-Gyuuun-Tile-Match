import React, { useState, useRef } from 'react';

export const ZoomWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scale, setScale] = useState(1);
  const pointers = useRef(new Map<number, React.PointerEvent>());
  const [lastDist, setLastDist] = useState<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointers.current.set(e.pointerId, e);
    if (pointers.current.size === 2) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const pts = Array.from(pointers.current.values()) as React.PointerEvent[];
      setLastDist(Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY));
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
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
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) setLastDist(null);
  };

  return (
    <div
      className="touch-none w-full h-full overflow-hidden"
      style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: 'center center',
        transition: 'transform 0.1s ease-out' 
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {children}
    </div>
  );
};
