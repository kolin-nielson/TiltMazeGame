import React, { useEffect } from 'react';
import { Canvas, Rect as SkiaRect, Circle, useValue, useSharedValueEffect, Group } from '@shopify/react-native-skia';
import Animated from 'react-native-reanimated';
import { Maze, ThemeColors } from '@types';

interface SkiaMazeRendererProps {
  maze: Maze;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  ballRadius: number;
  colors: ThemeColors;
  gameState?: 'ready' | 'playing' | 'paused' | 'completed' | 'game_over';
}

const SkiaMazeRenderer: React.FC<SkiaMazeRendererProps> = ({
  maze,
  ballPositionX,
  ballPositionY,
  ballRadius,
  colors,
  gameState = 'playing',
}) => {
  // Skia values for ball position
  const x = useValue(ballPositionX.value);
  const y = useValue(ballPositionY.value);

  // Sync reanimated shared values to Skia values
  useSharedValueEffect(() => {
    x.current = ballPositionX.value;
  }, ballPositionX);
  useSharedValueEffect(() => {
    y.current = ballPositionY.value;
  }, ballPositionY);

  return (
    <Canvas style={{ flex: 1 }}>
      <Group>
        {maze.laserGates?.map(gate => (
          <SkiaRect
            key={gate.id}
            x={gate.x}
            y={gate.y}
            width={gate.width}
            height={gate.height}
            color={colors.laser}
            opacity={gameState === 'playing' ? 1 : 0}
          />
        ))}
      </Group>

      <Circle
        cx={x}
        cy={y}
        r={ballRadius}
        color={colors.ball}
      />
    </Canvas>
  );
};

export default React.memo(SkiaMazeRenderer); 