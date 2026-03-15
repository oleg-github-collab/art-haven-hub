import { noiseGLSL } from './noise';

export const gradientVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const gradientFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2  uMouse;
  uniform vec2  uResolution;

  varying vec2 vUv;

  ${noiseGLSL}

  void main() {
    // Aspect-corrected UV so noise isn't stretched
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 uvCorrected = vec2(uv.x * aspect, uv.y);

    // Scroll shifts noise domain vertically
    float scrollOffset = uScroll * 1.5;

    // Mouse subtly shifts noise domain
    vec2 mouseShift = uMouse * 0.08;

    // === Layer 1: Large-scale warped FBM — main organic blobs ===
    float n1 = warpedFbm(
      vec3(
        uvCorrected * 1.8 + vec2(mouseShift.x, scrollOffset + mouseShift.y),
        uTime * 0.06
      ),
      uTime * 0.04
    );

    // === Layer 2: Medium FBM — secondary detail ===
    float n2 = fbm(
      vec3(
        uvCorrected * 2.5 + vec2(3.7 + mouseShift.x * 0.5, 1.2 + scrollOffset * 0.6),
        uTime * 0.045
      ),
      0.5,
      2.0
    );

    // === Layer 3: Slow large-scale drift ===
    float n3 = snoise(
      vec3(
        uvCorrected * 0.8 + vec2(-1.3, scrollOffset * 0.3),
        uTime * 0.03
      )
    );

    // Combine layers
    float combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

    // Remap to 0..1 range (noise outputs roughly -1..1)
    combined = combined * 0.5 + 0.5;

    // Add subtle radial vignette bias — keeps edges lighter/cream
    float radial = length(uv - 0.5) * 1.2;
    combined = combined * (1.0 - radial * 0.3);

    // === 4-stop warm gradient ===
    vec3 cream     = vec3(0.961, 0.941, 0.922); // #F5F0EB
    vec3 peach     = vec3(0.941, 0.835, 0.737); // #F0D5BC
    vec3 softOrange = vec3(0.910, 0.659, 0.486); // #E8A87C
    vec3 warmRose  = vec3(0.831, 0.533, 0.420); // #D4886B

    vec3 color;
    if (combined < 0.33) {
      color = mix(cream, peach, smoothstep(0.0, 0.33, combined));
    } else if (combined < 0.66) {
      color = mix(peach, softOrange, smoothstep(0.33, 0.66, combined));
    } else {
      color = mix(softOrange, warmRose, smoothstep(0.66, 1.0, combined));
    }

    // Scroll-based subtle warmth boost
    float warmth = uScroll * 0.06;
    color = mix(color, softOrange, warmth);

    gl_FragColor = vec4(color, 1.0);
  }
`;
