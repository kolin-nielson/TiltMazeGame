import { useEffect, useRef, useCallback } from 'react';
import Matter from 'matter-js';
import { Maze, Position } from '../types';

interface PhysicsOptions {
  width: number;
  height: number;
  gravityScale?: number;
  ballRadius?: number;
  tickRate?: number;
  wallThickness?: number;
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
}

const MAX_DELTA_MS = 16.667;
const FIXED_TIME_STEP = 1000 / 60;

export const usePhysics = (maze: Maze, options: PhysicsOptions): PhysicsWorld => {
  const { width, height, gravityScale = 0.012, ballRadius = 10, wallThickness = 10 } = options;

  const engineRef = useRef<Matter.Engine>();
  const worldRef = useRef<Matter.World>();
  const ballRef = useRef<Matter.Body>();
  const wallsRef = useRef<Matter.Body[]>([]);
  const goalRef = useRef<Matter.Body>();
  const tickerRef = useRef<number | null>(null);
  const goalReachedRef = useRef<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  useEffect(() => {
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 1 },
      enableSleeping: false,
      constraintIterations: 6,
      positionIterations: 8,
      velocityIterations: 8,
    });

    const world = engine.world;

    const ball = Matter.Bodies.circle(maze.startPosition.x, maze.startPosition.y, ballRadius, {
      label: 'ball',
      restitution: 0.4,
      friction: 0.002,
      frictionAir: 0.001,
      frictionStatic: 0.003,
      density: 0.15,
      inertia: Infinity,
      slop: 0.05,
      render: {
        fillStyle: '#FF4081',
      },
      collisionFilter: {
        category: 0x0002,
        mask: 0x0001,
      },
    });

    const walls = maze.walls.map(wall =>
      Matter.Bodies.rectangle(
        wall.x + wall.width / 2,
        wall.y + wall.height / 2,
        wall.width + (wall.width < 20 ? 6 : 3),
        wall.height + (wall.height < 20 ? 6 : 3),
        {
          isStatic: true,
          friction: 0.2,
          restitution: 0.3,
          slop: 0.05,
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
        friction: 0.2,
        restitution: 0.3,
        slop: 0.05,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002,
        },
      }),
      Matter.Bodies.rectangle(150, 305, 320, 10, {
        isStatic: true,
        label: 'boundary',
        friction: 0.2,
        restitution: 0.3,
        slop: 0.05,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002,
        },
      }),
      Matter.Bodies.rectangle(-5, 150, 10, 320, {
        isStatic: true,
        label: 'boundary',
        friction: 0.2,
        restitution: 0.3,
        slop: 0.05,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002,
        },
      }),
      Matter.Bodies.rectangle(305, 150, 10, 320, {
        isStatic: true,
        label: 'boundary',
        friction: 0.2,
        restitution: 0.3,
        slop: 0.05,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0002,
        },
      }),
    ];

    const goal = Matter.Bodies.circle(maze.endPosition.x, maze.endPosition.y, ballRadius * 1.5, {
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

        if (frameTime > 200) {
          frameTime = FIXED_TIME_STEP;
        }

        lastTimeRef.current = now;
        accumulatorRef.current += frameTime;

        while (accumulatorRef.current >= FIXED_TIME_STEP) {
          Matter.Engine.update(engineRef.current!, FIXED_TIME_STEP);
          accumulatorRef.current -= FIXED_TIME_STEP;
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
  }, [maze, ballRadius, gravityScale, width, height]);

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

      const gravityMagnitude = 0.001;

      engineRef.current.gravity.x = tiltX * gravityMagnitude;
      engineRef.current.gravity.y = tiltY * gravityMagnitude;

      const maxVelocity = 2.5;
      const velocity = ballRef.current.velocity;

      const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      if (currentSpeed > 0) {
        const speedFactor = Math.min(maxVelocity / currentSpeed, 1);
        const newVelX = velocity.x * speedFactor;
        const newVelY = velocity.y * speedFactor;

        Matter.Body.setVelocity(ballRef.current, {
          x: newVelX,
          y: newVelY,
        });
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
    [ballRadius]
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
    if (ballRef.current) {
      return {
        x: ballRef.current.position.x,
        y: ballRef.current.position.y,
      };
    }
    return maze.startPosition;
  };

  const isGoalReached = (): boolean => {
    return goalReachedRef.current;
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
  };
};
