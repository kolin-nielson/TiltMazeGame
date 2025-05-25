import { Maze, Wall, Position, LaserGate, Coin } from '@types';
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

  // Enhanced path validation for strategic laser placement
  // Check if any laser completely blocks all possible paths
  for (const gate of laserGates) {
    // Only block path if laser is on for more than 80% of the time (too difficult)
    if (gate.onDuration >= 0.8) {
      return false;
    }
    
    // Check if laser is placed in a critical chokepoint that would be impossible to pass
    const laserCenterX = gate.x + gate.width / 2;
    const laserCenterY = gate.y + gate.height / 2;
    const cellX = Math.floor(laserCenterX / cellSizeScaled);
    const cellY = Math.floor(laserCenterY / cellSizeScaled);
    
    // Ensure laser doesn't block the only path in a corridor
    if (cellX >= 0 && cellX < cols && cellY >= 0 && cellY < rows) {
      const cell = grid[cellY][cellX];
      const openDirections = [
        !cell.walls.top && cellY > 0,
        !cell.walls.bottom && cellY < rows - 1,
        !cell.walls.left && cellX > 0,
        !cell.walls.right && cellX < cols - 1
      ].filter(Boolean).length;
      
      // If this is a critical single-path corridor with very long laser duration, it's too hard
      if (openDirections === 2 && gate.onDuration > 0.6) {
        // Allow it but reduce the on duration to make it passable
        gate.onDuration = Math.min(gate.onDuration, 0.5);
      }
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
  
  // Clean wall generation without overlaps - walls meet precisely at edges
  // Each wall positioned exactly at cell boundaries for perfect connections
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = grid[y][x];
      const cellX = x * cellSizeScaled;
      const cellY = y * cellSizeScaled;
      
      // Top wall (only for first row - maze boundary)
      if (y === 0 && cell.walls.top) {
        walls.push({ 
          x: cellX, 
          y: cellY, 
          width: cellSizeScaled, 
          height: wallThicknessScaled 
        });
      }
      
      // Left wall (only for first column - maze boundary)
      if (x === 0 && cell.walls.left) {
        walls.push({ 
          x: cellX, 
          y: cellY, 
          width: wallThicknessScaled, 
          height: cellSizeScaled 
        });
      }
      
      // Bottom wall - position precisely at cell edge
      if (cell.walls.bottom) {
        walls.push({
          x: cellX,
          y: cellY + cellSizeScaled - wallThicknessScaled,
          width: cellSizeScaled,
          height: wallThicknessScaled,
        });
      }
      
      // Right wall - position precisely at cell edge
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

// Enhanced laser generation with strategic placement and varied patterns
interface LaserPattern {
  type: 'burst' | 'steady' | 'pulse' | 'rapid';
  interval: number;
  onDuration: number;
  phase: number;
}

interface StrategicPosition {
  x: number;
  y: number;
  direction: 'horizontal' | 'vertical';
  importance: number; // 0-1, higher means more strategic
  length: number;
}

// Define laser patterns for different gameplay styles
const LASER_PATTERNS: Record<string, LaserPattern> = {
  // Quick burst - easy to time
  burst: {
    type: 'burst',
    interval: 3000,
    onDuration: 0.3,
    phase: 0
  },
  // Long steady beam - requires patience
  steady: {
    type: 'steady',
    interval: 4000,
    onDuration: 0.7,
    phase: 0
  },
  // Rhythmic pulse - creates rhythm-based gameplay
  pulse: {
    type: 'pulse',
    interval: 2000,
    onDuration: 0.4,
    phase: 0
  },
  // Rapid fire - high difficulty
  rapid: {
    type: 'rapid',
    interval: 1500,
    onDuration: 0.2,
    phase: 0
  }
};

function findStrategicLaserPositions(
  grid: Cell[][], 
  rows: number, 
  cols: number, 
  scale: number,
  startPos: Position,
  endPos: Position
): StrategicPosition[] {
  const positions: StrategicPosition[] = [];
  const cellSize = CELL_SIZE * scale;
  
  // Find chokepoints and corridor intersections
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      const cell = grid[y][x];
      
      // Count open directions for this cell
      const openDirections = [
        !cell.walls.top && y > 0,
        !cell.walls.bottom && y < rows - 1,
        !cell.walls.left && x > 0,
        !cell.walls.right && x < cols - 1
      ].filter(Boolean).length;
      
      // Strategic positions: corridors with 2 openings (chokepoints)
      if (openDirections === 2) {
        const cellX = x * cellSize + cellSize / 2;
        const cellY = y * cellSize + cellSize / 2;
        
        // Calculate distance from start and end to determine importance
        const distFromStart = Math.sqrt(Math.pow(cellX - startPos.x, 2) + Math.pow(cellY - startPos.y, 2));
        const distFromEnd = Math.sqrt(Math.pow(cellX - endPos.x, 2) + Math.pow(cellY - endPos.y, 2));
        const maxDist = Math.sqrt(Math.pow(MAZE_AREA_SIZE, 2) + Math.pow(MAZE_AREA_SIZE, 2));
        
        // Higher importance for positions in the middle of the path
        const importance = 1 - Math.abs(distFromStart - distFromEnd) / maxDist;
        
        // Determine laser direction based on corridor orientation
        if ((!cell.walls.left || !cell.walls.right) && (cell.walls.top && cell.walls.bottom)) {
          // Horizontal corridor - vertical laser
          positions.push({
            x: cellX,
            y: cellY - cellSize * 0.4,
            direction: 'vertical',
            importance: importance + 0.2, // Bonus for crossing corridors
            length: cellSize * 0.8
          });
        } else if ((cell.walls.left && cell.walls.right) && (!cell.walls.top || !cell.walls.bottom)) {
          // Vertical corridor - horizontal laser
          positions.push({
            x: cellX - cellSize * 0.4,
            y: cellY,
            direction: 'horizontal',
            importance: importance + 0.2,
            length: cellSize * 0.8
          });
        }
      }
      
      // Junction positions (3+ openings) for advanced levels
      if (openDirections >= 3) {
        const cellX = x * cellSize + cellSize / 2;
        const cellY = y * cellSize + cellSize / 2;
        
        // Place crossing lasers at junctions for high difficulty
        const distFromStart = Math.sqrt(Math.pow(cellX - startPos.x, 2) + Math.pow(cellY - startPos.y, 2));
        const distFromEnd = Math.sqrt(Math.pow(cellX - endPos.x, 2) + Math.pow(cellY - endPos.y, 2));
        const maxDist = Math.sqrt(Math.pow(MAZE_AREA_SIZE, 2) + Math.pow(MAZE_AREA_SIZE, 2));
        const importance = 0.8 - Math.abs(distFromStart - distFromEnd) / maxDist;
        
        // Add both horizontal and vertical lasers for junction challenges
        if (openDirections === 4) { // 4-way intersection
          positions.push({
            x: cellX - cellSize * 0.3,
            y: cellY,
            direction: 'horizontal',
            importance: importance + 0.3,
            length: cellSize * 0.6
          });
          positions.push({
            x: cellX,
            y: cellY - cellSize * 0.3,
            direction: 'vertical',
            importance: importance + 0.3,
            length: cellSize * 0.6
          });
        }
      }
    }
  }
  
  // Sort by importance (highest first)
  return positions.sort((a, b) => b.importance - a.importance);
}

