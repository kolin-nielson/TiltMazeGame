import { Maze } from '../types';

export const defaultMazes: Maze[] = [
  {
    id: 'easy-1',
    name: 'Beginner Path',
    difficulty: 'easy',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 50, y: 150, width: 200, height: 10 },
    ],
    startPosition: { x: 40, y: 40 },
    endPosition: { x: 250, y: 250 },
    createdAt: 1622503200000,
    updatedAt: 1622503200000,
  },

  {
    id: 'easy-2',
    name: 'Simple Corner',
    difficulty: 'easy',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 50, y: 50, width: 190, height: 10 },
      { x: 50, y: 50, width: 10, height: 190 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 250, y: 250 },
    createdAt: 1622503200001,
    updatedAt: 1622503200001,
  },

  {
    id: 'easy-3',
    name: 'Two Gates',
    difficulty: 'easy',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 10, y: 100, width: 220, height: 10 },
      { x: 70, y: 200, width: 220, height: 10 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 250, y: 250 },
    createdAt: 1622503200006,
    updatedAt: 1622503200006,
  },

  {
    id: 'medium-1',
    name: 'Simple Zigzag',
    difficulty: 'medium',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 10, y: 100, width: 180, height: 10 },
      { x: 110, y: 200, width: 180, height: 10 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 250, y: 250 },
    createdAt: 1622503200002,
    updatedAt: 1622503200002,
  },

  {
    id: 'medium-2',
    name: 'Three Barriers',
    difficulty: 'medium',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 10, y: 80, width: 200, height: 10 },
      { x: 90, y: 160, width: 200, height: 10 },
      { x: 10, y: 240, width: 200, height: 10 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 250, y: 250 },
    createdAt: 1622503200003,
    updatedAt: 1622503200003,
  },

  {
    id: 'medium-3',
    name: 'Simple Cross',
    difficulty: 'medium',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 115, y: 10, width: 10, height: 100 },
      { x: 115, y: 170, width: 10, height: 120 },
      { x: 10, y: 140, width: 100, height: 10 },
      { x: 170, y: 140, width: 120, height: 10 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 250, y: 250 },
    createdAt: 1622503200007,
    updatedAt: 1622503200007,
  },

  {
    id: 'hard-1',
    name: 'Four Quadrants',
    difficulty: 'hard',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 10, y: 150, width: 110, height: 10 },
      { x: 180, y: 150, width: 110, height: 10 },
      { x: 150, y: 10, width: 10, height: 110 },
      { x: 150, y: 180, width: 10, height: 110 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 250, y: 250 },
    createdAt: 1622503200004,
    updatedAt: 1622503200004,
  },

  {
    id: 'hard-2',
    name: 'Wide Spiral',
    difficulty: 'hard',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 50, y: 50, width: 200, height: 10 },
      { x: 50, y: 50, width: 10, height: 150 },
      { x: 50, y: 200, width: 150, height: 10 },
      { x: 200, y: 100, width: 10, height: 100 },
    ],
    startPosition: { x: 25, y: 25 },
    endPosition: { x: 150, y: 150 },
    createdAt: 1622503200005,
    updatedAt: 1622503200005,
  },

  {
    id: 'hard-3',
    name: 'Wide Zigzag Challenge',
    difficulty: 'hard',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 10, y: 80, width: 200, height: 10 },
      { x: 90, y: 160, width: 200, height: 10 },
      { x: 10, y: 240, width: 200, height: 10 },

      { x: 210, y: 10, width: 10, height: 70 },
      { x: 80, y: 170, width: 10, height: 70 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 250, y: 250 },
    createdAt: 1622503200008,
    updatedAt: 1622503200008,
  },

  {
    id: 'hard-4',
    name: 'Open Circuit',
    difficulty: 'hard',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 60, y: 60, width: 180, height: 10 },
      { x: 60, y: 60, width: 10, height: 180 },
      { x: 60, y: 240, width: 180, height: 10 },
      { x: 240, y: 60, width: 10, height: 120 },
      { x: 240, y: 220, width: 10, height: 20 },

      { x: 110, y: 130, width: 80, height: 10 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 200, y: 200 },
    createdAt: 1622503200009,
    updatedAt: 1622503200009,
  },

  {
    id: 'hard-5',
    name: 'Final Path',
    difficulty: 'hard',
    walls: [
      { x: 0, y: 0, width: 300, height: 10 },
      { x: 0, y: 0, width: 10, height: 300 },
      { x: 0, y: 290, width: 300, height: 10 },
      { x: 290, y: 0, width: 10, height: 300 },

      { x: 60, y: 60, width: 180, height: 10 },
      { x: 60, y: 60, width: 10, height: 80 },
      { x: 60, y: 140, width: 140, height: 10 },
      { x: 200, y: 140, width: 10, height: 80 },
      { x: 80, y: 220, width: 130, height: 10 },
    ],
    startPosition: { x: 30, y: 30 },
    endPosition: { x: 250, y: 250 },
    createdAt: 1622503200010,
    updatedAt: 1622503200010,
  },
];
