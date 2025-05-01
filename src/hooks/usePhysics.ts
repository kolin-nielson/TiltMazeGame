import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { Platform, Dimensions } from 'react-native';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Maze, LaserGate, Wall, Coin } from '../types';
import { useAppDispatch } from '@store';
import { collectCoinAndSave } from '@store/slices/shopSlice';
import { removeCoin as mazeRemoveCoin } from '@store/slices/mazeSlice';

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
  sensitivity?: number; // Allow sensitivity to directly affect physics
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
const LOW_QUALITY_TIME_STEP = 1000 / 150; // Increased from 120 for smoother experience on low-end devices

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
    gravityScale = 0.022, // Increased for more responsive movement
    ballRadius = 7,
    wallThickness = 10,
    qualityLevel: initialQualityLevel = isLowEndDevice() ? 'low' : 'high',
    vibrationEnabled = true,
    sensitivity = 1.0,
  } = options;

  const dispatch = useAppDispatch();
  const [qualityLevel, setQualityLevel] = useState<'low' | 'medium' | 'high'>(initialQualityLevel);

  const engineRef = useRef<Matter.Engine>();
  const worldRef = useRef<Matter.World>();
  const ballRef = useRef<Matter.Body>();
  const wallsRef = useRef<Matter.Body[]>([]);
  const laserGatesRef = useRef<Matter.Body[]>([]);
  const goalRef = useRef<Matter.Body>();
  const coinCompositeRef = useRef<Matter.Composite>(); // Reference to coin composite for better management
  const tickerRef = useRef<number | null>(null);
  const [goalReached, setGoalReached] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);
  const collectedCoinsRef = useRef<Set<string>>(new Set()); // Track collected coins to prevent duplicate collection
  
  // For adaptive physics responses
  const lastImpactMagnitude = useRef<number>(0);
  const lastImpactTime = useRef<number>(0);
  const consecutiveImpacts = useRef<number>(0);
  const isSliding = useRef<boolean>(false);
  const slidingStartTime = useRef<number>(0);
  const lastInputForce = useRef<{x: number, y: number}>({x: 0, y: 0});

  const ballPositionX = useSharedValue(maze?.startPosition.x ?? 0);
  const ballPositionY = useSharedValue(maze?.startPosition.y ?? 0);

  // Enhanced physics settings with better feel across all quality levels
  const getPhysicsQualitySettings = useCallback(() => {
    // Base settings that work well across devices
    const baseSettings = {
      // Improved values for more natural movement
      restitution: 0.22, // More bounce for more satisfying collisions
      friction: 0.002,   // Lower friction for smoother gliding
      frictionStatic: 0.003, // Lower static friction for more responsive initial movement
      density: 0.13,     // Lighter ball feels more responsive
    };

    // Device-specific adjustments
    const isTablet = Math.min(width, height) >= 600;
    const isIOS = Platform.OS === 'ios';

    // Adjust settings based on device type
    const deviceAdjustments = {
      // iOS devices typically have more powerful GPUs
      frictionAirMultiplier: isIOS ? 0.85 : 1.05,
      // Tablets need slightly different physics due to larger screen
      densityMultiplier: isTablet ? 0.92 : 1.0,
      restitutionMultiplier: isTablet ? 1.05 : 1.0,
    };

    switch (qualityLevel) {
      case 'low':
        return {
          ...baseSettings,
          constraintIterations: 4, // Increased from 3
          positionIterations: 10,  // Increased from 8
          velocityIterations: 10,  // Increased from 8
          timeStep: LOW_QUALITY_TIME_STEP,
          frictionAir: 0.00045 * deviceAdjustments.frictionAirMultiplier, // Reduced for smoother movement
          sleepThreshold: 45,      // Reduced to prevent premature sleep
          density: baseSettings.density * deviceAdjustments.densityMultiplier,
          restitution: baseSettings.restitution * deviceAdjustments.restitutionMultiplier,
        };
      case 'medium':
        return {
          ...baseSettings,
          constraintIterations: 5,
          positionIterations: 14,
          velocityIterations: 14,
          timeStep: FIXED_TIME_STEP,
          frictionAir: 0.00025 * deviceAdjustments.frictionAirMultiplier, // Reduced for smoother movement
          sleepThreshold: 35,
          density: baseSettings.density * deviceAdjustments.densityMultiplier,
          restitution: baseSettings.restitution * deviceAdjustments.restitutionMultiplier,
        };
      case 'high':
      default:
        return {
          ...baseSettings,
          constraintIterations: 6,
          positionIterations: 18,  // Increased from 16
          velocityIterations: 18,  // Increased from 16
          timeStep: FIXED_TIME_STEP,
          frictionAir: 0.00018 * deviceAdjustments.frictionAirMultiplier, // Reduced for smoother movement
          sleepThreshold: 25,      // Reduced to prevent premature sleep
          density: baseSettings.density * deviceAdjustments.densityMultiplier,
          restitution: baseSettings.restitution * deviceAdjustments.restitutionMultiplier,
        };
    }
  }, [qualityLevel, width, height]);

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

    const world = engine.world;
    
    // Reset tracking variables on world creation
    lastImpactMagnitude.current = 0;
    lastImpactTime.current = 0;
    consecutiveImpacts.current = 0;
    isSliding.current = false;
    slidingStartTime.current = 0;
    lastInputForce.current = {x: 0, y: 0};

    // Create ball with enhanced physics properties
    const ball = Matter.Bodies.circle(
      maze.startPosition.x,
      maze.startPosition.y,
      ballRadius,
      {
        restitution: qualitySettings.restitution,
        friction: qualitySettings.friction,
        frictionStatic: qualitySettings.frictionStatic,
        frictionAir: qualitySettings.frictionAir,
        density: qualitySettings.density,
        sleepThreshold: qualitySettings.sleepThreshold,
        label: 'ball',
        // Add inertia scaling for more satisfying movement
        inverseInertia: 0,
        inverseInertiaX: 0,
        inverseInertiaY: 0,
        inertia: Infinity,
      }
    );

    // Disable rotation for the ball for better control
    Matter.Body.setInertia(ball, Infinity);

    const wallSimplificationFactor = 1.0;

    const walls: Matter.Body[] = maze.walls.map((wall: Wall) =>
      Matter.Bodies.rectangle(
        wall.x + wall.width / 2,
        wall.y + wall.height / 2,
        wall.width,
        wall.height,
        {
          isStatic: true,
          friction: 0.15, // Reduced friction for smoother sliding along walls
          restitution: 0.08, // Slightly increased bounciness for more satisfying collisions
          slop: 0.02, // Small amount of slop for smoother collisions
          collisionFilter: {
            category: 0x0001,
            mask: 0x0002,
          },
          chamfer: { radius: 1 }, // Slight rounding of corners for smoother interactions
          render: { fillStyle: '#333333' },
        }
      )
    );

    // Create boundary walls with improved properties for smoother edge collisions
    const boundaryProps = {
      isStatic: true,
      label: 'boundary',
      friction: 0.04, // Lower friction for smoother sliding along edges
      restitution: 0.15, // Slightly bouncier for more satisfying edge bounces
      slop: 0.03, // Increased slop for smoother edge collisions
      chamfer: { radius: 2 }, // Rounded corners for smoother interactions
      collisionFilter: {
        category: 0x0001,
        mask: 0x0002,
      },
    };

    const boundWalls = [
      // Top boundary
      Matter.Bodies.rectangle(150, -5, 320, 10, {
        ...boundaryProps,
      }),
      // Bottom boundary
      Matter.Bodies.rectangle(150, 305, 320, 10, {
        ...boundaryProps,
      }),
      // Left boundary
      Matter.Bodies.rectangle(-5, 150, 10, 320, {
        ...boundaryProps,
      }),
      // Right boundary
      Matter.Bodies.rectangle(305, 150, 10, 320, {
        ...boundaryProps,
      }),
    ];

    const goal = Matter.Bodies.circle(maze.endPosition.x, maze.endPosition.y, ballRadius * 1.8, {
      isStatic: true,
      isSensor: true,
      label: 'goal',
      render: { fillStyle: '#4CAF50' },
    });

    const laserGates: Matter.Body[] = [];
    if (maze.laserGates && Array.isArray(maze.laserGates) && maze.laserGates.length > 0) {
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

    // Create a separate composite for coins to make removal cleaner
    const coinComposite = Matter.Composite.create({ label: 'coins' });
    const coinBodies: Matter.Body[] = [];

    if (maze.coins && maze.coins.length > 0) {
      maze.coins.forEach((coin: Coin) => {
        // Create coins with special properties to ensure they don't affect ball physics
        const coinBody = Matter.Bodies.circle(
          coin.position.x,
          coin.position.y,
          ballRadius * 0.6,
          {
            isStatic: true,
            isSensor: true, // Always a sensor to prevent physics interactions
            label: `coin-${coin.id}`,
            render: { fillStyle: '#FFD700' },
            // Use a separate collision category to ensure clean interactions
            collisionFilter: {
              category: 0x0008,
              mask: 0x0002,
              group: -1 // Negative group means it never collides with physics (only triggers sensors)
            },
            // Zero mass and inertia to prevent any physics effects
            mass: 0,
            inertia: 0,
            friction: 0,
            frictionAir: 0,
            frictionStatic: 0,
            restitution: 0,
            // Add plugin data to store coin properties
            plugin: {
              coin: coin
            }
          }
        );
        coinBodies.push(coinBody);
        Matter.Composite.add(coinComposite, coinBody);
      });
    }

    // Store the coin composite for easier management
    coinCompositeRef.current = coinComposite;

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

        if (
          (bodyA.label === 'ball' && bodyB.label?.startsWith('coin-')) ||
          (bodyA.label?.startsWith('coin-') && bodyB.label === 'ball')
        ) {
          const coinBody = bodyA.label?.startsWith('coin-') ? bodyA : bodyB;
          const ballBody = bodyA.label === 'ball' ? bodyA : bodyB;
          const coinId = coinBody.label.replace(/^coin-/, '');

          // Skip if we've already collected this coin (prevents double collection)
          if (collectedCoinsRef.current.has(coinId)) {
            continue;
          }

          // Mark this coin as collected
          collectedCoinsRef.current.add(coinId);

          // Get coin data from the plugin
          const coin = coinBody.plugin?.coin as Coin;
          if (!coin) continue; // Skip if no coin data

          // Completely disable any physics interaction for this coin
          // This is the most important part to prevent jolting
          Matter.Body.set(coinBody, {
            isSensor: true,
            isStatic: true,
            collisionFilter: {
              category: 0,
              mask: 0,
              group: -2 // Ensure it doesn't interact with anything
            }
          });

          // Preserve the ball's exact state
          const originalVelocity = { ...ballBody.velocity };
          const originalPosition = { ...ballBody.position };
          const originalAngularVelocity = ballBody.angularVelocity;

          // Immediately restore the ball's state to prevent any jolt
          // This is crucial for smooth gameplay
          Matter.Body.setPosition(ballBody, originalPosition);
          Matter.Body.setVelocity(ballBody, originalVelocity);
          Matter.Body.setAngularVelocity(ballBody, originalAngularVelocity);

          // Use requestAnimationFrame to delay the actual removal
          // This ensures the physics engine doesn't process the removal during this step
          requestAnimationFrame(() => {
            // Remove the coin from the world in the next frame
            if (coinCompositeRef.current && worldRef.current) {
              Matter.Composite.remove(coinCompositeRef.current, coinBody);
            }
          });

          // Handle coin collection rewards
          if (coin?.isSpecial) {
            // Special coin is worth multiple regular coins
            for (let i = 0; i < (coin.value || 10); i++) {
              dispatch(collectCoinAndSave());
            }
            // Use medium impact for special coins
            if (vibrationEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          } else {
            // Regular coin
            dispatch(collectCoinAndSave());
            if (vibrationEnabled) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }

          // Update the Redux store to remove the coin from the maze data
          dispatch(mazeRemoveCoin(coinId));
          continue;
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

    // Add all bodies to the world, including the coin composite
    Matter.Composite.add(world, [ball, ...walls, ...boundWalls, ...laserGates, goal, coinComposite]);

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
      coinCompositeRef.current = undefined;
      collectedCoinsRef.current.clear();

      Matter.Events.off(currentEngine, 'collisionStart');
      Matter.Events.off(currentEngine, 'collisionActive');
    };
  }, [
    maze?.id,
    width,
    height,
    ballRadius,
    gravityScale,
    wallThickness,
    qualityLevel,
    getPhysicsQualitySettings,
    ballPositionX,
    ballPositionY,
    dispatch,
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

      // Clear the collected coins set when resetting
      collectedCoinsRef.current.clear();

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

      // Apply a variable force based on sensitivity and gravityScale
      const effectiveGravityScale = gravityScale * 
                                   (sensitivity || 1.0) * 
                                   (1 + Math.min(0.4, lastImpactMagnitude.current/10));
      
      // Calculate the force to apply
      const forceX = tiltX * effectiveGravityScale;
      const forceY = tiltY * effectiveGravityScale;
      
      // Store last input force for reference
      lastInputForce.current = {x: forceX, y: forceY};
      
      // Get current velocity
      const velX = ballRef.current.velocity.x;
      const velY = ballRef.current.velocity.y;
      
      // Calculate current speed
      const currentSpeed = Math.sqrt(velX * velX + velY * velY);
      
      // Dynamically adjust force based on conditions:
      
      // 1. Apply more force at low speeds to overcome initial inertia
      const lowSpeedBoost = currentSpeed < 0.5 ? 1.4 : 1.0;
      
      // 2. Apply less force at very high speeds to prevent excessive acceleration
      const highSpeedDamping = Math.min(1.0, 4.0 / (currentSpeed + 3.0));
      
      // 3. Apply more force when changing direction for better responsiveness
      const isChangingDirectionX = Math.sign(forceX) !== Math.sign(velX) && Math.abs(forceX) > 0.001;
      const isChangingDirectionY = Math.sign(forceY) !== Math.sign(velY) && Math.abs(forceY) > 0.001;
      const directionChangeBoost = (isChangingDirectionX || isChangingDirectionY) ? 1.35 : 1.0;
      
      // 4. Apply more force when sliding along walls for more control
      const slidingBoost = isSliding.current ? 1.25 : 1.0;
      
      // 5. Apply micro-control boost for very small, precise movements
      const isMicroControl = Math.abs(forceX) < 0.03 && Math.abs(forceY) < 0.03 && 
                            Math.abs(forceX) + Math.abs(forceY) > 0.005;
      const microControlBoost = isMicroControl ? 1.3 : 1.0;
      
      // Combine all adjustment factors
      const finalForceX = forceX * lowSpeedBoost * highSpeedDamping * directionChangeBoost * slidingBoost * microControlBoost;
      const finalForceY = forceY * lowSpeedBoost * highSpeedDamping * directionChangeBoost * slidingBoost * microControlBoost;
      
      // Set gravity directly for more responsive control at low speeds
      if (currentSpeed < 0.3) {
        // Direct gravity control provides more immediate response
        engineRef.current.gravity.x = finalForceX * 20;
        engineRef.current.gravity.y = finalForceY * 20;
      } else {
        // At higher speeds, use force for more natural physics
        // Apply the calculated force
        Matter.Body.applyForce(ballRef.current, ballRef.current.position, {
          x: finalForceX,
          y: finalForceY
        });
        
        // Gradual reduction of gravity as speed increases
        // This prevents runaway acceleration
        const gravityReductionFactor = Math.max(0.2, 1.0 - (currentSpeed / 8.0));
        engineRef.current.gravity.x = forceX * 10 * gravityReductionFactor;
        engineRef.current.gravity.y = forceY * 10 * gravityReductionFactor;
      }

      // Dynamic max velocity based on quality level and device
      let maxVelocity = 1.5; // Slightly increased for more satisfying movement
      if (qualityLevel === 'low') {
        maxVelocity = 1.3;
      } else if (qualityLevel === 'medium') {
        maxVelocity = 1.4;
      }

      // Velocity capping for stable physics
      if (currentSpeed > maxVelocity) {
        // Calculate alignment of tilt with velocity for smarter speed limiting
        const tiltMagnitude = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
        let alignmentFactor = 0;
        
        if (tiltMagnitude > 0.05) {
          // Normalized vectors
          const normVelX = velX / currentSpeed;
          const normVelY = velY / currentSpeed;
          const normTiltX = tiltX / tiltMagnitude;
          const normTiltY = tiltY / tiltMagnitude;
          
          // Dot product gives alignment (-1 to 1)
          alignmentFactor = normVelX * normTiltX + normVelY * normTiltY;
        }
        
        // Adjust velocity cap based on tilt alignment
        // If pushing against velocity, allow higher speeds to enable quicker direction changes
        const adjustedMaxVelocity = maxVelocity * (1 + Math.max(0, -alignmentFactor) * 0.3);
        
        if (currentSpeed > adjustedMaxVelocity) {
          // Calculate capping factor
          const cappingFactor = adjustedMaxVelocity / currentSpeed;
          
          // Apply velocity cap
          Matter.Body.setVelocity(ballRef.current, {
            x: velX * cappingFactor,
            y: velY * cappingFactor
          });
        }
      }

      // Improved boundary collision handling for more satisfying edge interactions
      const radius = ballRadius;
      const position = ballRef.current.position;
      const velocity = ballRef.current.velocity;

      // Helper function for smoother boundary collisions
      const handleBoundaryCollision = (
        axis: 'x' | 'y',
        position: number,
        boundary: number,
        isMin: boolean
      ) => {
        if ((isMin && position < boundary) || (!isMin && position > boundary)) {
          // Set position to boundary with a tiny offset to prevent sticking
          const newPosition = isMin ? boundary + 0.01 : boundary - 0.01;

          // Create a new position object with the corrected coordinate
          const newPositionObj = {
            x: ballRef.current!.position.x,
            y: ballRef.current!.position.y,
          };
          newPositionObj[axis] = newPosition;

          Matter.Body.setPosition(ballRef.current!, newPositionObj);

          // Calculate bounce response based on speed
          const speed = Math.abs(velocity[axis]);

          // Dynamic dampening - less dampening at low speeds for responsive feel
          // More dampening at high speeds to prevent excessive bouncing
          const speedFactor = Math.min(1, speed / 0.8); // Normalize speed
          const baseDampening = 0.85; // Higher base value for less dampening
          const dampening = baseDampening - speedFactor * 0.25; // Dynamic adjustment

          // Calculate bounce coefficient - more bounce at higher speeds
          const bounceCoef = -0.3 - (speedFactor * 0.2); // -0.3 to -0.5 range

          // Create new velocity with bounce effect
          const newVelocity = { ...velocity };

          // Apply bounce to primary axis
          newVelocity[axis] = speed * bounceCoef;

          // Apply dampening to other axis for more natural feel
          const otherAxis = axis === 'x' ? 'y' : 'x';
          newVelocity[otherAxis] = velocity[otherAxis] * dampening;

          Matter.Body.setVelocity(ballRef.current!, newVelocity);

          // Apply a tiny impulse away from the boundary to prevent sticking
          const impulse = { x: 0, y: 0 };
          const impulseStrength = 0.0001;
          impulse[axis] = isMin ? impulseStrength : -impulseStrength;

          Matter.Body.applyForce(ballRef.current!, position, impulse);

          if (vibrationEnabled) {
            // Only vibrate for significant impacts
            if (speed > 0.7) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } else if (speed > 0.3) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        }
      };

      // Check for boundary collisions
      const minX = radius + 1;
      const maxX = width - radius - 1;
      const minY = radius + 1;
      const maxY = height - radius - 1;

      handleBoundaryCollision('x', position.x, minX, true);
      handleBoundaryCollision('x', position.x, maxX, false);
      handleBoundaryCollision('y', position.y, minY, true);
      handleBoundaryCollision('y', position.y, maxY, false);
    },
    [width, height, ballRadius, vibrationEnabled, gravityScale, qualityLevel, sensitivity]
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
