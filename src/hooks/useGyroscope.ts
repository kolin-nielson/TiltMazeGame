import { useState, useEffect, useCallback, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useAppSelector, RootState } from '@store';
import { Platform } from 'react-native';

export interface GyroscopeData {
  x: number;
  y: number;
}

// Configuration constants
const UPDATE_INTERVAL = 16; // ms (~60Hz)
const SMOOTHING_FACTOR = 0.2; // Lower = more smoothing, Higher = more responsive
const DEAD_ZONE = 0.04; // Ignore small tilts below this threshold - increased for better stability
const CALIBRATION_SAMPLES = 5; // Increased number of samples for more accurate calibration
const CALIBRATION_INTERVAL = 20; // ms between calibration samples

export const useGyroscope = (enabled = true) => {
  const [data, setData] = useState<GyroscopeData>({ x: 0, y: 0 });
  const [offset, setOffset] = useState<GyroscopeData>({ x: 0, y: 0 });
  const [available, setAvailable] = useState<boolean>(false);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);

  // Refs for raw values and simple smoothing
  const rawXRef = useRef(0);
  const rawYRef = useRef(0);
  const smoothedXRef = useRef(0);
  const smoothedYRef = useRef(0);

  // Refs for calibration
  const calibrationSamplesRef = useRef<GyroscopeData[]>([]);
  const calibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const settings = useAppSelector((state: RootState) => state.settings);
  const sensitivity = settings.sensitivity ?? 1;

  // Apply simple linear dead zone
  const applyDeadZone = (value: number): number => {
    return Math.abs(value) < DEAD_ZONE ? 0 : value;
  };

  // Apply simple exponential moving average smoothing
  const applySmoothing = (
    current: number,
    previous: number,
    factor: number
  ): number => {
    return previous * factor + current * (1 - factor);
  };

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    const subscribe = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      setAvailable(isAvailable);
      if (!isAvailable || !enabled) return;

      Accelerometer.setUpdateInterval(UPDATE_INTERVAL);
      subscription = Accelerometer.addListener(({ x, y }) => {
        // Store raw values (used for calibration and movement detection)
        rawXRef.current = x;
        rawYRef.current = y;

        // Subtract the calibration offset
        const calibratedX = x - offset.x;
        const calibratedY = y - offset.y;

        // Apply simple dead zone
        let deadZoneX = applyDeadZone(calibratedX);
        let deadZoneY = applyDeadZone(calibratedY);

        // Apply sensitivity
        let sensitiveX = deadZoneX * sensitivity;
        let sensitiveY = -deadZoneY * sensitivity; // Invert Y axis

        // Apply simple smoothing
        smoothedXRef.current = applySmoothing(
          sensitiveX,
          smoothedXRef.current,
          SMOOTHING_FACTOR
        );
        smoothedYRef.current = applySmoothing(
          sensitiveY,
          smoothedYRef.current,
          SMOOTHING_FACTOR
        );

        let finalX = smoothedXRef.current;
        let finalY = smoothedYRef.current;

        if (Platform.OS === 'android') {
          // Invert axes on Android to match iOS tilt orientation
          finalX = -finalX;
          finalY = -finalY;
        }

        setData({ x: finalX, y: finalY });
      });
    };

    subscribe();
    return () => subscription?.remove();
  }, [enabled, offset, sensitivity]); // Removed deviceSettings dependency

  // Clean up any existing calibration timeout
  useEffect(() => {
    return () => {
      if (calibrationTimeoutRef.current) {
        clearTimeout(calibrationTimeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    // Clear any existing calibration process
    if (calibrationTimeoutRef.current) {
      clearTimeout(calibrationTimeoutRef.current);
    }

    // Reset calibration state
    setIsCalibrating(true);
    setIsCalibrated(false);
    calibrationSamplesRef.current = [];

    // Immediately set initial values to prevent any movement during calibration
    const initialRawX = rawXRef.current;
    const initialRawY = rawYRef.current;

    // Set initial offset based on current position
    setOffset({
      x: initialRawX,
      y: initialRawY,
    });

    // Reset smoothed values and data immediately
    smoothedXRef.current = 0;
    smoothedYRef.current = 0;
    setData({ x: 0, y: 0 });

    // Start collecting calibration samples
    const collectSamples = () => {
      // Add current sample
      calibrationSamplesRef.current.push({
        x: rawXRef.current,
        y: rawYRef.current
      });

      // If we have enough samples, calculate the average and set as offset
      if (calibrationSamplesRef.current.length >= CALIBRATION_SAMPLES) {
        // Calculate average of samples
        const avgX = calibrationSamplesRef.current.reduce((sum, sample) => sum + sample.x, 0) / CALIBRATION_SAMPLES;
        const avgY = calibrationSamplesRef.current.reduce((sum, sample) => sum + sample.y, 0) / CALIBRATION_SAMPLES;

        // Set final offset based on average
        setOffset({
          x: avgX,
          y: avgY
        });

        // Reset smoothed values again with final offset
        smoothedXRef.current = 0;
        smoothedYRef.current = 0;
        setData({ x: 0, y: 0 });

        // Mark calibration as complete
        setIsCalibrating(false);
        setIsCalibrated(true);
      } else {
        // Continue collecting samples with a small delay
        calibrationTimeoutRef.current = setTimeout(collectSamples, CALIBRATION_INTERVAL);
      }
    };

    // Start the sample collection process
    collectSamples();
  }, []); // No dependencies needed as we use refs

  // Auto-calibrate once sensor becomes available
  useEffect(() => {
    if (available && !isCalibrated) { // Only calibrate if not already calibrated
      reset();
    }
  }, [available, isCalibrated, reset]);

  // Detect if device has moved significantly from calibrated position
  // Useful for auto-recalibration suggestions (kept as it's used in GameScreen)
  const hasDeviceMovedSignificantly = useCallback(() => {
    // Calculate the difference between current raw tilt and the calibrated offset
    const deltaX = rawXRef.current - offset.x;
    const deltaY = rawYRef.current - offset.y;

    // Calculate magnitude of the difference
    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If magnitude is large, device has moved significantly from calibrated position
    return magnitude > 0.5; // Threshold for significant movement
  }, [offset.x, offset.y]); // Depend on offset

  // Force a complete calibration with a delay to ensure device is stable
  const forceCalibration = useCallback((delayMs = 100) => {
    // Clear any existing calibration process
    if (calibrationTimeoutRef.current) {
      clearTimeout(calibrationTimeoutRef.current);
    }

    // Reset calibration state immediately
    setIsCalibrating(true);
    setIsCalibrated(false);

    // Reset data to prevent movement during the delay
    smoothedXRef.current = 0;
    smoothedYRef.current = 0;
    setData({ x: 0, y: 0 });

    // Wait for the device to stabilize before starting calibration
    calibrationTimeoutRef.current = setTimeout(() => {
      // Start the actual calibration process
      reset();
    }, delayMs);
  }, [reset]);

  return {
    data,
    available,
    reset,
    forceCalibration,
    isCalibrated,
    isCalibrating,
    hasDeviceMovedSignificantly,
  };
};
