import { useState, useEffect, useCallback, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useAppSelector, RootState } from '@store';
import { Platform } from 'react-native';
export interface GyroscopeData {
  x: number;
  y: number;
}
const UPDATE_INTERVAL = 16; 
const SMOOTHING_FACTOR = 0.2; 
const DEAD_ZONE = 0.04; 
const CALIBRATION_SAMPLES = 5; 
const CALIBRATION_INTERVAL = 20; 
export const useGyroscope = (enabled = true) => {
  const [data, setData] = useState<GyroscopeData>({ x: 0, y: 0 });
  const [offset, setOffset] = useState<GyroscopeData>({ x: 0, y: 0 });
  const [available, setAvailable] = useState<boolean>(false);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const rawXRef = useRef(0);
  const rawYRef = useRef(0);
  const smoothedXRef = useRef(0);
  const smoothedYRef = useRef(0);
  const calibrationSamplesRef = useRef<GyroscopeData[]>([]);
  const calibrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settings = useAppSelector((state: RootState) => state.settings);
  const sensitivity = settings.sensitivity ?? 1;
  const applyDeadZone = (value: number): number => {
    return Math.abs(value) < DEAD_ZONE ? 0 : value;
  };
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
        rawXRef.current = x;
        rawYRef.current = y;
        const calibratedX = x - offset.x;
        const calibratedY = y - offset.y;
        let deadZoneX = applyDeadZone(calibratedX);
        let deadZoneY = applyDeadZone(calibratedY);
        let sensitiveX = deadZoneX * sensitivity;
        let sensitiveY = -deadZoneY * sensitivity; 
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
          finalX = -finalX;
          finalY = -finalY;
        }
        setData({ x: finalX, y: finalY });
      });
    };
    subscribe();
    return () => subscription?.remove();
  }, [enabled, offset, sensitivity]); 
  useEffect(() => {
    return () => {
      if (calibrationTimeoutRef.current) {
        clearTimeout(calibrationTimeoutRef.current);
      }
    };
  }, []);
  const reset = useCallback(() => {
    if (calibrationTimeoutRef.current) {
      clearTimeout(calibrationTimeoutRef.current);
    }
    setIsCalibrating(true);
    setIsCalibrated(false);
    calibrationSamplesRef.current = [];
    const initialRawX = rawXRef.current;
    const initialRawY = rawYRef.current;
    setOffset({
      x: initialRawX,
      y: initialRawY,
    });
    smoothedXRef.current = 0;
    smoothedYRef.current = 0;
    setData({ x: 0, y: 0 });
    const collectSamples = () => {
      calibrationSamplesRef.current.push({
        x: rawXRef.current,
        y: rawYRef.current
      });
      if (calibrationSamplesRef.current.length >= CALIBRATION_SAMPLES) {
        const avgX = calibrationSamplesRef.current.reduce((sum, sample) => sum + sample.x, 0) / CALIBRATION_SAMPLES;
        const avgY = calibrationSamplesRef.current.reduce((sum, sample) => sum + sample.y, 0) / CALIBRATION_SAMPLES;
        setOffset({
          x: avgX,
          y: avgY
        });
        smoothedXRef.current = 0;
        smoothedYRef.current = 0;
        setData({ x: 0, y: 0 });
        setIsCalibrating(false);
        setIsCalibrated(true);
      } else {
        calibrationTimeoutRef.current = setTimeout(collectSamples, CALIBRATION_INTERVAL);
      }
    };
    collectSamples();
  }, []); 
  useEffect(() => {
    if (available && !isCalibrated) { 
      reset();
    }
  }, [available, isCalibrated, reset]);
  const hasDeviceMovedSignificantly = useCallback(() => {
    const deltaX = rawXRef.current - offset.x;
    const deltaY = rawYRef.current - offset.y;
    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    return magnitude > 0.5; 
  }, [offset.x, offset.y]); 
  const forceCalibration = useCallback((delayMs = 100) => {
    if (calibrationTimeoutRef.current) {
      clearTimeout(calibrationTimeoutRef.current);
    }
    setIsCalibrating(true);
    setIsCalibrated(false);
    smoothedXRef.current = 0;
    smoothedYRef.current = 0;
    setData({ x: 0, y: 0 });
    calibrationTimeoutRef.current = setTimeout(() => {
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
