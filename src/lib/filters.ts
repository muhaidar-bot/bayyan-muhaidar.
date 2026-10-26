/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CameraFilter {
  id: string;
  name: string;
  description: string;
  cssFilter: string;
  canvasFilter?: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  colorGrade: string;
}

export interface DecorativeOverlay {
  id: string;
  name: string;
  icon: string;
  description: string;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, timeMs: number) => void;
}

// 10 Specified Filters from App Specification
export const CAMERA_FILTERS: CameraFilter[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Clean natural camera feed',
    cssFilter: 'none',
    colorGrade: 'rgba(0,0,0,0)',
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    description: 'Warm sunset amber lighting',
    cssFilter: 'sepia(0.28) saturate(1.4) contrast(1.08) brightness(1.05)',
    colorGrade: 'rgba(255, 175, 45, 0.14)',
  },
  {
    id: 'warm_glow',
    name: 'Warm Glow',
    description: 'Soft inviting romantic illumination',
    cssFilter: 'brightness(1.08) contrast(1.02) saturate(1.25) sepia(0.12)',
    colorGrade: 'rgba(255, 195, 130, 0.12)',
  },
  {
    id: 'pink_romance',
    name: 'Pink Romance',
    description: 'Dreamy tender rose and blush tone',
    cssFilter: 'contrast(1.05) saturate(1.3) hue-rotate(-12deg) brightness(1.06)',
    colorGrade: 'rgba(244, 63, 114, 0.15)',
  },
  {
    id: 'purple_dream',
    name: 'Purple Dream',
    description: 'Ethereal velvet dark-plum & violet',
    cssFilter: 'contrast(1.1) saturate(1.35) hue-rotate(25deg) brightness(0.98)',
    colorGrade: 'rgba(168, 85, 247, 0.16)',
  },
  {
    id: 'cool_blue',
    name: 'Cool Blue',
    description: 'Fresh cinematic twilight chill',
    cssFilter: 'contrast(1.1) saturate(1.15) hue-rotate(170deg) brightness(1.02)',
    colorGrade: 'rgba(56, 189, 248, 0.12)',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Classic nostalgic film tone with warmth',
    cssFilter: 'sepia(0.45) contrast(0.95) brightness(1.08) saturate(0.85)',
    colorGrade: 'rgba(196, 140, 90, 0.12)',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Rich deep shadows and stylized pop',
    cssFilter: 'contrast(1.3) saturate(1.22) brightness(0.94)',
    colorGrade: 'rgba(15, 23, 42, 0.08)',
  },
  {
    id: 'black_and_white',
    name: 'Black & White',
    description: 'Timeless monochrome contrast',
    cssFilter: 'grayscale(1) contrast(1.25) brightness(1.04)',
    colorGrade: 'rgba(0, 0, 0, 0)',
  },
  {
    id: 'high_contrast',
    name: 'High Contrast',
    description: 'Bold dramatic punch and clarity',
    cssFilter: 'contrast(1.5) saturate(1.35) brightness(1.02)',
    colorGrade: 'rgba(0, 0, 0, 0.05)',
  },
];

// Helper to draw a heart shape
function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 1.4, x, y + size);
  ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 1.4, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
  ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Helper to draw a 4-point star sparkle
function drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    ctx.lineTo(0, -size);
    ctx.quadraticCurveTo(0, -size * 0.2, size * 0.2, -size * 0.2);
    ctx.lineTo(size, 0);
    ctx.quadraticCurveTo(size * 0.2, 0, size * 0.2, size * 0.2);
    ctx.lineTo(0, size);
    ctx.quadraticCurveTo(0, size * 0.2, -size * 0.2, size * 0.2);
    ctx.lineTo(-size, 0);
    ctx.quadraticCurveTo(-size * 0.2, 0, -size * 0.2, -size * 0.2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 5 Specified Animated Overlays from App Specification
export const DECORATIVE_OVERLAYS: DecorativeOverlay[] = [
  {
    id: 'none',
    name: 'No Overlay',
    icon: '✨',
    description: 'Clean view without overlays',
    draw: () => {},
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: '❤️',
    description: 'Floating romantic radiant hearts',
    draw: (ctx, width, height, timeMs) => {
      const heartCount = 14;
      const t = timeMs / 1000;
      for (let i = 0; i < heartCount; i++) {
        const seed = i * 137.5;
        const progress = ((t * 0.4 + (i / heartCount)) % 1);
        const y = height - progress * (height + 100);
        const sway = Math.sin(t * 2 + seed) * (width * 0.08);
        const baseX = (seed * 9.7) % width;
        const x = baseX + sway;
        const size = (width * 0.04) + ((i % 3) * 10);
        const alpha = Math.sin(progress * Math.PI) * 0.85;
        const colors = ['#f43f5e', '#fb7185', '#ec4899', '#fda4af', '#f472b6'];
        drawHeart(ctx, x, y, size, colors[i % colors.length], alpha);
      }
    },
  },
  {
    id: 'sparkles',
    name: 'Sparkles',
    icon: '✨',
    description: 'Shimmering stardust and glitter bursts',
    draw: (ctx, width, height, timeMs) => {
      const sparkleCount = 20;
      const t = timeMs / 1000;
      for (let i = 0; i < sparkleCount; i++) {
        const seed = i * 263.3;
        const x = (seed * 7.9) % width;
        const y = (seed * 13.3) % height;
        const pulse = Math.abs(Math.sin(t * 3 + i * 1.2));
        const size = (width * 0.025) * pulse + 4;
        const rot = t * 1.5 + i;
        ctx.save();
        ctx.globalAlpha = pulse * 0.8;
        drawSparkle(ctx, x, y, size, '#fed7aa', rot);
        ctx.restore();
      }
    },
  },
  {
    id: 'flowers',
    name: 'Flowers',
    icon: '🌸',
    description: 'Drifting sakura petals and blossom breeze',
    draw: (ctx, width, height, timeMs) => {
      const flowerCount = 16;
      const t = timeMs / 1000;
      for (let i = 0; i < flowerCount; i++) {
        const seed = i * 73.1;
        const progress = ((t * 0.25 + (i / flowerCount)) % 1);
        const y = -40 + progress * (height + 80);
        const sway = Math.cos(t * 1.8 + seed) * (width * 0.12);
        const x = ((seed * 11.3) % width) + sway;
        const size = 14 + (i % 4) * 6;
        const rot = t * 1.2 + seed;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.8;
        
        // Draw 5-petal blossom
        for (let p = 0; p < 5; p++) {
          ctx.rotate((Math.PI * 2) / 5);
          ctx.fillStyle = (p % 2 === 0) ? '#fbcfe8' : '#f472b6';
          ctx.beginPath();
          ctx.ellipse(0, size * 0.55, size * 0.35, size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
  },
  {
    id: 'sunglasses',
    name: 'Sunglasses',
    icon: '🕶️',
    description: 'Stylish retro chic sunglasses overlay',
    draw: (ctx, width, height, timeMs) => {
      const t = timeMs / 1000;
      const bob = Math.sin(t * 2) * (height * 0.015);
      const centerX = width / 2;
      const centerY = height * 0.34 + bob;
      const glassWidth = width * 0.28;
      const glassHeight = glassWidth * 0.55;
      const bridge = width * 0.05;

      ctx.save();
      // Left and right frame
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#e11d48';
      ctx.lineWidth = 4;

      // Left lens
      ctx.beginPath();
      ctx.roundRect(centerX - bridge / 2 - glassWidth, centerY - glassHeight / 2, glassWidth, glassHeight, [16, 16, 28, 28]);
      ctx.fill();
      ctx.stroke();

      // Right lens
      ctx.beginPath();
      ctx.roundRect(centerX + bridge / 2, centerY - glassHeight / 2, glassWidth, glassHeight, [16, 16, 28, 28]);
      ctx.fill();
      ctx.stroke();

      // Bridge connection
      ctx.beginPath();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#e11d48';
      ctx.moveTo(centerX - bridge / 2, centerY - glassHeight * 0.2);
      ctx.quadraticCurveTo(centerX, centerY - glassHeight * 0.45, centerX + bridge / 2, centerY - glassHeight * 0.2);
      ctx.stroke();

      // Stylish reflection sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(centerX - bridge / 2 - glassWidth + 12, centerY - glassHeight / 2 + 8);
      ctx.lineTo(centerX - bridge / 2 - 20, centerY - glassHeight / 2 + 8);
      ctx.lineTo(centerX - bridge / 2 - glassWidth + 24, centerY + glassHeight / 2 - 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    },
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    description: 'Radiant vibrant romantic rainbow arch',
    draw: (ctx, width, height, timeMs) => {
      const t = timeMs / 1000;
      const shimmer = 0.6 + Math.sin(t * 2) * 0.15;
      const colors = ['#f43f5e', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#c084fc'];
      const cx = width * 0.5;
      const cy = height * 0.95;
      const baseRadius = width * 0.45;
      const bandWidth = width * 0.022;

      ctx.save();
      ctx.globalAlpha = shimmer;
      for (let i = 0; i < colors.length; i++) {
        ctx.strokeStyle = colors[i];
        ctx.lineWidth = bandWidth;
        ctx.beginPath();
        ctx.arc(cx, cy, baseRadius + i * bandWidth, Math.PI, 0, false);
        ctx.stroke();
      }
      ctx.restore();
    },
  },
];

/**
 * Composites a video/image frame, applies the active CSS filter emulation,
 * and draws the chosen animated overlay onto a canvas.
 * This guarantees the captured file has the effect burned into the media!
 */
export function renderCompositedFrame(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
  filterId: string,
  overlayId: string,
  isMirrored = false,
  timeMs: number = Date.now()
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Apply mirroring if front camera
  if (isMirrored) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  // Find filter
  const filter = CAMERA_FILTERS.find((f) => f.id === filterId) || CAMERA_FILTERS[0];
  if (filter.cssFilter && filter.cssFilter !== 'none') {
    ctx.filter = filter.cssFilter;
  } else {
    ctx.filter = 'none';
  }

  // Draw base camera frame
  ctx.drawImage(source, 0, 0, width, height);
  ctx.filter = 'none';

  // Apply color grade tint overlay
  if (filter.colorGrade && filter.colorGrade !== 'rgba(0,0,0,0)') {
    ctx.fillStyle = filter.colorGrade;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();

  // Draw overlay (not mirrored, so text/effects face natural orientation)
  const overlay = DECORATIVE_OVERLAYS.find((o) => o.id === overlayId);
  if (overlay && overlay.id !== 'none') {
    overlay.draw(ctx, width, height, timeMs);
  }
}
