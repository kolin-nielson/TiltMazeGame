import React, { useEffect, useState } from 'react';
import { Circle, Line } from 'react-native-svg';
import { LaserGate } from '@types';

interface MazeLaserGateProps {
  laserGate: LaserGate;
  color: string;
  isActive: boolean;
}

export const MazeLaserGate: React.FC<MazeLaserGateProps> = ({ laserGate, color, isActive }) => {
  const [visible, setVisible] = useState(false);
  const MAZE_SIZE = 300;
  const BEAM_THICKNESS = 4;

  useEffect(() => {
    let frameId: number;
    const updateVisibility = () => {
      const now = Date.now();
      const cyclePos = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
      setVisible(cyclePos < laserGate.onDuration);
      frameId = requestAnimationFrame(updateVisibility);
    };
    if (isActive) {
      updateVisibility();
    } else {
      setVisible(false);
    }
    return () => cancelAnimationFrame(frameId);
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
        r={emitterSize * 2}
        fill={color}
        opacity={visible ? 0.15 : 0.05}
      />
      <Circle
        cx={emitter1X}
        cy={emitter1Y}
        r={emitterSize}
        fill="#FFFFFF"
        stroke={color}
        strokeWidth={2}
        opacity={visible ? 1 : 0.5}
      />

      <Line
        x1={emitter1X}
        y1={emitter1Y}
        x2={emitter2X}
        y2={emitter2Y}
        stroke={color}
        strokeWidth={BEAM_THICKNESS}
        strokeLinecap="round"
        opacity={visible ? 1 : 0.3}
      />

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
