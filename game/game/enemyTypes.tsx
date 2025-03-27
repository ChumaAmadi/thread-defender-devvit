import { GameObject } from './gameRenderer';

// Enemy types with different behaviors
export type EnemyType = 'basic' | 'fast' | 'tank' | 'hunter' | 'bomber' | 'sniper' | 'teleporter' | 'shielded';

// Enemy behavior types
export type EnemyBehavior = 'direct' | 'circling' | 'swooping' | 'erratic' | 'ambush' | 'defensive';

// Add type definition at the top of the file
interface EnemyProperties {
  sizeMult: number;
  speedMult: number;
  hpMult: number;
  targetPlayer?: boolean;
  teleports?: boolean;
  teleportCooldown?: number;
  shielded?: boolean;
}

// Color schemes for different enemy types
const enemyColors = {
  basic: '#EF4444', // Red-500
  fast: '#F97316', // Orange-500
  tank: '#6366F1', // Indigo-500
  hunter: '#EC4899', // Pink-500
  bomber: '#10B981', // Emerald-500
  sniper: '#8B5CF6', // Violet-500
  teleporter: '#3B82F6', // Blue-500
  shielded: '#A3A3A3', // Gray-400
};

// Properties for different enemy types
const enemyProps: Record<EnemyType, EnemyProperties> = {
  basic: {
    sizeMult: 1.0,
    speedMult: 1.0,
    hpMult: 1.0,
  },
  fast: {
    sizeMult: 0.7,
    speedMult: 1.8,
    hpMult: 0.6,
  },
  tank: {
    sizeMult: 1.5,
    speedMult: 0.7,
    hpMult: 2.5,
  },
  hunter: {
    sizeMult: 0.9,
    speedMult: 1.3,
    hpMult: 1.2,
    targetPlayer: true,
  },
  bomber: {
    sizeMult: 1.2,
    speedMult: 0.8,
    hpMult: 1.3,
  },
  sniper: {
    sizeMult: 0.8,
    speedMult: 0.9,
    hpMult: 0.7,
  },
  teleporter: {
    sizeMult: 0.85,
    speedMult: 1.2,
    hpMult: 0.9,
    teleports: true,
    teleportCooldown: 3000,
  },
  shielded: {
    sizeMult: 1.1,
    speedMult: 0.9,
    hpMult: 1.8,
    shielded: true,
  },
};

// Chance weights for spawning each enemy type (adjusted by difficulty)
const enemySpawnWeights = {
  basic: { base: 100, perDifficulty: -5 }, // Less common at higher difficulties
  fast: { base: 30, perDifficulty: 5 },
  tank: { base: 20, perDifficulty: 5 },
  hunter: { base: 10, perDifficulty: 7 },
  bomber: { base: 5, perDifficulty: 6 },
  sniper: { base: 0, perDifficulty: 3 },
  teleporter: { base: 0, perDifficulty: 4 },
  shielded: { base: 0, perDifficulty: 6 },
};

// Behavior weights (chance of each behavior type)
const behaviorWeights = {
  direct: { base: 100, perDifficulty: -5 },
  circling: { base: 20, perDifficulty: 5 },
  swooping: { base: 10, perDifficulty: 5 },
  erratic: { base: 5, perDifficulty: 3 },
  ambush: { base: 0, perDifficulty: 4 },
  defensive: { base: 0, perDifficulty: 3 },
};

/**
 * Determine which enemy types are available based on level
 * @param level Game level (wave number)
 * @returns Array of available enemy types for this level
 */
export function getAvailableEnemyTypes(level: number): EnemyType[] {
  // Base enemy types available from level 1
  const availableTypes: EnemyType[] = ['basic'];
  
  // Gradually introduce more complex enemy types as levels increase
  if (level >= 2) availableTypes.push('fast');
  if (level >= 3) availableTypes.push('tank');
  if (level >= 4) availableTypes.push('hunter');
  if (level >= 5) availableTypes.push('bomber');
  if (level >= 7) availableTypes.push('sniper');
  if (level >= 9) availableTypes.push('teleporter');
  if (level >= 11) availableTypes.push('shielded');
  
  return availableTypes;
}

/**
 * Select a random enemy type based on difficulty and level
 * @param difficulty Game difficulty level (1-10)
 * @param level Game level (wave number)
 * @returns The selected enemy type
 */
