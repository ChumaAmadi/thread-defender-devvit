import { createRandomEnemy, GameObject } from './enemyTypes';

/**
 * Spawn multiple enemies
 * @param canvasWidth Canvas width
 * @param canvasHeight Canvas height
 * @param count Number of enemies to spawn
 * @param difficulty Game difficulty
 * @param addEnemyCallback Callback to add enemy to game state
 */
export function spawnEnemies(
  canvasWidth: number,
  canvasHeight: number,
  count: number,
  difficulty: number,
  addEnemyCallback: (enemy: GameObject) => void
) {
  console.log(`Spawning ${count} enemies with difficulty ${difficulty}`);
  
  // Space out spawns over time for a more natural appearance
  for (let i = 0; i < count; i++) {
    // Create a closure to capture the current index
    const spawn = (index: number) => {
      setTimeout(() => {
        const enemy = createRandomEnemy(
          canvasWidth, 
          canvasHeight, 
          difficulty,
          canvasWidth / 2,
          canvasHeight / 2
        );
        
        addEnemyCallback(enemy);
      }, index * 200); // Spawn every 200ms
    };
    
    spawn(i);
  }
}

/**
 * Spawn a single random enemy
 * @param canvasWidth Canvas width
 * @param canvasHeight Canvas height
 * @param difficulty Game difficulty
 * @param centerX Optional center X coordinate
 * @param centerY Optional center Y coordinate
 * @returns The created enemy
 */
export function spawnRandomEnemy(
  canvasWidth: number,
  canvasHeight: number,
  difficulty: number,
  centerX?: number,
  centerY?: number
): GameObject {
  return createRandomEnemy(
    canvasWidth,
    canvasHeight,
    difficulty,
    centerX || canvasWidth / 2,
    centerY || canvasHeight / 2
  );
}

/**
 * Calculate wave properties based on current wave and difficulty
 * @param wave Current wave number
 * @param difficulty Base difficulty level
 * @returns Wave properties
 */
export function getWaveProperties(wave: number, difficulty: number) {
  // Calculate enemy count for this wave
  const baseEnemyCount = 3 + Math.floor(wave / 2);
  const difficultyBonus = Math.floor(difficulty / 2);
  const enemyCount = baseEnemyCount + difficultyBonus;
  
  // Calculate spawn rate (ms between spawns)
  const baseSpawnRate = 2000; // 2 seconds
  const waveReduction = wave * 100; // Reduce by 100ms per wave
  const difficultyReduction = difficulty * 50; // Reduce by 50ms per difficulty level
  const spawnRate = Math.max(500, baseSpawnRate - waveReduction - difficultyReduction);
  
  // Calculate wave duration
  const baseDuration = 30000; // 30 seconds
  const waveDurationIncrease = wave * 5000; // Add 5 seconds per wave
  const waveDuration = baseDuration + waveDurationIncrease;
  
  // Calculate difficulty multiplier for this wave
  const waveMultiplier = 1 + (wave * 0.1);
  const adjustedDifficulty = Math.min(difficulty * waveMultiplier, 10);
  
  return {
    enemyCount,
    spawnRate,
    waveDuration,
    adjustedDifficulty
  };
}

/**
 * Check if wave is complete (all enemies defeated)
 * @param objects Game objects array
 * @returns True if no enemies remain
 */
export function isWaveComplete(objects: GameObject[]): boolean {
  return !objects.some(obj => obj.type === 'enemy');
}