import { useState, useRef, useCallback, useEffect } from 'react';

interface UseGameTimerReturn {
  elapsed: number;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  formatTime: (time: number) => string;
}

export const useGameTimer = (): UseGameTimerReturn => {
  const [elapsed, setElapsed] = useState(0);
  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);

  const tick = useCallback(() => {
    if (!isRunningRef.current || !startTimeRef.current) {
      return;
    }
    setElapsed(performance.now() - startTimeRef.current);
    requestRef.current = requestAnimationFrame(tick);
  }, []);

  const startTimer = useCallback(() => {
    if (isRunningRef.current) {
      return;
    }

    startTimeRef.current = performance.now() - elapsed;
    isRunningRef.current = true;
    requestRef.current = requestAnimationFrame(tick);
  }, [elapsed, tick]);

  const stopTimer = useCallback(() => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    isRunningRef.current = false;
    if (startTimeRef.current) {
      setElapsed(performance.now() - startTimeRef.current);
    }
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setElapsed(0);
    startTimeRef.current = null;
  }, [stopTimer]);

  const formatTime = useCallback((timeMs: number) => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((timeMs % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    elapsed,
    startTimer,
    stopTimer,
    resetTimer,
    formatTime,
  };
};
