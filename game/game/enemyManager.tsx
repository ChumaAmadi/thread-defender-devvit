import { GameObject } from './gameRenderer';
import { createRandomEnemy } from './enemyTypes';

/**
 * Spawn a random enemy
 * @param canvasWidth Canvas width
 * @param canvasHeight Canvas height
 * @param difficulty Game difficulty
 * @param centerX X coordinate of the center (obelisk)
 * @param centerY Y coordinate of the center (obelisk)
 * @param level Current game level for enemy type selection
 * @returns The created enemy object
 */
export function spawnRandomEnemy(
  canvasWidth: number,
  canvasHeight: number,
  difficulty: number,
  centerX: number = canvasWidth / 2,
  centerY: number = canvasHeight / 2,
  level: number = 1
): GameObject {
  return createRandomEnemy(
    canvasWidth,
    canvasHeight,
    difficulty,
    centerX,
    centerY,
    level
  );
}

/**
 * Spawn multiple enemies at once
 * @param canvasWidth Canvas width
 * @param canvasHeight Canvas height
 * @param count Number of enemies to spawn
 * @param difficulty Game difficulty
 * @param level Current game level for enemy type selection
 * @param addCallback Callback to add enemy to game state
 */
export function spawnEnemies(
  canvasWidth: number,
  canvasHeight: number,
  count: number,
  difficulty: number,
  level: number = 1,
  addCallback: (enemy: GameObject) => void
) {
  for (let i = 0; i < count; i++) {
    const enemy = createRandomEnemy(
      canvasWidth,
      canvasHeight,
      difficulty,
      canvasWidth / 2,
      canvasHeight / 2,
      level
    );
    addCallback(enemy);
  }
}