import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GradientMesh } from './GradientMesh';

interface HeroSceneProps {
  scrollProgress: React.MutableRefObject<number>;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  mouseUpdate: (delta: number) => void;
}

export default function HeroScene({ scrollProgress, mouse, mouseUpdate }: HeroSceneProps) {
  return (
    <div className="w-full h-full" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ zoom: 1, position: [0, 0, 1] }}
        dpr={[1, 2]}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: false,
        }}
      >
        <Suspense fallback={null}>
          <GradientMesh
            scrollProgress={scrollProgress}
            mouse={mouse}
            mouseUpdate={mouseUpdate}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
