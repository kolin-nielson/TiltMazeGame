import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { useAnimatedSensor, SensorType } from 'react-native-reanimated';
import { Maze } from '@types';

export interface AnimatedPhysicsOptions {
  gravityScale?: number;
  ballRadius?: number;
}

export function useAnimatedPhysics(
  maze: Maze | null,
  options: AnimatedPhysicsOptions = {}
) {
  const { gravityScale = 0.015, ballRadius = 7 } = options;

  // SharedValues for position and velocity
  const posX = useSharedValue(maze?.startPosition.x ?? 0);
  const posY = useSharedValue(maze?.startPosition.y ?? 0);
  const velX = useSharedValue(0);
  const velY = useSharedValue(0);

  // Read gyroscope on UI thread
  const gyro = useAnimatedSensor(SensorType.Gyroscope, {
    interval: 16,
  });

  // Last timestamp for dt calculation
  const lastTime = useSharedValue(Date.now());

  // Integrate velocity/position each frame
  useDerivedValue(() => {
    if (!maze) return;
    const now = Date.now();
    const dt = (now - lastTime.value) / 1000;
    lastTime.value = now;

    // Use sensor values as acceleration
    const ax = gyro.sensor.value.y * gravityScale;
    const ay = -gyro.sensor.value.x * gravityScale; // swap axes if needed

    // Integrate velocity
    velX.value += ax * dt;
    velY.value += ay * dt;

    // Damping
    velX.value *= 0.98;
    velY.value *= 0.98;

    // Integrate position
    posX.value += velX.value * dt;
    posY.value += velY.value * dt;

    // Clamp inside maze bounds
    const minX = ballRadius;
    const minY = ballRadius;
    const maxX = maze ? maze.endPosition.x + ballRadius : minX;
    const maxY = maze ? maze.endPosition.y + ballRadius : minY;

    if (posX.value < minX) posX.value = minX;
    if (posX.value > maxX) posX.value = maxX;
    if (posY.value < minY) posY.value = minY;
    if (posY.value > maxY) posY.value = maxY;
  }, [gyro]);

  return { posX, posY };
} 