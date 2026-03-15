import { useRef, useEffect, useCallback } from 'react';

export function useMousePosition() {
  const mouse = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  const update = (delta: number) => {
    const lerpFactor = 1 - Math.pow(0.05, delta);
    mouse.current.x += (target.current.x - mouse.current.x) * lerpFactor;
    mouse.current.y += (target.current.y - mouse.current.y) * lerpFactor;
  };

  return { mouse, update };
}
