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

  // Keep previous values for smoothing
  const prevRawX = useRef(0);
  const prevRawY = useRef(0);
  const prevMappedX = useRef(0);
  const prevMappedY = useRef(0);
  const lastUpdateTime = useRef(Date.now());

  const settings = useAppSelector((state: RootState) => state.settings);
  const sensitivity = settings.sensitivity ?? 1;

  // Increase sample rate for more immediate updates
  const UPDATE_INTERVAL = 8; // ms - slightly faster for more responsive feel

  // Enhanced device-specific adjustments for more intuitive control
  const getDeviceSpecificSettings = () => {
    // Get screen aspect ratio to better detect device type
    const aspectRatio = SCREEN_WIDTH / SCREEN_HEIGHT;
    const isWideScreen = aspectRatio > 0.6; // Wider screens need different settings

    // Base settings that work well across most devices
    const baseSettings = {
      // Slightly larger dead zone for more stability at rest
      deadZone: 0.025,
      // Moderate amplification for good balance of control and responsiveness
      amplification: 1.5,
      // Moderate smoothing for stability without feeling sluggish
      smoothingFactor: 0.28,
      // Slightly non-linear response for better fine control
      responseCurve: 1.12,
      // Initial movement boost to overcome inertia feeling
      initialBoost: 1.2,
    };

    if (Platform.OS === 'ios') {
      if (IS_TABLET) {
        return {
          // iPads need smaller dead zone due to more stable holding
          deadZone: 0.018,
          // Less amplification since tablets are held differently
          amplification: isWideScreen ? 1.35 : 1.4,
          // More smoothing for tablets as they're less shaky
          smoothingFactor: 0.32,
          // More linear response for predictable movement
          responseCurve: 1.08,
          // Less initial boost needed for tablets
          initialBoost: 1.15,
        };
      } else {
        // iPhone settings
        return {
          deadZone: 0.022,
          // Slightly higher amplification for one-handed play
          amplification: 1.55,
          // Less smoothing for more responsive feel
          smoothingFactor: 0.25,
          // Slightly non-linear for better control
          responseCurve: 1.1,
          initialBoost: 1.2,
        };
      }
    } else {
      // Android devices have more variety, so we adjust based on screen size too
      if (IS_TABLET) {
        return {
          deadZone: 0.02,
          // Android tablets need slightly higher amplification than iPads
          amplification: isWideScreen ? 1.4 : 1.45,
          // More smoothing to handle Android sensor variance
          smoothingFactor: 0.35,
          // More non-linear for Android tablets
          responseCurve: 1.12,
          initialBoost: 1.15,
        };
      } else {
        // Android phones
        return {
          // Slightly higher dead zone for Android phones
          deadZone: 0.025,
          // Higher amplification to compensate for Android sensor differences
          amplification: 1.65,
          // More smoothing for Android sensors
          smoothingFactor: 0.3,
          // More non-linear for Android
          responseCurve: 1.15,
          // Higher initial boost for Android
          initialBoost: 1.25,
        };
      }
    }
  };

  const deviceSettings = getDeviceSpecificSettings();

  // Apply a smooth dead zone with an even more gradual response curve
  // This creates a more forgiving and intuitive control experience
  const applySmoothDeadZone = (value: number, deadZone: number): number => {
    const absValue = Math.abs(value);

    // Complete dead zone for very tiny movements (helps with hand tremors)
    if (absValue < deadZone * 0.5) return 0;

    // Gradual response zone - creates a smooth transition from no movement to movement
    if (absValue < deadZone) {
      // Map values in [deadZone*0.5, deadZone] to [0, 0.1] with smooth curve
      const normalizedValue = (absValue - (deadZone * 0.5)) / (deadZone * 0.5);
      // Use cubic easing for extra smooth start
      const easedResponse = Math.pow(normalizedValue, 3) * 0.1;
      return Math.sign(value) * easedResponse;
    }

    // Normal response zone with non-linear curve for better control
    const normalizedValue = (absValue - deadZone) / (1 - deadZone);

    // Apply custom response curve:
    // - More sensitive in the middle range (small to medium tilts)
    // - Less sensitive at extreme tilts (prevents overshooting)
    let curvedResponse;
    if (normalizedValue < 0.5) {
      // Boost sensitivity for small tilts (most common during precise control)
      curvedResponse = Math.pow(normalizedValue * 2, deviceSettings.responseCurve * 0.9) * 0.5;
    } else {
      // Reduce sensitivity for large tilts (prevent overshooting)
      curvedResponse = 0.5 + Math.pow((normalizedValue - 0.5) * 2, deviceSettings.responseCurve * 1.1) * 0.5;
    }

    return Math.sign(value) * curvedResponse;
  };

  // Enhanced adaptive smoothing for more intuitive control
  const applyAdaptiveSmoothing = (
    current: number,
    previous: number,
    baseSmoothingFactor: number,
    deltaTime: number
  ): number => {
    // Calculate movement speed (change per second)
    const changeRate = Math.abs(current - previous) / deltaTime;

    // Calculate direction change (if the value changed direction)
    const directionChanged = Math.sign(current) !== Math.sign(previous) &&
                             Math.abs(previous) > 0.05;

    // Calculate adaptive smoothing factor:
    // 1. Less smoothing for fast movements (more responsive)
    // 2. More smoothing for slow/precise movements (more stable)
    // 3. Less smoothing when direction changes (more responsive to reversals)
    // 4. More smoothing for very small movements (reduces jitter)

    let adaptiveFactor;

    if (directionChanged) {
      // Reduce smoothing when direction changes for more responsive reversals
      // This makes the controls feel more immediately responsive when changing direction
      adaptiveFactor = Math.max(0.01, baseSmoothingFactor * 0.3);
    } else if (Math.abs(current) < 0.1) {
      // More smoothing for very small movements to reduce jitter
      adaptiveFactor = Math.min(0.8, baseSmoothingFactor * 1.5);
    } else {
      // Standard adaptive smoothing based on movement speed
      const speedFactor = Math.min(1, changeRate * 8);
      adaptiveFactor = Math.max(
        0.05,
        baseSmoothingFactor * (1 - speedFactor)
      );
    }

    // Apply smoothing with the adaptive factor
    return previous * adaptiveFactor + current * (1 - adaptiveFactor);
  };

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

        // Apply smooth dead zone with gradual response
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

        // Apply adaptive smoothing based on movement speed
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

        if (Platform.OS === 'android') {
          // Invert axes on Android to match iOS tilt orientation
          mappedX = -mappedX;
          mappedY = -mappedY;
        }

        // Apply a very subtle auto-centering force when tilt is very small
        // This helps the ball naturally come to rest when the device is almost level
        const autoCenterThreshold = 0.03;
        if (Math.abs(mappedX) < autoCenterThreshold) {
          mappedX *= Math.pow(Math.abs(mappedX) / autoCenterThreshold, 1.5);
        }

        if (Math.abs(mappedY) < autoCenterThreshold) {
          mappedY *= Math.pow(Math.abs(mappedY) / autoCenterThreshold, 1.5);
        }

        setData({ x: mappedX, y: mappedY });
      });
    };

    subscribe();
    return () => subscription?.remove();
  }, [enabled, offset, sensitivity, deviceSettings]);

  const reset = useCallback(() => {
    // Create a safe offset from current raw values
    const rawX = prevRawX.current || 0;
    const rawY = prevRawY.current || 0;

    // Set new offset to current raw position plus existing offset
    // This is the key to proper calibration - we need to account for the current position
    setOffset(current => ({
      x: rawX + current.x,
      y: rawY + current.y
    }));

    // Reset data to zero immediately
    setData({ x: 0, y: 0 });
    setIsCalibrated(true);

    // Reset previous values to prevent jumps
    prevRawX.current = 0;
    prevRawY.current = 0;
    prevMappedX.current = 0;
    prevMappedY.current = 0;

    // Force a second calibration after a short delay to ensure stability
    // This helps with devices that have sensor lag
    setTimeout(() => {
      const currentRawX = prevRawX.current || 0;
      const currentRawY = prevRawY.current || 0;

      setOffset(current => ({
        x: currentRawX + current.x,
        y: currentRawY + current.y
      }));

      setData({ x: 0, y: 0 });

      // Reset previous values again
      prevRawX.current = 0;
      prevRawY.current = 0;
      prevMappedX.current = 0;
      prevMappedY.current = 0;
    }, 50);
  }, []);

  // Auto-calibrate once sensor becomes available
  useEffect(() => {
    if (available) {
      reset();
    }
  }, [available, reset]);

  // Detect if device has moved significantly from calibrated position
  // Useful for auto-recalibration suggestions
  const hasDeviceMovedSignificantly = useCallback(() => {
    const rawTilt = {
      x: prevRawX.current,
      y: prevRawY.current
    };

    // Calculate magnitude of raw tilt
    const magnitude = Math.sqrt(rawTilt.x * rawTilt.x + rawTilt.y * rawTilt.y);

    // If magnitude is large and sustained, device has moved significantly
    return magnitude > 0.5; // Threshold for significant movement
  }, []);

  return {
    data,
    available,
    reset,
    isCalibrated,
    hasDeviceMovedSignificantly,
  };
};
