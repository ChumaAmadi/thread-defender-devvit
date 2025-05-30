// game/pages/HomePage.tsx

import React, { useEffect, useState, useRef } from 'react';
import { useSetPage } from '../hooks/usePage';
import { StarBackground } from '../components/StarBackground';
import { SpaceButton } from '../components/SpaceButton';
import { sendToDevvit } from '../utils';
import { audioManager } from '../audio/audioManager';

// News items for the updates section
const newsItems = [
  {
    title: "🚀 Welcome to Thread Defender!",
    content: "Protect your thread from cosmic invaders. The more downvotes, the tougher it gets!"
  },
  {
    title: "💎 New Shop Features",
    content: "Get power-ups and extra lives to help defend against the negativity."
  },
  {
    title: "⚡ Power-up System",
    content: "Use shields, rapid fire, and special weapons to survive longer."
  }
];

export const HomePage = ({ postId }: { postId: string }) => {
  const setPage = useSetPage();
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [showNews, setShowNews] = useState(true);
  const [gameDifficulty, setGameDifficulty] = useState('medium');
  const [highScore, setHighScore] = useState(0);
  const shipPreviewRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState('');

  // Load high score and difficulty from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('highScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }

    try {
      const savedOptions = localStorage.getItem('gameOptions');
      if (savedOptions) {
        const options = JSON.parse(savedOptions);
        setGameDifficulty(options.difficulty || 'medium');
      }
    } catch (error) {
      console.error('Error loading game options:', error);
    }

    // Play menu music when component mounts
    audioManager.playMenuMusic();
    
    console.log("Home page loaded - playing menu music");
  }, []);

  // Simulate ship movement in preview
  useEffect(() => {
    if (!shipPreviewRef.current) return;
    
    let angle = 0;
    let radius = 30;
    const centerX = 50;
    const centerY = 50;
    
    const animate = () => {
      if (!shipPreviewRef.current) return;
      
      angle += 0.02;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      shipPreviewRef.current.style.transform = `translate(${x}%, ${y}%) rotate(${angle * 57.3}deg)`;
    };
    
    const intervalId = setInterval(animate, 16);
    return () => clearInterval(intervalId);
  }, []);

  // Rotate through news items
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Let Devvit know when component mounts
  useEffect(() => {
    if (postId) {
      sendToDevvit({ type: 'INIT' });
    }
  }, [postId]);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'hard':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const formatDifficulty = (diff: string) => {
    return diff.charAt(0).toUpperCase() + diff.slice(1);
  };

  // Handle game start - switch music before navigating
  const handleStartGame = () => {
    // Stop menu music and start game music
    console.log("Start Game clicked - switching to game music");
    audioManager.stopMusic(); // Stop menu music completely
    setTimeout(() => {
      audioManager.playGameMusic(); // Start game music with a short delay
    }, 100);
    
    // Navigate to game page
    setPage('game');
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-[#000022]">
      {/* Animated stars */}
      <StarBackground />
      
      {/* Ship preview */}
      <div className="absolute w-full h-full pointer-events-none">
        <div 
          ref={shipPreviewRef}
          className="absolute w-8 h-8 transition-transform"
          style={{
            background: 'linear-gradient(45deg, #55ff55, #00ff00)',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            boxShadow: '0 0 10px #55ff55, 0 0 20px #55ff55',
            opacity: 0.8
          }}
        />
      </div>
      
      {/* Game title and content */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-lg">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 animate-pulse">THREAD DEFENDER</h1>
        <p className="text-[#8ca0bd] text-lg mb-6 text-center">
          Protect your thread from cosmic invaders!
        </p>
        
        {/* Stats display */}
        <div className="flex gap-4 mb-6">
          <div className="bg-[#113355] bg-opacity-30 px-4 py-2 rounded-md border border-[#55ff55] border-opacity-30">
            <p className="text-[#8ca0bd] text-sm">High Score</p>
            <p className="text-[#55ff55] font-bold">{highScore}</p>
          </div>
          <div className="bg-[#113355] bg-opacity-30 px-4 py-2 rounded-md border border-[#55ff55] border-opacity-30">
            <p className="text-[#8ca0bd] text-sm">Difficulty</p>
            <p className={`font-bold ${getDifficultyColor(gameDifficulty)}`}>
              {formatDifficulty(gameDifficulty)}
            </p>
          </div>
        </div>
        
        {/* Menu buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <SpaceButton
            onClick={handleStartGame} // Use the new handler function
            onMouseEnter={() => setIsHovering('game')}
            onMouseLeave={() => setIsHovering('')}
            className="transform transition-transform hover:scale-105"
          >
            {isHovering === 'game' ? '🚀 LAUNCH GAME' : 'START GAME'}
          </SpaceButton>
          
          <SpaceButton
            onClick={() => setPage('shop')}
            onMouseEnter={() => setIsHovering('shop')}
            onMouseLeave={() => setIsHovering('')}
            color="green"
            className="transform transition-transform hover:scale-105"
          >
            {isHovering === 'shop' ? '🛍️ BROWSE ITEMS' : 'SHOP'}
          </SpaceButton>
          
          <SpaceButton
            onClick={() => setPage('options')}
            onMouseEnter={() => setIsHovering('options')}
            onMouseLeave={() => setIsHovering('')}
            color="purple"
            className="transform transition-transform hover:scale-105"
          >
            {isHovering === 'options' ? '⚙️ CUSTOMIZE' : 'OPTIONS'}
          </SpaceButton>
          
          <SpaceButton
            onClick={() => setPage('help')}
            onMouseEnter={() => setIsHovering('help')}
            onMouseLeave={() => setIsHovering('')}
            color="orange"
            className="transform transition-transform hover:scale-105"
          >
            {isHovering === 'help' ? '📖 VIEW GUIDE' : 'HELP'}
          </SpaceButton>
        </div>

        {/* News ticker */}
        <div className="mt-8 w-full">
          <div className="bg-[#113355] bg-opacity-30 p-4 rounded-lg border border-[#55ff55] border-opacity-30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold">Latest Updates</h3>
              <button
                onClick={() => setShowNews(!showNews)}
                className="text-[#8ca0bd] hover:text-white transition-colors"
              >
                {showNews ? '🔽' : '🔼'}
              </button>
            </div>
            {showNews && (
              <div className="transition-all duration-500">
                <h4 className="text-[#55ff55] font-bold mb-1">{newsItems[currentNewsIndex].title}</h4>
                <p className="text-[#8ca0bd] text-sm">{newsItems[currentNewsIndex].content}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Post ID displayed in a tech-looking format */}
        <div className="mt-4 px-4 py-2 bg-[#113355] bg-opacity-30 rounded-md border border-[#55ff55] border-opacity-30">
          <p className="text-[#55ff55] text-xs font-mono">TRANSMITTER ID: {postId}</p>
        </div>
      </div>
    </div>
  );
};