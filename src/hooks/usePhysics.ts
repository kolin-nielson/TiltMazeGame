import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { Platform, Dimensions } from 'react-native';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Maze, LaserGate } from '../types';

interface PhysicsOptions {
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

const FIXED_TIME_STEP = 1000 / 60;
const LOW_QUALITY_TIME_STEP = 1000 / 30;

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
    vibrationEnabled = true
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
          constraintIterations: 1,
          positionIterations: 2,
          velocityIterations: 2,
          timeStep: LOW_QUALITY_TIME_STEP,
          frictionAir: 0.0005, // Slightly higher air friction for stability
          sleepThreshold: 60,  // Higher sleep threshold
        };
      case 'medium':
        return {
          constraintIterations: 2,
          positionIterations: 4,
          velocityIterations: 3,
          timeStep: FIXED_TIME_STEP,
          frictionAir: 0.0003,
          sleepThreshold: 45,
        };
      case 'high':
      default:
        return {
          constraintIterations: 2,
          positionIterations: 6,
          velocityIterations: 4,
          timeStep: FIXED_TIME_STEP,
          frictionAir: 0.0002,
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
      positionIterations: qualitySettings.positionIterations,
      velocityIterations: qualitySettings.velocityIterations,
    });

    const world = engine.world;

    const ball = Matter.Bodies.circle(maze.startPosition.x, maze.startPosition.y, ballRadius, {
      label: 'ball',
      restitution: 0.2,
      friction: 0.0005,
      frictionAir: qualitySettings.frictionAir,
      frictionStatic: 0.001,
      density: 0.08,
      inertia: Infinity,
      slop: 0.01,
      render: {
        fillStyle: '#FF4081',
      },
      collisionFilter: {
        category: 0x0002,
        mask: 0x0001 | 0x0004,
      },
    });


    const wallSimplificationFactor = qualityLevel === 'low' ? 0.99 : 0.98;

    const walls = maze.walls.map(wall =>
      Matter.Bodies.rectangle(
        wall.x + wall.width / 2,
        wall.y + wall.height / 2,
        wall.width * wallSimplificationFactor,
        wall.height * wallSimplificationFactor,
        {
          isStatic: true,
          friction: 0.05,
          restitution: 0.1,
          slop: 0.01,
          collisionFilter: {
            category: 0x0001,
            mask: 0x0002,
          },
          chamfer: { radius: qualityLevel === 'low' ? 0 : 1 },
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
      maze.laserGates.forEach(laserGate => {
        const laserBody = Matter.Bodies.rectangle(
          laserGate.x + laserGate.width / 2,
          laserGate.y + laserGate.height / 2,
          laserGate.width,
          laserGate.height,
          {
            isStatic: true,
            isSensor: true, // Make it a sensor so it doesn't affect physics but still detects collisions
            label: `laser-${laserGate.id}`,
            render: { fillStyle: '#FF0000' },
            collisionFilter: {
              category: 0x0004, // New category for lasers
              mask: 0x0002,    // Only collide with ball (category 0x0002)
            },
            friction: 0,      // No friction
            frictionAir: 0,   // No air friction
            restitution: 0,   // No bounce

            plugin: {
              laserGate: laserGate
            }
          }
        );
        laserGates.push(laserBody);
      });
    }

    gameOverTriggeredRef.current = false;

    Matter.Events.on(engine, 'collisionStart', event => {
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
          const cyclePosition = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
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


    Matter.Events.on(engine, 'collisionActive', event => {

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
          const cyclePosition = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
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
          Matter.Engine.update(engineRef.current!, timeStep);
          accumulatorRef.current -= timeStep;
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
    };
  }, [maze, width, height, ballRadius, gravityScale, wallThickness, qualityLevel, getPhysicsQualitySettings, ballPositionX, ballPositionY]);


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
      }

      engineRef.current.gravity.x = tiltX * gravityMagnitude;
      engineRef.current.gravity.y = tiltY * gravityMagnitude;

      let maxVelocity = 3.0;
      if (qualityLevel === 'low') {
        maxVelocity = 2.5;
      }

      const velocity = ballRef.current.velocity;
      const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      if (currentSpeed > 0) {
        if (currentSpeed > maxVelocity) {
          const speedFactor = maxVelocity / currentSpeed;
          const newVelX = velocity.x * speedFactor;
          const newVelY = velocity.y * speedFactor;

          Matter.Body.setVelocity(ballRef.current, {
            x: newVelX,
            y: newVelY,
          });
        }
      }

      const position = ballRef.current.position;
      const radius = ballRadius;
      const mazeSize = 300;

      if (position.x < radius) {
        Matter.Body.setPosition(ballRef.current, {
          x: radius,
          y: position.y,
        });
        Matter.Body.setVelocity(ballRef.current, {
          x: 0,
          y: velocity.y * 0.5,
        });
      } else if (position.x > mazeSize - radius) {
        Matter.Body.setPosition(ballRef.current, {
          x: mazeSize - radius,
          y: position.y,
        });
        Matter.Body.setVelocity(ballRef.current, {
          x: 0,
          y: velocity.y * 0.5,
        });
      }

      if (position.y < radius) {
        Matter.Body.setPosition(ballRef.current, {
          x: position.x,
          y: radius,
        });
        Matter.Body.setVelocity(ballRef.current, {
          x: velocity.x * 0.5,
          y: 0,
        });
      } else if (position.y > mazeSize - radius) {
        Matter.Body.setPosition(ballRef.current, {
          x: position.x,
          y: mazeSize - radius,
        });
        Matter.Body.setVelocity(ballRef.current, {
          x: velocity.x * 0.5,
          y: 0,
        });
      }

      const predictedX = position.x + velocity.x * 2;
      const predictedY = position.y + velocity.y * 2;

      const potentialCollisions = wallsRef.current.filter(wall => {
        if (!wall.bounds) return false;

        const bounds = wall.bounds;

        const safeRadius = radius * 1.2;

        return (
          predictedX + safeRadius > bounds.min.x &&
          predictedX - safeRadius < bounds.max.x &&
          predictedY + safeRadius > bounds.min.y &&
          predictedY - safeRadius < bounds.max.y
        );
      });

      if (potentialCollisions.length > 0 && currentSpeed > 1 && ballRef.current) {
        Matter.Body.setVelocity(ballRef.current, {
          x: velocity.x * 0.8,
          y: velocity.y * 0.8,
        });

        potentialCollisions.forEach(wall => {
          const dirX = position.x - wall.position.x;
          const dirY = position.y - wall.position.y;
          const distance = Math.sqrt(dirX * dirX + dirY * dirY);

          if (distance > 0) {
            const repulsionForce = 0.0003 / Math.max(distance, 1);
            Matter.Body.applyForce(ballRef.current!, position, {
              x: (dirX / distance) * repulsionForce,
              y: (dirY / distance) * repulsionForce,
            });
          }
        });
      }
    },
    [qualityLevel]
  );

  const changeQualityLevel = (level: 'low' | 'medium' | 'high') => {
    setQualityLevel(level);
  };

  // Memoize the returned object
  const physicsWorld = useMemo(() => ({
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
  }), [reset, update, ballPositionX, ballPositionY, goalReached, gameOver, changeQualityLevel]);

  return physicsWorld;
};
