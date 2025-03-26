import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import { useSettings } from '../contexts/SettingsContext';

const SMOOTHING_FACTOR = 0.8;
const BASE_SENSITIVITY = 4.0;
const HORIZONTAL_BOOST = 1.2;

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
        Gyroscope.setUpdateInterval(16);

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
