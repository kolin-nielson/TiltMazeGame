import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import { useAppSelector, RootState } from '@store';

const SMOOTHING_FACTOR = 0.75;
const BASE_SENSITIVITY = 1.6;
const HORIZONTAL_BOOST = 1.1;
const DEAD_ZONE = 0.05;
const RESPONSE_CURVE_POWER = 1.3;

const DEVICE_ADJUSTMENTS: Record<
  string,
  {
    updateInterval: number;
    xMultiplier: number;
    yMultiplier: number;
    deadZoneMultiplier: number;
    smoothingAdjustment: number;
    responseCurveAdjustment: number;
    sensitivityMultiplier: number;
  }
> = {
  default: {
    updateInterval: 16,
    xMultiplier: 1.0,
    yMultiplier: 1.0,
    deadZoneMultiplier: 1.0,
    smoothingAdjustment: 0.0,
    responseCurveAdjustment: 0.0,
    sensitivityMultiplier: 1.0,
  },
  android: {
    updateInterval: 24,
    xMultiplier: 1.15,
    yMultiplier: 1.05,
    deadZoneMultiplier: 1.2,
    smoothingAdjustment: 0.03,
    responseCurveAdjustment: 0.1,
    sensitivityMultiplier: 0.9,
  },
  pixel: {
    updateInterval: 32,
    xMultiplier: 1.3,
    yMultiplier: 1.2,
    deadZoneMultiplier: 1.5,
    smoothingAdjustment: 0.08,
    responseCurveAdjustment: 0.2,
    sensitivityMultiplier: 0.85,
  },
  ios: {
    updateInterval: 16,
    xMultiplier: 1.0,
    yMultiplier: 1.0,
    deadZoneMultiplier: 1.0,
    smoothingAdjustment: 0.0,
    responseCurveAdjustment: 0.0,
    sensitivityMultiplier: 1.0,
  },
};

interface GyroscopeData {
  x: number;
  y: number;
  z: number;
}

let globalCalibrationOffset: GyroscopeData | null = null;
let isCalibrated = false;
let lastRawData: GyroscopeData | null = null;
let deviceType: string = Platform.OS;
let deviceModel = '';

if (Platform.OS === 'android') {
  try {
    const { Brand } = Platform.constants || {};
    deviceModel = Brand || '';
    if (deviceModel.toLowerCase().includes('pixel')) {
      deviceType = 'pixel';
    }
  } catch (e) {
    deviceType = 'android';
  }
}
let calibrationTimestamp = 0;
let calibrationSamples: GyroscopeData[] = [];

