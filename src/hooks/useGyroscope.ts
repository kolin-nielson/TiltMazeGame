import { useState, useEffect, useCallback } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useAppSelector, RootState } from '@store';
import { Platform } from 'react-native';

export interface GyroscopeData {
  x: number;
  y: number;
}

export const useGyroscope = (enabled = true) => {
  const [data, setData] = useState<GyroscopeData>({ x: 0, y: 0 });
  const [offset, setOffset] = useState<GyroscopeData>({ x: 0, y: 0 });
  const [available, setAvailable] = useState<boolean>(false);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  const settings = useAppSelector((state: RootState) => state.settings);
  const sensitivity = settings.sensitivity ?? 1;

  // Increase sample rate for more immediate updates
  const UPDATE_INTERVAL = 10; // ms
  // Smoothing and dead zone to filter out sensor noise
  const SMOOTHING = 0; // no default smoothing, can increase if needed
  const DEAD_ZONE = 0.02; // ignore movements smaller than this to prevent jitter
  // Extra tilt amplification
  const AMPLIFICATION = 1.5;

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    const subscribe = async () => {
      const isAvailable = await Accelerometer.isAvailableAsync();
      setAvailable(isAvailable);
      if (!isAvailable || !enabled) return;
      Accelerometer.setUpdateInterval(UPDATE_INTERVAL);
      subscription = Accelerometer.addListener(({ x, y }) => {
        // subtract the calibration offset
        const rawX = x - offset.x;
        const rawY = y - offset.y;
        // apply dead zone
        const dz = DEAD_ZONE;
        const clamp = (v: number) => (Math.abs(v) < dz ? 0 : v);
        // instant mapping with amplification
        let mappedX = clamp(rawX) * sensitivity * AMPLIFICATION;
        let mappedY = -clamp(rawY) * sensitivity * AMPLIFICATION;
        if (Platform.OS === 'android') {
          // invert axes on Android to match iOS tilt orientation
          mappedX = -mappedX;
          mappedY = -mappedY;
        }
        setData({ x: mappedX, y: mappedY });
      });
    };
    subscribe();
    return () => subscription?.remove();
  }, [enabled, offset, sensitivity]);

  const reset = useCallback(async () => {
    if (!available) return;
    // take one sample to zero out current tilt
    return new Promise<void>(res => {
      const sub = Accelerometer.addListener(({ x, y }) => {
        setOffset({ x, y });
        setData({ x: 0, y: 0 });
        setIsCalibrated(true);
        sub.remove();
        res();
      });
      // fallback if no event arrives
      setTimeout(() => {
        sub.remove();
        setIsCalibrated(true);
        res();
      }, 500);
    });
  }, [available]);

  // auto-calibrate once sensor becomes available
  useEffect(() => {
    if (available) {
      reset();
    }
  }, [available, reset]);

  const hasDeviceMovedSignificantly = useCallback(() => false, []);

  return {
    data,
    available,
    reset,
    isCalibrated,
    hasDeviceMovedSignificantly,
  };
};
