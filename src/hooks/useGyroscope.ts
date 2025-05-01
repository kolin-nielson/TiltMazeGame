import { useState, useEffect, useCallback, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useAppSelector, RootState } from '@store';
import { Platform, Dimensions } from 'react-native';

export interface GyroscopeData {
  x: number;
  y: number;
}

// Get device info for better calibration
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_TABLET = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 600;

export const useGyroscope = (enabled = true) => {
  const [data, setData] = useState<GyroscopeData>({ x: 0, y: 0 });
  const [offset, setOffset] = useState<GyroscopeData>({ x: 0, y: 0 });
  const [available, setAvailable] = useState<boolean>(false);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  
  // Store movement history for better smoothing
  const movementHistoryX = useRef<number[]>([]);
  const movementHistoryY = useRef<number[]>([]);
  const HISTORY_LENGTH = 5; // Store last 5 samples for better adaptive smoothing
  
  // Keep previous values for smoothing
  const prevRawX = useRef(0);
  const prevRawY = useRef(0);
  const prevMappedX = useRef(0);
  const prevMappedY = useRef(0);
  const lastUpdateTime = useRef(Date.now());
  
  // For detecting micromovements
  const microMovementCounter = useRef(0);
  const lastSignificantMovement = useRef(Date.now());

  const settings = useAppSelector((state: RootState) => state.settings);
  const sensitivity = settings.sensitivity ?? 1;

  // Faster update interval for more responsive feel
  const UPDATE_INTERVAL = 6; // ms - faster for higher responsiveness

  // Enhanced device-specific adjustments for more intuitive control
  const getDeviceSpecificSettings = () => {
    // Get screen aspect ratio to better detect device type
    const aspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
    const isWideScreen = aspectRatio > 0.6; // Wider screens need different settings

    // Base settings that work well across most devices
    const baseSettings = {
      // Smaller dead zone for more responsive initial movement
      deadZone: 0.02,
      // Higher amplification for more satisfying control
      amplification: 1.8,
      // Adaptive smoothing for stability without feeling sluggish
      smoothingFactor: 0.22,
      // More personalized response curve for better fine control
      responseCurve: 1.08,
      // Higher initial movement boost to overcome inertia feeling
      initialBoost: 1.35,
      // New: micro-adjustment responsiveness
      microAdjustmentSensitivity: 1.25,
      // New: quick-stop responsiveness (how quickly the ball stops when device is level)
      quickStopFactor: 1.4
    };

    if (Platform.OS === 'ios') {
      if (IS_TABLET) {
        return {
          // iPads need slightly larger dead zone due to weight
          deadZone: 0.018,
          // Less amplification since tablets are held differently
          amplification: isWideScreen ? 1.45 : 1.5,
          // Less smoothing for direct control
          smoothingFactor: 0.20,
          // More linear response for predictable movement
          responseCurve: 1.05,
          // More initial boost for tablets to overcome their weight
          initialBoost: 1.4,
          // Better micro-adjustment for precision on larger screens
          microAdjustmentSensitivity: 1.35,
          // Faster stopping for better control
          quickStopFactor: 1.5
        };
      } else {
        // iPhone settings
        return {
          deadZone: 0.016, // Smaller dead zone for more precise control
          // Higher amplification for one-handed play
          amplification: 1.75,
          // Less smoothing for more responsive feel
          smoothingFactor: 0.18,
          // Slightly non-linear for better control
          responseCurve: 1.07,
          initialBoost: 1.35,
          // Better micro-adjustment for precision
          microAdjustmentSensitivity: 1.3,
          // Faster stopping for better control
          quickStopFactor: 1.45
        };
      }
    } else {
      // Android devices have more variety, so we adjust based on screen size too
      if (IS_TABLET) {
        return {
          deadZone: 0.017,
          // Android tablets need slightly higher amplification 
          amplification: isWideScreen ? 1.6 : 1.65,
          // Less smoothing for more responsive feel
          smoothingFactor: 0.20,
          // More non-linear for Android tablets
          responseCurve: 1.08,
          initialBoost: 1.45,
          // Better micro-adjustment for precision on larger screens
          microAdjustmentSensitivity: 1.4,
          // Faster stopping for better control
          quickStopFactor: 1.55
        };
      } else {
        // Android phones
        return {
          // Smaller dead zone for Android phones
          deadZone: 0.015,
          // Higher amplification for better response
          amplification: 1.85,
          // Less smoothing for Android sensors for more responsive feel
          smoothingFactor: 0.17,
          // More non-linear for Android
          responseCurve: 1.09,
          // Higher initial boost for Android
          initialBoost: 1.5,
          // Better micro-adjustment for precision
          microAdjustmentSensitivity: 1.45,
          // Faster stopping for better control
          quickStopFactor: 1.6
        };
      }
    }
  };

  const deviceSettings = getDeviceSpecificSettings();

  // Apply improved dead zone with natural feel response curve
  const applySmoothDeadZone = (value: number, deadZone: number): number => {
    const absValue = Math.abs(value);

    // Complete dead zone for very tiny movements (helps with hand tremors)
    if (absValue < deadZone * 0.4) return 0;

    // Gradual response zone - creates a smooth transition from no movement to movement
    if (absValue < deadZone) {
      // Map values in [deadZone*0.4, deadZone] to [0, 0.15] with smooth curve
      const normalizedValue = (absValue - (deadZone * 0.4)) / (deadZone * 0.6);
      // Use custom easing for extra smooth start
      const easedResponse = Math.pow(normalizedValue, 2.5) * 0.15;
      return Math.sign(value) * easedResponse;
    }

    // Enhanced response curve
    const normalizedValue = (absValue - deadZone) / (1 - deadZone);

    // Apply multi-segmented response curve for better control:
    // - Ultra-sensitive in the small tilt range (for precise adjustments)
    // - Balanced in middle range (for normal play)
    // - Limited at extreme tilts (prevents overshooting)
    let curvedResponse;
    if (normalizedValue < 0.3) {
      // Boost sensitivity for micro-adjustments
      curvedResponse = Math.pow(normalizedValue * 3.33, deviceSettings.responseCurve * 0.85) * 0.3 * deviceSettings.microAdjustmentSensitivity;
    } else if (normalizedValue < 0.7) {
      // Linear in middle range for predictable movement
      curvedResponse = 0.3 + (normalizedValue - 0.3) * (0.4 / 0.4);
    } else {
      // Reduced sensitivity for extreme tilts
      curvedResponse = 0.7 + Math.pow((normalizedValue - 0.7) * 3.33, deviceSettings.responseCurve * 1.2) * 0.3;
    }

    return Math.sign(value) * curvedResponse;
  };

  // More advanced adaptive smoothing algorithm
  const applyAdaptiveSmoothing = (
    current: number,
    previous: number,
    baseSmoothingFactor: number,
    deltaTime: number
  ): number => {
    // Add current value to history while keeping history limited
    if (current === previous) {
      // Increment micro-movement counter
      microMovementCounter.current++;
      
      // If device hasn't moved significantly for a while, gradually reduce movement
      // This creates a natural stopping effect when the device is held still
      if (microMovementCounter.current > 20) {
        // Apply quick stopping factor to make the ball come to rest faster
        const quickStopValue = previous * (1 - 0.08 * deviceSettings.quickStopFactor * deltaTime * 60);
        
        // Only apply quick stop if value is small (avoids sudden stops at high speeds)
        if (Math.abs(previous) < 0.3) {
          return quickStopValue;
        }
      }
    } else {
      // Reset micro-movement counter when device moves
      microMovementCounter.current = 0;
      lastSignificantMovement.current = Date.now();
    }
    
    // Calculate movement speed (change per second)
    const changeRate = Math.abs(current - previous) / Math.max(0.016, deltaTime);

    // Calculate direction change
    const directionChanged = Math.sign(current) !== Math.sign(previous) &&
                             Math.abs(previous) > 0.05;
                             
    // Add to movement history for trend detection
    if (current !== previous) {
      if (current !== 0) {
        movementHistoryX.current.push(current);
        if (movementHistoryX.current.length > HISTORY_LENGTH) {
          movementHistoryX.current.shift();
        }
      }
    }
    
    // Detect if the user is making consistent micro-adjustments
    const isMakingMicroAdjustments = movementHistoryX.current.length >= 3 && 
      movementHistoryX.current.every(v => Math.abs(v) < 0.2 && Math.abs(v) > 0.01);

    // Calculate optimal smoothing factor:
    let adaptiveFactor;

    if (directionChanged) {
      // Reduce smoothing dramatically when direction changes for more responsive reversals
      adaptiveFactor = Math.max(0.01, baseSmoothingFactor * 0.2);
    } else if (Math.abs(current) < 0.05 && Math.abs(previous) < 0.05) {
      // More smoothing for very small movements to reduce jitter
      adaptiveFactor = Math.min(0.7, baseSmoothingFactor * 1.3);
    } else if (isMakingMicroAdjustments) {
      // Less smoothing when user is making intentional small adjustments
      adaptiveFactor = Math.max(0.05, baseSmoothingFactor * 0.5);
    } else {
      // Standard adaptive smoothing based on movement speed
      const speedFactor = Math.min(1, changeRate * 10);
      adaptiveFactor = Math.max(
        0.05,
        baseSmoothingFactor * (1 - speedFactor * 0.8)
      );
    }

    // Apply smoothing with the adaptive factor
    return previous * adaptiveFactor + current * (1 - adaptiveFactor);
  };
  
  // Detect significant movement threshold for auto-recalibration
  const hasDeviceMovedSignificantly = useCallback(() => {
    // Get the raw accelerometer data without calibration offset
    const rawAccX = prevRawX.current;
    const rawAccY = prevRawY.current;
    
    // Calculate total acceleration magnitude
    const magnitude = Math.sqrt(rawAccX * rawAccX + rawAccY * rawAccY);
    
    // Define "significant" as exceeding 0.4G (adjusted for device)
    const threshold = IS_TABLET ? 0.42 : 0.38;
    
    return magnitude > threshold;
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    const subscribe = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      setAvailable(isAvailable);
      if (!isAvailable || !enabled) return;

      Accelerometer.setUpdateInterval(UPDATE_INTERVAL);
      subscription = Accelerometer.addListener(({ x, y }) => {
        // Calculate delta time for smooth, consistent movement regardless of frame rate
        const now = Date.now();
        const deltaTime = Math.min(100, now - lastUpdateTime.current) / 1000; // Cap at 100ms
        lastUpdateTime.current = now;

        // Subtract the calibration offset
        const rawX = x - offset.x;
        const rawY = y - offset.y;

        // Store raw values for next frame's smoothing
        prevRawX.current = rawX;
        prevRawY.current = rawY;

        // Apply smooth dead zone with improved response
        const smoothedX = applySmoothDeadZone(rawX, deviceSettings.deadZone);
        const smoothedY = applySmoothDeadZone(rawY, deviceSettings.deadZone);

        // Apply sensitivity and amplification
        let mappedX = smoothedX * sensitivity * deviceSettings.amplification;
        let mappedY = -smoothedY * sensitivity * deviceSettings.amplification; // Invert Y axis

        // Apply initial movement boost to overcome perceived inertia
        // This makes small movements feel more immediately responsive
        if (Math.abs(mappedX) > 0.01 && Math.abs(prevMappedX.current) < 0.01) {
          // Apply boost when starting from near-zero
          mappedX *= deviceSettings.initialBoost;
        }

        if (Math.abs(mappedY) > 0.01 && Math.abs(prevMappedY.current) < 0.01) {
          // Apply boost when starting from near-zero
          mappedY *= deviceSettings.initialBoost;
        }

        // Apply enhanced adaptive smoothing
        mappedX = applyAdaptiveSmoothing(
          mappedX,
          prevMappedX.current,
          deviceSettings.smoothingFactor,
          deltaTime
        );

        mappedY = applyAdaptiveSmoothing(
          mappedY,
          prevMappedY.current,
          deviceSettings.smoothingFactor,
          deltaTime
        );

        // Store mapped values for next frame
        prevMappedX.current = mappedX;
        prevMappedY.current = mappedY;

        // Update state
        setData({ x: mappedX, y: mappedY });
      });
    };

    subscribe();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, offset, sensitivity, deviceSettings]);

  const reset = useCallback(() => {
    Accelerometer.getAccelerometerDataAsync().then((data) => {
      // Clear history on calibration
      movementHistoryX.current = [];
      movementHistoryY.current = [];
      
      // Reset counters
      microMovementCounter.current = 0;
      
      // Store the current readings as offsets
      setOffset({ x: data.x, y: data.y });
      setData({ x: 0, y: 0 });
      setIsCalibrated(true);
      
      // Reset previous values to prevent jumps
      prevRawX.current = 0;
      prevRawY.current = 0;
      prevMappedX.current = 0;
      prevMappedY.current = 0;
    });
  }, []);

  return {
    data,
    available,
    reset,
    isCalibrated,
    hasDeviceMovedSignificantly,
  };
};
