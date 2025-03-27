import React, { useState, useEffect } from 'react';
import { useSetPage } from '../hooks/usePage';
import { StarBackground } from '../components/StarBackground';
import { SpaceButton } from '../components/SpaceButton';
import { audioManager } from '../audio/audioManager';

interface GameOptions {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  showFPS: boolean;
}

export const OptionsPage = () => {
  const setPage = useSetPage();
  const [options, setOptions] = useState<GameOptions>({
    soundEnabled: true,
    musicEnabled: true,
    difficulty: 'medium',
    showFPS: false
  });

  // Load saved options from localStorage
  useEffect(() => {
    try {
      const savedOptions = localStorage.getItem('gameOptions');
      if (savedOptions) {
        const parsedOptions = JSON.parse(savedOptions);
        setOptions(parsedOptions);
        
        // Apply audio settings immediately
        if (audioManager) {
          audioManager.setMute(!parsedOptions.soundEnabled);
          if (parsedOptions.musicEnabled) {
            audioManager.playMusic();
          } else {
            audioManager.stopMusic();
          }
        }
      }
    } catch (error) {
      console.error('Error loading options:', error);
    }
  }, []);

  // Save options to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('gameOptions', JSON.stringify(options));
      
      // Apply audio settings
      if (audioManager) {
        audioManager.setMute(!options.soundEnabled);
        if (options.musicEnabled) {
          audioManager.playMusic();
        } else {
          audioManager.stopMusic();
        }
      }
    } catch (error) {
      console.error('Error saving options:', error);
    }
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
      
      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-lg bg-[#1a237e] bg-opacity-90 rounded-lg p-6">
        <h1 className="text-4xl font-bold text-[#4fc3f7] mb-8">OPTIONS</h1>
        
        {/* Sound Options */}
        <div className="w-full bg-[#283593] bg-opacity-50 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold text-[#4fc3f7] mb-4">Sound Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#90caf9] text-lg">Sound Effects</span>
              <button
                onClick={() => toggleOption('soundEnabled')}
                className={`w-16 h-8 rounded-full relative transition-colors duration-200 ${
                  options.soundEnabled ? 'bg-[#4fc3f7]' : 'bg-[#1a237e]'
                }`}
              >
                <span className={`absolute top-1 transition-all duration-200 h-6 w-6 rounded-full ${
                  options.soundEnabled 
                    ? 'right-1 bg-white' 
                    : 'left-1 bg-[#90caf9]'
                }`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#90caf9] text-lg">Background Music</span>
              <button
                onClick={() => toggleOption('musicEnabled')}
                className={`w-16 h-8 rounded-full relative transition-colors duration-200 ${
                  options.musicEnabled ? 'bg-[#4fc3f7]' : 'bg-[#1a237e]'
                }`}
              >
                <span className={`absolute top-1 transition-all duration-200 h-6 w-6 rounded-full ${
                  options.musicEnabled 
                    ? 'right-1 bg-white' 
                    : 'left-1 bg-[#90caf9]'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Game Options */}
        <div className="w-full bg-[#283593] bg-opacity-50 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-bold text-[#4fc3f7] mb-4">Game Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#90caf9] text-lg">Difficulty</span>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors duration-200 ${
                      options.difficulty === diff
                        ? 'bg-[#4fc3f7] text-white'
                        : 'bg-[#1a237e] text-[#90caf9]'
                    }`}
                  >
                    {diff.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#90caf9] text-lg">Show FPS Counter</span>
              <button
                onClick={() => toggleOption('showFPS')}
                className={`w-16 h-8 rounded-full relative transition-colors duration-200 ${
                  options.showFPS ? 'bg-[#4fc3f7]' : 'bg-[#1a237e]'
                }`}
              >
                <span className={`absolute top-1 transition-all duration-200 h-6 w-6 rounded-full ${
                  options.showFPS 
                    ? 'right-1 bg-white' 
                    : 'left-1 bg-[#90caf9]'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => setPage('home')}
          className="bg-[#1a237e] text-[#4fc3f7] px-8 py-3 rounded-lg font-bold text-lg hover:bg-[#283593] transition-colors duration-200"
        >
          BACK TO MENU
        </button>
      </div>
    </div>
  );
}; 