function generateSmartLasers(
  grid: Cell[][],
  rows: number,
  cols: number,
  scale: number,
  difficulty: number,
  startPos: Position,
  endPos: Position,
  mazeId: string
): LaserGate[] {
  if (difficulty <= 3) {
    return []; // No lasers for easy levels
  }

  const strategicPositions = findStrategicLaserPositions(grid, rows, cols, scale, startPos, endPos);
  const laserGates: LaserGate[] = [];
  
  // Calculate number of lasers based on difficulty with better progression
  const baseLasers = Math.min(difficulty - 3, 3); // 0-3 base lasers
  const bonusLasers = Math.floor((difficulty - 6) / 2); // +1 every 2 levels after level 6
  const maxLasers = Math.min(baseLasers + bonusLasers, Math.min(8, strategicPositions.length));
  
  // Select patterns based on difficulty
  const availablePatterns = [];
  if (difficulty >= 4) availablePatterns.push('burst', 'pulse');
  if (difficulty >= 6) availablePatterns.push('steady');
  if (difficulty >= 8) availablePatterns.push('rapid');
  
  // Place lasers at strategic positions
  for (let i = 0; i < maxLasers && i < strategicPositions.length; i++) {
    const position = strategicPositions[i];
    const patternName = availablePatterns[Math.floor(Math.random() * availablePatterns.length)];
    const pattern = { ...LASER_PATTERNS[patternName] };
    
    // Add some randomization to timing to prevent predictable patterns
    pattern.interval += (Math.random() - 0.5) * 500;
    pattern.phase = Math.random();
    
    // Adjust pattern based on difficulty
    if (difficulty >= 10) {
      pattern.onDuration = Math.min(pattern.onDuration + 0.1, 0.8); // Longer beams at high difficulty
    }
    if (difficulty >= 12) {
      pattern.interval = Math.max(pattern.interval - 200, 1000); // Faster cycling
    }
    
    const laserThickness = 4;
    
    if (position.direction === 'horizontal') {
      laserGates.push({
        id: `laser-h-${mazeId}-${i}`,
        x: position.x,
        y: position.y - laserThickness / 2,
        width: position.length,
        height: laserThickness,
        direction: 'horizontal',
        interval: pattern.interval,
        phase: pattern.phase,
        onDuration: pattern.onDuration,
      });
    } else {
      laserGates.push({
        id: `laser-v-${mazeId}-${i}`,
        x: position.x - laserThickness / 2,
        y: position.y,
        width: laserThickness,
        height: position.length,
        direction: 'vertical',
        interval: pattern.interval,
        phase: pattern.phase,
        onDuration: pattern.onDuration,
      });
    }
  }
  
  // Add synchronized laser pairs for very high difficulty
  if (difficulty >= 15 && laserGates.length >= 2) {
    // Synchronize every other pair of lasers for coordinated challenges
    for (let i = 0; i < laserGates.length - 1; i += 2) {
      const sharedPhase = Math.random();
      const sharedInterval = 2500 + Math.random() * 1000;
      
      laserGates[i].phase = sharedPhase;
      laserGates[i].interval = sharedInterval;
      laserGates[i + 1].phase = sharedPhase + 0.5; // Offset by half cycle
      laserGates[i + 1].interval = sharedInterval;
    }
  }
  
  return laserGates;
}

