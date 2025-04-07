import { Maze, Wall, Position } from '../types';

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
  const id = `endless-${difficulty}-${Date.now()}`;
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

  return {
    id,
    name,
    walls,
    startPosition,
    endPosition,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    difficulty: difficultyLevel,
  };
}; 