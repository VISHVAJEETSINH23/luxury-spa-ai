"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AMBIENCE_EVENT,
  getPalette,
  readPaletteId,
  readSpeed,
  toRamp,
} from "@/lib/palettes";

// Zoom factor for the visual pattern.
const ZOOM_FACTOR = 0.3;

// Base wave amplitude in domain warping.
const BASE_WAVE_AMPLITUDE = 0.2;

// Additional factor for random amplitude variations.
// waveAmp = BASE_WAVE_AMPLITUDE + RANDOM_WAVE_FACTOR * noise2D(...)
const RANDOM_WAVE_FACTOR = 0.15;

// Frequency multiplier for wave domain warp.
const WAVE_FREQUENCY = 4.0;

// Speed now lives in lib/palettes (and the on-page switcher) rather than being
// baked into the shader: the JS clock is scaled before it reaches uTime, so
// changing speed costs nothing and needs no recompile.

// Swirl strength near the center.
const BASE_SWIRL_STRENGTH = 1.2;

// Finer swirl timing factor.
const SWIRL_TIME_MULT = 5.0;

// Additional swirl effect modulated by noise.
const NOISE_SWIRL_FACTOR = 0.2;

// Number of fractal noise octaves in fbm (optimized for buttery 60/120fps).
const FBM_OCTAVES = 4;

////////////////////////////////////////////////////////////////////////////////
// DYNAMIC FRAGMENT SHADER BUILDER
////////////////////////////////////////////////////////////////////////////////

function buildFragmentShader(ramp: [number, number, number][]): string {
  // Force integer for the for-loop.
  const fbmOctavesInt = Math.floor(FBM_OCTAVES);

  const colorArraySrc = ramp
    .map((c) => `vec3(${c[0].toFixed(4)}, ${c[1].toFixed(4)}, ${c[2].toFixed(4)})`)
    .join(",\n  ");

  return `#version 300 es

precision mediump float;
out vec4 outColor;

uniform vec2 uResolution;
uniform float uTime;

#define NUM_COLORS 20

// 20-step palette of blues.
vec3 rampColors[NUM_COLORS] = vec3[](
  ${colorArraySrc}
);

// ----------------------------------------------------------
// Perlin-like noise
// ----------------------------------------------------------
vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float noise2D(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,
    0.366025403784439,
    -0.577350269189626,
    0.024390243902439
  );

  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);

  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod(i, 289.0);
  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0)) +
    i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.792843 - 0.853734 * (a0 * a0 + h * h);

  vec3 g;
  g.x  = a0.x  * x0.x + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;

  return 130.0 * dot(m, g);
}

// ----------------------------------------------------------
// Fractional Brownian Motion
// ----------------------------------------------------------
float fbm(vec2 st) {
  float value = 0.0;
  float amplitude = 0.5;
  float freq = 1.0;
  for (int i = 0; i < ${fbmOctavesInt}; i++) {
    value += amplitude * noise2D(st * freq);
    freq *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  // Normalize coords to [-1,1]
  vec2 uv = (gl_FragCoord.xy / uResolution.xy) * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;

  // Zoom in so pattern is bigger and less obviously repeated
  uv *= float(${ZOOM_FACTOR});

  // Time factor for wave domain warp
  // uTime already arrives scaled by the chosen speed (see the render loop).
  float t = uTime;

  // Random amplitude that changes over time
  float waveAmp = float(${BASE_WAVE_AMPLITUDE}) + float(${RANDOM_WAVE_FACTOR})
                  * noise2D(vec2(t, 27.7));

  // Sine-based domain warp
  float waveX = waveAmp * sin(uv.y * float(${WAVE_FREQUENCY}) + t);
  float waveY = waveAmp * sin(uv.x * float(${WAVE_FREQUENCY}) - t);
  uv.x += waveX;
  uv.y += waveY;

  // Additional swirl near center
  float r = length(uv);
  float angle = atan(uv.y, uv.x);
  float swirlStrength = float(${BASE_SWIRL_STRENGTH})
                        * (1.0 - smoothstep(0.0, 1.0, r));

  // Driven by the scaled clock, not the raw one. Reading uTime here meant the
  // swirl oscillated at full speed no matter what TIME_FACTOR was set to —
  // it was the fastest thing on screen and the reason the panel felt busy.
  angle += swirlStrength * sin(t + r * float(${SWIRL_TIME_MULT}));
  uv = vec2(cos(angle), sin(angle)) * r;

  // Evaluate fractal noise
  float n = fbm(uv);

  // Additional swirl effect modulated by noise
  float swirlEffect = float(${NOISE_SWIRL_FACTOR})
                      * sin(t + n * 3.0);
  n += swirlEffect;

  // Convert noise to [0..1]
  float noiseVal = 0.5 * (n + 1.0);

  // Discrete palette sampling
  float idx = clamp(noiseVal, 0.0, 1.0) * float(NUM_COLORS - 1);
  int iLow = int(floor(idx));
  int iHigh = int(min(float(iLow + 1), float(NUM_COLORS - 1)));
  float f = fract(idx);

  vec3 colLow = rampColors[iLow];
  vec3 colHigh = rampColors[iHigh];
  vec3 color = mix(colLow, colHigh, f);

  // If it's the darkest color, set alpha=0 => total transparency
  if (iLow == 0 && iHigh == 0) {
    outColor = vec4(color, 0.0);
  } else {
    outColor = vec4(color, 1.0);
  }
}
`;
}

