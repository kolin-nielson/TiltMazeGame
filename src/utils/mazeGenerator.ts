import { Maze, Wall, Position, LaserGate } from '@types';
import { GAME } from '@config/constants';

const BASE_GRID_SIZE = 5;
const GRID_INCREMENT = 1;
const CELL_SIZE = 40;
const WALL_THICKNESS = 4;
const MAZE_AREA_SIZE = 300;

interface Cell {
  x: number;
  y: number;
  visited: boolean;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
}

function isPathPossible(
  grid: Cell[][],
  rows: number,
  cols: number,
  laserGates: LaserGate[],
  scale: number
): boolean {
  const startRow = 0;
  const startCol = 0;
  const endRow = rows - 1;
  const endCol = cols - 1;
  const cellSizeScaled = CELL_SIZE * scale;

  if (!hasPath(grid, startRow, startCol, endRow, endCol)) {
    return false;
  }

  if (!laserGates || laserGates.length === 0) {
    return true;
  }

  for (const gate of laserGates) {
    if (gate.onDuration >= 1) {
      return false;
    }
  }

  return true;
}

function hasPath(
  grid: Cell[][],
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number
): boolean {
  const rows = grid.length;
  const cols = grid[0].length;

  const visited: boolean[][] = Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(false));

  const queue: [number, number][] = [[startRow, startCol]];
  visited[startRow][startCol] = true;

  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;

    if (row === endRow && col === endCol) {
      return true;
    }

    for (let i = 0; i < 4; i++) {
      const newRow = row + directions[i][0];
      const newCol = col + directions[i][1];

      if (
        newRow >= 0 &&
        newRow < rows &&
        newCol >= 0 &&
        newCol < cols &&
        !visited[newRow][newCol]
      ) {
        let canMove = false;

        if (i === 0 && !grid[row][col].walls.right) canMove = true;
        if (i === 1 && !grid[row][col].walls.bottom) canMove = true;
        if (i === 2 && col > 0 && !grid[row][col - 1].walls.right) canMove = true;
        if (i === 3 && row > 0 && !grid[row - 1][col].walls.bottom) canMove = true;

        if (canMove) {
          visited[newRow][newCol] = true;
          queue.push([newRow, newCol]);
        }
      }
    }
  }

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

  if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]);
  if (x < cols - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]);
  if (y < rows - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]);
  if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]);

  return neighbors;
}

function removeWall(current: Cell, next: Cell): void {
  const dx = current.x - next.x;
  const dy = current.y - next.y;

  if (dx === 1) {
    current.walls.left = false;
    next.walls.right = false;
  } else if (dx === -1) {
    current.walls.right = false;
    next.walls.left = false;
  }

  if (dy === 1) {
    current.walls.top = false;
    next.walls.bottom = false;
  } else if (dy === -1) {
    current.walls.bottom = false;
    next.walls.top = false;
  }
}

function gridToWalls(grid: Cell[][], rows: number, cols: number, scale: number): Wall[] {
  const walls: Wall[] = [];
  const wallThicknessScaled = WALL_THICKNESS * scale;
  const cellSizeScaled = CELL_SIZE * scale;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = grid[y][x];
      const cellX = x * cellSizeScaled;
      const cellY = y * cellSizeScaled;

      if (y === 0 && cell.walls.top) {
        walls.push({ x: cellX, y: cellY, width: cellSizeScaled, height: wallThicknessScaled });
      }

      if (x === 0 && cell.walls.left) {
        walls.push({ x: cellX, y: cellY, width: wallThicknessScaled, height: cellSizeScaled });
      }

      if (cell.walls.bottom) {
        walls.push({
          x: cellX,
          y: cellY + cellSizeScaled - wallThicknessScaled,
          width: cellSizeScaled,
          height: wallThicknessScaled,
        });
      }

      if (cell.walls.right) {
        walls.push({
          x: cellX + cellSizeScaled - wallThicknessScaled,
          y: cellY,
          width: wallThicknessScaled,
          height: cellSizeScaled,
        });
      }
    }
  }
  return walls;
}