export function selectRandomEnemyType(difficulty: number, level: number = 1): EnemyType {
  // Get enemy types available at this level
  const availableTypes = getAvailableEnemyTypes(level);
  
  // Calculate weights adjusted for difficulty
  const adjustedWeights: Record<EnemyType, number> = {} as Record<EnemyType, number>;
  
  // Calculate total weight
  let totalWeight = 0;
  
  // Only consider weights for available enemy types
  for (const type of availableTypes) {
    const weights = enemySpawnWeights[type];
    const adjustedWeight = Math.max(0, weights.base + weights.perDifficulty * difficulty);
    adjustedWeights[type] = adjustedWeight;
    totalWeight += adjustedWeight;
  }
  
  // Pick a random value between 0 and total weight
  let random = Math.random() * totalWeight;
  
  // Find which enemy type this value corresponds to
  for (const [type, weight] of Object.entries(adjustedWeights)) {
    random -= weight;
    if (random <= 0) {
      return type as EnemyType;
    }
  }
  
  // Default fallback
  return availableTypes[0]; // Return the first available type as fallback
}

/**
 * Select a random behavior type based on difficulty
 * @param difficulty Game difficulty level (1-10)
 * @returns The selected behavior type
 */
export function selectRandomBehavior(difficulty: number): EnemyBehavior {
  // Calculate weights adjusted for difficulty
  const adjustedWeights: Record<EnemyBehavior, number> = {} as Record<EnemyBehavior, number>;
  
  // Calculate total weight
  let totalWeight = 0;
  
  for (const [behavior, weights] of Object.entries(behaviorWeights)) {
    const adjustedWeight = Math.max(0, weights.base + weights.perDifficulty * difficulty);
    adjustedWeights[behavior as EnemyBehavior] = adjustedWeight;
    totalWeight += adjustedWeight;
  }
  
  // Pick a random value between 0 and total weight
  let random = Math.random() * totalWeight;
  
  // Find which behavior type this value corresponds to
  for (const [behavior, weight] of Object.entries(adjustedWeights)) {
    random -= weight;
    if (random <= 0) {
      return behavior as EnemyBehavior;
    }
  }
  
  // Default fallback
  return 'direct';
}

/**
 * Create a random enemy from outside the screen
 * @param canvasWidth Width of the game canvas
 * @param canvasHeight Height of the game canvas
 * @param difficulty Game difficulty level (1-10)
 * @param centerX X coordinate of the center (obelisk)
 * @param centerY Y coordinate of the center (obelisk)
 * @param level Game level (wave number)
 * @returns The created enemy object
 */
