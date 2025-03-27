import { GameObject, GameState } from './gameRenderer';

// Powerup types
export type PowerupType = 'shield' | 'rapidFire' | 'infiniteSpecial' | 'healthPack';

// Powerup visual properties
const powerupColors = {
  shield: '#38BDF8', // Sky-400
  rapidFire: '#4ADE80', // Green-400
  infiniteSpecial: '#A78BFA', // Purple-400
  healthPack: '#FB7185', // Rose-400
};

const powerupIcons = {
  shield: '🛡️',
  rapidFire: '🔥',
  infiniteSpecial: '⚡',
  healthPack: '❤️',
};

// Powerup duration in milliseconds (except healthPack which is instant)
export const powerupDurations = {
  shield: 10000,      // 10 seconds
  rapidFire: 8000,    // 8 seconds
  infiniteSpecial: 5000, // 5 seconds
  healthPack: 0,      // Instant effect
};

// Chance weights for different powerup types
const powerupWeights = {
  shield: 15,
  rapidFire: 25,
  infiniteSpecial: 15,
  healthPack: 45,
};

// Active effects interface
export interface ActiveEffects {
  shield?: { active: boolean; startTime: number; endTime: number };
  rapidFire?: { active: boolean; startTime: number; endTime: number; originalFireRate: number };
  infiniteSpecial?: { active: boolean; startTime: number; endTime: number; originalAmmo: number };
}

/**
 * Select a random powerup type
 * @returns Selected powerup type
 */
export function selectRandomPowerupType(): PowerupType {
  // Calculate total weight
  const totalWeight = Object.values(powerupWeights).reduce((a, b) => a + b, 0);
  
  // Pick a random value
  let random = Math.random() * totalWeight;
  
  // Find which type this corresponds to
  for (const [type, weight] of Object.entries(powerupWeights)) {
    random -= weight;
    if (random <= 0) {
      return type as PowerupType;
    }
  }
  
  return 'healthPack'; // Default fallback
}

/**
 * Create a powerup at the given position
 * @param x X coordinate
 * @param y Y coordinate
 * @param type Powerup type (or random if not provided)
 * @returns The created powerup object
 */
export function createPowerup(x: number, y: number, type?: PowerupType): GameObject {
  const powerupType = type || selectRandomPowerupType();
  
  return {
    id: Date.now() + Math.random(),
    x,
    y,
    vx: 0,
    vy: 0.2, // Slower falling speed (was 0.5)
    size: 20, // Larger size (was 15)
    hp: 1,
    type: 'powerup',
    subType: powerupType,
    color: powerupColors[powerupType],
    icon: powerupIcons[powerupType],
    duration: powerupDurations[powerupType],
    createdAt: Date.now()
  };
}

/**
 * Apply powerup effect
 * @param powerup Powerup object
 * @param gameState Current game state
 * @param activeEffects Current active effects
 * @returns Updated game state and active effects
 */
export function applyPowerup(
  powerup: GameObject, 
  gameState: GameState, 
  activeEffects: ActiveEffects
): { gameState: GameState; activeEffects: ActiveEffects } {
  if (powerup.type !== 'powerup' || !powerup.subType) return { gameState, activeEffects };
  
  const type = powerup.subType as PowerupType;
  const newActiveEffects = { ...activeEffects };
  let updatedGameState = { ...gameState };
  
  switch (type) {
    case 'shield':
      // Add shield effect
      newActiveEffects.shield = {
        active: true,
        startTime: Date.now(),
        endTime: Date.now() + powerupDurations.shield
      };
      break;
      
    case 'rapidFire':
      // Add rapid fire effect
      newActiveEffects.rapidFire = {
        active: true,
        startTime: Date.now(),
        endTime: Date.now() + powerupDurations.rapidFire,
        originalFireRate: gameState.player.fireRate
      };
      
      // Update player fire rate (75% reduction)
      updatedGameState.player = {
        ...updatedGameState.player,
        fireRate: Math.round(updatedGameState.player.fireRate * 0.25)
      };
      break;
      
    case 'infiniteSpecial':
      // Add infinite special ammo effect
      newActiveEffects.infiniteSpecial = {
        active: true,
        startTime: Date.now(),
        endTime: Date.now() + powerupDurations.infiniteSpecial,
        originalAmmo: gameState.player.specialAmmo
      };
      break;
      
    case 'healthPack':
      // Instant health recovery (30% of max health)
      const healthRecovery = 30;
      updatedGameState.obeliskHealth = Math.min(100, updatedGameState.obeliskHealth + healthRecovery);
      break;
  }
  
  return { gameState: updatedGameState, activeEffects: newActiveEffects };
}

/**
 * Render a powerup
 * @param ctx Canvas rendering context
 * @param powerup Powerup object
 */
export function renderPowerup(ctx: CanvasRenderingContext2D, powerup: GameObject): void {
  if (powerup.type !== 'powerup') return;
  
  const time = Date.now();
  
  // Floating animation
  const floatOffset = Math.sin(time / 500) * 5;
  const renderY = powerup.y + floatOffset;
  
  // Pulse animation
  const pulseSize = 1 + Math.sin(time / 200) * 0.2;
  const baseSize = powerup.size * pulseSize;
  
  // Outer glow
  const gradient = ctx.createRadialGradient(
    powerup.x, renderY, baseSize * 0.5,
    powerup.x, renderY, baseSize * 2
  );
  gradient.addColorStop(0, powerup.color || '#60A5FA');
  gradient.addColorStop(0.5, `${powerup.color}40` || '#60A5FA40');
  gradient.addColorStop(1, 'transparent');
  
  ctx.beginPath();
  ctx.arc(powerup.x, renderY, baseSize * 2, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Inner circle
  ctx.beginPath();
  ctx.arc(powerup.x, renderY, baseSize, 0, Math.PI * 2);
  ctx.fillStyle = powerup.color || '#60A5FA';
  ctx.fill();
  
  // Rotating ring
  const rotationAngle = (time / 1000) % (Math.PI * 2);
  ctx.beginPath();
  ctx.arc(powerup.x, renderY, baseSize * 1.3, rotationAngle, rotationAngle + Math.PI * 1.5);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Icon
  if (powerup.icon) {
    ctx.save();
    ctx.translate(powerup.x, renderY);
    ctx.scale(pulseSize, pulseSize);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(powerup.icon, 0, 0);
    ctx.restore();
  }
}
