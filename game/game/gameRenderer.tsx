import { updateEnemy, renderEnemy, createRandomEnemy } from './enemyTypes'; // Import createRandomEnemy from enemyTypes

// Performance settings - tuned for better balance of performance and gameplay
const PERFORMANCE = {
  MAX_ACTIVE_EXPLOSIONS: 15,  // Increased max explosions
  MAX_SIMULTANEOUS_HITS: 5,   // Maximum enemies that can be hit at once
  EXPLOSION_DURATION: 10,     // How many frames an explosion lasts
  SKIP_FANCY_RENDERING: false, // Re-enable fancy rendering
  PROCESS_BATCH_SIZE: 20,     // Process more objects per frame
  DISABLE_AREA_DAMAGE: false, // Re-enable area damage
  CULL_DISTANCE: 2000,       // Increased culling distance
  FRAME_SKIP_THRESHOLD: 20,  // Higher threshold before skipping frames
  SPECIAL_AMMO_REFILL_TIME: 10000, // Time in ms to refill special ammo
  SPAWN_RATE: 500,          // Milliseconds between enemy spawns (lower = more enemies)
  MIN_ENEMIES: 8,           // Minimum number of enemies on screen
  INITIAL_ENEMIES: 10,      // Number of enemies to spawn at the start
};

// Track global performance metrics
let lastFrameTime = 0;
let frameTimes: number[] = [];
let isLowPerformance = false;
let frameCounter = 0;
let lastSpecialAmmoRefill = Date.now();
let lastEnemyCleanupCheck = Date.now();
let lastEnemySpawnTime = Date.now();

// Define interfaces
export interface GameObject {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hp: number;
  type: 'enemy' | 'bullet' | 'player-bullet' | 'explosion';
  subType?: string;
  color?: string;
  behavior?: string;
  spawnTime?: number;
  targetX?: number;
  targetY?: number;
  special?: {
    attackCooldown?: number;
    lastAttack?: number;
    targetPlayer?: boolean;
    shielded?: boolean;
    teleports?: boolean;
    lastTeleport?: number;
    teleportCooldown?: number;
  };
}

export interface PlayerShip {
  x: number;
  y: number;
  size: number;
  angle: number;
  speed: number;
  fireRate: number;
  lastFireTime: number;
  specialAmmo: number;
}

