"use client";

import { useEffect, useRef } from "react";

const GLYPHS = "0123456789abcdef<>/{}[]=+*;:.";

type Stream = { x: number; y: number; speed: number; length: number; glyphs: string[]; hue: "lime" | "purple" };

export function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const drawingCanvas: HTMLCanvasElement = canvas;
    const drawingContext: CanvasRenderingContext2D = context;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let streams: Stream[] = [];
    let animationFrame = 0;
    const cell = 21;

    function randomGlyph() { return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? "0"; }
    function resetStream(stream: Stream, height: number) {
      stream.y = -Math.random() * height;
      stream.speed = 0.055 + Math.random() * 0.11;
      stream.length = 8 + Math.floor(Math.random() * 18);
      stream.glyphs = Array.from({ length: stream.length }, randomGlyph);
      stream.hue = Math.random() > 0.86 ? "purple" : "lime";
    }
    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      drawingCanvas.width = Math.floor(window.innerWidth * ratio);
      drawingCanvas.height = Math.floor(window.innerHeight * ratio);
      drawingCanvas.style.width = `${window.innerWidth}px`;
      drawingCanvas.style.height = `${window.innerHeight}px`;
      drawingContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      streams = Array.from({ length: Math.ceil(window.innerWidth / cell) }, (_, index) => {
        const stream: Stream = { x: index * cell + Math.random() * 5, y: 0, speed: 0, length: 0, glyphs: [], hue: "lime" };
        resetStream(stream, window.innerHeight);
        return stream;
      });
    }
    function draw() {
      const { innerWidth: width, innerHeight: height } = window;
      drawingContext.fillStyle = "rgba(0, 0, 0, 0.12)";
      drawingContext.fillRect(0, 0, width, height);
      drawingContext.font = "15px 'Courier New', monospace";
      streams.forEach((stream) => {
        for (let index = 0; index < stream.length; index += 1) {
          const y = stream.y - index * cell;
          if (y < -cell || y > height + cell) continue;
          const alpha = 1 - index / stream.length;
          const head = index === 0;
          drawingContext.fillStyle = head
            ? "rgba(247, 245, 255, 0.94)"
            : stream.hue === "purple"
              ? `rgba(168, 85, 247, ${alpha * 0.52})`
              : `rgba(31, 255, 147, ${alpha * 0.58})`;
          drawingContext.fillText(stream.glyphs[index] ?? "0", stream.x, y);
        }
        stream.y += stream.speed * cell;
        if (stream.y - stream.length * cell > height) resetStream(stream, height);
      });
    }
    function tick() {
      draw();
      animationFrame = window.requestAnimationFrame(tick);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    if (!reducedMotion.matches) animationFrame = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="code-rain" aria-hidden="true" />;
}
