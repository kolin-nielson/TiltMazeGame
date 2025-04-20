import React, { useEffect, useState } from 'react';
import { Rect, Circle } from 'react-native-svg';
import { LaserGate } from '@types';

interface MazeLaserGateProps {
  laserGate: LaserGate;
  color: string;
  isActive: boolean;
}

export const MazeLaserGate: React.FC<MazeLaserGateProps> = ({ laserGate, color, isActive }) => {
  // Use simple state for visibility instead of Reanimated
  const [visible, setVisible] = useState(false);

  // Set up the pulsing effect with a simple interval
  useEffect(() => {
    if (!isActive) {
      setVisible(false);
      return () => {}; // No cleanup needed
    }

    // Calculate when the laser should be visible based on the phase
    const now = Date.now();
    const cyclePosition = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
    const initialVisibility = cyclePosition < laserGate.onDuration;
    setVisible(initialVisibility);

    // Set up the interval to toggle visibility
    const intervalId = setInterval(() => {
      const now = Date.now();
      const cyclePosition = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
      setVisible(cyclePosition < laserGate.onDuration);
    }, 100); // Check every 100ms for smoother transitions

    return () => {
      clearInterval(intervalId);
    };
  }, [isActive, laserGate.interval, laserGate.phase, laserGate.onDuration]);

  // Calculate emitter positions based on direction
  const emitterSize = 6;
  let emitter1X, emitter1Y, emitter2X, emitter2Y;

  if (laserGate.direction === 'horizontal') {
    emitter1X = laserGate.x;
    emitter1Y = laserGate.y + laserGate.height / 2;
    emitter2X = laserGate.x + laserGate.width;
    emitter2Y = laserGate.y + laserGate.height / 2;
  } else {
    // vertical
    emitter1X = laserGate.x + laserGate.width / 2;
    emitter1Y = laserGate.y;
    emitter2X = laserGate.x + laserGate.width / 2;
    emitter2Y = laserGate.y + laserGate.height;
  }

  // Only render if active (for performance)
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

      {/* beam */}
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

      {/* second emitter */}
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

