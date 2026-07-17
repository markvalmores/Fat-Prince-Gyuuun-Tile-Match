import React, { createContext, useContext, useState, useEffect } from 'react';

export type GraphicsQuality = 'LowRes' | 'MidRes' | 'HighRes';

interface SettingsContextType {
  graphicsQuality: GraphicsQuality;
  setGraphicsQuality: (quality: GraphicsQuality) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  graphicsQuality: 'MidRes',
  setGraphicsQuality: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(
    (localStorage.getItem('graphicsQuality') as GraphicsQuality) || 'MidRes'
  );

  useEffect(() => {
    localStorage.setItem('graphicsQuality', graphicsQuality);
  }, [graphicsQuality]);

  return (
    <SettingsContext.Provider value={{ graphicsQuality, setGraphicsQuality }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
