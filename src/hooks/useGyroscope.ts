import { useState, useEffect } from 'react';
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

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const checkAvailability = async () => {
      const isGyroAvailable = await Gyroscope.isAvailableAsync();
      setAvailable(isGyroAvailable);

      if (isGyroAvailable && enabled) {
        Gyroscope.setUpdateInterval(60);

        let prevData = { x: 0, y: 0, z: 0 };

        subscription = Gyroscope.addListener(gyroData => {
          let adjustedData = { ...gyroData };

          if (Platform.OS === 'ios') {
            adjustedData = {
              x: gyroData.y,
              y: gyroData.x,
              z: gyroData.z,
            };
          }

          const deadZone = 0.02;
          if (Math.abs(adjustedData.x) < deadZone) adjustedData.x = 0;
          if (Math.abs(adjustedData.y) < deadZone) adjustedData.y = 0;

          const applyResponseCurve = (value: number) => {
            const sign = Math.sign(value);
            return sign * Math.pow(Math.abs(value), 1.5);
          };
          
          adjustedData.x = applyResponseCurve(adjustedData.x);
          adjustedData.y = applyResponseCurve(adjustedData.y);

          const smoothedData = {
            x: prevData.x * SMOOTHING_FACTOR + adjustedData.x * (1 - SMOOTHING_FACTOR),
            y: prevData.y * SMOOTHING_FACTOR + adjustedData.y * (1 - SMOOTHING_FACTOR),
            z: prevData.z * SMOOTHING_FACTOR + adjustedData.z * (1 - SMOOTHING_FACTOR),
          };

          const sensitizedData = {
            x: smoothedData.x * BASE_SENSITIVITY * settings.sensitivity * HORIZONTAL_BOOST,
            y: smoothedData.y * BASE_SENSITIVITY * settings.sensitivity,
            z: smoothedData.z * BASE_SENSITIVITY * settings.sensitivity,
          };

          prevData = smoothedData;
          setData(sensitizedData);
        });
      }
    };

    checkAvailability();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enabled, settings.sensitivity]);

  const reset = () => {
    setData({ x: 0, y: 0, z: 0 });
  };

  return {
    data,
    available,
    reset,
  };
};
