import { useRef } from 'react';
import { useScroll, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion';

interface HeroScrollValues {
  scrollProgress: React.MutableRefObject<number>;
  textOpacity: MotionValue<number>;
  textY: MotionValue<number>;
}

export function useHeroScroll(containerRef: React.RefObject<HTMLElement>): HeroScrollValues {
  const scrollProgress = useRef(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Text parallax
  const textOpacity = useTransform(scrollYProgress, [0, 0.4, 0.7], [1, 1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.7], [0, -80]);

  // Sync motion value to mutable ref (read in R3F useFrame without re-renders)
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    scrollProgress.current = v;
  });

  return { scrollProgress, textOpacity, textY };
}
