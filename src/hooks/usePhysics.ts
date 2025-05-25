import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { Platform } from 'react-native';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Maze, LaserGate, Wall, Coin } from '../types';
import { useAppDispatch } from '@store';
import { collectCoinAndSave } from '@store/slices/shopSlice';
import { collectCoin as mazeCollectCoin } from '@store/slices/mazeSlice';
import { PHYSICS_CONFIG } from '@config/performance';

// Anti-tunneling utility functions
const calculateDynamicMaxSpeed = (sensitivity: number): number => {
  return Math.max(
    PHYSICS_CONFIG.MIN_MAX_SPEED,
    Math.min(
      PHYSICS_CONFIG.MAX_MAX_SPEED,
      PHYSICS_CONFIG.BASE_MAX_SPEED - (sensitivity - 1.0) * PHYSICS_CONFIG.SENSITIVITY_SPEED_FACTOR * PHYSICS_CONFIG.BASE_MAX_SPEED
    )
  );
};

// Use performance-optimized constants
const BALL_RADIUS = PHYSICS_CONFIG.BALL_RADIUS;
const BALL_DENSITY = PHYSICS_CONFIG.BALL_DENSITY; 
const BALL_FRICTION_AIR = 0.025; 
const BALL_RESTITUTION = PHYSICS_CONFIG.BALL_RESTITUTION; 
const BALL_FRICTION = PHYSICS_CONFIG.BALL_FRICTION; 
const BALL_FRICTION_STATIC = 0.12; 
const WALL_FRICTION = 0.12; 
const WALL_RESTITUTION = 0.08; 
const GRAVITY_SCALE_MULTIPLIER = PHYSICS_CONFIG.GRAVITY_SCALE_MULTIPLIER; 
const PHYSICS_TIME_STEP = 1000 / PHYSICS_CONFIG.PHYSICS_FPS;