export interface GameState {
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

// Object pools to reduce memory allocation
const explosionPool: GameObject[] = [];
let activeExplosions = 0;

// Create explosion with object pooling
export function createExplosion(x: number, y: number, size: number): GameObject | null {
  // Count current explosions
  const currentExplosionCount = activeExplosions;
  
  // Skip creating new explosions if we've hit the limit
  if (currentExplosionCount >= PERFORMANCE.MAX_ACTIVE_EXPLOSIONS) {
    return null;
  }
  
  // Make explosions smaller during low performance
  if (isLowPerformance) {
    size = Math.min(size, 12);
  }
  
  // Reuse an existing explosion or create a new one
  let explosion: GameObject;
  
  if (explosionPool.length > 0) {
    explosion = explosionPool.pop()!;
    explosion.x = x;
    explosion.y = y;
    explosion.size = size;
    explosion.hp = PERFORMANCE.EXPLOSION_DURATION;
  } else {
    explosion = {
      id: Date.now() + Math.random(),
      x, y,
      vx: 0, vy: 0,
      size,
      hp: PERFORMANCE.EXPLOSION_DURATION,
      type: 'explosion'
    };
  }
  
  activeExplosions++;
  return explosion;
}

// Recycle explosion when it's done
function recycleExplosion(explosion: GameObject) {
  // Limit pool size to prevent memory issues
  if (explosionPool.length < 30) {
    explosionPool.push(explosion);
  }
  activeExplosions--;
}

/**
 * Process all game objects and handle collisions
 * @param state Current game state
 * @param canvas Canvas element
 * @param difficulty Game difficulty multiplier
 * @returns Updated objects, obelisk damage, and score increase
 */
export function processGameObjects(
  state: GameState, 
  canvas: HTMLCanvasElement,
  difficulty: number
) {
  // Track performance
  const now = performance.now();
  if (lastFrameTime > 0) {
    // Track last 10 frame times
    frameTimes.push(now - lastFrameTime);
    if (frameTimes.length > 10) frameTimes.shift();
    
    // Calculate average frame time
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
    
    // If frame time is too high, we're in low performance mode
    isLowPerformance = avgFrameTime > 33; // 30fps threshold
  }
  lastFrameTime = now;
  frameCounter++;
  
  const updatedObjects: GameObject[] = [];
  const objectsToRemove = new Set<number>();
  let obeliskDamage = 0;
  let scoreIncrease = 0; // Only increases with enemy kills
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const obeliskRadius = 30;
  
  // Count current objects
  const currentTime = Date.now();
  const explosionCount = state.objects.filter(obj => obj.type === 'explosion').length;
  const enemyCount = state.objects.filter(obj => obj.type === 'enemy').length;
  const totalObjectCount = state.objects.length;
  
  // Ensure minimum number of enemies
  if (enemyCount < PERFORMANCE.MIN_ENEMIES && !isLowPerformance) {
    // Spawn new enemy immediately
    const newEnemy = createRandomEnemy(
      canvas.width, 
      canvas.height, 
      difficulty,
      canvas.width / 2,
      canvas.height / 2
    );
    updatedObjects.push(newEnemy);
    console.log(`Spawned new enemy to maintain minimum: ${newEnemy.id}`);
  }
  
  // Periodically check for and remove any "stuck" enemies with <= 0 HP
  if (currentTime - lastEnemyCleanupCheck > 2000) {
    const deadEnemies = state.objects.filter(obj => obj.type === 'enemy' && obj.hp <= 0);
    deadEnemies.forEach(enemy => objectsToRemove.add(enemy.id));
    lastEnemyCleanupCheck = currentTime;
  }
  
  // Check special ammo refill
  if (currentTime - lastSpecialAmmoRefill > PERFORMANCE.SPECIAL_AMMO_REFILL_TIME) {
    // Refill special ammo if below max
    if (state.player.specialAmmo < 3) {
      state.player.specialAmmo++;
      lastSpecialAmmoRefill = currentTime;
    }
  }

  // Process all objects
  for (let i = 0; i < state.objects.length; i++) {
    const obj = state.objects[i];
    
    // Skip if already marked for removal
    if (objectsToRemove.has(obj.id)) continue;
    
    // Handle different object types
    if (obj.type === 'explosion') {
      // Reduce size/hp over time
      const degradeRate = isLowPerformance ? 2 : 1;
      obj.hp -= degradeRate;
      
      // Remove if expired
      if (obj.hp <= 0) {
        recycleExplosion(obj);
        objectsToRemove.add(obj.id);
        continue;
      }
      
      // Adjust size based on remaining hp
      obj.size = obj.size * (obj.hp / PERFORMANCE.EXPLOSION_DURATION);
      
      updatedObjects.push(obj);
    } else if (obj.type === 'enemy') {
      // Always update enemy behavior to ensure visibility and correct movement
      updateEnemy(
        obj, 
        1/60,
        centerX, 
        centerY, 
        state.player.x, 
        state.player.y, 
        difficulty,
        canvas.width,  // Pass canvas width
        canvas.height  // Pass canvas height
      );
      
      // Skip dead enemies
      if (obj.hp <= 0) {
        objectsToRemove.add(obj.id);
        continue;
      }
      
      // Update position
      obj.x += obj.vx;
      obj.y += obj.vy;
      
      // Check for collision with obelisk
      const dx = obj.x - centerX;
      const dy = obj.y - centerY;
      const distanceSquared = dx * dx + dy * dy;
      const collisionRadiusSquared = Math.pow(obeliskRadius + obj.size, 2);
      
      if (distanceSquared < collisionRadiusSquared) {
        // Shield reduces damage
        const shieldReduction = obj.special?.shielded ? 0.5 : 1;
        obeliskDamage += 10 * shieldReduction;
        
        // Create explosion
        const explosion = createExplosion(obj.x, obj.y, obj.size * 1.5);
        if (explosion) {
          updatedObjects.push(explosion);
        }
        
        // Add score for destroying enemy
        scoreIncrease += 5 * difficulty;
        
        // Force HP to 0 and remove
        obj.hp = 0;
        objectsToRemove.add(obj.id);
        console.log(`Enemy removed after collision with obelisk: ${obj.id}`);
        continue;
      }
      
      // Check for collision with player
      const playerDx = obj.x - state.player.x;
      const playerDy = obj.y - state.player.y;
      const playerDistanceSquared = playerDx * playerDx + playerDy * playerDy;
      const playerCollisionRadiusSquared = Math.pow(obj.size + state.player.size, 2);
      
      if (playerDistanceSquared < playerCollisionRadiusSquared) {
        obeliskDamage += 5;
        
        // Create explosion
        const explosion = createExplosion(obj.x, obj.y, obj.size * 1.5);
        if (explosion) {
          updatedObjects.push(explosion);
        }
        
        // Add score for destroying enemy
        scoreIncrease += 5 * difficulty;
        
        // Force HP to 0 and remove
        obj.hp = 0;
        objectsToRemove.add(obj.id);
        console.log(`Enemy removed after collision with player: ${obj.id}`);
        continue;
      }
      
      // Check if the enemy is offscreen
      const buffer = 120;
      if (
        obj.x < -buffer || 
        obj.x > canvas.width + buffer || 
        obj.y < -buffer || 
        obj.y > canvas.height + buffer
      ) {
        // Less teleporting during low performance
        if (!isLowPerformance && Math.random() < 0.3) {
          // Teleport to a random spawn point
          const side = Math.floor(Math.random() * 4);
          switch (side) {
            case 0: // top
              obj.x = Math.random() * canvas.width;
              obj.y = -50;
              break;
            case 1: // right
              obj.x = canvas.width + 50;
              obj.y = Math.random() * canvas.height;
              break;
            case 2: // bottom
              obj.x = Math.random() * canvas.width;
              obj.y = canvas.height + 50;
              break;
            case 3: // left
              obj.x = -50;
              obj.y = Math.random() * canvas.height;
              break;
          }
          
          // Reset velocity to head toward center
          const dx = centerX - obj.x;
          const dy = centerY - obj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          const speed = Math.sqrt(obj.vx * obj.vx + obj.vy * obj.vy);
          obj.vx = (dx / dist) * speed * 0.8;
          obj.vy = (dy / dist) * speed * 0.8;
          
          updatedObjects.push(obj);
        } else {
          objectsToRemove.add(obj.id);
          continue;
        }
      } else {
        updatedObjects.push(obj);
      }
    } else if (obj.type === 'player-bullet') {
      // Update bullet position
      obj.x += obj.vx;
      obj.y += obj.vy;
      
      let hitEnemy = false;
      
      // Check for collisions with enemies
      for (const enemy of state.objects) {
        if (enemy.type !== 'enemy' || objectsToRemove.has(enemy.id) || enemy.hp <= 0) continue;
        
        const dx = enemy.x - obj.x;
        const dy = enemy.y - obj.y;
        const distanceSquared = dx * dx + dy * dy;
        const collisionRadiusSquared = Math.pow(obj.size + enemy.size, 2);
        
        if (distanceSquared < collisionRadiusSquared) {
          // Shielded enemies take reduced damage
          const damageReduction = enemy.special?.shielded ? 0.5 : 1;
          
          // Hit an enemy
          enemy.hp -= Math.ceil(obj.hp * damageReduction);
          hitEnemy = true;
          
          if (enemy.hp <= 0) {
            // Enemy destroyed - ONLY add score when enemies are killed
            scoreIncrease += 10 * difficulty;
            
            // Bonus points for special enemies
            if (enemy.subType && enemy.subType !== 'basic') {
              scoreIncrease += 5 * difficulty;
            }
            
            // Force HP to 0 to ensure it's counted as dead
            enemy.hp = 0;
            
            // Create explosion
            const explosion = createExplosion(enemy.x, enemy.y, enemy.size * 1.5);
            if (explosion) {
              updatedObjects.push(explosion);
            }
            
            // CRITICAL FIX - Make absolutely sure this enemy is removed
            objectsToRemove.add(enemy.id);
            console.log(`Enemy destroyed by bullet: ${enemy.id}`);
            
            // Area damage for special bullets
            if (obj.size > 5 && !PERFORMANCE.DISABLE_AREA_DAMAGE) {
              // Find nearby enemies
              const areaDamageRadius = enemy.size * 3;
              const areaDamageRadiusSquared = areaDamageRadius * areaDamageRadius;
              const nearbyEnemies: {enemy: GameObject, distSquared: number}[] = [];
              
              // Get nearby enemies
              for (const nearbyEnemy of state.objects) {
                if (nearbyEnemy.type !== 'enemy' || 
                    objectsToRemove.has(nearbyEnemy.id) || 
                    nearbyEnemy.id === enemy.id ||
                    nearbyEnemy.hp <= 0) continue;
                
                // Quick distance check
                const nearbyDx = nearbyEnemy.x - enemy.x;
                const nearbyDy = nearbyEnemy.y - enemy.y;
                const nearbyDistSquared = nearbyDx * nearbyDx + nearbyDy * nearbyDy;
                
                if (nearbyDistSquared < areaDamageRadiusSquared) {
                  nearbyEnemies.push({
                    enemy: nearbyEnemy,
                    distSquared: nearbyDistSquared
                  });
                }
              }
              
              // Limit number of enemies affected in heavy load
              const enemiesToProcess = isLowPerformance
                ? nearbyEnemies.slice(0, PERFORMANCE.MAX_SIMULTANEOUS_HITS)
                : nearbyEnemies;
              
              // Apply damage to nearby enemies
              for (const {enemy: nearbyEnemy, distSquared} of enemiesToProcess) {
                // Calculate damage based on distance
                const distance = Math.sqrt(distSquared);
                const damage = Math.ceil(3 * (1 - distance / areaDamageRadius));
                
                if (damage > 0) {
                  nearbyEnemy.hp -= damage;
                  
                  if (nearbyEnemy.hp <= 0) {
                    // ONLY add score when enemies are killed
                    scoreIncrease += 5 * difficulty;
                    
                    // Force HP to 0
                    nearbyEnemy.hp = 0;
                    objectsToRemove.add(nearbyEnemy.id);
                    console.log(`Nearby enemy destroyed by area damage: ${nearbyEnemy.id}`);
                    
                    // Create small explosion for nearby enemies
                    const smallExplosion = createExplosion(
                      nearbyEnemy.x, 
                      nearbyEnemy.y, 
                      nearbyEnemy.size
                    );
                    
                    if (smallExplosion) {
                      updatedObjects.push(smallExplosion);
                    }
                  }
                }
              }
            }
          }
          
          // Remove bullet after hit
          objectsToRemove.add(obj.id);
          break;
        }
      }
      
      // Skip further processing if hit an enemy
      if (hitEnemy) continue;
      
      // Check if bullet is off screen
      if (
        obj.x < 0 || 
        obj.x > canvas.width || 
        obj.y < 0 || 
        obj.y > canvas.height
      ) {
        objectsToRemove.add(obj.id);
        continue;
      }
      
      updatedObjects.push(obj);
    }
  }
  
  // Check if it's time to spawn a new enemy - use more aggressive timing
  if (currentTime - lastEnemySpawnTime > PERFORMANCE.SPAWN_RATE) {
    // Spawn a new enemy and add to game state
    const newEnemy = createRandomEnemy(
      canvas.width, 
      canvas.height, 
      difficulty,
      canvas.width / 2,
      canvas.height / 2
    );
    
    updatedObjects.push(newEnemy);
    lastEnemySpawnTime = currentTime;
    console.log(`Regular enemy spawn: ${newEnemy.id}`);
  }
  
  // Ensure objects marked for removal are REALLY removed
  const finalObjects: GameObject[] = [];
  for (const obj of state.objects) {
    if (!objectsToRemove.has(obj.id)) {
      // Extra check - if it's an enemy with 0 or less HP, don't keep it
      if (obj.type === 'enemy' && obj.hp <= 0) {
        continue; // Skip this enemy
      }
      
      // For objects we're keeping, make sure they're only added once
      if (!finalObjects.some(o => o.id === obj.id)) {
        finalObjects.push(obj);
      }
    }
  }

  // Add all the new objects we created during this update
  for (const obj of updatedObjects) {
    if (!objectsToRemove.has(obj.id) && !finalObjects.some(o => o.id === obj.id)) {
      finalObjects.push(obj);
    }
  }
  
  return { 
    updatedObjects: finalObjects,
    obeliskDamage, 
    scoreIncrease // ONLY returning score from enemy kills, not time-based
  };
}

/**
 * Fire a bullet from the player
 * @param state Current game state
 * @param type Type of bullet to fire
 * @returns New bullet and updated player state
 */
export function fireBullet(
  state: GameState,
  type: 'regular' | 'special'
) {
  const { player, mouseX, mouseY } = state;
  
  // Calculate direction to mouse cursor
  const dx = mouseX - player.x;
  const dy = mouseY - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { newBullet: null, updatedPlayer: player }; // Avoid division by zero
  
  // Normalize direction and set velocity
  const bulletSpeed = type === 'regular' ? 8 : 5;
  const vx = (dx / distance) * bulletSpeed;
  const vy = (dy / distance) * bulletSpeed;
  
  // Create bullet
  const newBullet: GameObject = {
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
  
  // Update last fire time and special ammo if needed
  const updatedPlayer = {
    ...player,
    lastFireTime: Date.now(),
    specialAmmo: type === 'special' ? player.specialAmmo - 1 : player.specialAmmo
  };
  
  return { newBullet, updatedPlayer };
}

/**
 * Render the game to the canvas
 * @param ctx Canvas rendering context
 * @param state Current game state
 * @param canvas Canvas element
 */
export function renderGame(
  ctx: CanvasRenderingContext2D, 
  state: GameState,
  canvas: HTMLCanvasElement
) {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw space background
  ctx.fillStyle = '#000022';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw obelisk
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  drawObelisk(ctx, centerX, centerY, state.obeliskHealth);
  
  // Set rendering quality based on load
  const explosionCount = state.objects.filter(obj => obj.type === 'explosion').length;
  const lowQuality = isLowPerformance || explosionCount > PERFORMANCE.FRAME_SKIP_THRESHOLD || PERFORMANCE.SKIP_FANCY_RENDERING;
  
  // Draw game objects
  for (const obj of state.objects) {
    // Skip rendering dead enemies
    if (obj.type === 'enemy' && obj.hp <= 0) continue;
    
    if (obj.type === 'enemy') {
      renderEnemy(ctx, obj);
    } else if (obj.type === 'explosion') {
      drawExplosion(ctx, obj, lowQuality);
    } else if (obj.type === 'player-bullet') {
      drawBullet(ctx, obj, lowQuality);
    }
  }
  
  // Draw player
  drawPlayer(ctx, state.player);
  
  // Draw HUD
  drawHUD(ctx, state, canvas);
}

/**
 * Draw the obelisk (tower) in the center
 * @param ctx Canvas rendering context
 * @param x X coordinate
 * @param y Y coordinate
 * @param health Obelisk health (0-100)
 */
function drawObelisk(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  health: number
) {
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
}

/**
 * Draw the player ship
 * @param ctx Canvas rendering context
 * @param player Player ship data
 */
function drawPlayer(
  ctx: CanvasRenderingContext2D, 
  player: PlayerShip
) {
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
}

/**
 * Draw bullets
 * @param ctx Canvas rendering context
 * @param bullet Bullet object
 * @param lowQuality Use simplified rendering for performance
 */
function drawBullet(
  ctx: CanvasRenderingContext2D, 
  bullet: GameObject,
  lowQuality: boolean = false
) {
  ctx.beginPath();
  ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
  ctx.fillStyle = bullet.color || '#60A5FA'; // Blue-400 by default
  ctx.fill();
  
  // Add glow effect for special bullets
  if (bullet.size > 5 && !lowQuality) {
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
}

/**
 * Draw explosion effects
 * @param ctx Canvas rendering context
 * @param explosion Explosion object
 * @param lowQuality Use simplified rendering for performance
 */
function drawExplosion(
  ctx: CanvasRenderingContext2D, 
  explosion: GameObject,
  lowQuality: boolean = false
) {
  ctx.beginPath();
  ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
  
  if (lowQuality) {
    // Simplified rendering for better performance
    ctx.fillStyle = '#F97316'; // Orange-500
    ctx.fill();
  } else {
    // Full quality rendering with gradient
    const gradient = ctx.createRadialGradient(
      explosion.x, explosion.y, 0,
      explosion.x, explosion.y, explosion.size
    );
    gradient.addColorStop(0, '#F59E0B'); // Amber-500
    gradient.addColorStop(0.7, '#F97316'); // Orange-500
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)'); // Transparent Red-500
    
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

/**
 * Draw HUD (score, level, etc.)
 * @param ctx Canvas rendering context
 * @param state Game state
 * @param canvas Canvas element
 */
function drawHUD(
  ctx: CanvasRenderingContext2D, 
  state: GameState,
  canvas: HTMLCanvasElement
) {
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
  
  // Debug info
  if (false) { // Set to true for debugging
    ctx.fillText(`Enemies: ${state.objects.filter(o => o.type === 'enemy').length}`, 20, 120);
    ctx.fillText(`Total Objects: ${state.objects.length}`, 20, 150);
  }
  
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
}