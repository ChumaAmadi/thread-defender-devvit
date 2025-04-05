import React, { useEffect, useState, useRef } from 'react';

export const FPSCounter = () => {
  const [fps, setFps] = useState(0);
  const frameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let animationFrameId: number;

    const updateFPS = () => {
      frameRef.current++;
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTimeRef.current;

      if (deltaTime >= 1000) {
        setFps(Math.round((frameRef.current * 1000) / deltaTime));
        frameRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(updateFPS);
    };

    animationFrameId = requestAnimationFrame(updateFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute bottom-4 left-24 bg-[#00002280] backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm z-[100]">
      FPS: {fps}
    </div>
  );
}; 
