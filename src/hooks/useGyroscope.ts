import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import { useAppSelector, RootState } from '../store';

// Adjust these constants for better device compatibility
const SMOOTHING_FACTOR = 0.8; // Less smoothing for more responsive controls
const BASE_SENSITIVITY = 1.8; // Lower base sensitivity for more consistent control
const HORIZONTAL_BOOST = 1.2; // Boost horizontal movement slightly
const DEAD_ZONE = 0.04; // Larger dead zone to prevent drift
const RESPONSE_CURVE_POWER = 1.2; // Less aggressive response curve

// Device-specific adjustments
const DEVICE_ADJUSTMENTS: Record<string, {
  updateInterval: number,
  xMultiplier: number,
  yMultiplier: number,
  deadZoneMultiplier: number,
  smoothingAdjustment: number
}> = {
  // Default values
  default: {
    updateInterval: 16,
    xMultiplier: 1.0,
    yMultiplier: 1.0,
    deadZoneMultiplier: 1.0,
    smoothingAdjustment: 0.0
  },
  // Android-specific adjustments
  android: {
    updateInterval: 32,
    xMultiplier: 1.2,
    yMultiplier: 1.1,
    deadZoneMultiplier: 1.5,
    smoothingAdjustment: 0.05
  },
  // Pixel-specific adjustments (known to have gyroscope issues)
  pixel: {
    updateInterval: 48,
    xMultiplier: 1.4,
    yMultiplier: 1.3,
    deadZoneMultiplier: 2.0,
    smoothingAdjustment: 0.1
  },
  // iOS-specific adjustments
  ios: {
    updateInterval: 16,
    xMultiplier: 1.0,
    yMultiplier: 1.0,
    deadZoneMultiplier: 1.0,
    smoothingAdjustment: 0.0
  }
};

interface GyroscopeData {
  x: number;
  y: number;
  z: number;
}

// Use variables outside the component to store calibration offset and state
// This will persist even when the component is unmounted and remounted
let globalCalibrationOffset: GyroscopeData | null = null;
let isCalibrated = false; // Track if we've already calibrated
let lastRawData: GyroscopeData | null = null; // Store the last raw data to detect device movement
// Detect device type for specific adjustments
let deviceType: string = Platform.OS;
let deviceModel: string = '';

// Try to detect Pixel devices
if (Platform.OS === 'android') {
  try {
    const { Brand } = Platform.constants || {};
    deviceModel = Brand || '';
    if (deviceModel.toLowerCase().includes('pixel')) {
      deviceType = 'pixel';
    }
  } catch (e) {
    // Fallback to generic Android if detection fails
    deviceType = 'android';
  }
}
let calibrationTimestamp: number = 0; // Track when calibration occurred

