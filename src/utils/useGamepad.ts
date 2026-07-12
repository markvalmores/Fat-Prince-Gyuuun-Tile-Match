import { useEffect, useCallback } from 'react';

type GamepadCallback = () => void;

export const useGamepad = (
  onUp: GamepadCallback,
  onDown: GamepadCallback,
  onLeft: GamepadCallback,
  onRight: GamepadCallback,
  onSelect: GamepadCallback,
  onCancel: GamepadCallback,
  isActive: boolean = true
) => {
  useEffect(() => {
    if (!isActive) return;

    let lastTime = 0;
    const cooldown = 200; // ms between inputs
    let animationFrameId: number;
    
    const checkGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      // Support standard console controllers (PS4, PS5, Xbox One, Switch Pro)
      const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
      
      if (gp) {
        const now = performance.now();
        if (now - lastTime > cooldown) {
          let acted = false;
          
          // D-PAD (buttons 12-15 usually) or Left Stick (axes 0, 1)
          const up = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
          const down = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
          const left = gp.buttons[14]?.pressed || gp.axes[0] < -0.5;
          const right = gp.buttons[15]?.pressed || gp.axes[0] > 0.5;
          
          // Cross/A (0), Circle/B (1)
          const select = gp.buttons[0]?.pressed; 
          const cancel = gp.buttons[1]?.pressed; 
          
          if (up) { onUp(); acted = true; }
          else if (down) { onDown(); acted = true; }
          else if (left) { onLeft(); acted = true; }
          else if (right) { onRight(); acted = true; }
          else if (select) { onSelect(); acted = true; }
          else if (cancel) { onCancel(); acted = true; }
          
          if (acted) lastTime = now;
        }
      }
      
      animationFrameId = requestAnimationFrame(checkGamepad);
    };
    
    animationFrameId = requestAnimationFrame(checkGamepad);
    return () => cancelAnimationFrame(animationFrameId);
  }, [onUp, onDown, onLeft, onRight, onSelect, onCancel, isActive]);
};
