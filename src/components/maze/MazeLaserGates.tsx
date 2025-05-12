import React, { memo } from 'react';
import { LaserGate } from '../../types';
import { MazeLaserGate } from './MazeLaserGate';
export const MemoizedLaserGates = memo(({ laserGates, color, isActive }: {
  laserGates: LaserGate[],
  color: string,
  isActive: boolean
}) => {
  return (
    <>
      {laserGates.map((laserGate) => (
        <MazeLaserGate
          key={`laser-${laserGate.id}`}
          laserGate={laserGate}
          color={color}
          isActive={isActive}
        />
      ))}
    </>
  );
});