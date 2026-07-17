
import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { audio } from '../utils/audio';

interface AudioContextType {
  playSFX: (name: keyof typeof audio) => void; // This needs to be improved based on actual audio class structure
  playMusic: (track: string) => void;
  toggleMute: () => void;
  isMuted: boolean;
}

const AudioContext = createContext<AudioContextType>({
  playSFX: () => {},
  playMusic: () => {},
  toggleMute: () => {},
  isMuted: false,
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const playSFX = (name: any) => {
    if (isMuted) return;
    // @ts-ignore
    if (typeof audio[name] === 'function') {
      // @ts-ignore
      audio[name]();
    }
  };

  const playMusic = (track: string) => {
    // Placeholder for actual OST logic
    console.log('Playing music:', track);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <AudioContext.Provider value={{ playSFX, playMusic, toggleMute, isMuted }}>
      {children}
    </AudioContext.Provider>
  );
};
