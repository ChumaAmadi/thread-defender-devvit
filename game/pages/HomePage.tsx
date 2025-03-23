import { ComponentProps } from 'react';
import { useSetPage } from '../hooks/usePage';
import { cn } from '../utils';
import '../styles/stars.css';

export const HomePage = ({ postId }: { postId: string }) => {
  const setPage = useSetPage();
  
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-[#000022]">
      {/* Space effect overlay */}
      <div className="pointer-events-none absolute inset-0 z-10 h-full w-full bg-[#000022] [mask-image:radial-gradient(transparent,white)] opacity-40" />
      
      {/* Stars background - randomly positioned dots */}
      <div className="absolute inset-0 z-5">
        {Array.from({ length: 100 }).map((_, i) => (
          <div 
            key={i}
            className={`absolute bg-white rounded-full star-${i % 5}`}
          />
        ))}
      </div>
      
      {/* Game title and content */}
      <div className="relative z-20 flex flex-col items-center justify-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">THREAD DEFENDER</h1>
        <p className="text-[#8ca0bd] text-lg mb-6">
          Protect your thread from cosmic invaders!
        </p>
        
        {/* Game logo/image */}
        <div className="w-32 h-32 bg-blue-600 rounded-full mb-8 flex items-center justify-center">
          <div className="w-28 h-28 bg-[#000022] rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-4xl font-bold">TD</span>
            </div>
          </div>
        </div>
        
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
        
        {/* Post ID displayed in a tech-looking format */}
        <div className="mt-8 px-4 py-2 bg-[#113355] bg-opacity-30 rounded-md border border-[#55ff55] border-opacity-30">
          <p className="text-[#55ff55] text-xs font-mono">TRANSMITTER ID: {postId}</p>
        </div>
      </div>
    </div>
  );
};

// Space-themed button component with different color options
const SpaceButton = ({ 
  children, 
  color = "blue", 
  ...props 
}: ComponentProps<'button'> & { color?: 'blue' | 'green' | 'purple' | 'orange' }) => {
  
  // Color mapping for different button styles
  const colorMap = {
    blue: "from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 border-blue-300",
    green: "from-green-700 to-green-500 hover:from-green-600 hover:to-green-400 border-green-300",
    purple: "from-purple-700 to-purple-500 hover:from-purple-600 hover:to-purple-400 border-purple-300",
    orange: "from-orange-700 to-orange-500 hover:from-orange-600 hover:to-orange-400 border-orange-300",
  };
  
  return (
    <button
      className={cn(
        'relative w-full h-12 overflow-hidden rounded-md p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900',
        props.className
      )}
      {...props}
    >
      {/* Animated glow effect */}
      <span className={`absolute inset-0 bg-gradient-to-r ${colorMap[color]} opacity-70`} />
      
      {/* Button content */}
      <span className="relative flex h-full w-full items-center justify-center rounded-md bg-[#000033] px-3 py-1 text-sm font-bold text-white backdrop-blur-3xl">
        {children}
      </span>
      
      {/* Border effect */}
      <span className={`absolute inset-0 rounded-md border border-opacity-30 ${colorMap[color].split(' ')[4]}`} />
    </button>
  );
};