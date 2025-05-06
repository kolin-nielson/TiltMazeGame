import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import Matter from 'matter-js';
import { Platform } from 'react-native';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Maze, LaserGate, Wall, Coin } from '../types';
import { useAppDispatch } from '@store';
import { collectCoinAndSave } from '@store/slices/shopSlice';
import { removeCoin as mazeRemoveCoin } from '@store/slices/mazeSlice';

// --- Physics Constants ---
// These are the primary tuning parameters for ball control
const BALL_RADIUS = 7;
const BALL_DENSITY = 0.12; // Increased slightly for more predictable movement
const BALL_FRICTION_AIR = 0.025; // Increased for better damping/control
const BALL_RESTITUTION = 0.25; // Reduced bounciness for better control
const BALL_FRICTION = 0.015; // Increased friction against objects
const BALL_FRICTION_STATIC = 0.12; // Increased static friction for better starting control

const WALL_FRICTION = 0.12; // Increased wall friction
const WALL_RESTITUTION = 0.08; // Reduced wall bounciness

const GRAVITY_SCALE_MULTIPLIER = 0.018; // Reduced for more precise control

const PHYSICS_TIME_STEP = 1000 / 60; // Target 60 FPS physics updates

export interface PhysicsOptions {
  width: number;
  height: number;
  gravityScale?: number; // Kept for potential future use, but multiplier is main control now
  ballRadius?: number;
  vibrationEnabled?: boolean;
  sensitivity?: number; // Added sensitivity
}

// Simplified PhysicsWorld interface
interface PhysicsWorld {
  engine: Matter.Engine | undefined; // Can be undefined before init
  world: Matter.World | undefined;
  ball: Matter.Body | undefined;
  reset: () => void;
  update: (tiltX: number, tiltY: number, resetVelocity?: boolean) => void;
  ballPositionX: Animated.SharedValue<number>;
  ballPositionY: Animated.SharedValue<number>;
  goalReached: boolean;
  gameOver: boolean;
  // Removed setQualityLevel
}

