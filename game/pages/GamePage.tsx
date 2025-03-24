import { useState, useEffect, useRef } from 'react';
import { StarBackground } from '../components/StarBackground';
import { SpaceButton } from '../components/SpaceButton';
import { useSetPage } from '../hooks/usePage';
import { sendToDevvit } from '../utils';

// Define game entity types
interface GameObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hp: number;
  type: 'enemy' | 'bullet' | 'player-bullet' | 'explosion';
  color?: string;
}

interface PlayerShip {
  x: number;
  y: number;
  size: number;
  angle: number;
  speed: number;
  fireRate: number;
  lastFireTime: number;
  specialAmmo: number;
}

interface GameState {
  player: PlayerShip;
  objects: GameObject[];
  score: number;
  level: number;
  obeliskHealth: number;
  gameOver: boolean;
  isPaused: boolean;
  mouseX: number;
  mouseY: number;
  isLeftMouseDown: boolean;
  isRightMouseDown: boolean;
}

export const GamePage = ({ postId, difficulty = 1 }: { postId: string; difficulty?: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
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
  
  // Update the ref when state changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  // Setup game
  useEffect(() => {
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
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('contextmenu', handleContextMenu);
    
    // Game loop
    const gameLoop = (time: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      
      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;
      
      // Update game state
      if (!gameStateRef.current?.isPaused && !gameStateRef.current?.gameOver) {
        updateGameState(deltaTime / 1000);
      }
      
      // Render the game
      renderGame(ctx);
      
      // Continue the game loop
      requestRef.current = requestAnimationFrame(gameLoop);
    };
    
    // Start game loop
    requestRef.current = requestAnimationFrame(gameLoop);
    
    // Initialize player position
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        x: canvas.width / 2,
        y: canvas.height / 2 + 100 // Position player below the obelisk
      }
    }));
    
    // Spawn initial enemies
    spawnEnemies();
    
    // Cleanup event listeners and animation frame on unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);
  
  // Handle game over
  useEffect(() => {
    if (gameState.gameOver) {
      // Send game over event to Devvit
      sendToDevvit({
        type: 'GAME_OVER',
        payload: { score: gameState.score }
      });
    }
  }, [gameState.gameOver]);
  
  // Handle player firing based on mouse state
  useEffect(() => {
    if (!gameState.isPaused && !gameState.gameOver) {
      // Check if left mouse button is pressed
      if (gameState.isLeftMouseDown) {
        const currentTime = Date.now();
        if (currentTime - gameState.player.lastFireTime >= gameState.player.fireRate) {
          // Fire regular bullet
          fireBullet('regular');
          
          // Update last fire time
          setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              lastFireTime: currentTime
            }
          }));
        }
      }
      
      // Check if right mouse button is pressed
      if (gameState.isRightMouseDown && gameState.player.specialAmmo > 0) {
        const currentTime = Date.now();
        if (currentTime - gameState.player.lastFireTime >= gameState.player.fireRate * 3) {
          // Fire special bullet
          fireBullet('special');
          
          // Update last fire time and decrease special ammo
          setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              lastFireTime: currentTime,
              specialAmmo: prev.player.specialAmmo - 1
            }
          }));
        }
      }
    }
  }, [gameState.isLeftMouseDown, gameState.isRightMouseDown, gameState.isPaused, gameState.gameOver]);
  
  // Fire bullet from player
  const fireBullet = (type: 'regular' | 'special') => {
    const { player, mouseX, mouseY } = gameState;
    
    // Calculate direction to mouse cursor
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction and set velocity
    const bulletSpeed = type === 'regular' ? 8 : 5;
    const vx = (dx / distance) * bulletSpeed;
    const vy = (dy / distance) * bulletSpeed;
    
    // Create bullet
    const bullet: GameObject = {
      id: Date.now() + Math.random(),
      x: player.x,
      y: player.y,
      vx: vx,
      vy: vy,
      size: type === 'regular' ? 4 : 10,
      hp: type === 'regular' ? 1 : 5,
      type: 'player-bullet',
      color: type === 'regular' ? '#60A5FA' : '#8B5CF6'
    };
    
    // Add bullet to game objects
    setGameState(prev => ({
      ...prev,
      objects: [...prev.objects, bullet]
    }));
  };
  
  // Update game state based on elapsed time
  const updateGameState = (deltaTime: number) => {
    if (!gameStateRef.current) return;
    const currentState = gameStateRef.current;
    
    if (currentState.obeliskHealth <= 0) {
      setGameState(prev => ({ ...prev, gameOver: true }));
      return;
    }
    
    // Update player position
    const playerSpeed = currentState.player.speed;
    
    // Calculate angle to mouse
    const dx = currentState.mouseX - currentState.player.x;
    const dy = currentState.mouseY - currentState.player.y;
    const angle = Math.atan2(dy, dx);
    
    // Move player towards mouse cursor, but with some maximum distance from obelisk
    const canvas = canvasRef.current;
    if (canvas) {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Calculate distance from player to center
      const playerToCenterX = currentState.player.x - centerX;
      const playerToCenterY = currentState.player.y - centerY;
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
      let targetX = currentState.player.x;
      let targetY = currentState.player.y;
      
      // Only move if mouse is more than 5px away from player
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        targetX = currentState.player.x + Math.cos(angle) * playerSpeed * deltaTime * 60;
        targetY = currentState.player.y + Math.sin(angle) * playerSpeed * deltaTime * 60;
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
      currentState.player.x = targetX;
      currentState.player.y = targetY;
      currentState.player.angle = angle;
    }
    
    // Update object positions
    const updatedObjects = currentState.objects.map(obj => {
      const newX = obj.x + obj.vx * deltaTime * 60;
      const newY = obj.y + obj.vy * deltaTime * 60;
      
      // If object is an explosion, reduce its size over time
      if (obj.type === 'explosion') {
        const newSize = obj.size - deltaTime * 40;
        if (newSize <= 0) {
          return null; // Remove explosion
        }
        return { ...obj, size: newSize };
      }
      
      return { ...obj, x: newX, y: newY };
    }).filter(Boolean) as GameObject[];
    
    // Check for collisions
    let obeliskHealth = currentState.obeliskHealth;
    let score = currentState.score;
    
    // Process all objects for collision
    const collidedObjects: number[] = []; // IDs of objects that collided
    
    for (let i = 0; i < updatedObjects.length; i++) {
      const obj = updatedObjects[i];
      if (collidedObjects.includes(obj.id)) continue; // Skip already collided objects
      
      // Get canvas dimensions
      const canvas = canvasRef.current;
      if (!canvas) continue;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const obeliskRadius = 30; // Size of the obelisk
      
      // Process based on object type
      if (obj.type === 'enemy') {
        // Calculate distance to obelisk center
        const dx = obj.x - centerX;
        const dy = obj.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If enemy collides with obelisk
        if (distance < obeliskRadius + obj.size) {
          obeliskHealth -= 10; // Reduce obelisk health
          
          // Create explosion effect
          const explosion: GameObject = {
            id: Date.now() + Math.random(),
            x: obj.x,
            y: obj.y,
            vx: 0,
            vy: 0,
            size: obj.size * 2,
            hp: 1,
            type: 'explosion'
          };
          
          updatedObjects.push(explosion);
          collidedObjects.push(obj.id); // Mark for removal
          continue;
        }
        
        // Check collision with player
        const playerDx = obj.x - currentState.player.x;
        const playerDy = obj.y - currentState.player.y;
        const playerDistance = Math.sqrt(playerDx * playerDx + playerDy * playerDy);
        
        if (playerDistance < obj.size + currentState.player.size) {
          obeliskHealth -= 5; // Player hit by enemy reduces obelisk health (game mechanic)
          
          // Create explosion effect
          const explosion: GameObject = {
            id: Date.now() + Math.random(),
            x: obj.x,
            y: obj.y,
            vx: 0,
            vy: 0,
            size: obj.size * 1.5,
            hp: 1,
            type: 'explosion'
          };
          
          updatedObjects.push(explosion);
          collidedObjects.push(obj.id); // Mark for removal
          continue;
        }
        
        // Check collision with player bullets
        for (let j = 0; j < updatedObjects.length; j++) {
          const bullet = updatedObjects[j];
          if (bullet.type !== 'player-bullet' || collidedObjects.includes(bullet.id)) continue;
          
          const bulletDx = obj.x - bullet.x;
          const bulletDy = obj.y - bullet.y;
          const bulletDistance = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);
          
          if (bulletDistance < obj.size + bullet.size) {
            // Reduce enemy HP by bullet's HP
            obj.hp -= bullet.hp;
            
            // If enemy is destroyed
            if (obj.hp <= 0) {
              score += 10 * difficultyMultiplier.current; // Add score
              
              // Create explosion effect
              const explosion: GameObject = {
                id: Date.now() + Math.random(),
                x: obj.x,
                y: obj.y,
                vx: 0,
                vy: 0,
                size: obj.size * 1.5,
                hp: 1,
                type: 'explosion'
              };
              
              updatedObjects.push(explosion);
              collidedObjects.push(obj.id); // Mark enemy for removal
              
              // Special bullet explosions cause area damage
              if (bullet.size > 5) {
                // Damage nearby enemies
                for (let k = 0; k < updatedObjects.length; k++) {
                  const nearbyObj = updatedObjects[k];
                  if (nearbyObj.type !== 'enemy' || collidedObjects.includes(nearbyObj.id)) continue;
                  
                  const nearbyDx = nearbyObj.x - obj.x;
                  const nearbyDy = nearbyObj.y - obj.y;
                  const nearbyDistance = Math.sqrt(nearbyDx * nearbyDx + nearbyDy * nearbyDy);
                  
                  if (nearbyDistance < obj.size * 3) {
                    // Damage based on distance
                    const damage = Math.ceil(3 * (1 - nearbyDistance / (obj.size * 3)));
                    nearbyObj.hp -= damage;
                    
                    // If nearby enemy is also destroyed
                    if (nearbyObj.hp <= 0) {
                      score += 5 * difficultyMultiplier.current; // Add score
                      
                      // Create smaller explosion
                      const smallExplosion: GameObject = {
                        id: Date.now() + Math.random(),
                        x: nearbyObj.x,
                        y: nearbyObj.y,
                        vx: 0,
                        vy: 0,
                        size: nearbyObj.size,
                        hp: 1,
                        type: 'explosion'
                      };
                      
                      updatedObjects.push(smallExplosion);
                      collidedObjects.push(nearbyObj.id); // Mark for removal
                    }
                  }
                }
              }
            }
            
            collidedObjects.push(bullet.id); // Mark bullet for removal
            break;
          }
        }
      }
      
      // Remove objects that go off-screen
      const buffer = 50;
      if (obj.x < -buffer || obj.x > canvas.width + buffer || 
          obj.y < -buffer || obj.y > canvas.height + buffer) {
        collidedObjects.push(obj.id);
      }
    }
    
    // Filter out collided objects
    const remainingObjects = updatedObjects.filter(obj => !collidedObjects.includes(obj.id));
    
    // Randomly spawn new enemies based on difficulty
    if (Math.random() < 0.02 * difficultyMultiplier.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const newEnemy = createRandomEnemy(canvas.width, canvas.height);
        remainingObjects.push(newEnemy);
      }
    }
    
    // Chance to replenish special ammo (slowly)
    if (Math.random() < 0.001 * difficultyMultiplier.current && currentState.player.specialAmmo < 3) {
      currentState.player.specialAmmo += 1;
    }
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      player: currentState.player, // Update player from current state
      objects: remainingObjects,
      obeliskHealth,
      score: score + (deltaTime * 5), // Passive score increase for survival
    }));
  };
  
  // Render the game to canvas
  const renderGame = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStateRef.current) return;
    
    const currentState = gameStateRef.current;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw obelisk
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    drawObelisk(ctx, centerX, centerY, currentState.obeliskHealth);
    
    // Draw game objects
    currentState.objects.forEach(obj => {
      if (obj.type === 'enemy') {
        drawEnemy(ctx, obj);
      } else if (obj.type === 'explosion') {
        drawExplosion(ctx, obj);
      } else if (obj.type === 'player-bullet') {
        drawBullet(ctx, obj);
      }
    });
    
    // Draw player
    drawPlayer(ctx, currentState.player);
    
    // Draw HUD
    drawHUD(ctx, currentState);
  };
  
  // Draw the obelisk/tower in the center
  const drawObelisk = (ctx: CanvasRenderingContext2D, x: number, y: number, health: number) => {
    // Outer circle
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#2563EB'; // Blue-600
    ctx.fill();
    
    // Inner circle
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#1E40AF'; // Blue-800
    ctx.fill();
    
    // X shape in the center
    ctx.beginPath();
    ctx.moveTo(x - 15, y - 15);
    ctx.lineTo(x + 15, y + 15);
    ctx.moveTo(x + 15, y - 15);
    ctx.lineTo(x - 15, y + 15);
    ctx.strokeStyle = '#D1D5DB'; // Gray-300
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Small orange dot
    ctx.beginPath();
    ctx.arc(x + 15, y - 15, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#F97316'; // Orange-500
    ctx.fill();
    
    // Shields/wings
    const shieldPositions = [
      { x: 0, y: -30 }, // top
      { x: 0, y: 30 }, // bottom
      { x: -30, y: 0 }, // left
      { x: 30, y: 0 }, // right
    ];
    
    shieldPositions.forEach(pos => {
      ctx.beginPath();
      ctx.roundRect(x + pos.x - 15, y + pos.y - 4, 30, 8, 4);
      ctx.fillStyle = '#D1D5DB'; // Gray-300
      ctx.fill();
    });
    
    // Health bar
    const healthBarWidth = 60;
    const healthBarHeight = 6;
    const healthPercentage = Math.max(0, health / 100);
    
    ctx.beginPath();
    ctx.roundRect(x - healthBarWidth / 2, y - 45, healthBarWidth, healthBarHeight, 3);
    ctx.fillStyle = '#4B5563'; // Gray-600
    ctx.fill();
    
    ctx.beginPath();
    ctx.roundRect(x - healthBarWidth / 2, y - 45, healthBarWidth * healthPercentage, healthBarHeight, 3);
    ctx.fillStyle = healthPercentage > 0.6 ? '#10B981' : healthPercentage > 0.3 ? '#F59E0B' : '#EF4444';
    ctx.fill();
    
    // Draw shield effect if health is low
    if (healthPercentage < 0.3) {
      ctx.beginPath();
      ctx.arc(x, y, 35, 0, Math.PI * 2);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };
  
  // Draw player ship
  const drawPlayer = (ctx: CanvasRenderingContext2D, player: PlayerShip) => {
    ctx.save();
    
    // Translate to player position
    ctx.translate(player.x, player.y);
    
    // Rotate to face mouse cursor
    ctx.rotate(player.angle);
    
    // Draw player ship body
    ctx.beginPath();
    ctx.moveTo(player.size, 0); // Nose of the ship
    ctx.lineTo(-player.size, -player.size / 2); // Bottom-left
    ctx.lineTo(-player.size / 2, 0); // Middle back
    ctx.lineTo(-player.size, player.size / 2); // Top-left
    ctx.closePath();
    ctx.fillStyle = '#60A5FA'; // Blue-400
    ctx.fill();
    
    // Draw player ship details
    ctx.beginPath();
    ctx.moveTo(player.size / 2, 0); // Front middle
    ctx.lineTo(-player.size / 2, -player.size / 4); // Bottom
    ctx.lineTo(-player.size / 4, 0); // Middle back
    ctx.lineTo(-player.size / 2, player.size / 4); // Top
    ctx.closePath();
    ctx.fillStyle = '#93C5FD'; // Blue-300
    ctx.fill();
    
    // Draw engine glow
    ctx.beginPath();
    ctx.moveTo(-player.size, 0);
    ctx.lineTo(-player.size - player.size / 2, -player.size / 4);
    ctx.lineTo(-player.size - player.size / 2, player.size / 4);
    ctx.closePath();
    ctx.fillStyle = '#F97316'; // Orange-500
    ctx.fill();
    
    ctx.restore();
  };
  
  // Draw enemies
  const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: GameObject) => {
    // Enemy body
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
    ctx.fillStyle = '#EF4444'; // Red-500
    ctx.fill();
    
    // Enemy details
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.size * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = '#B91C1C'; // Red-700
    ctx.fill();
    
    // Calculate direction towards obelisk for enemy "face"
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const dx = centerX - enemy.x;
    const dy = centerY - enemy.y;
    const angle = Math.atan2(dy, dx);
    
    // Draw "face" pointing to obelisk
    const eyeOffsetX = Math.cos(angle) * enemy.size * 0.3;
    const eyeOffsetY = Math.sin(angle) * enemy.size * 0.3;
    
    ctx.beginPath();
    ctx.arc(enemy.x + eyeOffsetX, enemy.y + eyeOffsetY, enemy.size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#FBBF24'; // Amber-400
    ctx.fill();
    
    // Health bar for bigger enemies
    if (enemy.size > 10 && enemy.hp > 1) {
      const healthBarWidth = enemy.size * 2;
      const healthBarHeight = 2;
      const healthPercentage = Math.max(0, enemy.hp / Math.ceil(enemy.size / 3));
      
      ctx.beginPath();
      ctx.roundRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.size - 5, healthBarWidth, healthBarHeight, 1);
      ctx.fillStyle = '#4B5563'; // Gray-600
      ctx.fill();
      
      ctx.beginPath();
      ctx.roundRect(enemy.x - healthBarWidth / 2, enemy.y - enemy.size - 5, healthBarWidth * healthPercentage, healthBarHeight, 1);
      ctx.fillStyle = '#EF4444'; // Red-500
      ctx.fill();
    }
  };
  
  // Draw bullets
  const drawBullet = (ctx: CanvasRenderingContext2D, bullet: GameObject) => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
    ctx.fillStyle = bullet.color || '#60A5FA'; // Blue-400 by default
    ctx.fill();
    
    // Add glow effect for special bullets
    if (bullet.size > 5) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.size * 1.5, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        bullet.x, bullet.y, bullet.size,
        bullet.x, bullet.y, bullet.size * 1.5
      );
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)'); // Purple-500 at 50% opacity
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)'); // Transparent
      ctx.fillStyle = gradient;
      ctx.fill();
    }
  };
  
  // Draw explosion effect
  const drawExplosion = (ctx: CanvasRenderingContext2D, explosion: GameObject) => {
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
    
    // Create gradient for explosion
    const gradient = ctx.createRadialGradient(
      explosion.x, explosion.y, 0,
      explosion.x, explosion.y, explosion.size
    );
    gradient.addColorStop(0, '#F59E0B'); // Amber-500
    gradient.addColorStop(0.7, '#F97316'); // Orange-500
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)'); // Transparent Red-500
    
    ctx.fillStyle = gradient;
    ctx.fill();
  };
  
  // Draw HUD (score, level, etc.)
  const drawHUD = (ctx: CanvasRenderingContext2D, state: GameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Draw score and level
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    
    // Score
    ctx.fillText(`Score: ${Math.floor(state.score)}`, 20, 30);
    
    // Level indicator
    ctx.fillText(`Level: ${state.level}`, 20, 60);
    
    // Special ammo indicator
    ctx.fillText(`Special Ammo: ${state.player.specialAmmo}`, 20, 90);
    
    // Instructions (only show for first few seconds)
    if (state.score < 100) {
      ctx.font = '14px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText('Move: Mouse', canvas.width / 2, canvas.height - 60);
      ctx.fillText('Shoot: Left Click', canvas.width / 2, canvas.height - 40);
      ctx.fillText('Special Attack: Right Click', canvas.width / 2, canvas.height - 20);
    }
    
    // Show game over text if game over
    if (state.gameOver) {
      ctx.font = 'bold 36px sans-serif';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Final Score: ${Math.floor(state.score)}`, canvas.width / 2, canvas.height / 2);
    }
  };
  
  // Spawn initial enemies
  const spawnEnemies = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const initialEnemies: GameObject[] = [];
    const enemyCount = Math.floor(3 + (difficultyMultiplier.current * 2));
    
    for (let i = 0; i < enemyCount; i++) {
      initialEnemies.push(createRandomEnemy(canvas.width, canvas.height));
    }
    
    setGameState(prev => ({
      ...prev,
      objects: [...prev.objects, ...initialEnemies]
    }));
  };
  
  // Create a random enemy outside the screen
  const createRandomEnemy = (canvasWidth: number, canvasHeight: number): GameObject => {
    // Decide which side the enemy will spawn from
    const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    
    let x, y;
    const buffer = 50; // Spawn slightly outside the canvas
    
    switch (side) {
      case 0: // top
        x = Math.random() * canvasWidth;
        y = -buffer;
        break;
      case 1: // right
        x = canvasWidth + buffer;
        y = Math.random() * canvasHeight;
        break;
      case 2: // bottom
        x = Math.random() * canvasWidth;
        y = canvasHeight + buffer;
        break;
      case 3: // left
        x = -buffer;
        y = Math.random() * canvasHeight;
        break;
      default:
        x = -buffer;
        y = Math.random() * canvasHeight;
    }
    
    // Calculate direction towards center
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const dx = centerX - x;
    const dy = centerY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Normalize direction and set velocity
    const baseSpeed = 1 + (difficultyMultiplier.current * 0.5);
    const speedVariation = Math.random() * 0.5 + 0.75; // 0.75 to 1.25
    const speed = baseSpeed * speedVariation;
    
    const vx = (dx / distance) * speed;
    const vy = (dy / distance) * speed;
    
    // Set size based on difficulty
    const baseSize = 8 + Math.random() * 8; // 8-16
    const sizeMultiplier = 1 + (difficultyMultiplier.current * 0.1); // 1.1 - 2.0
    const size = baseSize * sizeMultiplier;
    
    // HP based on size
    const hp = Math.ceil(size / 4);
    
    return {
      id: Date.now() + Math.random(),
      x,
      y,
      vx,
      vy,
      size,
      hp,
      type: 'enemy'
    };
  };
  
  // Handle restart game button click
  const handleRestart = () => {
    setGameState({
      player: {
        x: canvasRef.current ? canvasRef.current.width / 2 : 0,
        y: canvasRef.current ? canvasRef.current.height / 2 + 100 : 0,
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
    
    // Spawn new enemies
    spawnEnemies();
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
    </div>
  );
};