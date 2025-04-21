import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { Platform, Dimensions } from 'react-native';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Maze, LaserGate, Wall, Coin } from '../types';
import { useAppDispatch } from '@store';
import { collectCoin } from '@store/slices/shopSlice';

const lineIntersectsLine = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number
): boolean => {
  const dx1 = x2 - x1;
  const dy1 = y2 - y1;
  const dx2 = x4 - x3;
  const dy2 = y4 - y3;

  const determinant = dx1 * dy2 - dy1 * dx2;

  if (determinant === 0) return false;

  const t1 = ((x3 - x1) * dy2 - (y3 - y1) * dx2) / determinant;
  const t2 = ((x1 - x3) * dy1 - (y1 - y3) * dx1) / -determinant;

  return t1 >= 0 && t1 <= 1 && t2 >= 0 && t2 <= 1;
};

const lineIntersectsRectangle = (
  line: { x1: number; y1: number; x2: number; y2: number },
  rectX1: number,
  rectY1: number,
  rectX2: number,
  rectY2: number
): boolean => {
  return (
    lineIntersectsLine(line.x1, line.y1, line.x2, line.y2, rectX1, rectY1, rectX2, rectY1) ||
    lineIntersectsLine(line.x1, line.y1, line.x2, line.y2, rectX1, rectY2, rectX2, rectY2) ||
    lineIntersectsLine(line.x1, line.y1, line.x2, line.y2, rectX1, rectY1, rectX1, rectY2) ||
    lineIntersectsLine(line.x1, line.y1, line.x2, line.y2, rectX2, rectY1, rectX2, rectY2)
  );
};

export interface PhysicsOptions {
  width: number;
  height: number;
  gravityScale?: number;
  ballRadius?: number;
  tickRate?: number;
  wallThickness?: number;
  qualityLevel?: 'low' | 'medium' | 'high';
  vibrationEnabled?: boolean;
}

interface PhysicsWorld {
  engine: Matter.Engine;
  world: Matter.World;
  ball: Matter.Body;
  walls: Matter.Body[];
  goal: Matter.Body;
  reset: () => void;
  update: (tiltX: number, tiltY: number) => void;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  goalReached: boolean;
  gameOver: boolean;
  setQualityLevel: (level: 'low' | 'medium' | 'high') => void;
}

const FIXED_TIME_STEP = 1000 / 240;
const LOW_QUALITY_TIME_STEP = 1000 / 120;

