// File: game/hooks/useGameState.ts

import { useEffect, useState } from 'react';
import { sendToDevvit } from '../utils';
import { useDevvitListener } from './useDevvitListener';

interface GameInitData {
  postId: string;
  difficulty: number;
  downvotes: number;
  currentWave: number;
  obeliskHealth: number;
}

export const useGameState = (postId: string) => {
  const [gameData, setGameData] = useState<GameInitData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Listen for game data from Devvit
  const initData = useDevvitListener('INIT_RESPONSE');
  const gameStartData = useDevvitListener('GAME_START');
  
  // Initialize the game
  useEffect(() => {
    if (!postId) return;
    
    // Request game data from Devvit
    sendToDevvit({ type: 'INIT' });
    
    // Signal that the game is ready
    sendToDevvit({ type: 'GAME_READY' });
  }, [postId]);
  
  // Process initialization data
  useEffect(() => {
    if (initData) {
      try {
        // Calculate difficulty based on downvotes
        // We'll scale it between 1-10 based on the number of downvotes
        const downvotes = initData.downvotes || 0;
        const baseDifficulty = initData.difficulty === 'easy' ? 1 : 
                           initData.difficulty === 'medium' ? 3 : 
                           initData.difficulty === 'hard' ? 5 : 3;
        
        // Scale difficulty based on downvotes
        // Using a logarithmic scale to handle wide range of downvotes
        const downvoteScale = downvotes <= 0 ? 1 : Math.min(Math.log10(downvotes) + 1, 5);
        
        const calculatedDifficulty = Math.min(baseDifficulty + downvoteScale, 10);
        
        setGameData({
          postId: initData.postId,
          difficulty: calculatedDifficulty,
          downvotes: downvotes,
          currentWave: 1,
          obeliskHealth: 100
        });
        
        setIsLoading(false);
      } catch (err) {
        setError('Failed to initialize game data');
        setIsLoading(false);
      }
    }
  }, [initData]);
  
  // Handle game start data
  useEffect(() => {
    if (gameStartData && gameData) {
      setGameData(prev => prev ? {
        ...prev,
        currentWave: gameStartData.payload.wave || prev.currentWave,
        obeliskHealth: gameStartData.payload.obeliskHealth || prev.obeliskHealth
      } : null);
    }
  }, [gameStartData]);
  
  return {
    gameData,
    isLoading,
    error
  };
};