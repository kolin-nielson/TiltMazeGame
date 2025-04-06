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

export const useGyroscope = (enabled = true) => {
  const [data, setData] = useState<GyroscopeData>({ x: 0, y: 0, z: 0 });
  const [available, setAvailable] = useState<boolean>(false);
  const { settings } = useSettings();

  // State to hold the calibration offset
  const [calibrationOffset, setCalibrationOffset] = useState<GyroscopeData | null>(null);
  // Refs to store the latest raw data and smoothing history
  const rawGyroDataRef = useRef<GyroscopeData>({ x: 0, y: 0, z: 0 });
  const prevDataRef = useRef<GyroscopeData>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const checkAvailability = async () => {
      const isGyroAvailable = await Gyroscope.isAvailableAsync();
      setAvailable(isGyroAvailable);

      if (isGyroAvailable && enabled) {
        Gyroscope.setUpdateInterval(60);

        // Reset smoothing history when listener starts/restarts
        prevDataRef.current = { x: 0, y: 0, z: 0 };

        subscription = Gyroscope.addListener(gyroData => {
          let adjustedData = { ...gyroData };

          if (Platform.OS === 'ios') {
            adjustedData = { x: gyroData.y, y: gyroData.x, z: gyroData.z };
          }

          // Store the latest raw (platform-adjusted) data
          rawGyroDataRef.current = adjustedData;

          // --- Apply Calibration Offset --- 
          let relativeData = { ...adjustedData }; 
          if (calibrationOffset) {
            relativeData.x -= calibrationOffset.x;
            relativeData.y -= calibrationOffset.y;
            // Assuming Z is not used for tilt calibration, but adjust if needed
            // relativeData.z -= calibrationOffset.z; 
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
         // If not available or disabled, clear offset and reset data
         setCalibrationOffset(null);
         setData({ x: 0, y: 0, z: 0 });
         prevDataRef.current = { x: 0, y: 0, z: 0 };
      }
    };

    checkAvailability();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, settings.sensitivity]);

  // Reset function now captures the calibration offset
  const reset = useCallback(() => {
    setCalibrationOffset(rawGyroDataRef.current); // Store current raw orientation
    setData({ x: 0, y: 0, z: 0 }); // Reset processed data state immediately
    prevDataRef.current = { x: 0, y: 0, z: 0 }; // Reset smoothing history
    console.log('Gyroscope calibrated offset:', rawGyroDataRef.current); // Optional: for debugging
  }, []); // No dependencies needed, relies on ref

  return {
    data,
    available,
    reset,
  };
};