export const usePhysics = (maze: Maze | null, options: PhysicsOptions): PhysicsWorld => {
  const {
    width,
    height,
    gravityScale = 1.0, // Default to 1, use multiplier for tuning
    ballRadius = BALL_RADIUS,
    vibrationEnabled = true,
    sensitivity = 1.0, // Default sensitivity to 1.0
  } = options;

  const dispatch = useAppDispatch();

  const engineRef = useRef<Matter.Engine>();
  const worldRef = useRef<Matter.World>();
  const ballRef = useRef<Matter.Body>();
  const wallsRef = useRef<Matter.Body[]>([]); // Keep track of walls for potential queries
  const laserGatesRef = useRef<Matter.Body[]>([]);
  const goalRef = useRef<Matter.Body>();
  const coinCompositeRef = useRef<Matter.Composite>();
  const tickerRef = useRef<number | null>(null);
  const [goalReached, setGoalReached] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const lastTimeRef = useRef<number>(0);
  const collectedCoinsRef = useRef<Set<string>>(new Set());
  const gameOverTriggeredRef = useRef(false); // Keep track to avoid multiple triggers

  // Shared values for ball position used by Reanimated
  const ballPositionX = useSharedValue(maze?.startPosition.x ?? 0);
  const ballPositionY = useSharedValue(maze?.startPosition.y ?? 0);

  useEffect(() => {
    if (!maze) return;

    // Reset state flags
    setGoalReached(false);
    setGameOver(false);
    gameOverTriggeredRef.current = false;
    collectedCoinsRef.current.clear();

    // --- Create Matter.js Engine ---
    // Simplified engine options
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 1 }, // Gravity will be set in the update loop
      enableSleeping: false, // Keep everything active
      // Use default iterations for simplicity, can tune later if needed
      // constraintIterations: 2,
      // positionIterations: 6,
      // velocityIterations: 4,
    });
    const world = engine.world;

    // --- Create Ball ---
    const ball = Matter.Bodies.circle(maze.startPosition.x, maze.startPosition.y, ballRadius, {
      label: 'ball',
      restitution: BALL_RESTITUTION,
      friction: BALL_FRICTION,
      frictionAir: BALL_FRICTION_AIR,
      frictionStatic: BALL_FRICTION_STATIC,
      density: BALL_DENSITY,
      inertia: Infinity, // Prevents rotation
      // slop: 0.05, // Default slop
      collisionFilter: {
        category: 0x0002,
        mask: 0x0001 | 0x0004 | 0x0008, // Collide with walls, lasers, coins
      },
    });

    // --- Create Walls ---
    const walls = maze.walls.map((wall: Wall) =>
      Matter.Bodies.rectangle(
        wall.x + wall.width / 2,
        wall.y + wall.height / 2,
        wall.width,
        wall.height,
        {
          label: 'wall',
          isStatic: true,
          friction: WALL_FRICTION,
          restitution: WALL_RESTITUTION,
          collisionFilter: {
            category: 0x0001,
            mask: 0x0002, // Collide only with ball
          },
          // chamfer: { radius: 1 }, // Optional rounding
        }
      )
    );

    // --- Create Boundary Walls ---
    // Use simple static rectangles for boundaries
    const boundaryThickness = 20; // Make boundaries thick enough
    const boundaryProps = {
      label: 'boundary',
      isStatic: true,
      friction: WALL_FRICTION,
      restitution: WALL_RESTITUTION,
      collisionFilter: {
        category: 0x0001,
        mask: 0x0002, // Collide only with ball
      },
    };
    const boundWalls = [
      Matter.Bodies.rectangle(width / 2, -boundaryThickness / 2, width, boundaryThickness, boundaryProps), // Top
      Matter.Bodies.rectangle(width / 2, height + boundaryThickness / 2, width, boundaryThickness, boundaryProps), // Bottom
      Matter.Bodies.rectangle(-boundaryThickness / 2, height / 2, boundaryThickness, height, boundaryProps), // Left
      Matter.Bodies.rectangle(width + boundaryThickness / 2, height / 2, boundaryThickness, height, boundaryProps), // Right
    ];

    // --- Create Goal ---
    const goal = Matter.Bodies.circle(maze.endPosition.x, maze.endPosition.y, ballRadius * 1.5, { // Slightly larger sensor
      label: 'goal',
      isStatic: true,
      isSensor: true, // Doesn't cause collisions, just detects overlap
    });

    // --- Create Laser Gates ---
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
            isSensor: true, // Sensor to detect overlap
            collisionFilter: {
              category: 0x0004, // Specific category for lasers
              mask: 0x0002, // Only check collision with ball
            },
            plugin: { // Store laser data in plugin for easy access in collision events
              laserGate: laserGate,
            },
          }
        );
        laserGates.push(laserBody);
      });
    }

    // --- Create Coins ---
    const coinComposite = Matter.Composite.create({ label: 'coins' });
    if (maze.coins && maze.coins.length > 0) {
      maze.coins.forEach((coin: Coin) => {
        const coinBody = Matter.Bodies.circle(
          coin.position.x,
          coin.position.y,
          ballRadius * 0.7, // Slightly larger sensor
          {
            label: `coin-${coin.id}`,
            isStatic: true,
            isSensor: true, // Sensor to detect overlap
            collisionFilter: {
              category: 0x0008, // Specific category for coins
              mask: 0x0002, // Only check collision with ball
            },
            plugin: { // Store coin data
              coin: coin,
            },
          }
        );
        Matter.Composite.add(coinComposite, coinBody);
      });
    }

    // --- Add all bodies to world ---
    Matter.Composite.add(world, [
      ball,
      ...walls,
      ...boundWalls,
      ...laserGates,
      goal,
      coinComposite, // Add coin composite
    ]);

    // --- Store references ---
    engineRef.current = engine;
    worldRef.current = world;
    ballRef.current = ball;
    wallsRef.current = [...walls, ...boundWalls]; // Store all walls
    laserGatesRef.current = laserGates;
    goalRef.current = goal;
    coinCompositeRef.current = coinComposite;

    // --- Collision Handling ---
    const handleCollision = (event: Matter.IEventCollision<Matter.Engine>, type: 'start' | 'active') => {
      if (gameOverTriggeredRef.current) return; // Don't process collisions if game over already triggered

      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        const ballBody = bodyA.label === 'ball' ? bodyA : bodyB.label === 'ball' ? bodyB : null;
        const otherBody = ballBody === bodyA ? bodyB : bodyA;

        if (!ballBody) continue; // Skip if pair doesn't involve the ball

        // Goal Collision
        if (otherBody.label === 'goal') {
          if (!goalReached) { // Trigger only once
            setGoalReached(true);
            if (vibrationEnabled) {
              // Haptics might still need runOnJS if called from physics thread, but let's try direct first
              // If errors persist, we'll wrap only Haptics calls
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }
        // Laser Collision
        else if (otherBody.label?.startsWith('laser-')) {
          const laserGate = otherBody.plugin?.laserGate as LaserGate;
          if (laserGate) {
            const now = Date.now();
            const cyclePosition = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
            const isLaserActive = cyclePosition < laserGate.onDuration;

            if (isLaserActive && !gameOverTriggeredRef.current) {
              gameOverTriggeredRef.current = true; // Set flag immediately
              setGameOver(true);
              if (vibrationEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
              break; // Stop checking other pairs once game over
            }
          }
        }
        // Coin Collision (only on collisionStart)
        else if (type === 'start' && otherBody.label?.startsWith('coin-')) {
          const coinId = otherBody.label.replace(/^coin-/, '');

          // Prevent double collection
          if (collectedCoinsRef.current.has(coinId)) continue;
          collectedCoinsRef.current.add(coinId);

          const coin = otherBody.plugin?.coin as Coin;
          if (!coin) continue;

          // Remove coin visually and from physics (delayed slightly)
          // Make it non-collidable immediately
          Matter.Body.set(otherBody, {
            collisionFilter: { group: -1 } // Make it non-collidable
          });
          // Schedule removal from world
          requestAnimationFrame(() => {
            if (coinCompositeRef.current && worldRef.current) {
              Matter.Composite.remove(coinCompositeRef.current, otherBody, true); // Deep remove
            }
          });


          // Dispatch collection actions
          const value = coin?.isSpecial ? (coin.value || 10) : 1;
          for (let j = 0; j < value; j++) {
            dispatch(collectCoinAndSave());
          }
          dispatch(mazeRemoveCoin(coinId)); // Update maze state in Redux

          // Haptics
          if (vibrationEnabled) {
            const impactStyle = coin?.isSpecial ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light;
            Haptics.impactAsync(impactStyle);
          }
        }
      }
    };

    Matter.Events.on(engine, 'collisionStart', (event) => handleCollision(event, 'start'));
    Matter.Events.on(engine, 'collisionActive', (event) => handleCollision(event, 'active'));

    // --- Physics Loop ---
    lastTimeRef.current = performance.now();
    const tick = () => {
      if (!engineRef.current || !ballRef.current) {
        tickerRef.current = null;
        return; // Stop loop if engine/ball is gone
      }

      const currentTime = performance.now();
      const delta = currentTime - lastTimeRef.current;

      // Update engine with variable delta time (simpler approach)
      // Matter.js handles variable delta reasonably well for non-critical simulations
      Matter.Engine.update(engineRef.current, delta);

      // Update shared values for rendering
      // Use runOnJS to ensure state updates happen on the correct thread if needed,
      // but direct assignment is often fine for shared values.
      ballPositionX.value = ballRef.current.position.x;
      ballPositionY.value = ballRef.current.position.y;

      lastTimeRef.current = currentTime;
      tickerRef.current = requestAnimationFrame(tick); // Schedule next frame
    };

    // Start the physics loop
    tickerRef.current = requestAnimationFrame(tick);

    // --- Cleanup ---
    return () => {
      if (tickerRef.current !== null) {
        cancelAnimationFrame(tickerRef.current);
        tickerRef.current = null;
      }
      if (engineRef.current) {
        Matter.Events.off(engineRef.current, 'collisionStart');
        Matter.Events.off(engineRef.current, 'collisionActive');
        Matter.Engine.clear(engineRef.current);
        engineRef.current = undefined; // Clear refs
        worldRef.current = undefined;
        ballRef.current = undefined;
        wallsRef.current = [];
        laserGatesRef.current = [];
        goalRef.current = undefined;
        coinCompositeRef.current = undefined;
      }
    };
  }, [
    maze?.id, // Re-run effect if maze ID changes
    width,
    height,
    ballRadius,
    gravityScale, // Include gravityScale if it might change
    vibrationEnabled,
    dispatch, // Include dispatch
    ballPositionX, // Include shared values
    ballPositionY,
  ]);

  // --- Reset Function ---
  const reset = useCallback(() => {
    if (ballRef.current && engineRef.current && maze) {
      const startX = maze.startPosition.x;
      const startY = maze.startPosition.y;

      // Reset position, velocity, and flags
      Matter.Body.setPosition(ballRef.current, { x: startX, y: startY });
      Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(ballRef.current, 0);

      // Reset all forces and momentum
      // Apply a tiny force in the opposite direction of any residual movement
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
      Matter.Body.setInertia(ballRef.current, Infinity); // Prevent rotation

      // Reset gravity to zero
      engineRef.current.gravity.x = 0;
      engineRef.current.gravity.y = 0;

      // Reset game state flags
      gameOverTriggeredRef.current = false;
      setGoalReached(false);
      setGameOver(false);
      collectedCoinsRef.current.clear();

      // Reset timing to prevent large delta time on first update
      lastTimeRef.current = performance.now();

      // Update shared values for rendering
      ballPositionX.value = startX;
      ballPositionY.value = startY;

      // Apply a small delay to ensure physics engine has time to process the reset
      // before any new forces are applied
      setTimeout(() => {
        if (ballRef.current && engineRef.current) {
          // Double-check position and velocity after the delay
          Matter.Body.setPosition(ballRef.current, { x: startX, y: startY });
          Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
        }
      }, 16); // One frame at 60fps
    }
  }, [maze, ballPositionX, ballPositionY]); // Dependencies for reset

  // --- Update Function (called from GameScreen) ---
  const update = useCallback(
    (tiltX: number, tiltY: number, resetVelocity: boolean = false) => {
      if (!engineRef.current || !ballRef.current) return;

      // Reset velocity if requested (e.g., on game start)
      if (resetVelocity) {
        // Force a complete stop with zero velocity
        Matter.Body.setVelocity(ballRef.current, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(ballRef.current, 0);

        // Reset gravity to zero
        engineRef.current.gravity.x = 0;
        engineRef.current.gravity.y = 0;

        // Apply a small force in the opposite direction of any residual movement
        // This helps counteract any existing momentum
        const currentVelX = ballRef.current.velocity.x;
        const currentVelY = ballRef.current.velocity.y;

        if (Math.abs(currentVelX) > 0.01 || Math.abs(currentVelY) > 0.01) {
          Matter.Body.applyForce(
            ballRef.current,
            ballRef.current.position,
            {
              x: -currentVelX * 0.1,
              y: -currentVelY * 0.1
            }
          );
        }

        // Reset timing to prevent large delta time
        lastTimeRef.current = performance.now();
      }

      // Apply gravity based on tilt - This is the core control mechanism
      // The GRAVITY_SCALE_MULTIPLIER is key for tuning the responsiveness
      // Apply a small deadzone to prevent tiny movements when device is nearly flat
      const deadzone = 0.001;
      const effectiveX = Math.abs(tiltX) < deadzone ? 0 : tiltX;
      const effectiveY = Math.abs(tiltY) < deadzone ? 0 : tiltY;

      // Apply sensitivity to the overall gravity effect
      const finalGravityScale = GRAVITY_SCALE_MULTIPLIER * gravityScale * sensitivity;
      engineRef.current.gravity.x = effectiveX * finalGravityScale;
      engineRef.current.gravity.y = effectiveY * finalGravityScale;
    },
    [gravityScale, sensitivity] // Dependency for update
  );

  // --- Memoized return value ---
  // Ensure refs are accessed safely as they might be undefined initially
  const physicsWorld: PhysicsWorld = useMemo( // Explicitly type the return value
    () => ({
      // Explicitly handle undefined case for refs
      engine: engineRef.current ?? undefined,
      world: worldRef.current ?? undefined,
      ball: ballRef.current ?? undefined,
      reset,
      update,
      ballPositionX,
      ballPositionY,
      goalReached,
      gameOver,
      // Removed walls, goal, laserGates from return unless needed externally
    }),
    // Add potentially undefined refs to dependency array
    [engineRef.current, worldRef.current, ballRef.current, reset, update, ballPositionX, ballPositionY, goalReached, gameOver]
  );

  return physicsWorld;
};
