import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { Platform } from 'react-native';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Maze, LaserGate, Wall, Coin } from '../types';
import { useAppDispatch } from '@store';
import { collectCoinAndSave } from '@store/slices/shopSlice';
import { collectCoin as mazeCollectCoin } from '@store/slices/mazeSlice';

const BALL_RADIUS = 7;
const BALL_DENSITY = 0.12; 
const BALL_FRICTION_AIR = 0.025; 
const BALL_RESTITUTION = 0.25; 
const BALL_FRICTION = 0.015; 
const BALL_FRICTION_STATIC = 0.12; 
const WALL_FRICTION = 0.12; 
const WALL_RESTITUTION = 0.08; 
const GRAVITY_SCALE_MULTIPLIER = 0.018; 
const PHYSICS_TIME_STEP = 1000 / 60;

// Physics constants with better balance between collision handling and responsiveness
const MAX_BALL_SPEED = 15; // Higher speed cap for more responsive movement
const COLLISION_ITERATIONS = 6; // Balanced collision resolution iterations
const POSITION_ITERATIONS = 4; // Optimized position solving iterations
const VELOCITY_ITERATIONS = 6; // Optimized velocity solving iterations
const WALL_BUFFER = 0.5; // Reduced buffer for better movement while still preventing tunneling
const CORRECTION_FACTOR = 0.6; // Increased position correction factor 

export interface PhysicsOptions {
  width: number;
  height: number;
  gravityScale?: number; 
  ballRadius?: number;
  vibrationEnabled?: boolean;
  sensitivity?: number; 
}

interface PhysicsWorld {
  engine: Matter.Engine | undefined; 
  world: Matter.World | undefined;
  ball: Matter.Body | undefined;
  reset: () => void;
  update: (tiltX: number, tiltY: number, resetVelocity?: boolean) => void;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  goalReached: boolean;
  gameOver: boolean;
}

