import React, { useEffect, useRef } from 'react';

export const StarBackground: React.FC = () => {
  const starfieldRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const starfield = starfieldRef.current;
    if (!starfield) return;
    
    // Create multiple layers of stars for parallax effect
    const createStarLayer = (count: number, size: number, speed: number, opacity: number) => {
      const layer = document.createElement('div');
      layer.className = 'star-layer';
      layer.style.position = 'absolute';
      layer.style.inset = '0';
      layer.style.animation = `star-scroll ${speed}s linear infinite`;
      
      for (let i = 0; i < count; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.position = 'absolute';
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.borderRadius = '50%';
        star.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animation = `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        
        layer.appendChild(star);
      }
      
      return layer;
    };
    
    // Create nebula element
    const createNebula = () => {
      const nebula = document.createElement('div');
      nebula.className = 'nebula';
      nebula.style.position = 'absolute';
      nebula.style.width = '300px';
      nebula.style.height = '300px';
      nebula.style.borderRadius = '50%';
      nebula.style.background = 'radial-gradient(circle, rgba(86,30,128,0.2) 0%, rgba(59,22,122,0.1) 50%, rgba(0,0,0,0) 70%)';
      nebula.style.top = '20%';
      nebula.style.right = '15%';
      nebula.style.filter = 'blur(15px)';
      nebula.style.animation = 'nebula-pulse 15s ease-in-out infinite';
      
      return nebula;
    };
    
    // Create a second nebula element with different color
    const createSecondNebula = () => {
      const nebula = document.createElement('div');
      nebula.className = 'nebula';
      nebula.style.position = 'absolute';
      nebula.style.width = '250px';
      nebula.style.height = '250px';
      nebula.style.borderRadius = '50%';
      nebula.style.background = 'radial-gradient(circle, rgba(30,86,128,0.15) 0%, rgba(22,59,122,0.08) 50%, rgba(0,0,0,0) 70%)';
      nebula.style.bottom = '15%';
      nebula.style.left = '10%';
      nebula.style.filter = 'blur(12px)';
      nebula.style.animation = 'nebula-pulse 18s ease-in-out infinite reverse';
      
      return nebula;
    };
    
    // Add star layers with different parallax speeds
    starfield.appendChild(createStarLayer(50, 1, 150, 0.8)); // Small distant stars (slow)
    starfield.appendChild(createStarLayer(30, 2, 100, 0.9)); // Medium stars (medium)
    starfield.appendChild(createStarLayer(15, 3, 50, 1));    // Large close stars (fast)
    starfield.appendChild(createNebula());
    starfield.appendChild(createSecondNebula());
    
    // Add animation keyframes
    const style = document.createElement('style');
    style.textContent = `
      @keyframes star-scroll {
        from { transform: translateY(0); }
        to { transform: translateY(100%); }
      }
      
      @keyframes twinkle {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }
      
      @keyframes nebula-pulse {
        0%, 100% { opacity: 0.5; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.1); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div 
      ref={starfieldRef}
      className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#000036] to-[#000022] z-0"
    ></div>
  );
};