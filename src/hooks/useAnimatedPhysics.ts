import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { useAnimatedSensor, SensorType } from 'react-native-reanimated';
import { Maze } from '@types';

export interface AnimatedPhysicsOptions {
  gravityScale?: number;
  ballRadius?: number;
}

export function useAnimatedPhysics(maze: Maze | null, options: AnimatedPhysicsOptions = {}) {
  const { gravityScale = 0.015, ballRadius = 7 } = options;

  const posX = useSharedValue(maze?.startPosition.x ?? 0);
  const posY = useSharedValue(maze?.startPosition.y ?? 0);
  const velX = useSharedValue(0);
  const velY = useSharedValue(0);

  const gyro = useAnimatedSensor(SensorType.Gyroscope, {
    interval: 16,
  });

  const lastTime = useSharedValue(Date.now());

  useDerivedValue(() => {
    if (!maze) return;
    const now = Date.now();
    const dt = (now - lastTime.value) / 1000;
    lastTime.value = now;

    const ax = gyro.sensor.value.y * gravityScale;
    const ay = -gyro.sensor.value.x * gravityScale;

    velX.value += ax * dt;
    velY.value += ay * dt;

    velX.value *= 0.98;
    velY.value *= 0.98;

    posX.value += velX.value * dt;
    posY.value += velY.value * dt;

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
