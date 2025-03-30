import { Maze } from '../types';

// Maze grid size: 300x300
// Wall thickness: 10
// Ball diameter: ~15 (ball radius is now 7)
// Ensure at least 20px clearance around start/end positions

export const defaultMazes: Maze[] = [
  // --- Easy Mazes ---
  {
    id: 'easy-1',
    name: 'Open Field',
    difficulty: 'easy',
    walls: [
      // Outer walls only
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
    ],
    startPosition: { x: 40, y: 40 },
    endPosition: { x: 260, y: 260 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'easy-2',
    name: 'Simple Path',
    difficulty: 'easy',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Central divider with wide opening
      { x: 10, y: 150, width: 90, height: 10 },
      { x: 200, y: 150, width: 90, height: 10 },
    ],
    startPosition: { x: 40, y: 40 },
    endPosition: { x: 260, y: 260 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'easy-3',
    name: 'Corner Turn',
    difficulty: 'easy',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Corner guide (moved away from start/end)
      { x: 150, y: 10, width: 10, height: 120 },
      { x: 10, y: 150, width: 120, height: 10 },
    ],
    startPosition: { x: 40, y: 40 },
    endPosition: { x: 260, y: 260 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'easy-4',
    name: 'Corridor',
    difficulty: 'easy',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Corridor walls with 80px gap (adjusted to be away from start/end)
      { x: 10, y: 100, width: 200, height: 10 },
      { x: 90, y: 190, width: 200, height: 10 },
    ],
    startPosition: { x: 35, y: 35 },
    endPosition: { x: 260, y: 260 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'easy-5',
    name: 'Central Obstacle',
    difficulty: 'easy',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Central obstacle (smaller and centered)
      { x: 135, y: 135, width: 30, height: 30 },
    ],
    startPosition: { x: 40, y: 40 },
    endPosition: { x: 260, y: 260 },
    createdAt: 0, updatedAt: 0,
  },

  // --- Medium Mazes ---
  {
    id: 'medium-1',
    name: 'Zigzag',
    difficulty: 'medium',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Zigzag pattern with wider openings
      { x: 10, y: 80, width: 180, height: 10 },
      { x: 110, y: 160, width: 180, height: 10 },
      { x: 10, y: 240, width: 180, height: 10 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 260, y: 260 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'medium-2',
    name: 'Spiral',
    difficulty: 'medium',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Spiral with clear gaps (pulled away from start/end)
      { x: 60, y: 60, width: 180, height: 10 },
      { x: 60, y: 60, width: 10, height: 180 },
      { x: 60, y: 230, width: 150, height: 10 }, // Gap at right end
      { x: 230, y: 60, width: 10, height: 150 }, // Gap at bottom end
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 250, y: 250 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'medium-3',
    name: 'Two Paths',
    difficulty: 'medium',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Central barrier with two routes (shortened)
      { x: 150, y: 30, width: 10, height: 100 },
      { x: 150, y: 170, width: 10, height: 100 },
    ],
    startPosition: { x: 30, y: 150 },
    endPosition: { x: 270, y: 150 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'medium-4',
    name: 'Crossroads',
    difficulty: 'medium',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Cross pattern with much wider openings
      { x: 10, y: 120, width: 80, height: 10 },
      { x: 210, y: 120, width: 80, height: 10 },
      { x: 10, y: 180, width: 80, height: 10 },
      { x: 210, y: 180, width: 80, height: 10 },
      { x: 120, y: 10, width: 10, height: 80 },
      { x: 170, y: 10, width: 10, height: 80 },
      { x: 120, y: 210, width: 10, height: 80 },
      { x: 170, y: 210, width: 10, height: 80 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 270, y: 270 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'medium-5',
    name: 'Switchback',
    difficulty: 'medium',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Switchback pattern with clearer passage
      { x: 10, y: 80, width: 200, height: 10 },
      { x: 90, y: 160, width: 200, height: 10 },
      { x: 10, y: 240, width: 200, height: 10 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 30, y: 270 },
    createdAt: 0, updatedAt: 0,
  },

  // --- Hard Mazes ---
  {
    id: 'hard-1',
    name: 'Corridors',
    difficulty: 'hard',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Vertical barriers with wider gaps
      { x: 75, y: 40, width: 10, height: 200 },
      { x: 150, y: 60, width: 10, height: 180 },
      { x: 225, y: 40, width: 10, height: 200 },
    ],
    startPosition: { x: 35, y: 35 },
    endPosition: { x: 265, y: 265 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'hard-2',
    name: 'Concentric',
    difficulty: 'hard',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Outer ring with entrance (adjusted)
      { x: 60, y: 60, width: 180, height: 10 },
      { x: 60, y: 60, width: 10, height: 180 },
      { x: 60, y: 230, width: 140, height: 10 }, // Gap on right
      { x: 230, y: 60, width: 10, height: 140 }, // Gap on bottom
      // Inner ring with entrance (smaller)
      { x: 110, y: 110, width: 80, height: 10 },
      { x: 110, y: 110, width: 10, height: 80 },
      { x: 110, y: 180, width: 40, height: 10 }, // Gap on right
      { x: 180, y: 110, width: 10, height: 40 }, // Gap on bottom
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 150, y: 150 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'hard-3',
    name: 'Grid',
    difficulty: 'hard',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Grid with much wider path through
      { x: 40, y: 75, width: 35, height: 10 }, { x: 115, y: 75, width: 70, height: 10 }, { x: 225, y: 75, width: 35, height: 10 },
      { x: 40, y: 150, width: 35, height: 10 }, { x: 115, y: 150, width: 70, height: 10 }, { x: 225, y: 150, width: 35, height: 10 },
      { x: 40, y: 225, width: 35, height: 10 }, { x: 115, y: 225, width: 70, height: 10 }, { x: 225, y: 225, width: 35, height: 10 },
      { x: 75, y: 40, width: 10, height: 35 }, { x: 75, y: 115, width: 10, height: 35 }, { x: 75, y: 185, width: 10, height: 40 },
      { x: 150, y: 40, width: 10, height: 35 }, { x: 150, y: 115, width: 10, height: 35 }, { x: 150, y: 185, width: 10, height: 40 },
      { x: 225, y: 40, width: 10, height: 35 }, { x: 225, y: 115, width: 10, height: 35 }, { x: 225, y: 185, width: 10, height: 40 },
    ],
    startPosition: { x: 35, y: 35 },
    endPosition: { x: 265, y: 265 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'hard-4',
    name: 'Serpentine',
    difficulty: 'hard',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Serpentine path with much wider openings
      { x: 40, y: 60, width: 200, height: 10 }, { x: 230, y: 60, width: 10, height: 60 },
      { x: 60, y: 120, width: 170, height: 10 }, { x: 60, y: 120, width: 10, height: 60 },
      { x: 60, y: 180, width: 170, height: 10 }, { x: 230, y: 180, width: 10, height: 60 },
      { x: 40, y: 240, width: 200, height: 10 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 260, y: 260 },
    createdAt: 0, updatedAt: 0,
  },
  {
    id: 'hard-5',
    name: 'The Weave',
    difficulty: 'hard',
    walls: [
      // Outer walls
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 290, y: 0, width: 10, height: 300 },
      // Horizontal lines with very wide gaps
      { x: 40, y: 60, width: 190, height: 10 },
      { x: 40, y: 120, width: 190, height: 10 },
      { x: 40, y: 180, width: 190, height: 10 },
      { x: 40, y: 240, width: 190, height: 10 },
      // Vertical connectors with very wide gaps
      { x: 70, y: 40, width: 10, height: 20 }, { x: 70, y: 120, width: 10, height: 60 }, { x: 70, y: 240, width: 10, height: 50 },
      { x: 150, y: 60, width: 10, height: 60 }, { x: 150, y: 180, width: 10, height: 60 },
      { x: 230, y: 40, width: 10, height: 20 }, { x: 230, y: 120, width: 10, height: 60 }, { x: 230, y: 240, width: 10, height: 50 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 260, y: 260 },
    createdAt: 0, updatedAt: 0,
  }
];
