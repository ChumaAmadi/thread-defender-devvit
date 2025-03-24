// game/pages/HomePage.tsx

import React from 'react';
import { useSetPage } from '../hooks/usePage';
import { StarBackground } from '../components/StarBackground';
import { SpaceButton } from '../components/SpaceButton';
import { sendToDevvit } from '../utils';

export const HomePage = ({ postId }: { postId: string }) => {
  const setPage = useSetPage();
  
  // Let Devvit know when component mounts
  React.useEffect(() => {
    if (postId) {
      sendToDevvit({ type: 'INIT' });
    }
  }, [postId]);
  
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-[#000022]">
      {/* Animated stars */}
      <StarBackground />
      
      {/* Game title and content */}
      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-lg">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">THREAD DEFENDER</h1>
        <p className="text-[#8ca0bd] text-lg mb-6 text-center">
          Protect your thread from cosmic invaders!
        </p>
        
        {/* Menu buttons */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <SpaceButton
            onClick={() => {
              setPage('game');
            }}
          >
            START GAME
          </SpaceButton>
          
          <SpaceButton
            onClick={() => {
              setPage('shop');
            }}
            color="green"
          >
            SHOP
          </SpaceButton>
          
          <SpaceButton
            onClick={() => {
              setPage('options');
            }}
            color="purple"
          >
            OPTIONS
          </SpaceButton>
          
          <SpaceButton
            onClick={() => {
              setPage('help');
            }}
            color="orange"
          >
            HELP
          </SpaceButton>
        </div>
        
        {/* Game instructions */}
        <div className="mt-6 text-xs text-[#8ca0bd] text-center">
          <p>Control your ship with mouse movement</p>
          <p>Left-click to shoot, right-click for special attack</p>
          <p>Protect the central obelisk at all costs!</p>
        </div>
        
        {/* Post ID displayed in a tech-looking format */}
        <div className="mt-4 px-4 py-2 bg-[#113355] bg-opacity-30 rounded-md border border-[#55ff55] border-opacity-30">
          <p className="text-[#55ff55] text-xs font-mono">TRANSMITTER ID: {postId}</p>
        </div>
      </div>
    </div>
  );
};