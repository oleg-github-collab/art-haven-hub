import { noiseGLSL } from './noise';

export const gradientVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // Render directly to clip space — fills entire viewport
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const gradientFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uScroll;
  uniform vec2  uMouse;
  uniform vec2  uResolution;

  varying vec2 vUv;

  ${noiseGLSL}

  // Smooth HSL to RGB
  vec3 hsl2rgb(float h, float s, float l) {
    vec3 rgb = clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return l + s * (rgb - 0.5) * (1.0 - abs(2.0 * l - 1.0));
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 uvC = vec2(uv.x * aspect, uv.y);

    float time = uTime * 0.04;
    float scrollOffset = uScroll * 2.0;
    vec2 mouseShift = uMouse * 0.12;

    // === Layer 1: Deep double-warped FBM — organic flowing aurora ===
    float n1 = warpedFbm(
      vec3(
        uvC * 1.6 + vec2(mouseShift.x, scrollOffset + mouseShift.y),
        time
      ),
      time * 1.2
    );

    // === Layer 2: Ridge noise — creates luminous caustic veins ===
    float ridge = ridgeNoise(
      vec3(
        uvC * 2.2 + vec2(3.7 + mouseShift.x * 0.6, 1.2 + scrollOffset * 0.5),
        time * 0.8
      ),
      2.5
    );

    // === Layer 3: Slow large-scale drift with voronoi texture ===
    float n3 = snoise(
      vec3(
        uvC * 0.7 + vec2(-1.3, scrollOffset * 0.3),
        time * 0.6
      )
    );

    // === Layer 4: Fine grain detail ===
    float fine = fbm(
      vec3(uvC * 4.0 + vec2(scrollOffset * 0.2, mouseShift.y), time * 1.5),
      0.45,
      2.2
    );

    // === Layer 5: Voronoi cellular overlay — subtle organic cells ===
    float vor = voronoi(uvC * 3.0 + vec2(time * 0.3, scrollOffset * 0.4));
    vor = smoothstep(0.0, 0.6, vor);

    // Combine all layers
    float combined = n1 * 0.35 + ridge * 0.2 + n3 * 0.15 + fine * 0.15 + vor * 0.15;
    combined = combined * 0.5 + 0.5;

    // Radial vignette — keeps edges softer
    float radial = length(uv - 0.5) * 1.4;
    combined = combined * (1.0 - radial * 0.25);

    // Scroll-reactive hue shift: warm → cool aurora as user scrolls
    float hueBase = 24.0; // warm orange
    float hueShift = uScroll * 60.0; // shifts toward blue-teal on scroll
    float hue = mod(hueBase + hueShift + combined * 30.0, 360.0) / 360.0;

    // === Rich 6-stop gradient with dynamic hue ===
    vec3 cream      = vec3(0.961, 0.941, 0.922);
    vec3 peach      = vec3(0.941, 0.835, 0.737);
    vec3 softOrange = vec3(0.910, 0.659, 0.486);
    vec3 warmRose   = vec3(0.831, 0.533, 0.420);
    vec3 deepCoral  = vec3(0.722, 0.380, 0.340);
    vec3 tealGlow   = vec3(0.380, 0.620, 0.680);

    // Scroll blends palette from warm to cooler
    float scrollBlend = smoothstep(0.0, 1.0, uScroll);

    vec3 c1 = mix(cream, vec3(0.92, 0.94, 0.96), scrollBlend * 0.5);
    vec3 c2 = mix(peach, vec3(0.80, 0.85, 0.88), scrollBlend * 0.4);
    vec3 c3 = mix(softOrange, tealGlow, scrollBlend * 0.6);
    vec3 c4 = mix(warmRose, deepCoral, scrollBlend * 0.3);

    vec3 color;
    if (combined < 0.25) {
      color = mix(c1, c2, smoothstep(0.0, 0.25, combined));
    } else if (combined < 0.5) {
      color = mix(c2, c3, smoothstep(0.25, 0.5, combined));
    } else if (combined < 0.75) {
      color = mix(c3, c4, smoothstep(0.5, 0.75, combined));
    } else {
      color = mix(c4, deepCoral, smoothstep(0.75, 1.0, combined));
    }

    // Aurora luminance — bright ridge highlights
    float luminance = ridge * 0.3 * (1.0 + scrollBlend * 0.5);
    color += luminance * mix(vec3(1.0, 0.85, 0.7), tealGlow, scrollBlend) * 0.15;

    // Mouse proximity glow — soft radial light follows cursor
    float mouseDist = length(uv - (uMouse * 0.5 + 0.5));
    float mouseGlow = smoothstep(0.5, 0.0, mouseDist) * 0.08;
    color += mouseGlow * mix(softOrange, tealGlow, scrollBlend);

    // Subtle film grain
    float grain = (snoise(vec3(gl_FragCoord.xy * 0.5, uTime * 2.0)) * 0.5 + 0.5) * 0.015;
    color += grain - 0.0075;

    gl_FragColor = vec4(color, 1.0);
  }
`;
