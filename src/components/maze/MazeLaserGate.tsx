import React, { useEffect, useState } from 'react';
import { Rect, Circle } from 'react-native-svg';
import { LaserGate } from '@types';

interface MazeLaserGateProps {
  laserGate: LaserGate;
  color: string;
  isActive: boolean;
}

export const MazeLaserGate: React.FC<MazeLaserGateProps> = ({ laserGate, color, isActive }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setVisible(false);
      return () => {};
    }

    const now = Date.now();
    const cyclePosition = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
    const initialVisibility = cyclePosition < laserGate.onDuration;
    setVisible(initialVisibility);

    const intervalId = setInterval(() => {
      const now = Date.now();
      const cyclePosition = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
      setVisible(cyclePosition < laserGate.onDuration);
    }, 100);

    return () => {
      clearInterval(intervalId);
    };
  }, [isActive, laserGate.interval, laserGate.phase, laserGate.onDuration]);

  const emitterSize = 6;
  let emitter1X, emitter1Y, emitter2X, emitter2Y;

  if (laserGate.direction === 'horizontal') {
    emitter1X = laserGate.x;
    emitter1Y = laserGate.y + laserGate.height / 2;
    emitter2X = laserGate.x + laserGate.width;
    emitter2Y = laserGate.y + laserGate.height / 2;
  } else {
    emitter1X = laserGate.x + laserGate.width / 2;
    emitter1Y = laserGate.y;
    emitter2X = laserGate.x + laserGate.width / 2;
    emitter2Y = laserGate.y + laserGate.height;
  }

  if (!isActive) return null;

  return (
    <>
      <Circle
        cx={emitter1X}
        cy={emitter1Y}
        r={emitterSize}
        fill="#FFFFFF"
        stroke={color}
        strokeWidth={2}
        opacity={visible ? 1 : 0.5}
      />

      {}
      {laserGate.direction === 'horizontal' ? (
        <Rect
          x={emitter1X}
          y={emitter1Y - 1}
          width={laserGate.width}
          height={2}
          fill={color}
          opacity={visible ? 1 : 0.3}
        />
      ) : (
        <Rect
          x={emitter1X - 1}
          y={emitter1Y}
          width={2}
          height={laserGate.height}
          fill={color}
          opacity={visible ? 1 : 0.3}
        />
      )}

      {}
      <Circle
        cx={emitter2X}
        cy={emitter2Y}
        r={emitterSize}
        fill="#FFFFFF"
        stroke={color}
        strokeWidth={2}
        opacity={visible ? 1 : 0.5}
      />
    </>
  );
};
