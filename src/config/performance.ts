/**
 * Performance Configuration
 * Centralized performance settings for optimal mobile game experience
 */

// Animation configuration for smooth 60fps performance
export const ANIMATION_CONFIG = {
  // Reduced animation durations for snappier feel
  COIN_ANIMATION_DURATION: 2500,
  GOAL_ANIMATION_DURATION: 2000,
  BALL_TRAIL_DURATION: 300,
  
  // Frame rate targets
  TARGET_FPS: 60,
  PHYSICS_FPS: 60,
  
  // Animation easing
  DEFAULT_EASING: 'ease',
  
  // Sparkle settings - reduced for performance
  MAX_SPARKLES_PER_COIN: 2,
  MAX_SPARKLES_PER_GOAL: 2,
  
  // Trail settings
  MAX_TRAIL_POINTS: 8,
  TRAIL_CLEANUP_INTERVAL: 50, // ms
} as const;

// Physics optimization settings
export const PHYSICS_CONFIG = {
  // Engine settings
  POSITION_ITERATIONS: 6, // Increased for better collision detection
  VELOCITY_ITERATIONS: 8, // Increased for better collision detection
  CONSTRAINT_ITERATIONS: 8, // Increased for better collision detection
  
  // Ball physics - More aggressive anti-tunneling settings
  MAX_BALL_SPEED: 6, // Further reduced from 8 to prevent tunneling
  BASE_MAX_SPEED: 6, // Base speed limit for sensitivity = 1.0
  MIN_MAX_SPEED: 2.5,  // Much lower minimum speed limit for high sensitivity
  MAX_MAX_SPEED: 8, // Reduced maximum speed limit for low sensitivity
  SENSITIVITY_SPEED_FACTOR: 1.2, // Increased factor for stronger inverse relationship
  
  BALL_RADIUS: 7,
  BALL_DENSITY: 0.12,
  BALL_FRICTION: 0.015,
  BALL_RESTITUTION: 0.25,
  
  // Gravity settings
  GRAVITY_SCALE_MULTIPLIER: 0.018,
  
  // Much more aggressive anti-tunneling physics settings
  CONTINUOUS_COLLISION_DETECTION: true,
  MIN_WALL_THICKNESS: 4, // Only very thin walls need enhancement
  ADDITIONAL_WALL_BUFFER: 0.5, // Minimal buffer only for extremely thin walls
  HIGH_SPEED_PHYSICS_STEPS: 4, // More physics steps when ball is moving fast
  SPEED_THRESHOLD_FOR_EXTRA_STEPS: 3, // Much lower speed threshold for extra steps
  
  // Performance optimizations - more conservative for anti-tunneling
  ENABLE_SLEEPING: false,
  TIME_SCALE: 1.0,
  MAX_DELTA_TIME: 16, // Reduced to match Matter.js recommendation (16.667ms)
  
  // Collision optimization - match visual walls exactly
  WALL_BUFFER: 0, // No buffer - exact visual match
  COLLISION_SLOP: 0.02, // More forgiving collision slop to prevent sticking
} as const;

// Rendering optimization settings
export const RENDERING_CONFIG = {
  // SVG optimization
  VIEWPORT_SIZE: 300,
  PRESERVE_ASPECT_RATIO: 'xMidYMid meet',
  
  // Memoization settings
  USE_DEEP_MEMO: true,
  ENABLE_COMPONENT_MEMOIZATION: true,
  
  // Gradient optimization
  CACHE_GRADIENTS: true,
  MAX_CACHED_GRADIENTS: 50,
  
  // Animation optimization
  USE_NATIVE_DRIVER: true,
  REDUCE_MOTION_THRESHOLD: 0.001,
} as const;

// Memory management settings
export const MEMORY_CONFIG = {
  // Cleanup thresholds
  MAX_INACTIVE_ANIMATIONS: 10,
  CLEANUP_INTERVAL: 5000, // ms
  
  // Cache settings
  MAX_COMPONENT_CACHE_SIZE: 100,
  AUTO_CLEANUP_ENABLED: true,
} as const;

// Device-specific optimizations
export const DEVICE_CONFIG = {
  // Performance tiers based on device capabilities
  LOW_END: {
    maxAnimations: 5,
    reduceSparkles: true,
    simplifyGradients: true,
    physicsIterations: 3,
  },
  
  MID_RANGE: {
    maxAnimations: 10,
    reduceSparkles: false,
    simplifyGradients: false,
    physicsIterations: 4,
  },
  
  HIGH_END: {
    maxAnimations: 20,
    reduceSparkles: false,
    simplifyGradients: false,
    physicsIterations: 6,
  },
} as const;

// Export all configurations
export const PERFORMANCE_CONFIG = {
  ANIMATION: ANIMATION_CONFIG,
  PHYSICS: PHYSICS_CONFIG,
  RENDERING: RENDERING_CONFIG,
  MEMORY: MEMORY_CONFIG,
  DEVICE: DEVICE_CONFIG,
} as const;

export default PERFORMANCE_CONFIG; 