export const generateMaze = (difficulty: number): Maze => {
  const structureDifficulty = Math.min(difficulty, 4);
  const gridSize = BASE_GRID_SIZE + (structureDifficulty - 1) * GRID_INCREMENT;
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
  if (structureDifficulty <= 2) {
    difficultyLevel = 'easy';
  } else if (structureDifficulty <= 3) {
    difficultyLevel = 'medium';
  } else {
    difficultyLevel = 'hard';
  }
  const laserGates: LaserGate[] = generateSmartLasers(grid, rows, cols, scale, difficulty, startPosition, endPosition, id);
  const maxCoins = Math.min(20, Math.ceil(GAME.COINS_PER_LEVEL * (1 + difficulty / 10)));

  const flatCells: Position[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const pos: Position = {
        x: (x * CELL_SIZE + CELL_SIZE / 2) * scale,
        y: (y * CELL_SIZE + CELL_SIZE / 2) * scale,
      };
      if (
        (pos.x === startPosition.x && pos.y === startPosition.y) ||
        (pos.x === endPosition.x && pos.y === endPosition.y)
      ) {
        continue;
      }
      flatCells.push(pos);
    }
  }

  for (let i = flatCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flatCells[i], flatCells[j]] = [flatCells[j], flatCells[i]];
  }

  const regularCoins = Math.min(maxCoins - 1, flatCells.length - 1);
  const coinPositions = flatCells.slice(0, regularCoins);
  const coins: Coin[] = coinPositions.map((pos, idx) => ({ 
    id: `${id}-coin-${idx}`, 
    position: pos,
    value: 1,
    isSpecial: false
  }));

  if (flatCells.length > regularCoins) {
    const specialCoin: Coin = {
      id: `${id}-special-coin`,
      position: flatCells[regularCoins],
      value: 10,
      isSpecial: true
    };
    coins.push(specialCoin);
  }

  return {
    id,
    name,
    walls,
    laserGates,
    startPosition,
    endPosition,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    difficulty: difficultyLevel,
    coins,
  };
};
