import { Maze, Wall, Position, LaserGate } from '../types';
import { GAME } from '../config/constants';

// --- Configuration ---
const BASE_GRID_SIZE = 5; // Smallest grid size (e.g., 5x5 cells)
const GRID_INCREMENT = 1; // How many cells to add per difficulty level (e.g., difficulty 1 = 5x5, 2 = 6x6)
const CELL_SIZE = 40;     // Pixel size of each cell in the maze
const WALL_THICKNESS = 4; // Pixel thickness of walls
const MAZE_AREA_SIZE = 300; // The target playable area size (ensure CELL_SIZE * gridSize fits)

interface Cell {
  x: number;
  y: number;
  visited: boolean;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
}

// --- Helper Functions ---

// Function to check if a path exists from start to end with laser gates
function isPathPossible(grid: Cell[][], rows: number, cols: number, laserGates: LaserGate[], scale: number): boolean {
  // Convert grid coordinates to pixel coordinates
  const startRow = 0;
  const startCol = 0;
  const endRow = rows - 1;
  const endCol = cols - 1;
  const cellSizeScaled = CELL_SIZE * scale;

  // First check if there's a path without considering laser gates
  if (!hasPath(grid, startRow, startCol, endRow, endCol)) {
    return false;
  }

  // If there are no laser gates, the path is valid
  if (!laserGates || laserGates.length === 0) {
    return true;
  }

  // Check if all laser gates have off periods
  // If any laser gate is always on (onDuration = 1), the maze is unsolvable
  for (const gate of laserGates) {
    if (gate.onDuration >= 1) {
      return false;
    }
  }

  // If all laser gates have off periods, the maze is solvable
  // This is a simplification - in reality, we'd need to check timing
  // but for our purposes, as long as each laser turns off at some point,
  // the player can time their movement to get through
  return true;
}

// Basic BFS to check if there's a path from start to end
function hasPath(grid: Cell[][], startRow: number, startCol: number, endRow: number, endCol: number): boolean {
  const rows = grid.length;
  const cols = grid[0].length;

  // Create a visited array
  const visited: boolean[][] = Array(rows).fill(0).map(() => Array(cols).fill(false));

  // Queue for BFS
  const queue: [number, number][] = [[startRow, startCol]];
  visited[startRow][startCol] = true;

  // Directions: right, down, left, up
  const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;

    // Check if we reached the end
    if (row === endRow && col === endCol) {
      return true;
    }

    // Check all four directions
    for (let i = 0; i < 4; i++) {
      const newRow = row + directions[i][0];
      const newCol = col + directions[i][1];

      // Check if the new position is valid
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols && !visited[newRow][newCol]) {
        // Check if there's a wall between the current cell and the new cell
        let canMove = false;

        if (i === 0 && !grid[row][col].walls.right) canMove = true; // Right
        if (i === 1 && !grid[row][col].walls.bottom) canMove = true; // Down
        if (i === 2 && col > 0 && !grid[row][col-1].walls.right) canMove = true; // Left
        if (i === 3 && row > 0 && !grid[row-1][col].walls.bottom) canMove = true; // Up

        if (canMove) {
          visited[newRow][newCol] = true;
          queue.push([newRow, newCol]);
        }
      }
    }
  }

  // If we've exhausted all possibilities and haven't found the end, no path exists
  return false;
}

function initializeGrid(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = [];
  for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) {
      grid[y][x] = {
        x,
        y,
        visited: false,
        walls: { top: true, right: true, bottom: true, left: true },
      };
    }
  }
  return grid;
}

function getNeighbors(cell: Cell, grid: Cell[][], rows: number, cols: number): Cell[] {
  const neighbors: Cell[] = [];
  const { x, y } = cell;

  if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]); // Top
  if (x < cols - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]); // Right
  if (y < rows - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]); // Bottom
  if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]); // Left

  return neighbors;
}

function removeWall(current: Cell, next: Cell): void {
  const dx = current.x - next.x;
  const dy = current.y - next.y;

  if (dx === 1) { // Moving left
    current.walls.left = false;
    next.walls.right = false;
  } else if (dx === -1) { // Moving right
    current.walls.right = false;
    next.walls.left = false;
  }

  if (dy === 1) { // Moving up
    current.walls.top = false;
    next.walls.bottom = false;
  } else if (dy === -1) { // Moving down
    current.walls.bottom = false;
    next.walls.top = false;
  }
}