export const usePhysics = (maze: Maze | null, options: PhysicsOptions): PhysicsWorld => {
  const {
    width,
    height,
    gravityScale = 1.0, 
    ballRadius = BALL_RADIUS,
    vibrationEnabled = true,
    sensitivity = 1.0, 
  } = options;

  const dispatch = useAppDispatch();

  const engineRef = useRef<Matter.Engine | null>(null);
  const worldRef = useRef<Matter.World | null>(null);
  const ballRef = useRef<Matter.Body | null>(null);
  const wallsRef = useRef<Matter.Body[]>([]); 
  const laserGatesRef = useRef<Matter.Body[]>([]);
  const goalRef = useRef<Matter.Body | null>(null);
  const coinCompositeRef = useRef<Matter.Composite | null>(null);
  const laserGateCompositeRef = useRef<Matter.Composite | null>(null);
  const tickerRef = useRef<number | null>(null);
  const [goalReached, setGoalReached] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const collectedCoinsRef = useRef<Set<string>>(new Set());
  const gameOverTriggeredRef = useRef(false);

  const ballPositionX = useSharedValue(maze?.startPosition.x ?? 0);
  const ballPositionY = useSharedValue(maze?.startPosition.y ?? 0);

  useEffect(() => {
    if (!maze) return;

    setGoalReached(false);
    setGameOver(false);
    gameOverTriggeredRef.current = false;
    collectedCoinsRef.current.clear();

    // Create engine with improved collision handling settings
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 1 },
      enableSleeping: false,
      positionIterations: POSITION_ITERATIONS,  
      velocityIterations: VELOCITY_ITERATIONS,  
      constraintIterations: COLLISION_ITERATIONS,
      // Use improved physics settings
      timing: {
        timeScale: 1
      }
    });

    const world = engine.world;

    // Create ball with improved properties to prevent sticking and tunneling
    const ball = Matter.Bodies.circle(maze.startPosition.x, maze.startPosition.y, ballRadius, {
      label: 'ball',
      restitution: BALL_RESTITUTION,
      friction: BALL_FRICTION,
      frictionAir: BALL_FRICTION_AIR,
      frictionStatic: BALL_FRICTION_STATIC,
      density: BALL_DENSITY,
      inertia: Infinity,
      sleepThreshold: 60, 
      collisionFilter: {
        category: 0x0002,
        mask: 0x0001 | 0x0004 | 0x0008,
      },
    });

    // Create walls with optimized collision bounds for better movement
    const walls = maze.walls.map((wall: Wall) =>
      Matter.Bodies.rectangle(
        wall.x + wall.width / 2,
        wall.y + wall.height / 2,
        // Only add buffer to very thin walls to prevent tunneling without affecting gameplay
        wall.width + (wall.width < 8 ? WALL_BUFFER * 2 : 0),
        wall.height + (wall.height < 8 ? WALL_BUFFER * 2 : 0),
        {
          label: 'wall',
          isStatic: true,
          friction: WALL_FRICTION * 0.8, // Slightly reduced friction for better movement
          restitution: WALL_RESTITUTION,
          slop: 0.02, // Slightly increased slop for smoother movement
          collisionFilter: {
            category: 0x0001,
            mask: 0x0002,
          },
        }
      )
    );

    const boundaryThickness = 20;
    const boundaryProps = {
      label: 'boundary',
      isStatic: true,
      friction: WALL_FRICTION,
      restitution: WALL_RESTITUTION,
      chamfer: { radius: 4 }, 
      slop: 0.05, 
      collisionFilter: {
        category: 0x0001,
        mask: 0x0002,
      },
    };

    const boundWalls = [
      Matter.Bodies.rectangle(width / 2, -boundaryThickness / 2, width, boundaryThickness, boundaryProps), 
      Matter.Bodies.rectangle(width / 2, height + boundaryThickness / 2, width, boundaryThickness, boundaryProps), 
      Matter.Bodies.rectangle(-boundaryThickness / 2, height / 2, boundaryThickness, height, boundaryProps), 
      Matter.Bodies.rectangle(width + boundaryThickness / 2, height / 2, boundaryThickness, height, boundaryProps), 
    ];

    const goal = Matter.Bodies.circle(maze.endPosition.x, maze.endPosition.y, ballRadius * 1.5, { 
      label: 'goal',
      isStatic: true,
      isSensor: true, 
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
            label: `laser-${laserGate.id}`,
            isStatic: true,
            isSensor: true, 
            collisionFilter: {
              category: 0x0004, 
              mask: 0x0002, 
            },
            plugin: { 
              laserGate: laserGate,
            },
          }
        );
        laserGates.push(laserBody);
      });
    }

    const coinComposite = Matter.Composite.create({ label: 'coins' });
    if (maze.coins && maze.coins.length > 0) {
      maze.coins.forEach((coin: Coin) => {
        const coinBody = Matter.Bodies.circle(
          coin.position.x,
          coin.position.y,
          ballRadius * 0.7, 
          {
            label: `coin-${coin.id}`,
            isStatic: true,
            isSensor: true, 
            collisionFilter: {
              category: 0x0008, 
              mask: 0x0002, 
            },
            plugin: { 
              coin: coin,
            },
          }
        );
        Matter.Composite.add(coinComposite, coinBody);
      });
    }

    const laserGateComposite = Matter.Composite.create({ label: 'laserGates' });
    if (maze.laserGates && maze.laserGates.length > 0) {
      maze.laserGates.forEach((laserGate: LaserGate) => {
        const laserBody = Matter.Bodies.rectangle(
          laserGate.x + laserGate.width / 2,
          laserGate.y + laserGate.height / 2,
          laserGate.width,
          laserGate.height,
          {
            label: `laser-${laserGate.id}`,
            isStatic: true,
            isSensor: true, 
            collisionFilter: {
              category: 0x0004, 
              mask: 0x0002, 
            },
            plugin: { 
              laserGate: laserGate,
            },
          }
        );
        Matter.Composite.add(laserGateComposite, laserBody);
      });
    }
    
    Matter.Composite.add(world, [
      ball,
      ...walls,
      ...boundWalls,
      ...laserGates,
      goal,
      coinComposite,
      laserGateComposite,
    ]);

    engineRef.current = engine;
    worldRef.current = world;
    ballRef.current = ball;
    wallsRef.current = [...walls, ...boundWalls]; 
    laserGatesRef.current = laserGates;
    goalRef.current = goal;
    coinCompositeRef.current = coinComposite;
    laserGateCompositeRef.current = laserGateComposite;

    const handleCollision = (event: Matter.IEventCollision<Matter.Engine>, type: 'start' | 'active') => {
      if (gameOverTriggeredRef.current) return; 

      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        const ballBody = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;
        const otherBody = ballBody === bodyA ? bodyB : bodyA;

        if (!ballBody) continue; 

        if (otherBody.label === 'goal') {
          if (!goalReached) { 
            setGoalReached(true);
            if (vibrationEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }
        else if (otherBody.label?.startsWith('coin-')) {
          const coinId = otherBody.label.replace(/^coin-/, '');
          if (collectedCoinsRef.current.has(coinId)) continue;
          collectedCoinsRef.current.add(coinId);
          const coin = otherBody.plugin?.coin as Coin;
          if (!coin) continue;
          Matter.Body.set(otherBody, {
            collisionFilter: { group: -1 } 
          });
          requestAnimationFrame(() => {
            if (coinCompositeRef.current && worldRef.current) {
              Matter.Composite.remove(coinCompositeRef.current, otherBody, true); 
            }
          });
          const value = coin?.isSpecial ? (coin.value || 10) : 1;
          for (let j = 0; j < value; j++) {
            dispatch(collectCoinAndSave());
          }
          dispatch(mazeCollectCoin(coinId)); 
          if (vibrationEnabled) {
            const impactStyle = coin?.isSpecial ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
            Haptics.impactAsync(impactStyle);
          }
        }
      }
    };

    Matter.Events.on(engine, 'collisionStart', (event) => handleCollision(event, 'start'));
    Matter.Events.on(engine, 'collisionActive', (event) => handleCollision(event, 'active'));

    lastTimeRef.current = performance.now();

    const tick = () => {
      if (!engineRef.current || !ballRef.current) {
        tickerRef.current = null;
        return; 
      }

      const currentTime = performance.now();
      const delta = currentTime - lastTimeRef.current;

      // Optimized velocity capping and physics updates for better responsiveness
      if (ballRef.current) {
        const velocity = ballRef.current.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

        // Only cap velocity at higher threshold to allow more responsive movement
        if (speed > MAX_BALL_SPEED) {
          const ratio = MAX_BALL_SPEED / speed;
          Matter.Body.setVelocity(ballRef.current, {
            x: velocity.x * ratio,
            y: velocity.y * ratio
          });
        }

        // Only use sub-stepping for very high speeds to improve performance
        const substeps = speed > MAX_BALL_SPEED * 0.85 ? 2 : 1;
        const substepDelta = delta / substeps;

        for (let i = 0; i < substeps; i++) {
          Matter.Engine.update(engineRef.current, substepDelta);

          // Only do extra collision checks for very high speeds
          if (speed > MAX_BALL_SPEED * 0.8) {
            for (const wall of wallsRef.current) {
              const collision = Matter.Collision.collides(ballRef.current, wall, undefined);
              if (collision && collision.depth > 0) {
                // Smaller correction to prevent slowing down the ball too much
                Matter.Body.translate(ballRef.current, {
                  x: collision.normal.x * collision.depth * 0.3,
                  y: collision.normal.y * collision.depth * 0.3
                });
                break;
              }
            }
          }
        }
      }

      // Update ball position for rendering
      if (ballRef.current) {
        ballPositionX.value = ballRef.current.position.x;
        ballPositionY.value = ballRef.current.position.y;
      }

      lastTimeRef.current = currentTime;
      tickerRef.current = requestAnimationFrame(tick);
    };

    tickerRef.current = requestAnimationFrame(tick);

    return () => {
      if (tickerRef.current) {
        cancelAnimationFrame(tickerRef.current);
        tickerRef.current = null;

        if (engineRef.current) {
          Matter.Events.off(engineRef.current, 'collisionStart');
          Matter.Events.off(engineRef.current, 'collisionActive');
          Matter.Engine.clear(engineRef.current);
          engineRef.current = null;
          worldRef.current = null;
          ballRef.current = null;
          wallsRef.current = [];
          laserGatesRef.current = [];
          goalRef.current = null;
          coinCompositeRef.current = null;
          laserGateCompositeRef.current = null;
        }
      }
    };
  }, [
    maze?.id, 
    width,
    height,
    ballRadius,
    gravityScale, 
    vibrationEnabled,
    dispatch, 
    ballPositionX, 
    ballPositionY,
  ]);

  const reset = useCallback(() => {
    if (ballRef.current && engineRef.current && maze) {
      const startX = maze.startPosition.x;
      const startY = maze.startPosition.y;
      Matter.Body.setPosition(ballRef.current, { x: startX, y: startY });
      Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(ballRef.current, 0);
      const currentVelX = ballRef.current.velocity.x;
      const currentVelY = ballRef.current.velocity.y;
      if (Math.abs(currentVelX) > 0.001 || Math.abs(currentVelY) > 0.001) {
        Matter.Body.applyForce(
          ballRef.current,
          ballRef.current.position,
          {
            x: -currentVelX * 0.1,
            y: -currentVelY * 0.1
          }
        );
      }
      Matter.Body.setInertia(ballRef.current, Infinity); 
      engineRef.current.gravity.x = 0;
      engineRef.current.gravity.y = 0;
      gameOverTriggeredRef.current = false;
      setGoalReached(false);
      setGameOver(false);
      collectedCoinsRef.current.clear();
      lastTimeRef.current = performance.now();
      ballPositionX.value = startX;
      ballPositionY.value = startY;
      setTimeout(() => {
        if (ballRef.current && engineRef.current) {
          Matter.Body.setPosition(ballRef.current, { x: startX, y: startY });
          Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
        }
      }, 16); 
    }
  }, [maze, ballPositionX, ballPositionY]); 
  const update = useCallback(
    (tiltX: number, tiltY: number, resetVelocity: boolean = false) => {
      if (!engineRef.current || !ballRef.current) return;
      
      if (resetVelocity) {
        // Completely stop the ball when requested
        Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(ballRef.current, 0);
        engineRef.current.gravity.x = 0;
        engineRef.current.gravity.y = 0;
        
        // Apply just enough counter-force to stop movement without being sluggish
        const currentVelX = ballRef.current.velocity.x;
        const currentVelY = ballRef.current.velocity.y;
        if (Math.abs(currentVelX) > 0.001 || Math.abs(currentVelY) > 0.001) {
          Matter.Body.applyForce(
            ballRef.current,
            ballRef.current.position,
            {
              x: -currentVelX * 0.15,
              y: -currentVelY * 0.15
            }
          );
        }
        
        lastTimeRef.current = performance.now();
        return;
      }
      
      // Apply minimal deadzone for better responsiveness
      const deadzone = 0.0005;
      
      // Use more responsive curve (lower power) for better movement
      const responseScale = (value: number, power: number = 1.3): number => {
        if (Math.abs(value) < deadzone) return 0;
        const sign = Math.sign(value);
        return sign * Math.pow(Math.min(1.0, Math.abs(value)), power);
      };
      
      const effectiveX = responseScale(tiltX);
      const effectiveY = responseScale(tiltY);
      
      // Apply sensitivity with stronger effect (quadratic scaling)
      // This makes higher sensitivity settings much more pronounced
      const sensitivityFactor = Math.pow(sensitivity, 2.0);
      
      // Calculate final gravity scale with amplified sensitivity
      const finalGravityScale = GRAVITY_SCALE_MULTIPLIER * 1.5 * gravityScale * sensitivityFactor;
      
      // Apply gravity forces with sensitivity amplification
      engineRef.current.gravity.x = effectiveX * finalGravityScale;
      engineRef.current.gravity.y = effectiveY * finalGravityScale;
      
      // Scale force based on amplified sensitivity
      const gravityForceX = effectiveX * finalGravityScale * ballRef.current.mass * 0.15;
      const gravityForceY = effectiveY * finalGravityScale * ballRef.current.mass * 0.15;
      
      // Use direct forces for more stable physics than using engine gravity
      Matter.Body.applyForce(
        ballRef.current,
        ballRef.current.position,
        {
          x: gravityForceX,
          y: gravityForceY
        }
      );
      
      // Keep engine gravity at zero to avoid additive effects
      engineRef.current.gravity.x = 0;
      engineRef.current.gravity.y = 0;
    },
    [gravityScale, sensitivity] 
  );
  const physicsWorld: PhysicsWorld = useMemo( 
    () => ({
      engine: engineRef.current ?? undefined,
      world: worldRef.current ?? undefined,
      ball: ballRef.current ?? undefined,
      reset,
      update,
      ballPositionX,
      ballPositionY,
      goalReached,
      gameOver,
    }),
    [engineRef.current, worldRef.current, ballRef.current, reset, update, ballPositionX, ballPositionY, goalReached, gameOver]
  );
  return physicsWorld;
};