////////////////////////////////////////////////////////////////////////////////
// STATIC VERTEX SHADER
////////////////////////////////////////////////////////////////////////////////
const vertexShaderSource = `#version 300 es
precision mediump float;

in vec2 aPosition;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

////////////////////////////////////////////////////////////////////////////////
// SHADER COMPILATION UTIL
////////////////////////////////////////////////////////////////////////////////
function createShaderProgram(
  gl: WebGL2RenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram | null {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) return null;

  gl.shaderSource(vertexShader, vsSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error("Vertex shader error:", gl.getShaderInfoLog(vertexShader));
    gl.deleteShader(vertexShader);
    return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) {
    gl.deleteShader(vertexShader);
    return null;
  }

  gl.shaderSource(fragmentShader, fsSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error("Fragment shader error:", gl.getShaderInfoLog(fragmentShader));
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // Shaders are reference-counted by the program once linked.
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Could not link WebGL program:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

////////////////////////////////////////////////////////////////////////////////
// MAIN REACT COMPONENT
////////////////////////////////////////////////////////////////////////////////
export default function WavyBackground({
  children,
  className
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  // The palette is compiled into the shader, so a change rebuilds the program;
  // speed only scales the clock, so it rides in a ref and needs no rebuild.
  const [paletteId, setPaletteId] = useState<string>(() => readPaletteId());
  const speedRef = useRef<number>(readSpeed());

  useEffect(() => {
    // localStorage is off-limits until hydration, so the first paint uses the
    // default palette and this pulls the guest's saved choice straight after.
    setPaletteId(readPaletteId());
    speedRef.current = readSpeed();

    const onAmbience = (event: Event) => {
      const detail = (event as CustomEvent<{ paletteId: string; speed: number }>).detail;
      if (!detail) return;
      speedRef.current = detail.speed;
      setPaletteId(detail.paletteId);
    };

    window.addEventListener(AMBIENCE_EVENT, onAmbience);
    return () => window.removeEventListener(AMBIENCE_EVENT, onAmbience);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host || typeof window === "undefined") return;

    const fsSource = buildFragmentShader(toRamp(getPalette(paletteId)));

    const gl = canvas.getContext("webgl2", { alpha: true });
    if (!gl) {
      console.error("WebGL2 is not supported by your browser.");
      return;
    }

    const program = createShaderProgram(gl, vertexShaderSource, fsSource);
    if (!program) {
      console.error("Failed to create shader program.");
      return;
    }

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Transparent background
    gl.clearColor(0, 0, 0, 0);

    // Scaled canvas buffer for silky 60/120fps performance
    const updateCanvasSize = () => {
      const scale = Math.min(window.devicePixelRatio > 1 ? 0.6 : 0.8, 1);
      canvas.width = Math.max(320, Math.round(window.innerWidth * scale));
      canvas.height = Math.max(240, Math.round(window.innerHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    updateCanvasSize();

    gl.useProgram(program);

    // Full-screen quad
    const quadVertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const aPositionLoc = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform locations
    const uResolutionLoc = gl.getUniformLocation(program, "uResolution");
    const uTimeLoc = gl.getUniformLocation(program, "uTime");

    let animId: number | null = null;
    let onScreen = true;
    // Elapsed time is accumulated rather than read off the clock, so pausing
    // while scrolled away doesn't teleport the pattern on the way back.
    let shaderTime = 0;
    let lastFrame = performance.now();

    const drawFrame = () => {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.bindVertexArray(vao);

      gl.uniform2f(uResolutionLoc, canvas.width, canvas.height);
      gl.uniform1f(uTimeLoc, shaderTime);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const render = () => {
      const now = performance.now();
      // Scaled here rather than in the shader, so the speed control takes
      // effect on the next frame instead of needing a recompile.
      shaderTime += Math.min((now - lastFrame) * 0.001, 0.05) * speedRef.current;
      lastFrame = now;
      drawFrame();
      animId = requestAnimationFrame(render);
    };

    const start = () => {
      if (animId !== null) return;
      lastFrame = performance.now();
      animId = requestAnimationFrame(render);
    };

    const stop = () => {
      if (animId === null) return;
      cancelAnimationFrame(animId);
      animId = null;
    };

    drawFrame();
    start();

    // Only burn GPU while the panel is on screen and the tab is live.
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen && document.visibilityState === "visible") start();
        else stop();
      },
      { rootMargin: "200px" }
    );
    observer.observe(host);

    const onVisibility = () => {
      if (document.visibilityState === "visible" && onScreen) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const handleResize = () => {
      updateCanvasSize();
      if (animId === null) drawFrame();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", handleResize);
      gl.deleteProgram(program);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
    };
    // Rebuilds the program when the guest picks another palette.
  }, [paletteId]);

  return (
    <div ref={hostRef} className={cn("relative w-full", className)}>
      {/* The canvas renders one viewport of pattern. Stretched over a section
          that is many screens tall it smears into dark bands, so it sticks to
          the viewport instead and stays as crisp as on a short page.
          Note: no `overflow-hidden` on the host — that would make it a scroll
          container and kill the sticky. */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <canvas
          ref={canvasRef}
          className="sticky top-0 w-full h-screen"
          style={{ background: "transparent" }}
        />
      </div>

      {children}
    </div>
  );
}