export const generateMaze = (difficulty: number): Maze => {
  const gridSize = BASE_GRID_SIZE + (difficulty - 1) * GRID_INCREMENT;
  const rows = gridSize;
  const cols = gridSize;

  const totalWidth = cols * CELL_SIZE;
  const totalHeight = rows * CELL_SIZE;
  const scale = MAZE_AREA_SIZE / Math.max(totalWidth, totalHeight);

  const grid = initializeGrid(rows, cols);
  const stack: Cell[] = [];
  let currentCell = grid[0][0];
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

  const id = `endless-${difficulty}-${Date.now()}`;
  const name = `Endless Level ${difficulty}`;

  const walls = gridToWalls(grid, rows, cols, scale);

  const startPosition: Position = {
    x: (CELL_SIZE / 2) * scale,
    y: (CELL_SIZE / 2) * scale,
  };
  const endPosition: Position = {
    x: ((cols - 1) * CELL_SIZE + CELL_SIZE / 2) * scale,
    y: ((rows - 1) * CELL_SIZE + CELL_SIZE / 2) * scale,
  };

  let difficultyLevel: 'easy' | 'medium' | 'hard';
  if (difficulty <= 5) {
    difficultyLevel = 'easy';
  } else if (difficulty <= 10) {
    difficultyLevel = 'medium';
  } else {
    difficultyLevel = 'hard';
  }

  const laserGates: LaserGate[] = [];

  if (difficulty >= 2) {
    const laserThickness = 4;
    const numLasers = Math.min(difficulty, 4);

    const corridors: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      direction: 'horizontal' | 'vertical';
      length: number;
    }[] = [];

    const numHorizontalCorridors = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numHorizontalCorridors; i++) {
      const y = Math.floor(rows * 0.3) + Math.floor(Math.random() * (rows * 0.4));
      const cellY = y * CELL_SIZE * scale;

      corridors.push({
        x1: 0,
        y1: cellY + (CELL_SIZE * scale) / 2,
        x2: MAZE_AREA_SIZE,
        y2: cellY + (CELL_SIZE * scale) / 2,
        direction: 'horizontal',
        length: MAZE_AREA_SIZE,
      });
    }

    const numVerticalCorridors = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numVerticalCorridors; i++) {
      const x = Math.floor(cols * 0.3) + Math.floor(Math.random() * (cols * 0.4));
      const cellX = x * CELL_SIZE * scale;

      corridors.push({
        x1: cellX + (CELL_SIZE * scale) / 2,
        y1: 0,
        x2: cellX + (CELL_SIZE * scale) / 2,
        y2: MAZE_AREA_SIZE,
        direction: 'vertical',
        length: MAZE_AREA_SIZE,
      });
    }

    for (let i = corridors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [corridors[i], corridors[j]] = [corridors[j], corridors[i]];
    }

    const startX = startPosition.x;
    const startY = startPosition.y;
    const endX = endPosition.x;
    const endY = endPosition.y;
    const safeDistance = CELL_SIZE * scale * 1.5;

    const maxLasers = Math.min(difficulty, corridors.length);

    const tempLaserGates: LaserGate[] = [];

    for (let i = 0; i < maxLasers; i++) {
      const corridor = corridors[i];

      if (corridor.direction === 'horizontal') {
        const laserY = corridor.y1 - laserThickness / 2;

        const widthFactor = 0.6 + Math.random() * 0.2;
        const laserWidth = (corridor.x2 - corridor.x1) * widthFactor;

        const laserX = corridor.x1 + (corridor.x2 - corridor.x1 - laserWidth) / 2;

        tempLaserGates.push({
          id: `laser-h-${id}-${i}`,
          x: laserX,
          y: laserY,
          width: laserWidth,
          height: laserThickness,
          direction: 'horizontal',
          interval: 2000 + Math.random() * 2000,
          phase: Math.random(),
          onDuration: 0.6 + Math.random() * 0.2,
        });
      } else {
        const laserX = corridor.x1 - laserThickness / 2;

        const heightFactor = 0.6 + Math.random() * 0.2;
        const laserHeight = (corridor.y2 - corridor.y1) * heightFactor;

        const laserY = corridor.y1 + (corridor.y2 - corridor.y1 - laserHeight) / 2;

        tempLaserGates.push({
          id: `laser-v-${id}-${i}`,
          x: laserX,
          y: laserY,
          width: laserThickness,
          height: laserHeight,
          direction: 'vertical',
          interval: 2000 + Math.random() * 2000,
          phase: Math.random(),
          onDuration: 0.6 + Math.random() * 0.2,
        });
      }
    }

    if (isPathPossible(grid, rows, cols, tempLaserGates, scale)) {
      laserGates.push(...tempLaserGates);
      console.log(`Added ${tempLaserGates.length} laser gates - maze is solvable`);
    } else {
      if (tempLaserGates.length > 0) {
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
