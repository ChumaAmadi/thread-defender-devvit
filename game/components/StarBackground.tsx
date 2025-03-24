// game/components/StarBackground.tsx

import React from 'react';

export const StarBackground: React.FC = () => {
  // Create arrays for different star types
  const smallStars = Array.from({ length: 100 });
  const mediumStars = Array.from({ length: 50 });
  const largeStars = Array.from({ length: 20 });
  
  return (
    <div className="absolute inset-0 z-5 overflow-hidden">
      {smallStars.map((_, i) => (
        <div 
          key={`small-${i}`}
          className="star star-small star-opacity-low"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${Math.random() * 4 + 3}s infinite ${Math.random() * 5}s`
          }}
        />
      ))}
      
      {mediumStars.map((_, i) => (
        <div 
          key={`medium-${i}`}
          className="star star-medium star-opacity-medium"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${Math.random() * 5 + 4}s infinite ${Math.random() * 5}s`
          }}
        />
      ))}
      
      {largeStars.map((_, i) => (
        <div 
          key={`large-${i}`}
          className="star star-large star-opacity-high"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `twinkle ${Math.random() * 6 + 5}s infinite ${Math.random() * 5}s`
          }}
        />
      ))}
    </div>
  );
};