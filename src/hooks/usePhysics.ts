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

  const ballPositionX = useSharedValue(maze?.startPosition.x ?? 0);
  const ballPositionY = useSharedValue(maze?.startPosition.y ?? 0);

  // Enhanced physics settings with better feel across all quality levels
  const getPhysicsQualitySettings = useCallback(() => {
    // Base settings that work well across devices
    const baseSettings = {
      // Improved values for more natural movement
      restitution: 0.12, // Slightly bouncier for more satisfying collisions
      friction: 0.003,   // Lower friction for smoother sliding
      frictionStatic: 0.004, // Slightly higher static friction for better control
      density: 0.14,     // Slightly lighter ball feels more responsive
    };

    // Device-specific adjustments
    const isTablet = Math.min(width, height) >= 600;
    const isIOS = Platform.OS === 'ios';

    // Adjust settings based on device type
    const deviceAdjustments = {
      // iOS devices typically have more powerful GPUs
      frictionAirMultiplier: isIOS ? 0.9 : 1.1,
      // Tablets need slightly different physics due to larger screen
      densityMultiplier: isTablet ? 0.95 : 1.0,
      restitutionMultiplier: isTablet ? 1.1 : 1.0,
    };

    switch (qualityLevel) {
      case 'low':
        return {
          ...baseSettings,
          constraintIterations: 3, // Increased from 2
          positionIterations: 8,
          velocityIterations: 8,
          timeStep: LOW_QUALITY_TIME_STEP,
          frictionAir: 0.00055 * deviceAdjustments.frictionAirMultiplier, // Reduced for smoother movement
          sleepThreshold: 60,
          density: baseSettings.density * deviceAdjustments.densityMultiplier,
          restitution: baseSettings.restitution * deviceAdjustments.restitutionMultiplier,
        };
      case 'medium':
        return {
          ...baseSettings,
          constraintIterations: 4,
          positionIterations: 12,
          velocityIterations: 12,
          timeStep: FIXED_TIME_STEP,
          frictionAir: 0.00035 * deviceAdjustments.frictionAirMultiplier, // Reduced for smoother movement
          sleepThreshold: 45,
          density: baseSettings.density * deviceAdjustments.densityMultiplier,
          restitution: baseSettings.restitution * deviceAdjustments.restitutionMultiplier,
        };
      case 'high':
      default:
        return {
          ...baseSettings,
          constraintIterations: 6,
          positionIterations: 16,
          velocityIterations: 16,
          timeStep: FIXED_TIME_STEP,
          frictionAir: 0.00025 * deviceAdjustments.frictionAirMultiplier, // Reduced for smoother movement
          sleepThreshold: 30,
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

    engine.timing.timeScale = 1;
    engine.timing.lastDelta = 16.67;

    const world = engine.world;

    const ball = Matter.Bodies.circle(maze.startPosition.x, maze.startPosition.y, ballRadius, {
      label: 'ball',
      restitution: qualitySettings.restitution,
      friction: qualitySettings.friction,
      frictionAir: qualitySettings.frictionAir,
      frictionStatic: qualitySettings.frictionStatic,
      density: qualitySettings.density,
      inertia: Infinity, // Prevents rotation for better control
      slop: 0.01, // Small amount of slop for smoother collisions
      render: {
        fillStyle: '#FF4081',
      },
      collisionFilter: {
        category: 0x0002,
        mask: 0x0001 | 0x0004 | 0x0008,
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

    // Update ball position shared values for use in the UI
    Matter.Events.on(engine, 'afterUpdate', () => {
      if (!ball) return;
      
      // Use runOnUI to update shared values if available
      if (typeof ballPositionX.runOnUI === 'function') {
        ballPositionX.value = ball.position.x;
        ballPositionY.value = ball.position.y;
      } else {
        // Fallback
        ballPositionX.value = ball.position.x;
        ballPositionY.value = ball.position.y;
      }
      
      // Apply a subtle easing to high velocities to prevent visual jitter
      const currentSpeed = Math.sqrt(
        ball.velocity.x * ball.velocity.x + 
        ball.velocity.y * ball.velocity.y
      );
      
      // Gradually slow down extremely fast movements to prevent visual jitter
      if (currentSpeed > 8) {
        const dampingFactor = 0.98;
        Matter.Body.setVelocity(ball, {
          x: ball.velocity.x * dampingFactor,
          y: ball.velocity.y * dampingFactor
        });
      }
    });

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

      // Get device-specific adjustments
      const isTablet = Math.min(width, height) >= 600;
      const isIOS = Platform.OS === 'ios';

      // Apply gravity with enhanced device-specific adjustments for more intuitive feel
      const gravityMultiplier = isIOS ? 1.0 : 1.05; // Slightly stronger on Android
      const tabletAdjustment = isTablet ? 0.95 : 1.0; // Slightly weaker on tablets

      // Apply dynamic gravity scaling based on tilt magnitude
      // This creates a more intuitive control experience:
      // - Small tilts: More precise control with slightly reduced gravity
      // - Medium tilts: Linear response for predictable movement
      // - Large tilts: Slightly boosted gravity for responsive feel at extremes

      const tiltMagnitude = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
      let dynamicGravityMultiplier = 1.0;

      if (tiltMagnitude < 0.3) {
        // Small tilts get slightly reduced gravity for finer control
        dynamicGravityMultiplier = 0.9 + (tiltMagnitude / 0.3) * 0.1;
      } else if (tiltMagnitude > 0.8) {
        // Large tilts get slightly boosted gravity for responsive feel
        const excess = Math.min(0.2, tiltMagnitude - 0.8);
        dynamicGravityMultiplier = 1.0 + (excess / 0.2) * 0.15;
      }

      // Apply gravity directly based on device tilt with all adjustments
      const effectiveGravityScale = gravityScale * gravityMultiplier * tabletAdjustment * dynamicGravityMultiplier;

      // Apply gravity with subtle easing for more natural acceleration
      const currentGravityX = engineRef.current.gravity.x;
      const currentGravityY = engineRef.current.gravity.y;
      const targetGravityX = tiltX * effectiveGravityScale;
      const targetGravityY = tiltY * effectiveGravityScale;

      // Smooth gravity changes for more natural feel
      // Faster response when increasing gravity, slower when decreasing (feels more natural)
      const gravityEasingFactor = 0.3;
      engineRef.current.gravity.x = currentGravityX + (targetGravityX - currentGravityX) *
        (targetGravityX > currentGravityX ? gravityEasingFactor * 1.5 : gravityEasingFactor);
      engineRef.current.gravity.y = currentGravityY + (targetGravityY - currentGravityY) *
        (targetGravityY > currentGravityY ? gravityEasingFactor * 1.5 : gravityEasingFactor);

      // Dynamic max velocity based on quality level and device
      let maxVelocity = 1.3; // Slightly increased for more responsive feel
      if (qualityLevel === 'low') {
        maxVelocity = 1.1;
      } else if (qualityLevel === 'medium') {
        maxVelocity = 1.2;
      }

      // Adjust max velocity based on device type
      if (isTablet) {
        maxVelocity *= 1.1; // Tablets can handle slightly higher velocities
      }

      const velocity = ballRef.current.velocity;
      const currentSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      // Enhanced progressive velocity capping for more intuitive movement
      if (currentSpeed > 0) {
        // Calculate tilt direction alignment with current velocity
        // This helps determine if the player is trying to speed up or slow down
        const tiltMagnitude = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
        let alignmentFactor = 0;

        if (tiltMagnitude > 0.05 && currentSpeed > 0.1) {
          // Calculate normalized vectors
          const normVelX = velocity.x / currentSpeed;
          const normVelY = velocity.y / currentSpeed;
          const normTiltX = tiltX / tiltMagnitude;
          const normTiltY = tiltY / tiltMagnitude;

          // Dot product gives alignment (-1 to 1)
          alignmentFactor = normVelX * normTiltX + normVelY * normTiltY;
        }

        // Dynamic speed threshold based on alignment
        // - When accelerating in same direction: higher threshold for responsive feel
        // - When changing direction: lower threshold for quicker response to changes
        const baseSpeedThreshold = maxVelocity * 0.7;
        const speedThreshold = baseSpeedThreshold * (1 + alignmentFactor * 0.2);

        let speedFactor = 1.0;

        if (currentSpeed > maxVelocity) {
          // Progressive capping that gets stronger as speed increases
          const excess = currentSpeed - maxVelocity;

          // Alignment-aware capping strength:
          // - Stronger capping when trying to go against current direction
          // - Gentler capping when continuing in same direction
          const baseCappingStrength = 1.0 + (excess / maxVelocity) * 0.5;
          const alignmentAdjustment = Math.max(0, 0.2 - alignmentFactor * 0.2);
          const cappingStrength = baseCappingStrength + alignmentAdjustment;

          speedFactor = maxVelocity / (currentSpeed * cappingStrength);
        }
        else if (currentSpeed > speedThreshold) {
          // Gradual reduction as we approach max velocity
          const normalizedExcess = (currentSpeed - speedThreshold) / (maxVelocity - speedThreshold);

          // Smoother easing curve for more natural feel
          // Using a custom ease-out curve that feels more natural than cubic
          const t = normalizedExcess;
          const easedReduction = t * t * (3 - 2 * t);

          // Alignment-aware reduction:
          // - Less reduction when continuing in same direction (feels more responsive)
          // - More reduction when changing direction (prevents overshooting)
          const baseReduction = 0.3;
          const alignmentAdjustment = Math.max(0, 0.1 - alignmentFactor * 0.1);

          speedFactor = 1.0 - easedReduction * (baseReduction + alignmentAdjustment);
        }

        if (speedFactor < 1.0) {
          // Apply velocity capping with smooth friction
          const newVelX = velocity.x * speedFactor;
          const newVelY = velocity.y * speedFactor;

          // Enhanced dynamic friction:
          // 1. Base friction that increases with speed
          // 2. Alignment-aware adjustment (less friction when aligned with tilt)
          // 3. Speed-dependent component for natural feel

          const baseFriction = Math.min(
            0.99,
            1.0 - Math.pow(currentSpeed / maxVelocity, 2) * 0.04
          );

          // Reduce friction when player is actively pushing in velocity direction
          const alignmentBonus = Math.max(0, alignmentFactor * 0.02);

          // Final friction with all factors
          const frictionFactor = Math.min(0.99, baseFriction + alignmentBonus);

          Matter.Body.setVelocity(ballRef.current, {
            x: newVelX * frictionFactor,
            y: newVelY * frictionFactor,
          });
        }
      }

      // Improved boundary collision handling for more satisfying edge interactions
      const radius = ballRadius;

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

          Matter.Body.applyForce(
            ballRef.current!,
            ballRef.current!.position,
            impulse
          );
        }
      };

      // Handle all boundaries with the improved function
      handleBoundaryCollision('x', ballRef.current.position.x, radius, true); // Left boundary
      handleBoundaryCollision('x', ballRef.current.position.x, width - radius, false); // Right boundary
      handleBoundaryCollision('y', ballRef.current.position.y, radius, true); // Top boundary
      handleBoundaryCollision('y', ballRef.current.position.y, height - radius, false); // Bottom boundary

      // Movement assist code moved after potentialCollisions is defined

      const predictedX = ballRef.current.position.x + velocity.x * 2;
      const predictedY = ballRef.current.position.y + velocity.y * 2;

      // Ensure wallsRef.current exists before filtering
      const potentialCollisions = wallsRef.current ? wallsRef.current.filter(wall => {
        if (!wall || !wall.bounds) return false;

        const bounds = wall.bounds;

        const safeRadius = radius * 1.5;

        return (
          predictedX + safeRadius > bounds.min.x &&
          predictedX - safeRadius < bounds.max.x &&
          predictedY + safeRadius > bounds.min.y &&
          predictedY - safeRadius < bounds.max.y
        );
      }) : [];

      if (ballRef.current && currentSpeed > 0) {
        const timeSteps = 3;
        const dt = 1 / 60;

        const pos = { x: ballRef.current.position.x, y: ballRef.current.position.y };
        const vel = { x: velocity.x, y: velocity.y };

        const futurePos = {
          x: pos.x + vel.x * dt * timeSteps,
          y: pos.y + vel.y * dt * timeSteps,
        };

        // Add safety checks for potentialCollisions
        const willCollide = Array.isArray(potentialCollisions) && potentialCollisions.length > 0 ?
          potentialCollisions.some(wall => {
            if (!wall || !wall.bounds) return false;

            const line = { x1: pos.x, y1: pos.y, x2: futurePos.x, y2: futurePos.y };

            return lineIntersectsRectangle(
              line,
              wall.bounds.min.x,
              wall.bounds.min.y,
              wall.bounds.max.x,
              wall.bounds.max.y
            );
          }) : false;

        // Improved wall collision handling for more satisfying interactions
        if (willCollide) {
          // Dynamic reduction factor based on speed for more natural collision response
          // Faster speeds get more reduction to prevent excessive bouncing
          const speedFactor = Math.min(1, currentSpeed / 1.2); // Normalize speed
          const baseReduction = 0.6; // Higher base value for less reduction
          const reductionFactor = baseReduction - speedFactor * 0.3; // 0.6 to 0.3 range

          // Apply velocity reduction with slight directional bias to prevent head-on sticking
          const directionBias = 0.05; // Small bias to help ball slide along walls
          const biasedVelocity = {
            x: velocity.x * (1 + (Math.sign(velocity.x) * directionBias)),
            y: velocity.y * (1 + (Math.sign(velocity.y) * directionBias))
          };

          Matter.Body.setVelocity(ballRef.current, {
            x: biasedVelocity.x * reductionFactor,
            y: biasedVelocity.y * reductionFactor,
          });

          // Apply repulsion forces from each potential wall with safety checks
          if (Array.isArray(potentialCollisions)) {
            potentialCollisions.forEach(wall => {
              if (!wall || !wall.position) return;

              const dirX = pos.x - wall.position.x;
              const dirY = pos.y - wall.position.y;
              const distance = Math.sqrt(dirX * dirX + dirY * dirY);

              if (distance > 0) {
                // Stronger repulsion for imminent collisions
                const repulsionForce = 0.0025 / Math.max(distance, 0.4);

                // Apply force with slight tangential component for better sliding
                const normalizedDirX = dirX / distance;
                const normalizedDirY = dirY / distance;

                // Add small tangential component (perpendicular to normal)
                const tangentialFactor = 0.2;
                const tangentialX = -normalizedDirY * tangentialFactor;
                const tangentialY = normalizedDirX * tangentialFactor;

                Matter.Body.applyForce(ballRef.current!, pos, {
                  x: (normalizedDirX + tangentialX) * repulsionForce,
                  y: (normalizedDirY + tangentialY) * repulsionForce,
                });
              }
            });
          }
        }
        // Near-miss handling for smoother approach to walls with safety checks
        else if (Array.isArray(potentialCollisions) && potentialCollisions.length > 0 && currentSpeed > 0.25) {
          // Progressive velocity reduction based on speed and proximity
          const proximityFactor = Math.min(1, potentialCollisions.length / 2);
          const speedFactor = Math.min(1, currentSpeed / 0.8);
          const reductionStrength = 0.2 + (proximityFactor * speedFactor * 0.15);

          Matter.Body.setVelocity(ballRef.current, {
            x: velocity.x * (1 - reductionStrength),
            y: velocity.y * (1 - reductionStrength),
          });

          // Apply gentler repulsion forces for near-miss walls
          potentialCollisions.forEach(wall => {
            if (!wall || !wall.position) return;

            const dirX = pos.x - wall.position.x;
            const dirY = pos.y - wall.position.y;
            const distance = Math.sqrt(dirX * dirX + dirY * dirY);

            if (distance > 0) {
              // Gentler repulsion for near misses
              const repulsionForce = 0.0012 / Math.max(distance, 0.8);

              Matter.Body.applyForce(ballRef.current!, pos, {
                x: (dirX / distance) * repulsionForce,
                y: (dirY / distance) * repulsionForce,
              });
            }
          });
        }
      }

      // Add subtle movement assist for more intuitive control in tight spaces
      // This helps players navigate narrow corridors and tight turns more easily
      if (currentSpeed > 0.05 && Array.isArray(potentialCollisions) && potentialCollisions.length > 0 && ballRef.current) {
        // Check if we're in a narrow passage (walls on multiple sides)
        const narrowPassageThreshold = radius * 5; // Distance to check for narrow passages

        // Find nearby walls in different directions
        const nearbyWalls = {
          left: false,
          right: false,
          top: false,
          bottom: false
        };

        // Check for walls in each direction
        potentialCollisions.forEach(wall => {
          if (!wall || !wall.bounds) return;

          const ballX = ballRef.current!.position.x;
          const ballY = ballRef.current!.position.y;
          const wallCenterX = (wall.bounds.min.x + wall.bounds.max.x) / 2;
          const wallCenterY = (wall.bounds.min.y + wall.bounds.max.y) / 2;

          const dx = ballX - wallCenterX;
          const dy = ballY - wallCenterY;

          // Determine wall direction relative to ball
          if (Math.abs(dx) > Math.abs(dy)) {
            // Wall is to the left or right
            if (dx < 0 && Math.abs(dx) < narrowPassageThreshold) nearbyWalls.right = true;
            if (dx > 0 && Math.abs(dx) < narrowPassageThreshold) nearbyWalls.left = true;
          } else {
            // Wall is to the top or bottom
            if (dy < 0 && Math.abs(dy) < narrowPassageThreshold) nearbyWalls.bottom = true;
            if (dy > 0 && Math.abs(dy) < narrowPassageThreshold) nearbyWalls.top = true;
          }
        });

        // Check if we're in a corridor (walls on opposite sides)
        const inHorizontalCorridor = nearbyWalls.left && nearbyWalls.right;
        const inVerticalCorridor = nearbyWalls.top && nearbyWalls.bottom;

        if (inHorizontalCorridor || inVerticalCorridor) {
          // We're in a narrow passage, apply subtle movement assist

          // Determine primary movement direction
          const absVelX = Math.abs(velocity.x);
          const absVelY = Math.abs(velocity.y);
          const movingHorizontally = absVelX > absVelY;

          if (inHorizontalCorridor && !movingHorizontally) {
            // In horizontal corridor but moving vertically - help align horizontally
            const assistFactor = 0.92; // Reduce vertical movement
            Matter.Body.setVelocity(ballRef.current, {
              x: velocity.x,
              y: velocity.y * assistFactor
            });
          } else if (inVerticalCorridor && movingHorizontally) {
            // In vertical corridor but moving horizontally - help align vertically
            const assistFactor = 0.92; // Reduce horizontal movement
            Matter.Body.setVelocity(ballRef.current, {
              x: velocity.x * assistFactor,
              y: velocity.y
            });
          }
        }
      }
    },
    [qualityLevel, width, height, ballRadius, gravityScale, Platform]
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