export function createRandomEnemy(
  canvasWidth: number, 
  canvasHeight: number, 
  difficulty: number,
  centerX: number = canvasWidth / 2,
  centerY: number = canvasHeight / 2,
  level: number = 1
): GameObject {
  // Calculate level speed multiplier (very subtle increase - just 1% per level, capped at 10%)
  const levelSpeedMultiplier = 1 + (Math.min(level - 1, 10) * 0.01); // Max 10% increase at level 11+
  
  // Select random enemy type and behavior based on difficulty and level
  const enemyType = selectRandomEnemyType(difficulty, level);
  const behavior = selectRandomBehavior(difficulty);
  
  // Get properties for this enemy type
  const props = enemyProps[enemyType];
  
  // Decide which side the enemy will spawn from
  const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
  
  let x, y;
  const buffer = 100; // Increased buffer to ensure enemies spawn fully outside the screen
  
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
  const dx = centerX - x;
  const dy = centerY - y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Normalize direction and set velocity with very minimal level-based speed scaling
  const baseSpeed = (1 + (difficulty * 0.2)) * levelSpeedMultiplier;
  const speedVariation = Math.random() * 0.3 + 0.85; // 0.85 to 1.15
  const speed = baseSpeed * speedVariation * props.speedMult;
  
  // Default velocities (direct path to obelisk)
  let vx = (dx / distance) * speed;
  let vy = (dy / distance) * speed;
  
  // Ensure minimum velocity component to prevent getting stuck
  const minVelocityComponent = 0.1 * speed;
  if (Math.abs(vx) < minVelocityComponent) {
    vx = vx >= 0 ? minVelocityComponent : -minVelocityComponent;
  }
  if (Math.abs(vy) < minVelocityComponent) {
    vy = vy >= 0 ? minVelocityComponent : -minVelocityComponent;
  }
  
  // Adjust velocity based on behavior
  switch (behavior) {
    case 'circling':
      // Add perpendicular component to create circular motion
      vx += -dy / distance * speed * 0.7;
      vy += dx / distance * speed * 0.7;
      break;
      
    case 'swooping':
      // Curve toward obelisk but with initial tangential velocity
      vx = (dx / distance) * speed * 0.5 + (Math.random() - 0.5) * speed;
      vy = (dy / distance) * speed * 0.5 + (Math.random() - 0.5) * speed;
      break;
      
    case 'erratic':
      // Move in a somewhat random direction
      vx = (dx / distance) * speed * 0.7 + (Math.random() - 0.5) * speed * 1.5;
      vy = (dy / distance) * speed * 0.7 + (Math.random() - 0.5) * speed * 1.5;
      break;
      
    case 'ambush':
      // Start slow, will accelerate later
      vx = (dx / distance) * speed * 0.3;
      vy = (dy / distance) * speed * 0.3;
      break;
      
    case 'defensive':
      // Circle around but don't approach directly
      vx = -dy / distance * speed * 1.2;
      vy = dx / distance * speed * 1.2;
      break;
  }
  
  // Set size based on difficulty and type
  const baseSize = 8 + Math.random() * 8; // 8-16
  const sizeMultiplier = 1 + (difficulty * 0.1); // 1.1 - 2.0
  const size = baseSize * sizeMultiplier * props.sizeMult;
  
  // HP based on size, type, and difficulty (scale with level but not too quickly)
  const levelHpMultiplier = 1 + (Math.min(level - 1, 15) * 0.03); // Up to 45% more HP at level 16+
  const baseHp = Math.ceil(size / 3);
  const hp = Math.ceil(baseHp * props.hpMult * levelHpMultiplier) + Math.floor(difficulty);
  
  // Create special properties
  const special: any = {};
  
  if (props.targetPlayer) {
    special.targetPlayer = true;
  }
  
  if (props.teleports) {
    special.teleports = true;
    special.teleportCooldown = props.teleportCooldown || 3000;
    special.lastTeleport = Date.now();
  }
  
  if (props.shielded) {
    special.shielded = true;
  }
  
  // Create enemy object
  return {
    id: Date.now() + Math.random(),
    x,
    y,
    vx,
    vy,
    size,
    hp,
    type: 'enemy',
    subType: enemyType,
    behavior,
    color: enemyColors[enemyType],
    spawnTime: Date.now(),
    icon: '👾',
    special
  };
}

/**
 * Update enemy position and behavior
 * @param enemy The enemy to update
 * @param deltaTime Time since last update in seconds
 * @param centerX X coordinate of obelisk
 * @param centerY Y coordinate of obelisk
 * @param playerX X coordinate of player
 * @param playerY Y coordinate of player
 * @param difficulty Game difficulty
 * @param canvasWidth Width of the game canvas
 * @param canvasHeight Height of the game canvas
 */
