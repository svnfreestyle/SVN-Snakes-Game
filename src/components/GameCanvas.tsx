import React, { useEffect, useRef } from 'react';
import { SnakeEngine, GRID_COLS, GRID_ROWS } from '../engine/snakeEngine';
import { ThemeColors } from '../types';

interface GameCanvasProps {
  engine: SnakeEngine;
  theme: ThemeColors;
  className?: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, theme, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background LCD color
      ctx.fillStyle = theme.lcdBg;
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      // Calculate cell dimensions
      const cellWidth = displayWidth / GRID_COLS;
      const cellHeight = displayHeight / GRID_ROWS;
      const cellPad = Math.max(1, Math.floor(Math.min(cellWidth, cellHeight) * 0.12));

      // Draw faint LCD background grid dots
      ctx.fillStyle = theme.lcdGrid;
      for (let col = 0; col < GRID_COLS; col++) {
        for (let row = 0; row < GRID_ROWS; row++) {
          const x = col * cellWidth + cellPad;
          const y = row * cellHeight + cellPad;
          const w = cellWidth - cellPad * 2;
          const h = cellHeight - cellPad * 2;
          ctx.fillRect(x, y, w, h);
        }
      }

      // Draw Wall border if walls enabled
      if (engine.config.walls) {
        ctx.strokeStyle = theme.wallColor;
        ctx.lineWidth = Math.max(2, Math.floor(cellPad * 1.5));
        ctx.strokeRect(1, 1, displayWidth - 2, displayHeight - 2);
      } else {
        // Subtle corner markers to signify wrap-around open playfield
        ctx.strokeStyle = theme.wallColor;
        ctx.lineWidth = 1.5;
        const markLen = cellWidth * 0.8;
        // Top-left
        ctx.beginPath();
        ctx.moveTo(0, markLen);
        ctx.lineTo(0, 0);
        ctx.lineTo(markLen, 0);
        // Top-right
        ctx.moveTo(displayWidth - markLen, 0);
        ctx.lineTo(displayWidth, 0);
        ctx.lineTo(displayWidth, markLen);
        // Bottom-left
        ctx.moveTo(0, displayHeight - markLen);
        ctx.lineTo(0, displayHeight);
        ctx.lineTo(markLen, displayHeight);
        // Bottom-right
        ctx.moveTo(displayWidth - markLen, displayHeight);
        ctx.lineTo(displayWidth, displayHeight);
        ctx.lineTo(displayWidth, displayHeight - markLen);
        ctx.stroke();
      }

      // Draw Bonus Creature (Insect / Mouse)
      if (engine.bonus) {
        const bx = engine.bonus.x * cellWidth + cellPad;
        const by = engine.bonus.y * cellHeight + cellPad;
        const bw = cellWidth - cellPad * 2;
        const bh = cellHeight - cellPad * 2;

        ctx.fillStyle = theme.bonusColor;
        
        // Draw pixelated retro bug
        const now = Date.now();
        const legWiggle = Math.sin(now / 100) > 0;

        // Central bug body
        ctx.fillRect(bx + bw * 0.25, by + bh * 0.25, bw * 0.5, bh * 0.5);
        // Head
        ctx.fillRect(bx + bw * 0.35, by + bh * 0.1, bw * 0.3, bh * 0.2);
        // Legs
        if (legWiggle) {
          ctx.fillRect(bx + bw * 0.05, by + bh * 0.2, bw * 0.2, bh * 0.15);
          ctx.fillRect(bx + bw * 0.75, by + bh * 0.2, bw * 0.2, bh * 0.15);
          ctx.fillRect(bx + bw * 0.05, by + bh * 0.65, bw * 0.2, bh * 0.15);
          ctx.fillRect(bx + bw * 0.75, by + bh * 0.65, bw * 0.2, bh * 0.15);
        } else {
          ctx.fillRect(bx + bw * 0.1, by + bh * 0.35, bw * 0.2, bh * 0.15);
          ctx.fillRect(bx + bw * 0.7, by + bh * 0.35, bw * 0.2, bh * 0.15);
          ctx.fillRect(bx + bw * 0.1, by + bh * 0.5, bw * 0.2, bh * 0.15);
          ctx.fillRect(bx + bw * 0.7, by + bh * 0.5, bw * 0.2, bh * 0.15);
        }
      }

      // Draw Food (Classic Nokia dot / egg)
      const fx = engine.food.x * cellWidth + cellPad;
      const fy = engine.food.y * cellHeight + cellPad;
      const fw = cellWidth - cellPad * 2;
      const fh = cellHeight - cellPad * 2;

      ctx.fillStyle = theme.foodColor;
      // Authentic diamond / rounded pixel food
      ctx.beginPath();
      ctx.roundRect(fx + fw * 0.15, fy + fh * 0.15, fw * 0.7, fh * 0.7, [2]);
      ctx.fill();

      // Inner pixel core
      ctx.fillStyle = theme.lcdBg;
      ctx.fillRect(fx + fw * 0.35, fy + fh * 0.35, fw * 0.3, fh * 0.3);

      // Draw Snake Body
      engine.snake.forEach((segment, idx) => {
        const sx = segment.x * cellWidth + cellPad;
        const sy = segment.y * cellHeight + cellPad;
        const sw = cellWidth - cellPad * 2;
        const sh = cellHeight - cellPad * 2;

        if (idx === 0) {
          // Head segment
          ctx.fillStyle = theme.snakeHead;
          ctx.beginPath();
          ctx.roundRect(sx, sy, sw, sh, [3]);
          ctx.fill();

          // Snake Eyes
          ctx.fillStyle = theme.lcdBg;
          const eyeSize = Math.max(2, Math.floor(sw * 0.22));
          const dir = engine.direction;

          if (dir.x === 1) { // Moving Right
            ctx.fillRect(sx + sw * 0.65, sy + sh * 0.2, eyeSize, eyeSize);
            ctx.fillRect(sx + sw * 0.65, sy + sh * 0.65, eyeSize, eyeSize);
          } else if (dir.x === -1) { // Moving Left
            ctx.fillRect(sx + sw * 0.15, sy + sh * 0.2, eyeSize, eyeSize);
            ctx.fillRect(sx + sw * 0.15, sy + sh * 0.65, eyeSize, eyeSize);
          } else if (dir.y === 1) { // Moving Down
            ctx.fillRect(sx + sw * 0.2, sy + sh * 0.65, eyeSize, eyeSize);
            ctx.fillRect(sx + sw * 0.65, sy + sh * 0.65, eyeSize, eyeSize);
          } else { // Moving Up
            ctx.fillRect(sx + sw * 0.2, sy + sh * 0.15, eyeSize, eyeSize);
            ctx.fillRect(sx + sw * 0.65, sy + sh * 0.15, eyeSize, eyeSize);
          }
        } else {
          // Body segment
          ctx.fillStyle = theme.snakeBody;
          ctx.beginPath();
          ctx.roundRect(sx, sy, sw, sh, [1.5]);
          ctx.fill();

          // Subtle inner pixel shade for Nokia LCD depth
          if (idx % 2 === 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(sx + sw * 0.25, sy + sh * 0.25, sw * 0.5, sh * 0.5);
          }
        }
      });

      // Bonus creature countdown timer bar at top
      if (engine.bonus) {
        const timerPercent = engine.bonus.timeLeft / engine.bonus.maxTime;
        const barWidth = (displayWidth - 8) * timerPercent;
        ctx.fillStyle = theme.bonusColor;
        ctx.fillRect(4, 3, barWidth, 3);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [engine, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full block rounded-sm ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};
