
import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  start?: number;
  delay?: number;
}

export const useCountUp = ({ end, duration = 600, start = 0, delay = 0 }: UseCountUpOptions) => {
  const [count, setCount] = useState(start);
  const countRef = useRef(start);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = start + (end - start) * easeOutQuart;

      countRef.current = current;
      setCount(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    const timeoutId = setTimeout(() => {
      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, start, delay]);

  return Math.floor(count);
};