export function updateEnemy(
  enemy: GameObject, 
  deltaTime: number,
  centerX: number,
  centerY: number,
  playerX: number,
  playerY: number,
  difficulty: number,
  canvasWidth: number = 800,
  canvasHeight: number = 600
): void {
  if (enemy.type !== 'enemy') return;
  
  const now = Date.now();
  const timeSinceSpawn = now - (enemy.spawnTime || 0);
  
  // Calculate distance to obelisk
  const dxObelisk = centerX - enemy.x;
  const dyObelisk = centerY - enemy.y;
  const distanceToObelisk = Math.sqrt(dxObelisk * dxObelisk + dyObelisk * dyObelisk);
  
  // Calculate distance to player
  const dxPlayer = playerX - enemy.x;
  const dyPlayer = playerY - enemy.y;
  const distanceToPlayer = Math.sqrt(dxPlayer * dxPlayer + dyPlayer * dyPlayer);
  
  // Base attraction force to obelisk (all enemies are attracted to the obelisk)
  let attractionForce = 0.05 + (difficulty * 0.01);
  
  // Default target is obelisk
  let targetX = centerX;
  let targetY = centerY;
  
  // Special behavior for hunter type - targets player instead
  if (enemy.special?.targetPlayer && distanceToPlayer < 300) {
    targetX = playerX;
    targetY = playerY;
    attractionForce = 0.08 + (difficulty * 0.02);
  }
  
  // Store target for rendering purposes
  enemy.targetX = targetX;
  enemy.targetY = targetY;
  
  // Calculate direction to target
  const dxTarget = targetX - enemy.x;
  const dyTarget = targetY - enemy.y;
  const distanceToTarget = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);
  
  // Normalize direction vectors
  const ndxTarget = dxTarget / distanceToTarget;
  const ndyTarget = dyTarget / distanceToTarget;
  
  // Check if enemy is stuck at boundary
  const boundaryBuffer = 10;
  const isAtLeftBoundary = enemy.x <= boundaryBuffer;
  const isAtRightBoundary = enemy.x >= canvasWidth - boundaryBuffer;
  const isAtTopBoundary = enemy.y <= boundaryBuffer;
  const isAtBottomBoundary = enemy.y >= canvasHeight - boundaryBuffer;
  
  // Force correction if stuck at boundary
  if (isAtLeftBoundary || isAtRightBoundary || isAtTopBoundary || isAtBottomBoundary) {
    // Increase attraction force to push away from boundaries
    attractionForce *= 3;
    
    // Ensure minimum velocity components toward center
    if (isAtLeftBoundary && enemy.vx <= 0) {
      enemy.vx = 0.5 + (difficulty * 0.1);
    }
    if (isAtRightBoundary && enemy.vx >= 0) {
      enemy.vx = -0.5 - (difficulty * 0.1);
    }
    if (isAtTopBoundary && enemy.vy <= 0) {
      enemy.vy = 0.5 + (difficulty * 0.1);
    }
    if (isAtBottomBoundary && enemy.vy >= 0) {
      enemy.vy = -0.5 - (difficulty * 0.1);
    }
  }
  
  // Update velocity based on behavior
  switch (enemy.behavior) {
    case 'direct':
      enemy.vx += ndxTarget * attractionForce;
      enemy.vy += ndyTarget * attractionForce;
      break;
      
    case 'circling':
      // Circle around target while slowly approaching
      enemy.vx += ndxTarget * attractionForce * 0.5;
      enemy.vy += ndyTarget * attractionForce * 0.5;
      
      // Add perpendicular component
      enemy.vx += -ndyTarget * attractionForce * 2;
      enemy.vy += ndxTarget * attractionForce * 2;
      break;
      
    case 'swooping':
      // Swooping motion - curve towards target
      enemy.vx += ndxTarget * attractionForce * (0.5 + Math.sin(timeSinceSpawn / 1000) * 0.5);
      enemy.vy += ndyTarget * attractionForce * (0.5 + Math.cos(timeSinceSpawn / 1000) * 0.5);
      break;
      
    case 'erratic':
      // Random movement with occasional bursts towards target
      if (Math.random() < 0.05) {
        // Occasional burst towards target
        enemy.vx = ndxTarget * (1 + difficulty * 0.2);
        enemy.vy = ndyTarget * (1 + difficulty * 0.2);
      } else {
        // Otherwise, slight attraction plus random movement
        enemy.vx += ndxTarget * attractionForce * 0.3;
        enemy.vy += ndyTarget * attractionForce * 0.3;
        
        // Add random movement
        enemy.vx += (Math.random() - 0.5) * 0.2;
        enemy.vy += (Math.random() - 0.5) * 0.2;
      }
      break;
      
    case 'ambush':
      // Start slow, then accelerate
      const ambushThreshold = 5000 - (difficulty * 400); // Accelerate sooner at higher difficulties
      if (timeSinceSpawn > ambushThreshold || distanceToTarget < 150) {
        // Accelerate towards target
        enemy.vx += ndxTarget * attractionForce * 3;
        enemy.vy += ndyTarget * attractionForce * 3;
      } else {
        // Move slowly
        enemy.vx += ndxTarget * attractionForce * 0.2;
        enemy.vy += ndyTarget * attractionForce * 0.2;
      }
      break;
      
    case 'defensive':
      // Circle around target, approach only when at an advantage
      if (distanceToTarget < 200) {
        // Back away slightly
        enemy.vx -= ndxTarget * attractionForce;
        enemy.vy -= ndyTarget * attractionForce;
      } else if (Math.random() < 0.01 * difficulty) {
        // Occasionally charge
        enemy.vx = ndxTarget * (1.5 + difficulty * 0.1);
        enemy.vy = ndyTarget * (1.5 + difficulty * 0.1);
      } else {
        // Circle around
        enemy.vx += -ndyTarget * attractionForce * 1.5;
        enemy.vy += ndxTarget * attractionForce * 1.5;
      }
      break;
  }
  
  // Special abilities based on enemy type
  if (enemy.subType === 'teleporter' && enemy.special?.teleports) {
    const teleportCooldown = enemy.special.teleportCooldown || 3000;
    const lastTeleport = enemy.special.lastTeleport || 0;
    
    // Teleport if cooldown has passed
    if (now - lastTeleport > teleportCooldown) {
      // Random position around target
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 100;
      
      enemy.x = targetX + Math.cos(angle) * distance;
      enemy.y = targetY + Math.sin(angle) * distance;
      enemy.special.lastTeleport = now;
      
      // Add visual indication of teleport (could be handled by game logic)
      // Here we just reset velocity to create a pause
      enemy.vx = 0;
      enemy.vy = 0;
    }
  }
  
  // Cap enemy speed based on type and difficulty
  const baseMaxSpeed = 1 + (difficulty * 0.2);
  let typeMultiplier = 1;
  
  // Adjust max speed based on enemy type
  if (enemy.subType) {
    typeMultiplier = enemyProps[enemy.subType as EnemyType].speedMult;
  }
  
  const maxSpeed = baseMaxSpeed * typeMultiplier;
  
  // Calculate current speed
  const currentSpeed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
  
  // Cap speed if necessary
  if (currentSpeed > maxSpeed) {
    enemy.vx = (enemy.vx / currentSpeed) * maxSpeed;
    enemy.vy = (enemy.vy / currentSpeed) * maxSpeed;
  }
  
  // Apply drag/friction to prevent extreme speeds
  const drag = 0.02;
  enemy.vx *= (1 - drag);
  enemy.vy *= (1 - drag);
  
  // Handle screen boundary wrap-around or bounce if enemy is off-screen
  const offScreenBuffer = enemy.size * 2;
  
  // Check if enemy is completely off-screen and has been moving away from the center
  if (
    (enemy.x < -offScreenBuffer && enemy.vx < 0) ||
    (enemy.x > canvasWidth + offScreenBuffer && enemy.vx > 0) ||
    (enemy.y < -offScreenBuffer && enemy.vy < 0) ||
    (enemy.y > canvasHeight + offScreenBuffer && enemy.vy > 0)
  ) {
    // Force enemy to move back toward the center
    const centerDx = centerX - enemy.x;
    const centerDy = centerY - enemy.y;
    const centerDist = Math.sqrt(centerDx * centerDx + centerDy * centerDy);
    
    // Set velocity directly toward center
    enemy.vx = (centerDx / centerDist) * maxSpeed;
    enemy.vy = (centerDy / centerDist) * maxSpeed;
  }
}