export const useGyroscope = (enabled = true) => {
  const [data, setData] = useState<GyroscopeData>({ x: 0, y: 0, z: 0 });
  const [available, setAvailable] = useState<boolean>(false);
  const settings = useAppSelector((state: RootState) => state.settings);

  const rawGyroDataRef = useRef<GyroscopeData>({ x: 0, y: 0, z: 0 });
  const prevDataRef = useRef<GyroscopeData>({ x: 0, y: 0, z: 0 });
  const velocityRef = useRef<GyroscopeData>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const checkAvailability = async () => {
      const isGyroAvailable = await Gyroscope.isAvailableAsync();
      setAvailable(isGyroAvailable);

      if (isGyroAvailable && enabled) {
        const deviceSettings = DEVICE_ADJUSTMENTS[deviceType] || DEVICE_ADJUSTMENTS.default;
        Gyroscope.setUpdateInterval(deviceSettings.updateInterval);

        if (!prevDataRef.current) {
          prevDataRef.current = { x: 0, y: 0, z: 0 };
        }

        velocityRef.current = { x: 0, y: 0, z: 0 };

        subscription = Gyroscope.addListener(gyroData => {
          let adjustedData = { ...gyroData };

          const deviceSettings = DEVICE_ADJUSTMENTS[deviceType] || DEVICE_ADJUSTMENTS.default;

          if (Platform.OS === 'ios') {
            adjustedData = {
              x: gyroData.y * deviceSettings.xMultiplier,
              y: gyroData.x * deviceSettings.yMultiplier,
              z: gyroData.z,
            };
          } else {
            adjustedData = {
              x: gyroData.x * deviceSettings.xMultiplier,
              y: gyroData.y * deviceSettings.yMultiplier,
              z: gyroData.z,
            };
          }

          rawGyroDataRef.current = adjustedData;
          lastRawData = { ...adjustedData };

          const relativeData = { ...adjustedData };
          if (globalCalibrationOffset) {
            relativeData.x -= globalCalibrationOffset.x;
            relativeData.y -= globalCalibrationOffset.y;
            relativeData.z -= globalCalibrationOffset.z;
          }

          const deadZone = DEAD_ZONE * deviceSettings.deadZoneMultiplier;

          const applyDeadZone = (value: number, threshold: number) => {
            const absValue = Math.abs(value);
            if (absValue < threshold) {
              return 0;
            } else {
              const factor = Math.min(1, (absValue - threshold) / (threshold * 2.5));
              return value * factor;
            }
          };

          relativeData.x = applyDeadZone(relativeData.x, deadZone);
          relativeData.y = applyDeadZone(relativeData.y, deadZone);

          const responseCurve = RESPONSE_CURVE_POWER + deviceSettings.responseCurveAdjustment;

          const applyResponseCurve = (value: number) => {
            const sign = Math.sign(value);
            return sign * Math.pow(Math.abs(value), responseCurve);
          };

          relativeData.x = applyResponseCurve(relativeData.x);
          relativeData.y = applyResponseCurve(relativeData.y);

          const movementMagnitude = Math.sqrt(
            relativeData.x * relativeData.x + relativeData.y * relativeData.y
          );

          const baseSmoothingFactor = SMOOTHING_FACTOR + deviceSettings.smoothingAdjustment;

          // More adaptive smoothing - less smoothing for faster movements
          const adaptiveSmoothingFactor = Math.max(
            0.35,
            baseSmoothingFactor - movementMagnitude * 0.3
          );

          // Calculate velocity for momentum effect
          velocityRef.current = {
            x: relativeData.x - prevDataRef.current.x,
            y: relativeData.y - prevDataRef.current.y,
            z: relativeData.z - prevDataRef.current.z,
          };

          // Apply velocity damping
          const velocityDamping = 0.85;
          velocityRef.current.x *= velocityDamping;
          velocityRef.current.y *= velocityDamping;
          velocityRef.current.z *= velocityDamping;

          // Apply exponential moving average with adaptive factor
          const smoothedData = {
            x:
              prevDataRef.current.x * adaptiveSmoothingFactor +
              relativeData.x * (1 - adaptiveSmoothingFactor),
            y:
              prevDataRef.current.y * adaptiveSmoothingFactor +
              relativeData.y * (1 - adaptiveSmoothingFactor),
            z:
              prevDataRef.current.z * baseSmoothingFactor +
              relativeData.z * (1 - baseSmoothingFactor),
          };

          // Apply momentum for more natural feel
          const momentumFactor = deviceType === 'pixel' ? 0.25 : 0.15;
          smoothedData.x += velocityRef.current.x * momentumFactor;
          smoothedData.y += velocityRef.current.y * momentumFactor;

          // Apply device-specific sensitivity adjustment
          const adjustedSensitivity = settings.sensitivity * deviceSettings.sensitivityMultiplier;

          const sensitizedData = {
            x: smoothedData.x * BASE_SENSITIVITY * adjustedSensitivity * HORIZONTAL_BOOST,
            y: smoothedData.y * BASE_SENSITIVITY * adjustedSensitivity,
            z: smoothedData.z * BASE_SENSITIVITY * adjustedSensitivity,
          };

          prevDataRef.current = smoothedData;
          setData(sensitizedData);
        });
      } else {
        setData({ x: 0, y: 0, z: 0 });
        prevDataRef.current = { x: 0, y: 0, z: 0 };
        velocityRef.current = { x: 0, y: 0, z: 0 };
      }
    };

    checkAvailability();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, settings.sensitivity]);

  const reset = useCallback(() => {
    if (
      rawGyroDataRef.current.x !== 0 ||
      rawGyroDataRef.current.y !== 0 ||
      rawGyroDataRef.current.z !== 0
    ) {
      // Start collecting samples for better calibration
      calibrationSamples = [];

      // Take initial sample
      const initialSample = { ...rawGyroDataRef.current };
      calibrationSamples.push(initialSample);

      // Set initial calibration immediately for responsiveness
      globalCalibrationOffset = { ...initialSample };

      // Schedule additional samples for more accurate calibration
      const sampleInterval = deviceType === 'pixel' ? 80 : 50;
      const numSamples = deviceType === 'pixel' ? 5 : 3;

      const takeSample = (sampleIndex: number) => {
        if (sampleIndex >= numSamples) {
          // Calculate average from all samples
          const avgX =
            calibrationSamples.reduce((sum, sample) => sum + sample.x, 0) /
            calibrationSamples.length;
          const avgY =
            calibrationSamples.reduce((sum, sample) => sum + sample.y, 0) /
            calibrationSamples.length;
          const avgZ =
            calibrationSamples.reduce((sum, sample) => sum + sample.z, 0) /
            calibrationSamples.length;

          globalCalibrationOffset = { x: avgX, y: avgY, z: avgZ };
          return;
        }

        setTimeout(() => {
          calibrationSamples.push({ ...rawGyroDataRef.current });
          takeSample(sampleIndex + 1);
        }, sampleInterval);
      };

      // Start taking additional samples
      takeSample(1);

      // Reset all state
      lastRawData = { ...rawGyroDataRef.current };
      setData({ x: 0, y: 0, z: 0 });
      prevDataRef.current = { x: 0, y: 0, z: 0 };
      velocityRef.current = { x: 0, y: 0, z: 0 };
      isCalibrated = true;
      calibrationTimestamp = Date.now();
    }
  }, []);

  const hasDeviceMovedSignificantly = useCallback(() => {
    if (!lastRawData || !globalCalibrationOffset) return false;

    // Adaptive threshold based on device type
    const baseThreshold = Platform.OS === 'android' ? 0.18 : 0.12;
    const deviceSettings = DEVICE_ADJUSTMENTS[deviceType] || DEVICE_ADJUSTMENTS.default;
    const threshold = baseThreshold * deviceSettings.deadZoneMultiplier;

    const dx = Math.abs(lastRawData.x - globalCalibrationOffset.x);
    const dy = Math.abs(lastRawData.y - globalCalibrationOffset.y);

    // Weighted check - more sensitive to sustained movement
    const timeSinceCalibration = Date.now() - calibrationTimestamp;
    const timeWeight = Math.min(1, timeSinceCalibration / 10000); // Full weight after 10 seconds

    return (dx > threshold || dy > threshold) && timeWeight > 0.5;
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
