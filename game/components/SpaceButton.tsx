// game/components/SpaceButton.tsx

import React, { ComponentProps } from 'react';
import { cn } from '../utils';

type SpaceButtonProps = ComponentProps<'button'> & { 
  color?: 'blue' | 'green' | 'purple' | 'orange'
};

export const SpaceButton: React.FC<SpaceButtonProps> = ({ 
  children, 
  color = "blue", 
  ...props 
}) => {
  
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
