import { useState, useEffect, useRef } from 'react';
import { StarBackground } from '../components/StarBackground';
import { SpaceButton } from '../components/SpaceButton';
import { useSetPage } from '../hooks/usePage';
import { sendToDevvit } from '../utils';
import { 
  renderGame, 
  processGameObjects, 
  fireBullet,
  resetGameTimers,
  GameState,
  PlayerShip,
  GameObject 
} from '../game/gameRenderer';
import { spawnEnemies, spawnRandomEnemy } from '../game/enemyManager';

export const GamePage = ({ postId, difficulty = 1 }: { postId: string; difficulty?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const animationFrameRef = useRef<number>(0);
  const setPage = useSetPage();
  const [gameState, setGameState] = useState<GameState>({
    player: {
      x: 0,
      y: 0,
      size: 15,
      angle: 0,
      speed: 5,
      fireRate: 200, // milliseconds between shots
      lastFireTime: 0,
      specialAmmo: 3
    },
    objects: [],
    score: 0,
    level: 1,
    obeliskHealth: 100,
    gameOver: false,
    isPaused: false,
    mouseX: 0,
    mouseY: 0,
    isLeftMouseDown: false,
    isRightMouseDown: false
  });
  
  // Game loop using requestAnimationFrame
  const lastTimeRef = useRef<number>(0);
  const requestRef = useRef<number>();
  const difficultyMultiplier = useRef<number>(Math.min(Math.max(difficulty, 1), 10));
  
  // Enemy spawning timers
  const lastEnemySpawnTime = useRef<number>(0);
  const enemySpawnRate = useRef<number>(2000); // Time in ms between spawns
  const waveStartTime = useRef<number>(Date.now());
  const waveNumber = useRef<number>(1);
  
  // FPS and performance monitoring
  const fpsRef = useRef<number[]>([]);
  const lastFpsUpdate = useRef<number>(0);
  const currentFps = useRef<number>(60);
  
  // Update the ref when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  // Setup game
  useEffect(() => {
    console.log("Game initialized with difficulty:", difficultyMultiplier.current);
    
    // Initialize the game
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions to match container
    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        
        // Reset player position on resize
        setGameState(prev => ({
          ...prev,
          player: {
            ...prev.player,
            x: canvas.width / 2,
            y: canvas.height / 2 + 100 // Position player below the obelisk
          }
        }));
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Setup mouse event listeners
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      setGameState(prev => ({
        ...prev,
        mouseX,
        mouseY
      }));
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        setGameState(prev => ({
          ...prev,
          isLeftMouseDown: true
        }));
      } else if (e.button === 2) { // Right click
        setGameState(prev => ({
          ...prev,
          isRightMouseDown: true
        }));
        
        // Prevent context menu
        e.preventDefault();
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        setGameState(prev => ({
          ...prev,
          isLeftMouseDown: false
        }));
      } else if (e.button === 2) { // Right click
        setGameState(prev => ({
          ...prev,
          isRightMouseDown: false
        }));
      }
    };
    
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent context menu from showing
    };
    
    // Add event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp); // Listen on window to catch mouseup outside canvas
    canvas.addEventListener('contextmenu', handleContextMenu);
    
    // Start game loop
    startGameLoop();
    
    // Initialize player position
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        x: canvas.width / 2,
        y: canvas.height / 2 + 100 // Position player below the obelisk
      }
    }));
    
    // Start the first wave
    startWave(1);
    
    // Cleanup event listeners and animation frame on unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  // Start a new wave
  const startWave = (wave: number) => {
    if (!canvasRef.current) return;
    
    console.log(`Starting wave ${wave}`);
    waveNumber.current = wave;
    waveStartTime.current = Date.now();
    
    // Calculation for enemies per wave that scales with level
    // Base of 3 enemies, +1 every level up to a reasonable cap
    const baseEnemies = 2;  // Reduced from 3 to 2
    const additionalEnemies = Math.min(Math.floor((wave - 1) / 2), 8); // Slower scaling, capped at +8  
    const enemyCount = baseEnemies + additionalEnemies;

    // Adjust spawn rate based on wave (becomes faster at higher waves)
    enemySpawnRate.current = Math.max(
      500, // Minimum spawn rate cap
      2000 - (wave * 80) - (difficultyMultiplier.current * 50)
    );
    
    const canvas = canvasRef.current;
    
    spawnEnemies(
      canvas.width, 
      canvas.height, 
      enemyCount,
      difficultyMultiplier.current, 
      wave, // Pass the wave number for enemy type selection
      (enemy: GameObject) => {
        setGameState(prev => ({
          ...prev,
          objects: [...prev.objects, enemy]
        }));
      }
    );
    
    // Update game state with new wave number
    setGameState(prev => ({
      ...prev,
      level: wave
    }));
    
    // If it's not the first wave, show a wave notification
    if (wave > 1) {
      // This could be implemented with a visual notification
      // For now, we'll just adjust difficulty slightly for each wave
      difficultyMultiplier.current = Math.min(difficultyMultiplier.current + 0.1, 10);
    }
  };
  
  // Start the game loop
  const startGameLoop = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    const gameLoop = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      // Calculate FPS
      if (time - lastFpsUpdate.current > 1000) {
        // Update FPS every second
        const fps = fpsRef.current.length > 0
          ? fpsRef.current.reduce((sum, value) => sum + value, 0) / fpsRef.current.length
          : 60;
        
        currentFps.current = Math.round(fps);
        fpsRef.current = [];
        lastFpsUpdate.current = time;
      } else {
        // Add current fps to the list
        fpsRef.current.push(1000 / deltaTime);
      }
      
      // Update game state
      if (gameStateRef.current && !gameStateRef.current.isPaused && !gameStateRef.current.gameOver) {
        updateGameState(deltaTime / 1000);
      }
      
      // Render the game
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx && gameStateRef.current) {
          renderGame(ctx, gameStateRef.current, canvasRef.current);
        }
      }
      
      // Continue the game loop
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start the loop
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Handle game over
  useEffect(() => {
    if (gameState.gameOver) {
      // Send game over event to Devvit
      sendToDevvit({
        type: 'GAME_OVER',
        payload: { score: Math.floor(gameState.score) }
      });
    }
  }, [gameState.gameOver]);
  
  // Handle player firing based on mouse state
  useEffect(() => {
    if (gameState.isPaused || gameState.gameOver) return;
    
    // Handle shooting in a separate interval
    const shootingInterval = setInterval(() => {
      if (!gameStateRef.current) return;
      
      const currentTime = Date.now();
      const { isLeftMouseDown, isRightMouseDown, player } = gameStateRef.current;
      
      // Check if left mouse button is pressed and cooldown has passed
      if (isLeftMouseDown && (currentTime - player.lastFireTime >= player.fireRate)) {
        handleFireBullet('regular');
      }
      
      // Check if right mouse button is pressed and cooldown has passed
      if (isRightMouseDown && player.specialAmmo > 0 && (currentTime - player.lastFireTime >= player.fireRate * 3)) {
        handleFireBullet('special');
      }
    }, 16); // Check roughly every frame
    
    return () => clearInterval(shootingInterval);
  }, [gameState.isPaused, gameState.gameOver]);
  
  // Handle firing a bullet
  const handleFireBullet = (type: 'regular' | 'special') => {
    if (!gameStateRef.current) return;
    
    const { newBullet, updatedPlayer } = fireBullet(
      gameStateRef.current, 
      type,
      gameStateRef.current.level // Pass current level for damage scaling
    );
    
    if (!newBullet) return;
    
    // Add bullet to game objects using a functional state update
    setGameState(prev => ({
      ...prev,
      player: updatedPlayer,
      objects: [...prev.objects, newBullet]
    }));
  };
  
  // Update game state based on elapsed time
  const updateGameState = (deltaTime: number) => {
    if (!gameStateRef.current || !canvasRef.current) return;
    const currentState = { ...gameStateRef.current };
    const canvas = canvasRef.current;
    
    // Check for game over
    if (currentState.obeliskHealth <= 0) {
      setGameState(prev => ({ ...prev, gameOver: true }));
      return;
    }
    
    // Check if it's time to spawn a new enemy
    const now = Date.now();
    if (now - lastEnemySpawnTime.current > enemySpawnRate.current) {
      // Spawn a new enemy and add to game state, passing current level
      const newEnemy = spawnRandomEnemy(
        canvas.width, 
        canvas.height, 
        difficultyMultiplier.current,
        canvas.width / 2,
        canvas.height / 2,
        currentState.level // Pass current level
      );
      
      setGameState(prev => ({
        ...prev,
        objects: [...prev.objects, newEnemy]
      }));
      
      lastEnemySpawnTime.current = now;
      
      // Decrease spawn rate over time (more enemies as the game progresses)
      enemySpawnRate.current = Math.max(
        500, // Minimum spawn rate
        enemySpawnRate.current - 10 // Gradually decrease spawn time
      );
    }
    
    // Check if it's time for a new wave
    const waveTime = 30000 + (waveNumber.current * 5000); // Each wave gets longer
    if (now - waveStartTime.current > waveTime) {
      // Start next wave
      startWave(waveNumber.current + 1);
    }
    
    // Update player position
    updatePlayerPosition(currentState, canvas, deltaTime);
    
    // Process objects and collisions
    const { updatedObjects, obeliskDamage, scoreIncrease } = processGameObjects(
      currentState, 
      canvas,
      difficultyMultiplier.current
    );
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      player: currentState.player,
      objects: updatedObjects,
      obeliskHealth: Math.max(0, prev.obeliskHealth - obeliskDamage),
      score: prev.score + scoreIncrease + (deltaTime * 5), // Passive score increase for survival
    }));
    
    // If all enemies are cleared from a wave, give a small health bonus
    const enemies = updatedObjects.filter(obj => obj.type === 'enemy');
    if (enemies.length === 0 && now - lastEnemySpawnTime.current > 3000) {
      // Spawn a new wave of enemies
      const waveEnemies = Math.min(3 + Math.floor(waveNumber.current / 2), 10);
      spawnEnemies(
        canvas.width, 
        canvas.height, 
        waveEnemies, 
        difficultyMultiplier.current,
        currentState.level, // Pass current level 
        (enemy: GameObject) => {
          setGameState(prev => ({
            ...prev,
            objects: [...prev.objects, enemy]
          }));
        }
      );
      lastEnemySpawnTime.current = now;
      
      // Give a health bonus (capped at 100)
      setGameState(prev => ({
        ...prev,
        obeliskHealth: Math.min(100, prev.obeliskHealth + 5)
      }));
    }
    
    // Occasionally replenish special ammo
    if (Math.random() < 0.001 && currentState.player.specialAmmo < 3) {
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          specialAmmo: prev.player.specialAmmo + 1
        }
      }));
    }
  };
  
  // Update player position based on mouse movement
  const updatePlayerPosition = (state: GameState, canvas: HTMLCanvasElement, deltaTime: number) => {
    const playerSpeed = state.player.speed;
    
    // Calculate angle to mouse
    const dx = state.mouseX - state.player.x;
    const dy = state.mouseY - state.player.y;
    const angle = Math.atan2(dy, dx);
    
    // Move player towards mouse cursor, but with some maximum distance from obelisk
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Calculate distance from player to center
    const playerToCenterX = state.player.x - centerX;
    const playerToCenterY = state.player.y - centerY;
    const distanceToCenter = Math.sqrt(playerToCenterX * playerToCenterX + playerToCenterY * playerToCenterY);
    
    // Maximum distance player can be from center
    const maxDistance = Math.min(canvas.width, canvas.height) * 0.4;
    
    // Constrain player within screen bounds
    const padding = 20;
    const minX = padding;
    const maxX = canvas.width - padding;
    const minY = padding;
    const maxY = canvas.height - padding;
    
    // Calculate target position
    let targetX = state.player.x;
    let targetY = state.player.y;
    
    // Only move if mouse is more than 5px away from player
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      targetX = state.player.x + Math.cos(angle) * playerSpeed * deltaTime * 60;
      targetY = state.player.y + Math.sin(angle) * playerSpeed * deltaTime * 60;
    }
    
    // Constrain to screen bounds
    targetX = Math.max(minX, Math.min(maxX, targetX));
    targetY = Math.max(minY, Math.min(maxY, targetY));
    
    // Constrain to maximum distance from center
    const newPlayerToCenterX = targetX - centerX;
    const newPlayerToCenterY = targetY - centerY;
    const newDistanceToCenter = Math.sqrt(newPlayerToCenterX * newPlayerToCenterX + newPlayerToCenterY * newPlayerToCenterY);
    
    if (newDistanceToCenter > maxDistance) {
      const ratio = maxDistance / newDistanceToCenter;
      targetX = centerX + newPlayerToCenterX * ratio;
      targetY = centerY + newPlayerToCenterY * ratio;
    }
    
    // Update player
    state.player.x = targetX;
    state.player.y = targetY;
    state.player.angle = angle;
  };
  
  // Handle restart game button click
  const handleRestart = () => {
    if (!canvasRef.current) return;
    
    // Reset game timers to fix acceleration bug
    resetGameTimers();
    
    // Reset local timing references
    lastTimeRef.current = 0;
    
    setGameState({
      player: {
        x: canvasRef.current.width / 2,
        y: canvasRef.current.height / 2 + 100,
        size: 15,
        angle: 0,
        speed: 5,
        fireRate: 200,
        lastFireTime: 0,
        specialAmmo: 3
      },
      objects: [],
      score: 0,
      level: 1,
      obeliskHealth: 100,
      gameOver: false,
      isPaused: false,
      mouseX: 0,
      mouseY: 0,
      isLeftMouseDown: false,
      isRightMouseDown: false
    });
    
    // Reset wave number and timing
    waveNumber.current = 1;
    waveStartTime.current = Date.now();
    lastEnemySpawnTime.current = 0;
    enemySpawnRate.current = 2000;
    
    // Also reset difficulty multiplier to initial value
    difficultyMultiplier.current = Math.min(Math.max(difficulty, 1), 10);
    
    // Start the first wave again
    startWave(1);
    
    // Restart game loop
    startGameLoop();
  };
  
  // Handle return to menu button click
  const handleMenu = () => {
    setPage('home');
  };
  
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-[#000022]">
      {/* Animated stars background */}
      <StarBackground />
      
      {/* Game canvas */}
      <div className="relative w-full h-full">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          style={{ touchAction: 'none' }}
        />
      </div>
      
      {/* Game over UI overlay */}
      {gameState.gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <div className="bg-[#00002280] backdrop-blur-md p-8 rounded-xl flex flex-col items-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">GAME OVER</h1>
            <p className="text-[#8ca0bd] text-xl mb-6">
              Final Score: {Math.floor(gameState.score)}
            </p>
            
            <div className="flex gap-4">
              <SpaceButton onClick={handleRestart} color="blue">
                PLAY AGAIN
              </SpaceButton>
              
              <SpaceButton onClick={handleMenu} color="purple">
                MAIN MENU
              </SpaceButton>
            </div>
          </div>
        </div>
      )}
      
      {/* Wave notification overlay (optional - could implement this) */}
      {/* {showWaveNotification && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 transition-opacity duration-1000">
          <h2 className="text-4xl text-white font-bold">Wave {gameState.level}</h2>
          <p className="text-xl text-[#8ca0bd]">Enemies are getting stronger!</p>
        </div>
      )} */}
      
      {/* Debug info overlay (hidden in production) */}
      {false && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 p-2 rounded text-xs text-white">
          <div>FPS: {currentFps.current}</div>
          <div>Objects: {gameState.objects.length}</div>
          <div>Difficulty: {difficultyMultiplier.current.toFixed(1)}</div>
          <div>Wave: {waveNumber.current}</div>
        </div>
      )}
    </div>
  );
};