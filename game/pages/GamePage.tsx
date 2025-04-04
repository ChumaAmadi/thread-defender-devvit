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
import { WebviewToBlockMessage } from '../types/messages.js';

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
      speed: 12,
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
    
    // Start game music - ensure we're using the right music track
    console.log("Starting game music");
    audioManager.playGameMusic();
    
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
      
      // Stop game music when component unmounts
      audioManager.stopMusic();
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
      console.log('Game Over detected - handling game over state');
      
      // Ensure game music is stopped and game over sound is played
      audioManager.stopMusic();
      audioManager.playSound('gameOver');
      
      // Save high score to localStorage
      const currentHighScore = parseInt(localStorage.getItem('highScore') || '0', 10);
      const finalScore = Math.floor(gameState.score);
      
      if (finalScore > currentHighScore) {
        localStorage.setItem('highScore', finalScore.toString());
      }
      
      // Send game over event to Devvit
      console.log('Sending GAME_OVER event to Devvit');
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
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [musicVolume, setMusicVolume] = useState(0.5);

  // Initialize audio
  useEffect(() => {
    // Set initial volumes
    audioManager.setSoundVolume(soundVolume);
    audioManager.setMusicVolume(musicVolume);
    
    // Start game music - ensure correct music is playing
    console.log("Initializing game music");
    audioManager.playGameMusic();

    // Cleanup on unmount
    return () => {
      audioManager.stopMusic();
    };
  }, []);

  // Handle volume changes
  useEffect(() => {
    audioManager.setSoundVolume(soundVolume);
  }, [soundVolume]);

  useEffect(() => {
    audioManager.setMusicVolume(musicVolume);
  }, [musicVolume]);

  // Handle mute changes
  useEffect(() => {
    audioManager.setSoundMute(isSoundMuted);
  }, [isSoundMuted]);

  useEffect(() => {
    audioManager.setMusicMute(isMusicMuted);
  }, [isMusicMuted]);

  // Modify handleFireBullet to include sound
  const handleFireBullet = (type: 'regular' | 'special') => {
    if (!gameStateRef.current) return;
    
    // Play appropriate sound
    audioManager.playSound(type === 'regular' ? 'shoot' : 'specialShoot');
    
    const hasInfiniteSpecial = activeEffectsRef.current.infiniteSpecial?.active || false;
    
    const { newBullet, updatedPlayer } = fireBullet(
      gameStateRef.current, 
      type,
      gameStateRef.current.level
    );
    
    if (!newBullet) return;
    
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
      // Stop game music first
      audioManager.stopMusic();
      // Then play game over sound
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
    
    // Play explosion sound for each enemy that was destroyed
    const destroyedEnemies = currentState.objects.filter(obj => 
      obj.type === 'enemy' && 
      !updatedObjects.some(updated => updated.id === obj.id)
    );
    destroyedEnemies.forEach(() => {
      audioManager.playSound('explosion');
    });
    
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
    
    // Only move if mouse is more than 10px away from player (increased from 5px for smoother movement)
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      // Add interpolation factor for smoother movement
      const interpolationFactor = 0.8; // Increased from 0.5 to 0.8 for much faster response
      targetX = state.player.x + (Math.cos(angle) * playerSpeed * deltaTime * 60) * interpolationFactor;
      targetY = state.player.y + (Math.sin(angle) * playerSpeed * deltaTime * 60) * interpolationFactor;
    }
    
    // Constrain to screen bounds
    targetX = Math.max(minX, Math.min(maxX, targetX));
    targetY = Math.max(minY, Math.min(maxY, targetY));
    
    // Constrain to maximum distance from center
    const newPlayerToCenterX = targetX - centerX;
    const newPlayerToCenterY = targetY - centerY;
    const newDistanceToCenter = Math.sqrt(newPlayerToCenterX * newPlayerToCenterX + newPlayerToCenterY * newPlayerToCenterY);
    
    if (newDistanceToCenter > maxDistance) {
      // Scale back the movement to stay within max distance
      const scale = maxDistance / newDistanceToCenter;
      targetX = centerX + newPlayerToCenterX * scale;
      targetY = centerY + newPlayerToCenterY * scale;
    }
    
    // Update player position
    state.player.x = targetX;
    state.player.y = targetY;
    state.player.angle = angle;
  };
  
  // Add this new function to create the results post
  const createResultsPost = () => {
    if (!gameState.gameOver) {
      console.log('Game not over yet, skipping results post');
      return;
    }
    
    console.log('Creating results post with:', {
      score: Math.floor(gameState.score),
      difficulty: gameOptions.difficulty,
      transmitterId: postId,
      wave: gameState.level
    });
    
    // Make sure we have all required data
    if (!postId) {
      console.error('Missing postId, cannot create results post');
      return;
    }
    
    const finalScore = Math.floor(gameState.score);
    const difficultyLabel = gameOptions.difficulty.charAt(0).toUpperCase() + gameOptions.difficulty.slice(1);
    
    const message: WebviewToBlockMessage = {
      type: 'CREATE_RESULTS_POST',
      payload: {
        score: finalScore,
        difficulty: difficultyLabel,
        transmitterId: postId,
        wave: gameState.level
      }
    };
    
    console.log('Sending message to Devvit:', message);
    sendToDevvit(message);
    
    // Add a visual indicator that the post is being created
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg z-50 animate-fade-in-out';
    notification.textContent = 'Creating results post...';
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  // Add a listener for the results post creation response
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'RESULTS_POST_CREATED') {
        const { success, postUrl, error } = event.data.payload;
        
        if (success) {
          console.log('Results post created successfully:', postUrl);
          // Show success notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50 animate-fade-in-out';
          notification.textContent = 'Results posted successfully!';
          document.body.appendChild(notification);
          
          // Remove notification after 3 seconds
          setTimeout(() => {
            notification.remove();
          }, 3000);
        } else {
          console.error('Failed to create results post:', error);
          // Show error notification
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg z-50 animate-fade-in-out';
          notification.textContent = `Failed to post results: ${error || 'Unknown error'}`;
          document.body.appendChild(notification);
          
          // Remove notification after 3 seconds
          setTimeout(() => {
            notification.remove();
          }, 3000);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  
  // Handle restart game button click
  const handleRestart = () => {
    if (!canvasRef.current) return;
    
    console.log('Restart button clicked - creating results post');
    // Create a results post before restarting
    createResultsPost();
    
    // IMPORTANT: Cancel the current animation frame before starting a new one
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }
    
    // Reset game timers in gameRenderer.tsx
    resetGameTimers();
    
    // Reset ALL local timing references
    lastTimeRef.current = 0;
    lastEnemySpawnTime.current = 0;
    waveStartTime.current = Date.now();
    waveNumber.current = 1;
    enemySpawnRate.current = 2000;
    
    // Reset ANY intervals that might be running
    if (shootingIntervalRef.current) {
      clearInterval(shootingIntervalRef.current);
      shootingIntervalRef.current = null;
    }
    
    // Reset active effects
    setActiveEffects({});

    // Set difficulty based on current options
    const difficultyValues: Record<DifficultyLevel, number> = {
      easy: 0.7,
      medium: 1.5,
      hard: 2.5
    };
    difficultyMultiplier.current = difficultyValues[gameOptions.difficulty];
    
    // Reset game state
    setGameState({
      player: {
        x: canvasRef.current.width / 2,
        y: canvasRef.current.height / 2 + 100,
        size: 15,
        angle: 0,
        speed: 12,
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
    
    // Add a small delay before starting the game loop again
    setTimeout(() => {
      // Start the first wave
      startWave(1);
      
      // Stop any existing music and start game music
      audioManager.stopMusic();
      setTimeout(() => {
        audioManager.playGameMusic();
      }, 100);
      
      // Restart game loop
      startGameLoop();
    }, 50);
  };
  
  // Handle return to menu button click
  const handleMenu = () => {
    console.log('Menu button clicked - creating results post');
    // Create a results post before navigating away
    createResultsPost();
    
    // Stop game music and play menu music
    console.log("Switching to menu music");
    audioManager.playMenuMusic();
    
    // Clean up any running processes before navigating away
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
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

  // Add showInstructions state
  const [showInstructions, setShowInstructions] = useState(true);

  // Add useEffect for instructions timer
  useEffect(() => {
    if (showInstructions) {
      const timer = setTimeout(() => {
        setShowInstructions(false);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showInstructions]);

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
      
      {/* Game info display - Keep this as is */}
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

      {/* Temporary vertical instructions that disappear */}
      {showInstructions && (
        <div className="absolute top-4 left-0 right-0 flex justify-center z-[100] transition-opacity duration-500">
          <div className="bg-[#00002280] backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="text-white text-opacity-70 text-sm flex flex-col items-center">
              <div>Move: Mouse</div>
              <div>Shoot: Left Click</div>
              <div>Special Attack: Right Click</div>
            </div>
          </div>
        </div>
      )}

      {/* Show FPS counter if enabled - raised by one more pixel */}
      {gameOptions.showFPS && (
        <div className="absolute bottom-[20px] left-24 bg-[#00002280] backdrop-blur-sm px-3 py-2 rounded-full text-white text-sm z-[100] flex items-center">
          FPS: {currentFps.current}
        </div>
      )}
      
      {/* Game canvas */}
      <div className="relative w-full h-full">
        <canvas 
          ref={canvasRef} 
          className="w-full h-full"
          style={{ touchAction: 'none' }}
        />
      </div>
      
      {/* Bottom UI container with better alignment */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-between px-6 z-[100]">
        {/* Game controls - left side */}
        <div className="flex gap-2">
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
        
        {/* Audio controls - right side, moved slightly right */}
        <div className="flex items-center gap-6">
          {/* Sound Effects Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSoundMuted(!isSoundMuted)}
              className="p-2 rounded-full bg-[#00002280] backdrop-blur-sm text-white hover:bg-[#000022a0] transition-colors"
            >
              {isSoundMuted ? '🔇' : '🔊'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={soundVolume}
              onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>

          {/* Music Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMusicMuted(!isMusicMuted)}
              className="p-2 rounded-full bg-[#00002280] backdrop-blur-sm text-white hover:bg-[#000022a0] transition-colors"
            >
              {isMusicMuted ? '🎵🚫' : '🎵'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
      </div>

      {/* Game over UI overlay - Keep this as is */}
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