// Anti-tunneling physics constants
const BASE_MAX_SPEED = PHYSICS_CONFIG.BASE_MAX_SPEED;
const MIN_MAX_SPEED = PHYSICS_CONFIG.MIN_MAX_SPEED;
const MAX_MAX_SPEED = PHYSICS_CONFIG.MAX_MAX_SPEED;
const SENSITIVITY_SPEED_FACTOR = PHYSICS_CONFIG.SENSITIVITY_SPEED_FACTOR;
const COLLISION_ITERATIONS = PHYSICS_CONFIG.CONSTRAINT_ITERATIONS;
const POSITION_ITERATIONS = PHYSICS_CONFIG.POSITION_ITERATIONS;
const VELOCITY_ITERATIONS = PHYSICS_CONFIG.VELOCITY_ITERATIONS;
const WALL_BUFFER = PHYSICS_CONFIG.WALL_BUFFER;
const ADDITIONAL_WALL_BUFFER = PHYSICS_CONFIG.ADDITIONAL_WALL_BUFFER;
const MIN_WALL_THICKNESS = PHYSICS_CONFIG.MIN_WALL_THICKNESS;
const HIGH_SPEED_PHYSICS_STEPS = PHYSICS_CONFIG.HIGH_SPEED_PHYSICS_STEPS;
const SPEED_THRESHOLD_FOR_EXTRA_STEPS = PHYSICS_CONFIG.SPEED_THRESHOLD_FOR_EXTRA_STEPS;
const MAX_DELTA_TIME = PHYSICS_CONFIG.MAX_DELTA_TIME;
const COLLISION_SLOP = PHYSICS_CONFIG.COLLISION_SLOP;
const CORRECTION_FACTOR = 0.6;

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

  // Optimized physics update loop with better performance - OUTSIDE useEffect
  const tick = useCallback(() => {
    if (!engineRef.current || !ballRef.current) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - lastTimeRef.current;
    
    // Use much smaller fixed timestep for consistent physics
    const clampedDelta = Math.min(deltaTime, MAX_DELTA_TIME);
    
    // Calculate dynamic max speed based on sensitivity using utility function
    const dynamicMaxSpeed = calculateDynamicMaxSpeed(sensitivity);
    
    // Check current ball speed for anti-tunneling measures
    const velocity = ballRef.current.velocity;
    const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    
    // Much more aggressive physics stepping - always use multiple steps for any movement
    const basePhysicsSteps = 2; // Always use at least 2 steps
    const extraSteps = currentSpeed > SPEED_THRESHOLD_FOR_EXTRA_STEPS ? HIGH_SPEED_PHYSICS_STEPS : 0;
    const physicsSteps = basePhysicsSteps + extraSteps;
    const stepDelta = clampedDelta / physicsSteps;
    
    // Store previous position for continuous collision detection
    const prevPosition = { x: ballRef.current.position.x, y: ballRef.current.position.y };
    
    // Run multiple physics updates with aggressive collision checking
    for (let i = 0; i < physicsSteps; i++) {
      if (!ballRef.current) break;
      
      // Store position before physics step
      const beforeStep = { x: ballRef.current.position.x, y: ballRef.current.position.y };
      
      // Run single physics step
      Matter.Engine.update(engineRef.current, stepDelta);
      
      if (!ballRef.current) break;
      
      // Check for large position jumps that might indicate tunneling
      const afterStep = { x: ballRef.current.position.x, y: ballRef.current.position.y };
      const stepDistance = Math.sqrt(
        Math.pow(afterStep.x - beforeStep.x, 2) + 
        Math.pow(afterStep.y - beforeStep.y, 2)
      );
      
      // If ball moved too far in one step, it might have tunneled
      const maxStepDistance = ballRadius * 0.8; // Ball shouldn't move more than 80% of its radius per step
      if (stepDistance > maxStepDistance) {
        // Revert to safer intermediate position
        const safeX = beforeStep.x + (afterStep.x - beforeStep.x) * 0.5;
        const safeY = beforeStep.y + (afterStep.y - beforeStep.y) * 0.5;
        Matter.Body.setPosition(ballRef.current, { x: safeX, y: safeY });
        
        // Reduce velocity significantly to prevent further tunneling
        Matter.Body.setVelocity(ballRef.current, {
          x: velocity.x * 0.3,
          y: velocity.y * 0.3
        });
      }
      
      // Aggressive speed limiting after each micro-step
      const stepVelocity = ballRef.current.velocity;
      const stepSpeed = Math.sqrt(stepVelocity.x * stepVelocity.x + stepVelocity.y * stepVelocity.y);
      
      if (stepSpeed > dynamicMaxSpeed) {
        const scale = dynamicMaxSpeed / stepSpeed;
        Matter.Body.setVelocity(ballRef.current, {
          x: stepVelocity.x * scale,
          y: stepVelocity.y * scale
        });
      }
    }

    // Update shared values efficiently
    ballPositionX.value = ballRef.current.position.x;
    ballPositionY.value = ballRef.current.position.y;
    
    lastTimeRef.current = currentTime;
  }, [ballPositionX, ballPositionY, sensitivity]);

  const update = useCallback((tiltX: number, tiltY: number, resetVelocity = false) => {
    if (!engineRef.current || !ballRef.current) return;

    // Enhanced response scaling for better control feel
    const responseScale = (value: number, power: number = 1.2): number => {
      const sign = Math.sign(value);
      const magnitude = Math.abs(value);
      return sign * Math.pow(magnitude, power);
    };

    // Optimized gravity calculation
    const effectiveGravityScale = GRAVITY_SCALE_MULTIPLIER * gravityScale * sensitivity;
    const gravityX = responseScale(tiltX) * effectiveGravityScale;
    const gravityY = responseScale(tiltY) * effectiveGravityScale;

    // Apply gravity more efficiently
    engineRef.current.world.gravity.x = gravityX;
    engineRef.current.world.gravity.y = gravityY;

    if (resetVelocity && ballRef.current) {
      Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(ballRef.current, 0);
    }

    // Single physics tick per update for consistent performance
    tick();
  }, [gravityScale, sensitivity, tick]);

  useEffect(() => {
    if (!maze) return;

    setGoalReached(false);
    setGameOver(false);
    gameOverTriggeredRef.current = false;
    collectedCoinsRef.current.clear();

    // Create engine with performance-optimized collision handling settings
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 1 },
      enableSleeping: PHYSICS_CONFIG.ENABLE_SLEEPING,
      positionIterations: POSITION_ITERATIONS,  
      velocityIterations: VELOCITY_ITERATIONS,  
      constraintIterations: COLLISION_ITERATIONS,
      timing: {
        timeScale: PHYSICS_CONFIG.TIME_SCALE
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

    // Create walls with exact visual collision bounds
    const walls = maze.walls.map((wall: Wall) => {
      // Only add buffer to extremely thin walls (< 4px) to prevent tunneling
      const isVeryThinWall = wall.width < MIN_WALL_THICKNESS || wall.height < MIN_WALL_THICKNESS;
      const widthBuffer = isVeryThinWall ? ADDITIONAL_WALL_BUFFER : 0; // Exact visual match for normal walls
      const heightBuffer = isVeryThinWall ? ADDITIONAL_WALL_BUFFER : 0; // Exact visual match for normal walls
      
      return Matter.Bodies.rectangle(
        wall.x + wall.width / 2,
        wall.y + wall.height / 2,
        wall.width + widthBuffer,
        wall.height + heightBuffer,
        {
          label: 'wall',
          isStatic: true,
          friction: WALL_FRICTION, // Normal friction for natural feel
          restitution: WALL_RESTITUTION, // Normal restitution for natural bouncing
          slop: COLLISION_SLOP, // More forgiving collision slop
          isSensor: false,
          collisionFilter: {
            category: 0x0001,
            mask: 0x0002,
          },
        }
      );
    });

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
        else if (otherBody.label?.startsWith('laser-')) {
          // Check if laser gate is currently active (visible)
          const laserGate = otherBody.plugin?.laserGate as LaserGate;
          if (laserGate) {
            const now = Date.now();
            const cyclePos = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
            const isLaserVisible = cyclePos < laserGate.onDuration;
            
            if (isLaserVisible && !gameOverTriggeredRef.current) {
              gameOverTriggeredRef.current = true;
              setGameOver(true);
              if (vibrationEnabled) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              }
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

    // Start the physics loop manually to avoid dependency issues with sensitivity
    const startPhysicsLoop = () => {
      tick();
      tickerRef.current = requestAnimationFrame(startPhysicsLoop);
    };
    tickerRef.current = requestAnimationFrame(startPhysicsLoop);

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