// Updated function to prevent duplicate walls
function gridToWalls(grid: Cell[][], rows: number, cols: number, scale: number): Wall[] {
    const walls: Wall[] = [];
    const wallThicknessScaled = WALL_THICKNESS * scale;
    const cellSizeScaled = CELL_SIZE * scale;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const cell = grid[y][x];
            const cellX = x * cellSizeScaled;
            const cellY = y * cellSizeScaled;

            // Always add top wall for the first row
            if (y === 0 && cell.walls.top) {
                walls.push({ x: cellX, y: cellY, width: cellSizeScaled, height: wallThicknessScaled });
            }
            // Always add left wall for the first column
            if (x === 0 && cell.walls.left) {
                walls.push({ x: cellX, y: cellY, width: wallThicknessScaled, height: cellSizeScaled });
            }

            // Add bottom wall if it exists
            if (cell.walls.bottom) {
                walls.push({
                  x: cellX,
                  y: cellY + cellSizeScaled - wallThicknessScaled,
                  width: cellSizeScaled,
                  height: wallThicknessScaled
                });
            }
            // Add right wall if it exists
            if (cell.walls.right) {
                walls.push({
                  x: cellX + cellSizeScaled - wallThicknessScaled,
                  y: cellY,
                  width: wallThicknessScaled,
                  height: cellSizeScaled
                });
            }
        }
    }
    return walls;
}


// --- Main Generator Function ---
// Note: Difficulty is capped at GAME.MAX_DIFFICULTY (currently set to 4) in GameScreen.tsx
// Higher difficulty levels create more complex mazes with larger grid sizes