const isLowEndDevice = () => {
  const { width, height } = Dimensions.get('window');
  const screenPixels = width * height;

  if (Platform.OS === 'android') {
    return screenPixels <= 2350000;
  }

  return false;
};
export const usePhysics = (maze: Maze | null, options: PhysicsOptions): PhysicsWorld => {
  const {
    width,
    height,
    gravityScale = 0.015,
    ballRadius = 7,
    wallThickness = 10,
    qualityLevel: initialQualityLevel = isLowEndDevice() ? 'low' : 'high',
    vibrationEnabled = true,
  } = options;

  const [qualityLevel, setQualityLevel] = useState<'low' | 'medium' | 'high'>(initialQualityLevel);

  const engineRef = useRef<Matter.Engine>();
  const worldRef = useRef<Matter.World>();
  const ballRef = useRef<Matter.Body>();
  const wallsRef = useRef<Matter.Body[]>([]);
  const laserGatesRef = useRef<Matter.Body[]>([]);
  const goalRef = useRef<Matter.Body>();
  const tickerRef = useRef<number | null>(null);
  const [goalReached, setGoalReached] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  const ballPositionX = useSharedValue(maze?.startPosition.x ?? 0);
  const ballPositionY = useSharedValue(maze?.startPosition.y ?? 0);

  const getPhysicsQualitySettings = useCallback(() => {
    switch (qualityLevel) {
      case 'low':
        return {
          constraintIterations: 2,
          positionIterations: 8,
          velocityIterations: 8,
          timeStep: LOW_QUALITY_TIME_STEP,
          frictionAir: 0.0006,
          sleepThreshold: 60,
        };
      case 'medium':
        return {
          constraintIterations: 4,
          positionIterations: 12,
          velocityIterations: 12,
          timeStep: FIXED_TIME_STEP,
          frictionAir: 0.0004,
          sleepThreshold: 45,
        };
      case 'high':
      default:
        return {
          constraintIterations: 6,
          positionIterations: 16,
          velocityIterations: 16,
          timeStep: FIXED_TIME_STEP,
          frictionAir: 0.0003,
          sleepThreshold: 30,
        };
    }
  }, [qualityLevel]);

  useEffect(() => {
    if (!maze) return;

    runOnJS(setGoalReached)(false);
    runOnJS(setGameOver)(false);

    const qualitySettings = getPhysicsQualitySettings();

    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 1 },
      enableSleeping: false,
      constraintIterations: qualitySettings.constraintIterations,
      positionIterations: Math.max(8, qualitySettings.positionIterations),
      velocityIterations: Math.max(8, qualitySettings.velocityIterations),
    });

    engine.timing.timeScale = 1;
    engine.timing.lastDelta = 16.67;

    const world = engine.world;

    const ball = Matter.Bodies.circle(maze.startPosition.x, maze.startPosition.y, ballRadius, {
      label: 'ball',
      restitution: 0.05,
      friction: 0.002,
      frictionAir: qualitySettings.frictionAir,
      frictionStatic: 0.003,
      density: 0.15,
      inertia: Infinity,
      slop: 0,
      render: {
        fillStyle: '#FF4081',
      },
      collisionFilter: {
        category: 0x0002,
        mask: 0x0001 | 0x0004,
      },
    });

    const wallSimplificationFactor = 1.0;

    const walls: Matter.Body[] = maze.walls.map((wall: Wall) =>
      Matter.Bodies.rectangle(
        wall.x + wall.width / 2,
        wall.y + wall.height / 2,
        wall.width,
        wall.height,
        {
          isStatic: true,
          friction: 0.2,
          restitution: 0.01,
          slop: 0,
          collisionFilter: {
            category: 0x0001,
            mask: 0x0002,
          },
          chamfer: { radius: 0 },
          render: { fillStyle: '#333333' },
        }
      )
    );

    const boundWalls = [
      Matter.Bodies.rectangle(150, -5, 320, 10, {
        isStatic: true,
        label: 'boundary',
        friction: 0.05,
        restitution: 0.1,
        slop: 0.01,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002,
        },
      }),
      Matter.Bodies.rectangle(150, 305, 320, 10, {
        isStatic: true,
        label: 'boundary',
        friction: 0.05,
        restitution: 0.1,
        slop: 0.01,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002,
        },
      }),
      Matter.Bodies.rectangle(-5, 150, 10, 320, {
        isStatic: true,
        label: 'boundary',
        friction: 0.05,
        restitution: 0.1,
        slop: 0.01,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002,
        },
      }),
      Matter.Bodies.rectangle(305, 150, 10, 320, {
        isStatic: true,
        label: 'boundary',
        friction: 0.05,
        restitution: 0.1,
        slop: 0.01,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002,
        },
      }),
    ];

    const goal = Matter.Bodies.circle(maze.endPosition.x, maze.endPosition.y, ballRadius * 1.8, {
      isStatic: true,
      isSensor: true,
      label: 'goal',
      render: { fillStyle: '#4CAF50' },
    });

    const laserGates: Matter.Body[] = [];
    if (maze.laserGates && maze.laserGates.length > 0) {
      maze.laserGates.forEach((laserGate: LaserGate) => {
        const laserBody = Matter.Bodies.rectangle(
          laserGate.x + laserGate.width / 2,
          laserGate.y + laserGate.height / 2,
          laserGate.width,
          laserGate.height,
          {
            isStatic: true,
            isSensor: true,
            label: `laser-${laserGate.id}`,
            render: { fillStyle: '#FF0000' },
            collisionFilter: {
              category: 0x0004,
              mask: 0x0002,
            },
            friction: 0,
            frictionAir: 0,
            restitution: 0,

            plugin: {
              laserGate: laserGate,
            },
          }
        );
        laserGates.push(laserBody);
      });
    }

    gameOverTriggeredRef.current = false;

    const currentEngine = engine;

    Matter.Events.on(currentEngine, 'collisionStart', event => {
      const pairs = event.pairs;

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        if (
          (bodyA.label === 'ball' && bodyB.label === 'goal') ||
          (bodyA.label === 'goal' && bodyB.label === 'ball')
        ) {
          runOnJS(setGoalReached)(true);
          if (vibrationEnabled) {
            runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
          }
        }

        if (
          !gameOverTriggeredRef.current &&
          ((bodyA.label === 'ball' && bodyB.label?.startsWith('laser-')) ||
            (bodyA.label?.startsWith('laser-') && bodyB.label === 'ball'))
        ) {
          const laserBody = bodyA.label?.startsWith('laser-') ? bodyA : bodyB;
          const laserGate = laserBody.plugin?.laserGate as LaserGate;

          const now = Date.now();
          const cyclePosition =
            ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
          const isLaserActive = cyclePosition < laserGate.onDuration;

          if (isLaserActive) {
            gameOverTriggeredRef.current = true;
            runOnJS(setGameOver)(true);
            if (vibrationEnabled) {
              runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Error);
            }
            break;
          }
        }
      }
    });

    Matter.Events.on(currentEngine, 'collisionActive', event => {
      if (gameOverTriggeredRef.current) return;

      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        if (
          (bodyA.label === 'ball' && bodyB.label?.startsWith('laser-')) ||
          (bodyA.label?.startsWith('laser-') && bodyB.label === 'ball')
        ) {
          const laserBody = bodyA.label?.startsWith('laser-') ? bodyA : bodyB;
          const laserGate = laserBody.plugin?.laserGate as LaserGate;

          const now = Date.now();
          const cyclePosition =
            ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
          const isLaserActive = cyclePosition < laserGate.onDuration;

          if (isLaserActive && !gameOverTriggeredRef.current) {
            gameOverTriggeredRef.current = true;
            runOnJS(setGameOver)(true);
            if (vibrationEnabled) {
              runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Error);
            }
            break;
          }
        }
      }
    });

    Matter.Composite.add(world, [ball, ...walls, ...boundWalls, ...laserGates, goal]);

    engineRef.current = engine;
    worldRef.current = world;
    ballRef.current = ball;
    wallsRef.current = [...walls, ...boundWalls];
    laserGatesRef.current = laserGates;
    goalRef.current = goal;
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;

    ballPositionX.value = maze.startPosition.x;
    ballPositionY.value = maze.startPosition.y;
    if (tickerRef.current === null) {
      const tick = () => {
        const now = performance.now();
        let frameTime = now - lastTimeRef.current;

        if (frameTime > 200) {
          frameTime = qualitySettings.timeStep;
        }

        lastTimeRef.current = now;
        accumulatorRef.current += frameTime;

        const timeStep = qualitySettings.timeStep;

        while (accumulatorRef.current >= timeStep) {
          const prevPos = { x: ballRef.current!.position.x, y: ballRef.current!.position.y };

          Matter.Engine.update(engineRef.current!, timeStep);
          accumulatorRef.current -= timeStep;

          if (ballRef.current) {
            const newPos = { x: ballRef.current.position.x, y: ballRef.current.position.y };
            const collisions = Matter.Query.ray(wallsRef.current, prevPos, newPos);
            if (collisions.length > 0) {
              Matter.Body.setPosition(ballRef.current, prevPos);
              const vel = ballRef.current.velocity;
              Matter.Body.setVelocity(ballRef.current, { x: -vel.x * 0.5, y: -vel.y * 0.5 });
              accumulatorRef.current = 0;
              break;
            }
          }
        }

        if (ballRef.current) {
          ballPositionX.value = ballRef.current.position.x;
          ballPositionY.value = ballRef.current.position.y;
        }

        tickerRef.current = requestAnimationFrame(tick);
      };

      tick();
    }

    return () => {
      if (tickerRef.current !== null) {
        cancelAnimationFrame(tickerRef.current);
        tickerRef.current = null;
      }

      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
      }

      engineRef.current = undefined;
      worldRef.current = undefined;
      ballRef.current = undefined;
      wallsRef.current = [];
      laserGatesRef.current = [];
      goalRef.current = undefined;

      Matter.Events.off(currentEngine, 'collisionStart');
      Matter.Events.off(currentEngine, 'collisionActive');
    };
  }, [
    maze,
    width,
    height,
    ballRadius,
    gravityScale,
    wallThickness,
    qualityLevel,
    getPhysicsQualitySettings,
    ballPositionX,
    ballPositionY,
  ]);

  const gameOverTriggeredRef = useRef(false);

  const reset = useCallback(() => {
    if (ballRef.current && engineRef.current && maze) {
      const startX = maze.startPosition.x;
      const startY = maze.startPosition.y;
      Matter.Body.setPosition(ballRef.current, { x: startX, y: startY });
      Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });

      Matter.Body.setAngularVelocity(ballRef.current, 0);

      gameOverTriggeredRef.current = false;
      runOnJS(setGoalReached)(false);
      runOnJS(setGameOver)(false);

      lastTimeRef.current = performance.now();
      accumulatorRef.current = 0;

      if (ballRef.current.isSleeping) {
        Matter.Sleeping.set(ballRef.current, false);
      }

      ballPositionX.value = startX;
      ballPositionY.value = startY;
    }
  }, [maze, ballPositionX, ballPositionY, setGoalReached, setGameOver]);

  const update = useCallback(
    (tiltX: number, tiltY: number) => {
      if (!engineRef.current || !ballRef.current) return;

      let gravityMagnitude = 0.0025;

      if (qualityLevel === 'low') {
        gravityMagnitude = 0.003;
      } else if (qualityLevel === 'high') {
        gravityMagnitude = 0.0022;
      }

      const position = ballRef.current.position;
      const mazeSize = 300;
      const centerBiasRange = 30;

      const distFromLeftEdge = position.x;
      const distFromRightEdge = mazeSize - position.x;
      const distFromTopEdge = position.y;
      const distFromBottomEdge = mazeSize - position.y;

      let horizontalBias = 0;
      let verticalBias = 0;

      if (distFromLeftEdge < centerBiasRange) {
        horizontalBias = 0.3 * (1 - distFromLeftEdge / centerBiasRange);
      } else if (distFromRightEdge < centerBiasRange) {
        horizontalBias = -0.3 * (1 - distFromRightEdge / centerBiasRange);
      }

      if (distFromTopEdge < centerBiasRange) {
        verticalBias = 0.3 * (1 - distFromTopEdge / centerBiasRange);
      } else if (distFromBottomEdge < centerBiasRange) {
        verticalBias = -0.3 * (1 - distFromBottomEdge / centerBiasRange);
      }

      engineRef.current.gravity.x = (tiltX + horizontalBias) * gravityMagnitude;
      engineRef.current.gravity.y = (tiltY + verticalBias) * gravityMagnitude;

      let maxVelocity = 1.2;
      if (qualityLevel === 'low') {
        maxVelocity = 1.0;
      }

      const velocity = ballRef.current.velocity;
      const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      if (currentSpeed > 0) {
        let speedFactor = 1.0;

        if (currentSpeed > maxVelocity) {
          const ratio = currentSpeed / maxVelocity;
          speedFactor = 1 / (ratio * 1.05);
        } else if (currentSpeed > maxVelocity * 0.75) {
          const excess = (currentSpeed - maxVelocity * 0.75) / (maxVelocity * 0.25);
          speedFactor = 1.0 - excess * 0.35;
        }

        if (speedFactor < 1.0) {
          const newVelX = velocity.x * speedFactor;
          const newVelY = velocity.y * speedFactor;

          const frictionFactor = Math.min(0.98, 1.0 - (currentSpeed / maxVelocity) * 0.05);

          Matter.Body.setVelocity(ballRef.current, {
            x: newVelX * frictionFactor,
            y: newVelY * frictionFactor,
          });
        }
      }

      const radius = ballRadius;

      if (position.x < radius) {
        Matter.Body.setPosition(ballRef.current, {
          x: radius,
          y: position.y,
        });

        const dampening = Math.max(0.3, 0.7 - Math.abs(velocity.x) * 0.1);

        Matter.Body.setVelocity(ballRef.current, {
          x: Math.abs(velocity.x) * -0.2,
          y: velocity.y * dampening,
        });
      } else if (position.x > mazeSize - radius) {
        Matter.Body.setPosition(ballRef.current, {
          x: mazeSize - radius,
          y: position.y,
        });

        const dampening = Math.max(0.3, 0.7 - Math.abs(velocity.x) * 0.1);

        Matter.Body.setVelocity(ballRef.current, {
          x: Math.abs(velocity.x) * -0.2,
          y: velocity.y * dampening,
        });
      }

      if (position.y < radius) {
        Matter.Body.setPosition(ballRef.current, {
          x: position.x,
          y: radius,
        });

        const dampening = Math.max(0.3, 0.7 - Math.abs(velocity.y) * 0.1);

        Matter.Body.setVelocity(ballRef.current, {
          x: velocity.x * dampening,
          y: Math.abs(velocity.y) * -0.2,
        });
      } else if (position.y > mazeSize - radius) {
        Matter.Body.setPosition(ballRef.current, {
          x: position.x,
          y: mazeSize - radius,
        });

        const dampening = Math.max(0.3, 0.7 - Math.abs(velocity.y) * 0.1);

        Matter.Body.setVelocity(ballRef.current, {
          x: velocity.x * dampening,
          y: Math.abs(velocity.y) * -0.2,
        });
      }

      const predictedX = position.x + velocity.x * 2;
      const predictedY = position.y + velocity.y * 2;

      const potentialCollisions = wallsRef.current.filter(wall => {
        if (!wall.bounds) return false;

        const bounds = wall.bounds;

        const safeRadius = radius * 1.5;

        return (
          predictedX + safeRadius > bounds.min.x &&
          predictedX - safeRadius < bounds.max.x &&
          predictedY + safeRadius > bounds.min.y &&
          predictedY - safeRadius < bounds.max.y
        );
      });

      if (ballRef.current && currentSpeed > 0) {
        const timeSteps = 3;
        const dt = 1 / 60;

        const pos = { x: position.x, y: position.y };
        const vel = { x: velocity.x, y: velocity.y };

        const futurePos = {
          x: pos.x + vel.x * dt * timeSteps,
          y: pos.y + vel.y * dt * timeSteps,
        };

        const willCollide = potentialCollisions.some(wall => {
          if (!wall.bounds) return false;

          const line = { x1: pos.x, y1: pos.y, x2: futurePos.x, y2: futurePos.y };

          return lineIntersectsRectangle(
            line,
            wall.bounds.min.x,
            wall.bounds.min.y,
            wall.bounds.max.x,
            wall.bounds.max.y
          );
        });

        if (willCollide) {
          const reductionFactor = Math.min(0.5, 1.0 / (currentSpeed + 0.1));
          Matter.Body.setVelocity(ballRef.current, {
            x: velocity.x * reductionFactor,
            y: velocity.y * reductionFactor,
          });

          potentialCollisions.forEach(wall => {
            const dirX = position.x - wall.position.x;
            const dirY = position.y - wall.position.y;
            const distance = Math.sqrt(dirX * dirX + dirY * dirY);

            if (distance > 0) {
              const repulsionForce = 0.002 / Math.max(distance, 0.5);
              Matter.Body.applyForce(ballRef.current!, position, {
                x: (dirX / distance) * repulsionForce,
                y: (dirY / distance) * repulsionForce,
              });
            }
          });
        } else if (potentialCollisions.length > 0 && currentSpeed > 0.3) {
          Matter.Body.setVelocity(ballRef.current, {
            x: velocity.x * 0.7,
            y: velocity.y * 0.7,
          });

          potentialCollisions.forEach(wall => {
            const dirX = position.x - wall.position.x;
            const dirY = position.y - wall.position.y;
            const distance = Math.sqrt(dirX * dirX + dirY * dirY);

            if (distance > 0) {
              const repulsionForce = 0.001 / Math.max(distance, 1);
              Matter.Body.applyForce(ballRef.current!, position, {
                x: (dirX / distance) * repulsionForce,
                y: (dirY / distance) * repulsionForce,
              });
            }
          });
        }
      }
    },
    [qualityLevel]
  );

  const changeQualityLevel = (level: 'low' | 'medium' | 'high') => {
    setQualityLevel(level);
  };

  const physicsWorld = useMemo(
    () => ({
      engine: engineRef.current!,
      world: worldRef.current!,
      ball: ballRef.current!,
      walls: wallsRef.current,
      goal: goalRef.current!,
      reset,
      update,
      ballPositionX,
      ballPositionY,
      goalReached,
      gameOver,
      setQualityLevel: changeQualityLevel,
      laserGates: laserGatesRef.current.map(lg => lg.plugin?.laserGate as LaserGate),
    }),
    [reset, update, ballPositionX, ballPositionY, goalReached, gameOver, changeQualityLevel]
  );

  return physicsWorld;
};
