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
  const [laserPattern, setLaserPattern] = useState<'burst' | 'steady' | 'pulse' | 'rapid'>('burst');

  useEffect(() => {
    let frameId: number;
    const updateVisibility = () => {
      const now = Date.now();
      const cyclePos = ((now % laserGate.interval) / laserGate.interval + laserGate.phase) % 1;
      const newVisible = cyclePos < laserGate.onDuration;
      setVisible(newVisible);
      
      // Determine laser pattern based on timing characteristics
      if (laserGate.onDuration <= 0.3 && laserGate.interval <= 1500) {
        setLaserPattern('rapid');
      } else if (laserGate.onDuration <= 0.4 && laserGate.interval <= 2500) {
        setLaserPattern('burst');
      } else if (laserGate.onDuration >= 0.6) {
        setLaserPattern('steady');
      } else {
        setLaserPattern('pulse');
      }
      
      frameId = requestAnimationFrame(updateVisibility);
    };
    
    if (isActive) {
      updateVisibility();
    } else {
      setVisible(false);
    }
    
    return () => cancelAnimationFrame(frameId);
  }, [isActive, laserGate.interval, laserGate.phase, laserGate.onDuration]);

  // Calculate emitter positions
  const BEAM_THICKNESS = 6;
  const emitterSize = 5; // Reduced from 8 to 5 for a more refined look
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

  // Pattern-specific visual properties
  const getPatternColor = () => {
    switch (laserPattern) {
      case 'rapid': return '#FF4757'; // Bright red for dangerous rapid fire
      case 'burst': return '#00D4FF'; // Electric blue for quick bursts
      case 'steady': return '#FFD700'; // Gold for steady beams
      case 'pulse': return '#FF6B9D'; // Hot pink for rhythmic pulses
      default: return color;
    }
  };

  const patternColor = getPatternColor();

  if (!isActive) return null;

  return (
    <>
      {/* Laser Beam - Multi-layered for depth and glow effect */}
      {/* Outer glow beam (widest) */}
      <Line
        x1={emitter1X}
        y1={emitter1Y}
        x2={emitter2X}
        y2={emitter2Y}
        stroke={patternColor}
        strokeWidth={BEAM_THICKNESS * 2.5}
        strokeLinecap="round"
        opacity={visible ? 0.15 : 0.03}
      />
      
      {/* Middle glow beam */}
      <Line
        x1={emitter1X}
        y1={emitter1Y}
        x2={emitter2X}
        y2={emitter2Y}
        stroke={patternColor}
        strokeWidth={BEAM_THICKNESS * 1.5}
        strokeLinecap="round"
        opacity={visible ? 0.4 : 0.08}
      />
      
      {/* Main beam */}
      <Line
        x1={emitter1X}
        y1={emitter1Y}
        x2={emitter2X}
        y2={emitter2Y}
        stroke={patternColor}
        strokeWidth={BEAM_THICKNESS}
        strokeLinecap="round"
        opacity={visible ? 0.9 : 0.2}
      />
      
      {/* Core beam for intensity */}
      <Line
        x1={emitter1X}
        y1={emitter1Y}
        x2={emitter2X}
        y2={emitter2Y}
        stroke="#FFFFFF"
        strokeWidth={BEAM_THICKNESS * 0.3}
        strokeLinecap="round"
        opacity={visible ? 0.8 : 0.15}
      />

      {/* Emitter 1 - Refined design */}
      {/* Outer glow ring */}
      <Circle
        cx={emitter1X}
        cy={emitter1Y}
        r={emitterSize * 1.4}
        fill={patternColor}
        opacity={visible ? 0.15 : 0.03}
      />
      
      {/* Middle ring */}
      <Circle
        cx={emitter1X}
        cy={emitter1Y}
        r={emitterSize * 1.1}
        fill={patternColor}
        opacity={visible ? 0.4 : 0.1}
      />
      
      {/* Main emitter body */}
      <Circle
        cx={emitter1X}
        cy={emitter1Y}
        r={emitterSize}
        fill="#E0E0E0"
        stroke={patternColor}
        strokeWidth={2}
        opacity={visible ? 1 : 0.5}
      />
      
      {/* Inner core */}
      <Circle
        cx={emitter1X}
        cy={emitter1Y}
        r={emitterSize * 0.4}
        fill="#FFFFFF"
        opacity={visible ? 0.9 : 0.4}
      />
      
      {/* Central energy point */}
      <Circle
        cx={emitter1X}
        cy={emitter1Y}
        r={emitterSize * 0.15}
        fill={patternColor}
        opacity={visible ? 1 : 0.6}
      />

      {/* Emitter 2 - Refined design */}
      {/* Outer glow ring */}
      <Circle
        cx={emitter2X}
        cy={emitter2Y}
        r={emitterSize * 1.4}
        fill={patternColor}
        opacity={visible ? 0.15 : 0.03}
      />
      
      {/* Middle ring */}
      <Circle
        cx={emitter2X}
        cy={emitter2Y}
        r={emitterSize * 1.1}
        fill={patternColor}
        opacity={visible ? 0.4 : 0.1}
      />
      
      {/* Main emitter body */}
      <Circle
        cx={emitter2X}
        cy={emitter2Y}
        r={emitterSize}
        fill="#E0E0E0"
        stroke={patternColor}
        strokeWidth={2}
        opacity={visible ? 1 : 0.5}
      />
      
      {/* Inner core */}
      <Circle
        cx={emitter2X}
        cy={emitter2Y}
        r={emitterSize * 0.4}
        fill="#FFFFFF"
        opacity={visible ? 0.9 : 0.4}
      />
      
      {/* Central energy point */}
      <Circle
        cx={emitter2X}
        cy={emitter2Y}
        r={emitterSize * 0.15}
        fill={patternColor}
        opacity={visible ? 1 : 0.6}
      />
    </>
  );
};
