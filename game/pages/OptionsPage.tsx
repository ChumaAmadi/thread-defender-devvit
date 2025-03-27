import React, { useState, useEffect } from 'react';
import { useSetPage } from '../hooks/usePage';
import { StarBackground } from '../components/StarBackground';
import { SpaceButton } from '../components/SpaceButton';

interface GameOptions {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  showFPS: boolean;
}

export const OptionsPage = () => {
  const setPage = useSetPage();
  const [options, setOptions] = useState<GameOptions>({
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    difficulty: 'medium',
    showFPS: false
  });

  // Load saved options from localStorage
  useEffect(() => {
    const savedOptions = localStorage.getItem('gameOptions');
    if (savedOptions) {
      setOptions(JSON.parse(savedOptions));
    }
  }, []);

  // Save options to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('gameOptions', JSON.stringify(options));
  }, [options]);

  const toggleOption = (option: keyof GameOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: typeof prev[option] === 'boolean' ? !prev[option] : prev[option]
    }));
  };

  const setDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
    setOptions(prev => ({ ...prev, difficulty }));
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-[#000022]">
      <StarBackground />
      
      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-lg p-6">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-8">OPTIONS</h1>
        
        {/* Sound Options */}
        <div className="w-full bg-[#113355] bg-opacity-30 p-6 rounded-lg border border-[#55ff55] border-opacity-30 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Sound Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8ca0bd]">Sound Effects</span>
              <button
                onClick={() => toggleOption('soundEnabled')}
                className={`px-4 py-2 rounded ${options.soundEnabled ? 'bg-[#55ff55] text-black' : 'bg-[#113355] text-[#8ca0bd]'}`}
              >
                {options.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8ca0bd]">Background Music</span>
              <button
                onClick={() => toggleOption('musicEnabled')}
                className={`px-4 py-2 rounded ${options.musicEnabled ? 'bg-[#55ff55] text-black' : 'bg-[#113355] text-[#8ca0bd]'}`}
              >
                {options.musicEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8ca0bd]">Vibration</span>
              <button
                onClick={() => toggleOption('vibrationEnabled')}
                className={`px-4 py-2 rounded ${options.vibrationEnabled ? 'bg-[#55ff55] text-black' : 'bg-[#113355] text-[#8ca0bd]'}`}
              >
                {options.vibrationEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Game Options */}
        <div className="w-full bg-[#113355] bg-opacity-30 p-6 rounded-lg border border-[#55ff55] border-opacity-30 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">Game Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8ca0bd]">Difficulty</span>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-4 py-2 rounded ${
                      options.difficulty === diff
                        ? 'bg-[#55ff55] text-black'
                        : 'bg-[#113355] text-[#8ca0bd]'
                    }`}
                  >
                    {diff.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8ca0bd]">Show FPS Counter</span>
              <button
                onClick={() => toggleOption('showFPS')}
                className={`px-4 py-2 rounded ${options.showFPS ? 'bg-[#55ff55] text-black' : 'bg-[#113355] text-[#8ca0bd]'}`}
              >
                {options.showFPS ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <SpaceButton
          onClick={() => setPage('home')}
          className="mt-6"
        >
          BACK TO MENU
        </SpaceButton>
      </div>
    </div>
  );
}; 
