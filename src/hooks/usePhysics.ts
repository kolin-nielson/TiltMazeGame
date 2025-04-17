import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { Maze, Position, LaserGate } from '../types';
import { Platform } from 'react-native';
import { Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedReaction, runOnJS } from 'react-native-reanimated';

interface PhysicsOptions {
  width: number;
  height: number;
  gravityScale?: number;
  ballRadius?: number;
  tickRate?: number;
  wallThickness?: number;
  qualityLevel?: 'low' | 'medium' | 'high';
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

const MAX_DELTA_MS = 16.667;
const FIXED_TIME_STEP = 1000 / 60;
const LOW_QUALITY_TIME_STEP = 1000 / 30;

// Detect if we're on a lower-end device
const isLowEndDevice = () => {
  // For Android, we can use screen dimensions as a rough proxy for device capability
  // More sophisticated detection would require native modules
  const { width, height } = Dimensions.get('window');
  const screenPixels = width * height;

  if (Platform.OS === 'android') {
    // Pixel 3 has 1080 x 2160 resolution (2,332,800 pixels)
    // Consider similar or lower resolution devices as lower-end
    return screenPixels <= 2350000;
  }

  return false;
};

// Accept Maze or null
export const usePhysics = (maze: Maze | null, options: PhysicsOptions): PhysicsWorld => {
  const {
    width,
    height,
    gravityScale = 0.015,
    ballRadius = 7,
    wallThickness = 10,
    qualityLevel: initialQualityLevel = isLowEndDevice() ? 'low' : 'high'
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

  // Create SharedValues for ball position
  const ballPositionX = useSharedValue(maze?.startPosition.x ?? 0);
  const ballPositionY = useSharedValue(maze?.startPosition.y ?? 0);

  // Configure physics quality parameters based on device capability
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
        mask: 0x0001 | 0x0004, // Collide with walls (0x0001) and lasers (0x0004)
      },
    });

    // Use simpler wall collision boxes on lower-end devices
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

    // Create laser gates if they exist in the maze
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
            // Store the laser gate data for reference
            plugin: {
              laserGate: laserGate
            }
          }
        );
        laserGates.push(laserBody);
      });
    }

    // Log all collision categories for debugging
    console.log('Ball collision category:', 0x0002);
    console.log('Wall collision category:', 0x0001);
    console.log('Laser collision category:', 0x0004);
    console.log('Ball collision mask:', 0x0001 | 0x0004);
    console.log('Laser collision mask:', 0x0002);

    // Log all laser gates for debugging
    if (maze.laserGates && maze.laserGates.length > 0) {
      console.log(`Created ${maze.laserGates.length} laser gates in physics engine`);
      maze.laserGates.forEach(laserGate => {
        console.log(`Laser gate ${laserGate.id} at (${laserGate.x}, ${laserGate.y}) with size ${laserGate.width}x${laserGate.height}`);
      });
    } else {
      console.log('No laser gates in this maze');
    }

    // Reset game over state when creating a new physics world
    gameOverTriggeredRef.current = false;
    console.log('Game over flag initialized:', gameOverTriggeredRef.current);

    Matter.Events.on(engine, 'collisionStart', event => {
      const pairs = event.pairs;
      console.log(`Collision event with ${pairs.length} pairs`);

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        console.log(`Collision between ${bodyA.label} and ${bodyB.label}`);

        if (
          (bodyA.label === 'ball' && bodyB.label === 'goal') ||
          (bodyA.label === 'goal' && bodyB.label === 'ball')
        ) {
          console.log('Goal reached!');
          runOnJS(setGoalReached)(true);
        }

        // Check for laser gate collisions
        if (
          !gameOverTriggeredRef.current && // Skip if game over already triggered
          ((bodyA.label === 'ball' && bodyB.label?.startsWith('laser-')) ||
          (bodyA.label?.startsWith('laser-') && bodyB.label === 'ball'))
        ) {
          const laserBody = bodyA.label?.startsWith('laser-') ? bodyA : bodyB;
          const laserGate = laserBody.plugin?.laserGate as LaserGate;

          console.log(`Laser collision detected with ${laserGate.id}`);

          // Only trigger game over if the laser is in its active phase
          // This is determined by the animation state in the MazeLaserGate component
          const now = Date.now();
          const cyclePosition = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
          const isLaserActive = cyclePosition < laserGate.onDuration;

          console.log(`Laser active check: now=${now}, interval=${laserGate.interval}, phase=${laserGate.phase}, onDuration=${laserGate.onDuration}`);
          console.log(`Cycle position: ${cyclePosition}, isActive: ${isLaserActive}`);

          if (isLaserActive) {
            console.log(`Laser collision detected with ${laserGate.id} - ACTIVE LASER - GAME OVER`);
            gameOverTriggeredRef.current = true;
            console.log('Game over flag set to:', gameOverTriggeredRef.current);
            runOnJS(setGameOver)(true);
            // Break out of the loop after triggering game over
            break;
          } else {
            console.log(`Laser collision detected with ${laserGate.id} - inactive laser, no game over`);
          }
        }
      }
    });

    // Also listen for collisionActive to catch continuous collisions
    Matter.Events.on(engine, 'collisionActive', event => {
      // Skip if game over has already been triggered
      if (gameOverTriggeredRef.current) return;

      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        // Check for laser gate collisions
        if (
          (bodyA.label === 'ball' && bodyB.label?.startsWith('laser-')) ||
          (bodyA.label?.startsWith('laser-') && bodyB.label === 'ball')
        ) {
          const laserBody = bodyA.label?.startsWith('laser-') ? bodyA : bodyB;
          const laserGate = laserBody.plugin?.laserGate as LaserGate;

          // Only trigger game over if the laser is in its active phase
          const now = Date.now();
          const cyclePosition = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
          const isLaserActive = cyclePosition < laserGate.onDuration;

          if (isLaserActive && !gameOverTriggeredRef.current) {
            console.log(`Continuous laser collision with ${laserGate.id} - ACTIVE LASER - GAME OVER`);
            gameOverTriggeredRef.current = true;
            console.log('Game over flag set to:', gameOverTriggeredRef.current);
            runOnJS(setGameOver)(true);
            // Break out of the loop after triggering game over
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

    // Initialize shared values when maze changes
    ballPositionX.value = maze.startPosition.x;
    ballPositionY.value = maze.startPosition.y;

    if (tickerRef.current === null) {
      const tick = () => {
        const now = performance.now();
        let frameTime = now - lastTimeRef.current;

        // Limit maximum frame time to prevent large jumps after app pause/resume
        if (frameTime > 200) {
          frameTime = qualitySettings.timeStep;
        }

        lastTimeRef.current = now;
        accumulatorRef.current += frameTime;

        // Use quality-dependent time step
        const timeStep = qualitySettings.timeStep;

        while (accumulatorRef.current >= timeStep) {
          Matter.Engine.update(engineRef.current!, timeStep);
          accumulatorRef.current -= timeStep;
        }

        // *** Update SharedValues after physics engine update ***
        if (ballRef.current) {
           // Use withTiming or directly set .value for immediate update
           // Direct update is usually fine here as physics drives it
           ballPositionX.value = ballRef.current.position.x;
           ballPositionY.value = ballRef.current.position.y;
        }

        // Schedule next tick
        tickerRef.current = requestAnimationFrame(tick);
      };

      tick();
    }

    // Cleanup function
    return () => {
      // 1. Stop the animation frame loop
      if (tickerRef.current !== null) {
        cancelAnimationFrame(tickerRef.current);
        tickerRef.current = null;
      }
      // 2. Clean up the Matter.js engine
      if (engineRef.current) {
        // Clear the engine (removes world, etc.)
        Matter.Engine.clear(engineRef.current);
      }
      // 3. Reset refs
      engineRef.current = undefined;
      worldRef.current = undefined;
      ballRef.current = undefined;
      wallsRef.current = [];
      laserGatesRef.current = [];
      goalRef.current = undefined;
    };
  }, [maze, width, height, ballRadius, gravityScale, wallThickness, qualityLevel, getPhysicsQualitySettings, ballPositionX, ballPositionY]);

  // Create a simple boolean ref to track if game over has been triggered
  const gameOverTriggeredRef = useRef(false);

  const reset = useCallback(() => {
    if (ballRef.current && engineRef.current && maze) { // Ensure maze exists
      // IMPORTANT: This function only resets the physics engine, not the gyroscope calibration
      // This ensures the gyroscope calibration is preserved between levels

      const startX = maze.startPosition.x;
      const startY = maze.startPosition.y;
      Matter.Body.setPosition(ballRef.current, { x: startX, y: startY });
      Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });

      Matter.Body.setAngularVelocity(ballRef.current, 0);

      // Don't reset gravity to zero here - this would cause the ball to stop responding to tilt
      // Instead, let the update function handle gravity based on the current gyroscope data
      // engineRef.current.gravity.x = 0;
      // engineRef.current.gravity.y = 0;

      // Reset the game over triggered flag
      gameOverTriggeredRef.current = false;
      console.log('Game over flag reset:', gameOverTriggeredRef.current);

      runOnJS(setGoalReached)(false);
      runOnJS(setGameOver)(false);

      lastTimeRef.current = performance.now();
      accumulatorRef.current = 0;

      // Optional: Wake up the ball if it was sleeping
      if (ballRef.current.isSleeping) {
        Matter.Sleeping.set(ballRef.current, false);
      }

      // Reset shared values on the JS thread
      ballPositionX.value = startX;
      ballPositionY.value = startY;

      console.log('[Physics] Reset complete - ball position reset to start');
    }
  }, [maze, ballPositionX, ballPositionY, setGoalReached, setGameOver]);

  const update = useCallback(
    (tiltX: number, tiltY: number) => {
      if (!engineRef.current || !ballRef.current) return;

      // Adjust gravity magnitude based on quality level for consistent experience
      let gravityMagnitude = 0.0025;
      if (qualityLevel === 'low') {
        gravityMagnitude = 0.003; // Slightly stronger for low-end devices to compensate for fewer updates
      }

      engineRef.current.gravity.x = tiltX * gravityMagnitude;
      engineRef.current.gravity.y = tiltY * gravityMagnitude;

      // Adjust max velocity based on quality level for consistent experience
      let maxVelocity = 3.0;
      if (qualityLevel === 'low') {
        maxVelocity = 2.5; // Lower max velocity on low-end devices for better stability
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

  const findNearestWall = (
    position: Matter.Vector,
    walls: Matter.Body[],
    threshold: number
  ): Matter.Body | null => {
    let closest: Matter.Body | null = null;
    let closestDist = threshold;

    walls.forEach(wall => {
      const dx = wall.position.x - position.x;
      const dy = wall.position.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDist) {
        closestDist = distance;
        closest = wall;
      }
    });

    return closest;
  };

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
