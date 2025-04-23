import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Maze, ThemeColors } from '@types';

interface FallbackMazeRendererProps {
  maze: Maze;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  ballRadius: number;
  colors: ThemeColors;
  gameState?: 'ready' | 'playing' | 'paused' | 'completed' | 'game_over';
}

const FallbackMazeRenderer: React.FC<FallbackMazeRendererProps> = ({
  maze,
  ballPositionX,
  ballPositionY,
  ballRadius,
  colors,
  gameState = 'playing',
}) => {
  return (
    <View style={styles.container}>
      {/* Render laser gates */}
      {maze.laserGates?.map(gate => (
        <View
          key={gate.id}
          style={[
            styles.laserGate,
            {
              left: gate.x,
              top: gate.y,
              width: gate.width,
              height: gate.height,
              backgroundColor: colors.laser,
              opacity: gameState === 'playing' ? 1 : 0,
            },
          ]}
        />
      ))}

      {/* Render ball */}
      <Animated.View
        style={[
          styles.ball,
          {
            width: ballRadius * 2,
            height: ballRadius * 2,
            borderRadius: ballRadius,
            backgroundColor: colors.ball,
            transform: [
              {
                translateX: ballPositionX,
              },
              {
                translateY: ballPositionY,
              },
              {
                translateX: -ballRadius,
              },
              {
                translateY: -ballRadius,
              },
            ],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  laserGate: {
    position: 'absolute',
  },
  ball: {
    position: 'absolute',
  },
});

export default React.memo(FallbackMazeRenderer);
