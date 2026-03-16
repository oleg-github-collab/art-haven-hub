import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gradientVertexShader, gradientFragmentShader } from './shaders/gradient.frag';

interface GradientMeshProps {
  scrollProgress: React.MutableRefObject<number>;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  mouseUpdate: (delta: number) => void;
}

export function GradientMesh({ scrollProgress, mouse, mouseUpdate }: GradientMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const uniforms = useMemo(() => ({
    uTime:       { value: 0 },
    uScroll:     { value: 0 },
    uMouse:      { value: new THREE.Vector2(0, 0) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
  }), []);

  useFrame((state, delta) => {
    mouseUpdate(delta);

    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uScroll.value = scrollProgress.current;
    uniforms.uMouse.value.set(mouse.current.x, mouse.current.y);
    uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={gradientVertexShader}
        fragmentShader={gradientFragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
