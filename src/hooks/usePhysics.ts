import { useEffect, useRef, useCallback, useState } from 'react';
import Matter from 'matter-js';
import { Maze, Position } from '../types';
import { Platform } from 'react-native';
import { Dimensions } from 'react-native';

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
  getBallPosition: () => Position;
  isGoalReached: () => boolean;
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

export const usePhysics = (maze: Maze, options: PhysicsOptions): PhysicsWorld => {
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
  const goalRef = useRef<Matter.Body>();
  const tickerRef = useRef<number | null>(null);
  const goalReachedRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

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
        mask: 0x0001,
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
      render: { fillStyle: '#4CAF50' },
    });

    Matter.Events.on(engine, 'collisionStart', event => {
      const pairs = event.pairs;

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];

        if (
          (pair.bodyA === ball && pair.bodyB === goal) ||
          (pair.bodyA === goal && pair.bodyB === ball)
        ) {
          goalReachedRef.current = true;
        }
      }
    });

    Matter.Composite.add(world, [ball, ...walls, ...boundWalls, goal]);

    engineRef.current = engine;
    worldRef.current = world;
    ballRef.current = ball;
    wallsRef.current = [...walls, ...boundWalls];
    goalRef.current = goal;
    lastTimeRef.current = performance.now();
    accumulatorRef.current = 0;

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

        tickerRef.current = requestAnimationFrame(tick);
      };

      tick();
    }

    return () => {
      if (tickerRef.current !== null) {
        cancelAnimationFrame(tickerRef.current);
        tickerRef.current = null;
      }

      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
    };
  }, [maze, ballRadius, gravityScale, width, height, qualityLevel, getPhysicsQualitySettings]);

  const reset = () => {
    if (ballRef.current && engineRef.current) {
      Matter.Body.setPosition(ballRef.current, {
        x: maze.startPosition.x,
        y: maze.startPosition.y,
      });

      Matter.Body.setVelocity(ballRef.current, {
        x: 0,
        y: 0,
      });

      Matter.Body.setAngularVelocity(ballRef.current, 0);

      engineRef.current.gravity.x = 0;
      engineRef.current.gravity.y = 0;

      goalReachedRef.current = false;

      lastTimeRef.current = performance.now();
      accumulatorRef.current = 0;
    }
  };

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

  const getBallPosition = (): Position => {
    if (!ballRef.current) return { x: 0, y: 0 };
    return { x: ballRef.current.position.x, y: ballRef.current.position.y };
  };

  const isGoalReached = (): boolean => {
    return goalReachedRef.current;
  };

  // Add a function to change quality level dynamically
  const changeQualityLevel = (level: 'low' | 'medium' | 'high') => {
    setQualityLevel(level);
  };

  return {
    engine: engineRef.current!,
    world: worldRef.current!,
    ball: ballRef.current!,
    walls: wallsRef.current,
    goal: goalRef.current!,
    reset,
    update,
    getBallPosition,
    isGoalReached,
    setQualityLevel: changeQualityLevel,
  };
};
