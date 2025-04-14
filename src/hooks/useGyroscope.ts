import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import { useSettings } from '../contexts/SettingsContext';

const SMOOTHING_FACTOR = 0.9;
const BASE_SENSITIVITY = 2.5;
const HORIZONTAL_BOOST = 1.0;

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

export const useGyroscope = (enabled = true) => {
  const [data, setData] = useState<GyroscopeData>({ x: 0, y: 0, z: 0 });
  const [available, setAvailable] = useState<boolean>(false);
  const { settings } = useSettings();

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
        // Try a faster update interval (target ~60fps)
        Gyroscope.setUpdateInterval(16);

        // Only reset smoothing history, NOT calibration offset
        // This ensures calibration persists between levels
        if (!prevDataRef.current) {
          prevDataRef.current = { x: 0, y: 0, z: 0 };
        }

        // Log calibration status for debugging
        console.log('Gyroscope calibration status:', isCalibrated ? 'CALIBRATED' : 'NOT CALIBRATED');

        subscription = Gyroscope.addListener(gyroData => {
          let adjustedData = { ...gyroData };

          if (Platform.OS === 'ios') {
            adjustedData = { x: gyroData.y, y: gyroData.x, z: gyroData.z };
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

          // Apply dead zone to *relative* data
          const deadZone = 0.02;
          if (Math.abs(relativeData.x) < deadZone) relativeData.x = 0;
          if (Math.abs(relativeData.y) < deadZone) relativeData.y = 0;

          // Apply response curve to *relative* data
          const applyResponseCurve = (value: number) => {
            const sign = Math.sign(value);
            return sign * Math.pow(Math.abs(value), 1.5);
          };
          relativeData.x = applyResponseCurve(relativeData.x);
          relativeData.y = applyResponseCurve(relativeData.y);

          // Apply smoothing using prevDataRef and *relative* data
          const smoothedData = {
            x: prevDataRef.current.x * SMOOTHING_FACTOR + relativeData.x * (1 - SMOOTHING_FACTOR),
            y: prevDataRef.current.y * SMOOTHING_FACTOR + relativeData.y * (1 - SMOOTHING_FACTOR),
            z: prevDataRef.current.z * SMOOTHING_FACTOR + relativeData.z * (1 - SMOOTHING_FACTOR), // Smooth Z too? Or just pass relativeData.z?
          };

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
      globalCalibrationOffset = { ...rawGyroDataRef.current }; // Store current raw orientation in global variable
      lastRawData = { ...rawGyroDataRef.current }; // Also store as last raw data
      setData({ x: 0, y: 0, z: 0 }); // Reset processed data state immediately
      // prevDataRef.current = { x: 0, y: 0, z: 0 }; // DO NOT reset smoothing history
      isCalibrated = true; // Mark as calibrated globally
      console.log('Gyroscope calibrated offset:', globalCalibrationOffset); // Optional: for debugging
    } else {
      console.log('Skipping calibration - no valid gyroscope data yet');
    }
  }, []); // No dependencies needed, relies on ref

  // Function to check if device has moved significantly since calibration
  const hasDeviceMovedSignificantly = useCallback(() => {
    if (!lastRawData || !globalCalibrationOffset) return false;

    const threshold = 0.15; // Increase threshold slightly
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
