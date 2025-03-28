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
import { 
  createPowerup, 
  applyPowerup, 
  ActiveEffects,
  powerupDurations
} from '../game/powerups';
import { audioManager } from '../audio/audioManager';
import { FPSCounter } from '../components/FPSCounter';

type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface GameOptions {
  showFPS: boolean;
  difficulty: DifficultyLevel;
}

export const GamePage = ({ postId }: { postId: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const animationFrameRef = useRef<number>(0);
  const shootingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const difficultyMultiplier = useRef<number>(1.5); // Default to medium difficulty
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
  
  // New state for active powerup effects
  const [activeEffects, setActiveEffects] = useState<ActiveEffects>({});
  const activeEffectsRef = useRef<ActiveEffects>({});
  
  // Update the ref when activeEffects changes
  useEffect(() => {
    activeEffectsRef.current = activeEffects;
  }, [activeEffects]);
  
  // Game loop using requestAnimationFrame
  const lastTimeRef = useRef<number>(0);
  const requestRef = useRef<number>();
  
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
  
  // Process powerup effects
  useEffect(() => {
    const effectsInterval = setInterval(() => {
      const now = Date.now();
      let effectsUpdated = false;
      const updatedEffects = { ...activeEffects };
      
      // Process each active effect
      if (updatedEffects.shield?.active && now > updatedEffects.shield.endTime) {
        updatedEffects.shield.active = false;
        effectsUpdated = true;
      }
      
      if (updatedEffects.rapidFire?.active && now > updatedEffects.rapidFire.endTime) {
        updatedEffects.rapidFire.active = false;
        
        // Reset fire rate
        setGameState(prev => ({
          ...prev,
          player: {
            ...prev.player,
            fireRate: updatedEffects.rapidFire?.originalFireRate || 200
          }
        }));
        
        effectsUpdated = true;
      }
      
      if (updatedEffects.infiniteSpecial?.active && now > updatedEffects.infiniteSpecial.endTime) {
        updatedEffects.infiniteSpecial.active = false;
        effectsUpdated = true;
      }
      
      if (effectsUpdated) {
        setActiveEffects(updatedEffects);
      }
    }, 100);
    
    return () => clearInterval(effectsInterval);
  }, [activeEffects]);
  
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
      
      if (shootingIntervalRef.current) {
        clearInterval(shootingIntervalRef.current);
        shootingIntervalRef.current = null;
      }
    };
  }, []);
  
  // Start a new wave
  const startWave = (wave: number) => {
    if (!canvasRef.current) return;
    
    console.log(`Starting wave ${wave}`);
    waveNumber.current = wave;
    waveStartTime.current = Date.now();
    
    // Calculation for enemies per wave that scales with level - but with fewer enemies
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
    
    // Health regeneration after wave completion (5% per wave, more at higher waves)
    const healthRegen = Math.min(20, 5 + Math.floor(wave / 5) * 2);
    
    // Update game state with new wave number and health regeneration
    setGameState(prev => ({
      ...prev,
      level: wave,
      obeliskHealth: Math.min(100, prev.obeliskHealth + healthRegen)
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
    // Cancel any existing animation frame
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
    
    // Reset lastTimeRef to ensure first frame has clean timing
    lastTimeRef.current = 0;
    
    const gameLoop = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(gameLoop);
        return; // Skip first frame calculations to avoid huge delta
      }
      
      const deltaTime = Math.min(time - lastTimeRef.current, 33); // Cap at ~30fps equivalent
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
      requestRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start the loop
    requestRef.current = requestAnimationFrame(gameLoop);
  };
  
  // Handle game over
  useEffect(() => {
    if (gameState.gameOver) {
      // Save high score to localStorage
      const currentHighScore = parseInt(localStorage.getItem('highScore') || '0', 10);
      const finalScore = Math.floor(gameState.score);
      
      if (finalScore > currentHighScore) {
        localStorage.setItem('highScore', finalScore.toString());
      }
      
      // Send game over event to Devvit
      sendToDevvit({
        type: 'GAME_OVER',
        payload: { score: finalScore }
      });
    }
  }, [gameState.gameOver]);
  
  // Handle player firing based on mouse state
  useEffect(() => {
    if (gameState.isPaused || gameState.gameOver) return;
    
    // Clear any existing interval first
    if (shootingIntervalRef.current) {
      clearInterval(shootingIntervalRef.current);
      shootingIntervalRef.current = null;
    }
    
    // Handle shooting in a separate interval
    shootingIntervalRef.current = setInterval(() => {
      if (!gameStateRef.current) return;
      
      const currentTime = Date.now();
      const { isLeftMouseDown, isRightMouseDown, player } = gameStateRef.current;
      
      // Check if left mouse button is pressed and cooldown has passed
      if (isLeftMouseDown && (currentTime - player.lastFireTime >= player.fireRate)) {
        handleFireBullet('regular');
      }
      
      // Check if right mouse button is pressed and cooldown has passed
      if (isRightMouseDown && (currentTime - player.lastFireTime >= player.fireRate * 3)) {
        // Only use special if we have ammo or infinite special is active
        if (player.specialAmmo > 0 || activeEffectsRef.current.infiniteSpecial?.active) {
          handleFireBullet('special');
        }
      }
    }, 16); // Check roughly every frame
    
    return () => {
      if (shootingIntervalRef.current) {
        clearInterval(shootingIntervalRef.current);
        shootingIntervalRef.current = null;
      }
    };
  }, [gameState.isPaused, gameState.gameOver]);
  
  // Add audio state
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);

  // Initialize audio
  useEffect(() => {
    // Set initial volume
    audioManager.setVolume(volume);
    
    // Start background music
    audioManager.playMusic();

    // Cleanup on unmount
    return () => {
      audioManager.stopMusic();
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    audioManager.setVolume(volume);
  }, [volume]);

  // Handle mute changes
  useEffect(() => {
    audioManager.setMute(isMuted);
  }, [isMuted]);

  // Modify handleFireBullet to play sound
  const handleFireBullet = (type: 'regular' | 'special') => {
    if (!gameStateRef.current) return;
    
    // Play appropriate sound
    audioManager.playSound(type === 'regular' ? 'shoot' : 'specialShoot');
    
    // Check if we can use special without consuming ammo
    const hasInfiniteSpecial = activeEffectsRef.current.infiniteSpecial?.active || false;
    
    const { newBullet, updatedPlayer } = fireBullet(
      gameStateRef.current, 
      type,
      gameStateRef.current.level
    );
    
    if (!newBullet) return;
    
    // If we have infinite special, don't reduce ammo
    const finalPlayer = type === 'special' && hasInfiniteSpecial ? {
      ...updatedPlayer,
      specialAmmo: gameStateRef.current.player.specialAmmo
    } : updatedPlayer;
    
    setGameState(prev => ({
      ...prev,
      player: finalPlayer,
      objects: [...prev.objects, newBullet]
    }));
  };
  
  // Update game state based on elapsed time
  const updateGameState = (deltaTime: number) => {
    if (!gameStateRef.current || !canvasRef.current) return;
    const currentState = { ...gameStateRef.current };
    const canvas = canvasRef.current;
    
    // Update player position
    updatePlayerPosition(currentState, canvas, deltaTime);
    
    // Check for game over
    if (currentState.obeliskHealth <= 0) {
      audioManager.playSound('gameOver');
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
        currentState.level
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
      // Play wave start sound
      audioManager.playSound('waveStart');
      // Start next wave
      startWave(waveNumber.current + 1);
    }
    
    // Process powerup collection
    const playerPowerups = currentState.objects.filter(obj => obj.type === 'powerup');
    for (const powerup of playerPowerups) {
      const dx = powerup.x - currentState.player.x;
      const dy = powerup.y - currentState.player.y;
      const distanceSquared = dx * dx + dy * dy;
      const collisionRadiusSquared = Math.pow(powerup.size + currentState.player.size, 2);
      
      if (distanceSquared < collisionRadiusSquared) {
        // Play appropriate powerup sound based on type
        switch (powerup.subType) {
          case 'shield':
            audioManager.playSound('shield');
            break;
          case 'rapidFire':
            audioManager.playSound('rapidFire');
            break;
          case 'infiniteSpecial':
            audioManager.playSound('infiniteSpecial');
            break;
          case 'healthPack':
            audioManager.playSound('healthPack');
            break;
          default:
            audioManager.playSound('powerup');
        }
        
        // Apply powerup effect
        const { gameState: updatedState, activeEffects: updatedEffects } = 
          applyPowerup(powerup, currentState, activeEffectsRef.current);
        
        // Update game state
        setGameState(prev => ({
          ...updatedState,
          objects: prev.objects.filter(o => o.id !== powerup.id)
        }));
        
        // Update active effects
        setActiveEffects(updatedEffects);
        break;
      }
    }
    
    // Process objects and collisions
    const { updatedObjects, obeliskDamage, scoreIncrease } = processGameObjects(
      currentState, 
      canvas,
      difficultyMultiplier.current
    );
    
    // Play hit sound if obelisk took damage
    if (obeliskDamage > 0) {
      audioManager.playSound('hit');
    }
    
    // Apply shield effect to reduce obelisk damage if active
    const finalObeliskDamage = activeEffectsRef.current.shield?.active 
      ? obeliskDamage * 0.2 // 80% damage reduction with shield
      : obeliskDamage;
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      player: currentState.player,
      objects: updatedObjects,
      obeliskHealth: Math.max(0, prev.obeliskHealth - finalObeliskDamage),
      score: prev.score + scoreIncrease + (deltaTime * 5), // Passive score increase for survival
    }));
    
    // If all enemies are cleared from a wave, give a small health bonus
    const remainingEnemies = updatedObjects.filter(obj => obj.type === 'enemy');
    if (remainingEnemies.length === 0 && now - lastEnemySpawnTime.current > 3000) {
      // Play wave start sound for new wave
      audioManager.playSound('waveStart');
      
      // Spawn a new wave of enemies
      const waveEnemies = Math.min(3 + Math.floor(waveNumber.current / 2), 10);
      spawnEnemies(
        canvas.width, 
        canvas.height, 
        waveEnemies, 
        difficultyMultiplier.current,
        currentState.level,
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
    
    // Play wave start sound
    audioManager.playSound('waveStart');
    
    // IMPORTANT: Cancel the current animation frame before starting a new one
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
    
    // Reset game timers in gameRenderer.tsx
    resetGameTimers();
    
    // Reset ALL local timing references
    lastTimeRef.current = 0; // This is crucial
    
    // Reset ANY intervals that might be running
    if (shootingIntervalRef.current) {
      clearInterval(shootingIntervalRef.current);
      shootingIntervalRef.current = null;
    }
    
    // Reset active effects
    setActiveEffects({});

    // Set difficulty based on current options
    const difficultyValues: Record<DifficultyLevel, number> = {
      easy: 0.7,    // Easier than before
      medium: 1.5,  // Same as before
      hard: 2.5     // Harder than before
    };
    difficultyMultiplier.current = difficultyValues[gameOptions.difficulty];
    
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
    
    // Add a small delay before starting the game loop again
    setTimeout(() => {
      // Start the first wave again
      startWave(1);
      
      // Restart game loop
      startGameLoop();
    }, 50);
  };
  
  // Handle return to menu button click
  const handleMenu = () => {
    // Stop music when leaving game
    audioManager.stopMusic();
    
    // Clean up any running processes before navigating away
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    if (shootingIntervalRef.current) {
      clearInterval(shootingIntervalRef.current);
      shootingIntervalRef.current = null;
    }
    
    setPage('home');
  };
  
  const [gameOptions, setGameOptions] = useState<GameOptions>({
    showFPS: false,
    difficulty: 'medium'
  });

  // Load game options
  useEffect(() => {
    try {
      const savedOptions = localStorage.getItem('gameOptions');
      if (savedOptions) {
        const options = JSON.parse(savedOptions) as Partial<GameOptions>;
        setGameOptions({
          showFPS: options.showFPS || false,
          difficulty: (options.difficulty as DifficultyLevel) || 'medium'
        });

        // Set initial difficulty
        const difficultyValues: Record<DifficultyLevel, number> = {
          easy: 0.7,    // Easier than before
          medium: 1.5,  // Same as before
          hard: 2.5     // Harder than before
        };
        difficultyMultiplier.current = difficultyValues[options.difficulty as DifficultyLevel || 'medium'];
      }
    } catch (error) {
      console.error('Error loading game options:', error);
    }
  }, []);

  // Update difficulty when options change
  useEffect(() => {
    const difficultyValues: Record<DifficultyLevel, number> = {
      easy: 0.7,    // Easier than before
      medium: 1.5,  // Same as before
      hard: 2.5     // Harder than before
    };
    difficultyMultiplier.current = difficultyValues[gameOptions.difficulty];
  }, [gameOptions.difficulty]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-[#000022]">
      <StarBackground />
      
      {/* Game info display - more compact with grid layout */}
      <div className="absolute top-4 left-4 bg-[#00002280] backdrop-blur-sm rounded-lg p-2 z-[100]">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="text-[#8ca0bd]">Score:</div>
          <div className="text-white text-right">{Math.floor(gameState.score)}</div>
          
          <div className="text-[#8ca0bd]">Wave:</div>
          <div className="text-white text-right">{gameState.level}</div>
          
          <div className="text-[#8ca0bd]">Special Ammo:</div>
          <div className="text-white text-right">{gameState.player.specialAmmo}</div>
          
          <div className="text-[#8ca0bd]">Difficulty:</div>
          <div className="text-white text-right">{gameOptions.difficulty}</div>
          
          <div className="text-[#8ca0bd]">Health:</div>
          <div className="text-white text-right">{Math.floor(gameState.obeliskHealth)}%</div>
        </div>
      </div>

      {/* Show FPS counter if enabled */}
      {gameOptions.showFPS && <FPSCounter />}
      
      {/* Game canvas */}
      <div className="relative w-full h-full">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          style={{ touchAction: 'none' }}
        />
      </div>
      
      {/* Game controls - more compact */}
      <div className="absolute bottom-4 left-4 flex gap-2 z-[100] scale-90">
        <button
          onClick={() => setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
          className="p-2 rounded-full bg-[#00002280] backdrop-blur-sm text-white hover:bg-[#000022a0] transition-colors"
        >
          {gameState.isPaused ? '▶️' : '⏸️'}
        </button>
        <button
          onClick={handleMenu}
          className="p-2 rounded-full bg-[#00002280] backdrop-blur-sm text-white hover:bg-[#000022a0] transition-colors"
        >
          🚪
        </button>
      </div>
      
      {/* Audio controls - more compact */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-[100] scale-90">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-20"
        />
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-full bg-[#00002280] backdrop-blur-sm text-white hover:bg-[#000022a0] transition-colors"
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Game over UI overlay */}
      {gameState.gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-[200]">
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
    </div>
  );
};