/**
 * Render a specific enemy type
 * @param ctx Canvas rendering context
 * @param enemy The enemy to render
 */
export function renderEnemy(ctx: CanvasRenderingContext2D, enemy: GameObject): void {
  if (enemy.type !== 'enemy') return;
  
  // Skip rendering if enemy is outside the canvas (with a buffer)
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  const renderBuffer = enemy.size * 3; // Buffer zone for rendering
  
  // Early return if enemy is completely outside the rendering area
  if (
    enemy.x < -renderBuffer ||
    enemy.x > canvasWidth + renderBuffer ||
    enemy.y < -renderBuffer ||
    enemy.y > canvasHeight + renderBuffer
  ) {
    return;
  }
  
  // Base enemy rendering - circle with color based on type
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
  ctx.fillStyle = enemy.color || '#EF4444';
  ctx.fill();
  
  // Different details based on enemy subType
  switch (enemy.subType) {
    case 'basic':
      // Simple enemy - just add inner circle
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#B91C1C'; // Red-700
      ctx.fill();
      break;
      
    case 'fast':
      // Fast enemy - streaking effect
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#C2410C'; // Orange-700
      ctx.fill();
      
      // Add streaking effect
      ctx.beginPath();
      ctx.moveTo(enemy.x - enemy.vx * 5, enemy.y - enemy.vy * 5);
      ctx.lineTo(enemy.x, enemy.y);
      ctx.lineWidth = enemy.size * 0.6;
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)'; // Orange-500 with opacity
      ctx.stroke();
      break;
      
    case 'tank':
      // Tank enemy - hexagonal shape
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const x = enemy.x + Math.cos(angle) * enemy.size * 0.7;
        const y = enemy.y + Math.sin(angle) * enemy.size * 0.7;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = '#4F46E5'; // Indigo-600
      ctx.fill();
      break;
      
    case 'hunter':
      // Hunter enemy - triangle shape pointing to target
      const angle = enemy.targetX && enemy.targetY 
        ? Math.atan2(enemy.targetY - enemy.y, enemy.targetX - enemy.x) 
        : Math.atan2(enemy.vy, enemy.vx);
      
      ctx.beginPath();
      ctx.moveTo(
        enemy.x + Math.cos(angle) * enemy.size,
        enemy.y + Math.sin(angle) * enemy.size
      );
      ctx.lineTo(
        enemy.x + Math.cos(angle + 2.5) * enemy.size,
        enemy.y + Math.sin(angle + 2.5) * enemy.size
      );
      ctx.lineTo(
        enemy.x + Math.cos(angle - 2.5) * enemy.size,
        enemy.y + Math.sin(angle - 2.5) * enemy.size
      );
      ctx.closePath();
      ctx.fillStyle = '#DB2777'; // Pink-600
      ctx.fill();
      break;
      
    case 'bomber':
      // Bomber - pulsing circle that explodes
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#059669'; // Emerald-600
      ctx.fill();
      
      // Pulse effect
      const pulseSize = 0.2 * Math.sin(Date.now() / 200) + 0.8;
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size * pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = '#10B981'; // Emerald-500
      ctx.fill();
      break;
      
    case 'sniper':
      // Sniper - has a "targeting" line
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = '#7C3AED'; // Violet-600
      ctx.fill();
      // Draw targeting line
      if (enemy.targetX !== undefined && enemy.targetY !== undefined) {
        ctx.beginPath();
        ctx.moveTo(enemy.x, enemy.y);
        const targetDist = Math.sqrt(
          Math.pow(enemy.targetX - enemy.x, 2) + 
          Math.pow(enemy.targetY - enemy.y, 2)
        );
        const targetX = enemy.x + (enemy.targetX - enemy.x) / targetDist * enemy.size * 3;
        const targetY = enemy.y + (enemy.targetY - enemy.y) / targetDist * enemy.size * 3;
        
        ctx.lineTo(targetX, targetY);
        ctx.strokeStyle = '#8B5CF6'; // Violet-500
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      break;
      
    case 'teleporter':
      // Teleporter - fading in and out
      const teleportPhase = enemy.special?.lastTeleport 
        ? Math.min(1, (Date.now() - enemy.special.lastTeleport) / 500)
        : 1;
        
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size * teleportPhase, 0, Math.PI * 2);
      ctx.fillStyle = '#2563EB'; // Blue-600
      ctx.fill();
      
      // Ripple effect
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size * 1.3 * teleportPhase, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)'; // Blue-500 with opacity
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
      
    case 'shielded':
      // Shielded enemy - has a protective barrier
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = '#737373'; // Gray-500
      ctx.fill();
      
      // Shield
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.size * 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212, 212, 216, 0.7)'; // Gray-300 with opacity
      ctx.lineWidth = 3;
      ctx.stroke();
      break;
  }
  
  // Draw health bar for all enemy types if they have more than 1 HP
  if (enemy.hp > 1) {
    const healthBarWidth = enemy.size * 2;
    const healthBarHeight = 2;
    const maxHp = Math.ceil(enemy.size / 3) * 
      (enemy.subType ? enemyProps[enemy.subType as EnemyType].hpMult : 1);
    const healthPercentage = Math.max(0, enemy.hp / maxHp);
    
    // Background bar
    ctx.beginPath();
    ctx.roundRect(
      enemy.x - healthBarWidth / 2,
      enemy.y - enemy.size - 5,
      healthBarWidth,
      healthBarHeight,
      1
    );
    ctx.fillStyle = '#4B5563'; // Gray-600
    ctx.fill();
    
    // Health bar
    ctx.beginPath();
    ctx.roundRect(
      enemy.x - healthBarWidth / 2,
      enemy.y - enemy.size - 5,
      healthBarWidth * healthPercentage,
      healthBarHeight,
      1
    );
    ctx.fillStyle = enemy.color || '#EF4444'; // Use enemy color for health bar
    ctx.fill();
  }
}

export type { GameObject };