export const generateMaze = (difficulty: number): Maze => {
  const gridSize = BASE_GRID_SIZE + (difficulty - 1) * GRID_INCREMENT;
  const rows = gridSize;
  const cols = gridSize;

  // Calculate scale to fit maze within MAZE_AREA_SIZE
  const totalWidth = cols * CELL_SIZE;
  const totalHeight = rows * CELL_SIZE;
  const scale = MAZE_AREA_SIZE / Math.max(totalWidth, totalHeight);

  const grid = initializeGrid(rows, cols);
  const stack: Cell[] = [];
  let currentCell = grid[0][0]; // Start at top-left
  currentCell.visited = true;
  stack.push(currentCell);

  while (stack.length > 0) {
    currentCell = stack.pop()!;
    const neighbors = getNeighbors(currentCell, grid, rows, cols);

    if (neighbors.length > 0) {
      stack.push(currentCell);
      const randomIndex = Math.floor(Math.random() * neighbors.length);
      const nextCell = neighbors[randomIndex];

      removeWall(currentCell, nextCell);
      nextCell.visited = true;
      stack.push(nextCell);
    }
  }

  // --- Generate Maze Object ---
  // Use a consistent ID format that doesn't change on every generation
  // This prevents lasers from changing position when calibrating
  const id = `endless-${difficulty}`;
  const name = `Endless Level ${difficulty}`;

  // Convert grid cells to wall coordinates, applying scale
  const walls = gridToWalls(grid, rows, cols, scale);

  // Define start and end positions (scaled)
  const startPosition: Position = {
    x: (CELL_SIZE / 2) * scale, // Center of top-left cell
    y: (CELL_SIZE / 2) * scale,
  };
  const endPosition: Position = {
    x: ((cols - 1) * CELL_SIZE + CELL_SIZE / 2) * scale, // Center of bottom-right cell
    y: ((rows - 1) * CELL_SIZE + CELL_SIZE / 2) * scale,
  };

  // Determine difficulty string
  let difficultyLevel: 'easy' | 'medium' | 'hard';
  if (difficulty <= 5) {
    difficultyLevel = 'easy';
  } else if (difficulty <= 10) {
    difficultyLevel = 'medium';
  } else {
    difficultyLevel = 'hard';
  }

  // Generate laser gates that block paths in the maze
  const laserGates: LaserGate[] = [];

  // Only add laser gates for difficulty 2 and above
  if (difficulty >= 2) {
    // Find paths to block with laser gates
    const laserThickness = 4; // Thickness of the laser beam
    const numLasers = Math.min(difficulty, 4); // Cap at 4 lasers

    // Simplified approach - just create a few random laser gates
    const corridors: {x1: number, y1: number, x2: number, y2: number, direction: 'horizontal' | 'vertical', length: number}[] = [];

    // Create 2-3 horizontal corridors at different heights
    const numHorizontalCorridors = 1 + Math.floor(Math.random() * 2); // 1-2 horizontal corridors
    for (let i = 0; i < numHorizontalCorridors; i++) {
      // Pick a random row that's not too close to the start or end
      const y = Math.floor(rows * 0.3) + Math.floor(Math.random() * (rows * 0.4));
      const cellY = y * CELL_SIZE * scale;

      // Create a corridor that spans most of the width
      corridors.push({
        x1: 0,
        y1: cellY + CELL_SIZE * scale / 2,
        x2: MAZE_AREA_SIZE,
        y2: cellY + CELL_SIZE * scale / 2,
        direction: 'horizontal',
        length: MAZE_AREA_SIZE
      });
    }

    // Create 2-3 vertical corridors at different positions
    const numVerticalCorridors = 1 + Math.floor(Math.random() * 2); // 1-2 vertical corridors
    for (let i = 0; i < numVerticalCorridors; i++) {
      // Pick a random column that's not too close to the start or end
      const x = Math.floor(cols * 0.3) + Math.floor(Math.random() * (cols * 0.4));
      const cellX = x * CELL_SIZE * scale;

      // Create a corridor that spans most of the height
      corridors.push({
        x1: cellX + CELL_SIZE * scale / 2,
        y1: 0,
        x2: cellX + CELL_SIZE * scale / 2,
        y2: MAZE_AREA_SIZE,
        direction: 'vertical',
        length: MAZE_AREA_SIZE
      });
    }

    // Shuffle the corridors array to randomize laser placement
    for (let i = corridors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [corridors[i], corridors[j]] = [corridors[j], corridors[i]];
    }

    // Create laser gates directly from the corridors
    // Avoid placing lasers too close to start or end positions
    const startX = startPosition.x;
    const startY = startPosition.y;
    const endX = endPosition.x;
    const endY = endPosition.y;
    const safeDistance = CELL_SIZE * scale * 1.5; // Minimum distance from start/end

    // Limit the number of laser gates based on difficulty
    const maxLasers = Math.min(difficulty, corridors.length);

    // Create a temporary array to hold potential laser gates
    const tempLaserGates: LaserGate[] = [];

    // Process each corridor
    for (let i = 0; i < maxLasers; i++) {
      const corridor = corridors[i];

      // Create a laser gate for this corridor
      if (corridor.direction === 'horizontal') {
        // Create a horizontal laser gate
        const laserY = corridor.y1 - laserThickness / 2;

        // Add some randomness to the width (60-80% of corridor width)
        // Reduced from 80-90% to ensure there's more space to navigate
        const widthFactor = 0.6 + Math.random() * 0.2;
        const laserWidth = (corridor.x2 - corridor.x1) * widthFactor;

        // Center the laser in the corridor
        const laserX = corridor.x1 + ((corridor.x2 - corridor.x1) - laserWidth) / 2;

        // Ensure the laser gate has an off period (never 100% on)
        const onDuration = Math.min(0.4 + Math.random() * 0.2, 0.6); // Cap at 60% on time

        tempLaserGates.push({
          id: `laser-h-${id}-${i}`,
          x: laserX,
          y: laserY,
          width: laserWidth,
          height: laserThickness,
          direction: 'horizontal',
          interval: 1000 + Math.random() * 1000, // Random interval between 1000-2000ms
          phase: Math.random(), // Random phase
          onDuration: onDuration // 40-60% on duration
        });
      } else { // vertical
        // Create a vertical laser gate
        const laserX = corridor.x1 - laserThickness / 2;

        // Add some randomness to the height (60-80% of corridor height)
        // Reduced from 80-90% to ensure there's more space to navigate
        const heightFactor = 0.6 + Math.random() * 0.2;
        const laserHeight = (corridor.y2 - corridor.y1) * heightFactor;

        // Center the laser in the corridor
        const laserY = corridor.y1 + ((corridor.y2 - corridor.y1) - laserHeight) / 2;

        // Ensure the laser gate has an off period (never 100% on)
        const onDuration = Math.min(0.4 + Math.random() * 0.2, 0.6); // Cap at 60% on time

        tempLaserGates.push({
          id: `laser-v-${id}-${i}`,
          x: laserX,
          y: laserY,
          width: laserThickness,
          height: laserHeight,
          direction: 'vertical',
          interval: 1000 + Math.random() * 1000, // Random interval between 1000-2000ms
          phase: Math.random(), // Random phase
          onDuration: onDuration // 40-60% on duration
        });
      }
    }

    // Verify that the maze is still solvable with these laser gates
    if (isPathPossible(grid, rows, cols, tempLaserGates, scale)) {
      // If the maze is solvable, add the laser gates
      laserGates.push(...tempLaserGates);
      console.log(`Added ${tempLaserGates.length} laser gates - maze is solvable`);
    } else {
      // If the maze is not solvable, add fewer laser gates or none
      // For simplicity, we'll just add the first laser gate if there are multiple
      if (tempLaserGates.length > 0) {
        // Just add one laser gate to ensure the maze is solvable
        laserGates.push(tempLaserGates[0]);
        console.log('Added only one laser gate to ensure maze is solvable');
      } else {
        console.log('No laser gates added - maze would be unsolvable');
      }
    }
  }

  return {
    id,
    name,
    walls,
    laserGates: laserGates.length > 0 ? laserGates : undefined,
    startPosition,
    endPosition,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    difficulty: difficultyLevel,
  };
};