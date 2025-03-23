import { Page } from './shared';
import { HomePage } from './pages/HomePage';
import { usePage } from './hooks/usePage';
import { useEffect, useState } from 'react';
import { sendToDevvit } from './utils';
import { useDevvitListener } from './hooks/useDevvitListener';

// Create components for pages that don't exist yet
const ComingSoonPage = ({ page }: { page: string }) => (
  <div className="flex h-full w-full items-center justify-center flex-col bg-[#000022] text-white">
    <h2 className="text-2xl font-bold text-[#55ff55] mb-4">Coming Soon: {page}</h2>
    <p className="text-[#8ca0bd]">This feature is currently under development</p>
  </div>
);

const getPage = (page: Page, { postId }: { postId: string }) => {
  switch (page) {
    case 'home':
      return <HomePage postId={postId} />;
    case 'game':
      return <ComingSoonPage page="Game" />;
    case 'shop':
      return <ComingSoonPage page="Shop" />;
    case 'options':
      return <ComingSoonPage page="Options" />;
    case 'help':
      return <ComingSoonPage page="Help" />;
    default:
      throw new Error(`Unknown page: ${page satisfies never}`);
  }
};

export const App = () => {
  const [postId, setPostId] = useState('');
  const page = usePage();
  const initData = useDevvitListener('INIT_RESPONSE');
  
  useEffect(() => {
    // Initialize communication with Devvit
    sendToDevvit({ type: 'INIT' });
  }, []);

  useEffect(() => {
    if (initData) {
      setPostId(initData.postId);
    }
  }, [initData]);

  // Add space theme background to entire app
  return (
    <div className="h-full bg-[#000022] text-white overflow-hidden">
      {getPage(page, { postId })}
    </div>
  );
};