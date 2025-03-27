// global.d.ts
interface Window {
  starfield?: Array<{
    x: number;
    y: number;
    size: number;
    speed: number;
    brightness: number;
    twinkleSpeed: number;
  }>;
}