export const useGyroscope = (enabled = true) => {
  const [data, setData] = useState<GyroscopeData>({ x: 0, y: 0, z: 0 });
  const [available, setAvailable] = useState<boolean>(false);
  const settings = useAppSelector((state: RootState) => state.settings);

  // Refs to store the latest raw data and smoothing history
  const rawGyroDataRef = useRef<GyroscopeData>({ x: 0, y: 0, z: 0 });
  const prevDataRef = useRef<GyroscopeData>({ x: 0, y: 0, z: 0 });

  // Use the global calibration offset ref instead of component state
  // This ensures the calibration persists even when the component is unmounted and remounted

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const checkAvailability = async () => {
      const isGyroAvailable = await Gyroscope.isAvailableAsync();
      setAvailable(isGyroAvailable);

      if (isGyroAvailable && enabled) {
        // Get device-specific settings
        const deviceSettings = DEVICE_ADJUSTMENTS[deviceType] || DEVICE_ADJUSTMENTS.default;

        // Apply device-specific update interval
        Gyroscope.setUpdateInterval(deviceSettings.updateInterval);

        // Log device type for debugging
        console.log(`Using gyroscope settings for: ${deviceType} (${deviceModel})`);
        console.log(`Update interval: ${deviceSettings.updateInterval}ms`);

        // Only reset smoothing history, NOT calibration offset
        // This ensures calibration persists between levels
        if (!prevDataRef.current) {
          prevDataRef.current = { x: 0, y: 0, z: 0 };
        }

        subscription = Gyroscope.addListener(gyroData => {
          let adjustedData = { ...gyroData };

          // Get device-specific settings
          const deviceSettings = DEVICE_ADJUSTMENTS[deviceType] || DEVICE_ADJUSTMENTS.default;

          // Platform-specific adjustments
          if (Platform.OS === 'ios') {
            // iOS uses different axis orientation
            adjustedData = {
              x: gyroData.y * deviceSettings.xMultiplier,
              y: gyroData.x * deviceSettings.yMultiplier,
              z: gyroData.z
            };
          } else {
            // Android-based adjustments with device-specific multipliers
            adjustedData = {
              x: gyroData.x * deviceSettings.xMultiplier,
              y: gyroData.y * deviceSettings.yMultiplier,
              z: gyroData.z
            };
          }

          // Store the latest raw (platform-adjusted) data
          rawGyroDataRef.current = adjustedData;
          lastRawData = { ...adjustedData }; // Update global last raw data

          // --- Apply Calibration Offset ---
          let relativeData = { ...adjustedData };
          if (globalCalibrationOffset) {
            relativeData.x -= globalCalibrationOffset.x;
            relativeData.y -= globalCalibrationOffset.y;
            // Assuming Z is not used for tilt calibration, but adjust if needed
            // relativeData.z -= globalCalibrationOffset.z;
          }
          // --- End Calibration ---

          // Apply dead zone to *relative* data with device-specific adjustments
          const deadZone = DEAD_ZONE * deviceSettings.deadZoneMultiplier;

          // Apply progressive dead zone - stronger near center, weaker at extremes
          const applyDeadZone = (value: number, threshold: number) => {
            const absValue = Math.abs(value);
            if (absValue < threshold) {
              return 0;
            } else {
              // Smooth transition out of dead zone
              const factor = Math.min(1, (absValue - threshold) / (threshold * 2));
              return value * factor;
            }
          };

          relativeData.x = applyDeadZone(relativeData.x, deadZone);
          relativeData.y = applyDeadZone(relativeData.y, deadZone);

          // Apply response curve to *relative* data
          const applyResponseCurve = (value: number) => {
            const sign = Math.sign(value);
            return sign * Math.pow(Math.abs(value), RESPONSE_CURVE_POWER);
          };
          relativeData.x = applyResponseCurve(relativeData.x);
          relativeData.y = applyResponseCurve(relativeData.y);

          // Apply adaptive smoothing with device-specific adjustments
          const movementMagnitude = Math.sqrt(relativeData.x * relativeData.x + relativeData.y * relativeData.y);

          // Adjust smoothing based on device and movement speed
          const baseSmoothingFactor = SMOOTHING_FACTOR + deviceSettings.smoothingAdjustment;
          const adaptiveSmoothingFactor = Math.max(0.4, baseSmoothingFactor - (movementMagnitude * 0.25));

          // Apply exponential moving average with adaptive factor
          const smoothedData = {
            x: prevDataRef.current.x * adaptiveSmoothingFactor + relativeData.x * (1 - adaptiveSmoothingFactor),
            y: prevDataRef.current.y * adaptiveSmoothingFactor + relativeData.y * (1 - adaptiveSmoothingFactor),
            z: prevDataRef.current.z * baseSmoothingFactor + relativeData.z * (1 - baseSmoothingFactor),
          };

          // Apply additional stabilization for problematic devices
          if (deviceType === 'pixel') {
            // Add slight momentum to smooth out jittery movements
            const momentum = 0.3;
            smoothedData.x = smoothedData.x * (1 - momentum) + prevDataRef.current.x * momentum;
            smoothedData.y = smoothedData.y * (1 - momentum) + prevDataRef.current.y * momentum;
          }

          // Apply sensitivity to *smoothed* data
          const sensitizedData = {
            x: smoothedData.x * BASE_SENSITIVITY * settings.sensitivity * HORIZONTAL_BOOST,
            y: smoothedData.y * BASE_SENSITIVITY * settings.sensitivity,
            z: smoothedData.z * BASE_SENSITIVITY * settings.sensitivity, // Sensitize Z?
          };

          prevDataRef.current = smoothedData; // Store smoothed data for next iteration
          setData(sensitizedData); // Update the hook's output state
        });
      } else {
         // If not available or disabled, just reset data but keep calibration
         // This ensures calibration persists when the game is paused
         setData({ x: 0, y: 0, z: 0 });
         // Don't reset calibration offset here
      }
    };

    checkAvailability();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, settings.sensitivity]);

  // Reset function now captures the calibration offset in the global variable
  const reset = useCallback(() => {
    // Make sure we have valid data before calibrating
    if (rawGyroDataRef.current.x !== 0 || rawGyroDataRef.current.y !== 0 || rawGyroDataRef.current.z !== 0) {
      // Apply device-specific calibration strategy
      if (deviceType === 'pixel') {
        // For problematic devices, use more aggressive averaging
        // Take multiple samples over a short period for more stable calibration
        const currentData = { ...rawGyroDataRef.current };

        // Schedule multiple samples
        setTimeout(() => {
          const sample1 = { ...rawGyroDataRef.current };
          globalCalibrationOffset = {
            x: (currentData.x + sample1.x) / 2,
            y: (currentData.y + sample1.y) / 2,
            z: (currentData.z + sample1.z) / 2
          };

          // Take another sample after a short delay
          setTimeout(() => {
            const sample2 = { ...rawGyroDataRef.current };
            globalCalibrationOffset = {
              x: (globalCalibrationOffset.x * 2 + sample2.x) / 3,
              y: (globalCalibrationOffset.y * 2 + sample2.y) / 3,
              z: (globalCalibrationOffset.z * 2 + sample2.z) / 3
            };
            console.log('Multi-sample calibration complete');
          }, 100);
        }, 100);

        // Use initial values for immediate response
        globalCalibrationOffset = { ...currentData };
      } else if (globalCalibrationOffset && Date.now() - calibrationTimestamp < 5000) {
        // If recalibrating within 5 seconds, blend with previous calibration
        globalCalibrationOffset = {
          x: globalCalibrationOffset.x * 0.3 + rawGyroDataRef.current.x * 0.7,
          y: globalCalibrationOffset.y * 0.3 + rawGyroDataRef.current.y * 0.7,
          z: globalCalibrationOffset.z * 0.3 + rawGyroDataRef.current.z * 0.7
        };
      } else {
        // Otherwise use the current values directly
        globalCalibrationOffset = { ...rawGyroDataRef.current };
      }

      lastRawData = { ...rawGyroDataRef.current }; // Also store as last raw data
      setData({ x: 0, y: 0, z: 0 }); // Reset processed data state immediately
      prevDataRef.current = { x: 0, y: 0, z: 0 }; // Reset smoothing history for immediate response
      isCalibrated = true; // Mark as calibrated globally
      calibrationTimestamp = Date.now(); // Update calibration timestamp
    }
  }, []); // No dependencies needed, relies on ref

  // Function to check if device has moved significantly since calibration
  const hasDeviceMovedSignificantly = useCallback(() => {
    if (!lastRawData || !globalCalibrationOffset) return false;

    // Use different thresholds for different devices
    const threshold = Platform.OS === 'android' ? 0.2 : 0.15;
    const dx = Math.abs(lastRawData.x - globalCalibrationOffset.x);
    const dy = Math.abs(lastRawData.y - globalCalibrationOffset.y);

    return dx > threshold || dy > threshold;
  }, []);

  // Return additional flags and functions to help components manage calibration
  return {
    data,
    available,
    reset,
    isCalibrated: isCalibrated,
    hasDeviceMovedSignificantly,
  };
};
