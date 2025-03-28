import React, { useState, useEffect } from 'react';
import { Page } from './shared';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import ShopPage from './pages/ShopPage';
import HelpPage from './pages/HelpPage';
import { OptionsPage } from './pages/OptionsPage';
import { usePage } from './hooks/usePage';
import { sendToDevvit } from './utils';
import { useDevvitListener } from './hooks/useDevvitListener';

const getPage = (page: Page, { postId, difficulty }: { postId: string, difficulty: number }) => {
  switch (page) {
    case 'home':
      return <HomePage postId={postId} />;
    case 'game':
      return <GamePage postId={postId} />;
    case 'shop':
      return <ShopPage />;
    case 'options':
      return <OptionsPage />;
    case 'help':
      return <HelpPage />;
    default:
      throw new Error(`Unknown page: ${page satisfies never}`);
  }
};

export const App = () => {
  const [postId, setPostId] = useState<string>('');
  const [difficulty, setDifficulty] = useState(1);
  const page = usePage();
  const initData = useDevvitListener('INIT_RESPONSE');
  
  useEffect(() => {
    // Initialize communication with Devvit
    sendToDevvit({ type: 'INIT' });
  }, []);

  useEffect(() => {
    if (initData) {
      setPostId(initData.postId || '');
      
      // Calculate difficulty based on downvotes in the post (if available)
      if (initData.downvotes !== undefined) {
        const downvotesValue = initData.downvotes || 0;
        
        // Scale difficulty: 
        // 1 = easy (few downvotes), 
        // 5 = medium (moderate downvotes), 
        // 10 = hard (many downvotes)
        const calculatedDifficulty = Math.min(
          1 + Math.floor(Math.log(downvotesValue + 1) / Math.log(10) * 3), 
          10
        );
        
        setDifficulty(calculatedDifficulty);
      }
    }
  }, [initData]);

  // Add space theme background to entire app
  return (
    <div className="h-full bg-[#000022] text-white overflow-hidden">
      {getPage(page, { postId, difficulty })}
    </div>
  );
};
