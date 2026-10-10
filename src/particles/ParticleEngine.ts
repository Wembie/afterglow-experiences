/**
 * Lightweight canvas particle renderer shared by every scene.
 *
 * One canvas, one requestAnimationFrame loop for the whole app. Scenes change
 * the preset rather than mounting their own renderers, so moods blend instead
 * of popping. Particles are drawn from pre-rendered glow sprites, which is far
 * cheaper than per-frame gradients or shadowBlur.
 */
import { particlePresets, particleCount, type ParticlePreset } from './presets';
import type { ParticlePresetName } from '../engine/schema';

interface Ambient {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  color: number;
  alpha: number;
  /** 1 = alive, 0 = fading out for removal. */
  target: number;
  /** 0..1 — nearer particles move more with the pointer (parallax). */
  depth: number;
}

interface Transient {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  ring: boolean;
}

export interface EngineSettings {
  preset: ParticlePresetName;
  colors: string[];
  reduced: boolean;
  quality: 'high' | 'low';
}

export interface BurstOptions {
  count?: number;
  colors?: string[];
  speed?: number;
  /** Seconds. */
  life?: number;
}

const MAX_TRANSIENTS = 260;
const SPRITE_SIZE = 64;

export class ParticleEngine {
  private ctx: CanvasRenderingContext2D | null;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private ambient: Ambient[] = [];
  private transients: Transient[] = [];
  private sprites = new Map<string, HTMLCanvasElement>();
  private settings: EngineSettings = {
    preset: 'none',
    colors: ['#ffffff'],
    reduced: false,
    quality: 'high',
  };
  private preset: ParticlePreset | null = null;
  private frame = 0;
  private lastTime = 0;
  private running = false;
  private pointer = { x: -9999, y: -9999, active: false, lastMove: 0 };
  private gatherPoint: { x: number; y: number } | null = null;

  private readonly onResize = () => this.resize();
  private readonly onVisibility = () => {
    if (document.hidden) this.stop();
    else this.start();
  };
  private readonly onPointerMove = (e: PointerEvent) => {
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
    this.pointer.active = true;
    this.pointer.lastMove = performance.now();
  };
  private readonly onPointerDown = (e: PointerEvent) => {
    this.onPointerMove(e);
    this.ripple(e.clientX, e.clientY);
  };
  private readonly onPointerLeave = () => {
    this.pointer.active = false;
  };

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d');
    window.addEventListener('resize', this.onResize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onPointerLeave);
    this.resize();
  }

  destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerdown', this.onPointerDown);
    document.documentElement.removeEventListener('pointerleave', this.onPointerLeave);
    this.ambient = [];
    this.transients = [];
    this.sprites.clear();
  }

  configure(next: EngineSettings): void {
    const colorsChanged = next.colors.join() !== this.settings.colors.join();
    this.settings = next;
    this.preset = next.preset === 'none' ? null : particlePresets[next.preset];
    if (colorsChanged) {
      for (const p of this.ambient) p.color = Math.floor(Math.random() * next.colors.length);
    }
    this.resize();
    this.syncPopulation();
    if (next.reduced) {
      this.stop();
      this.transients = [];
      for (const p of this.ambient) p.alpha = p.target;
      this.ambient = this.ambient.filter((p) => p.target > 0);
      this.draw(0, performance.now() / 1000);
    } else {
      this.start();
    }
  }

  // -- public effects --------------------------------------------------------

  burst(x: number, y: number, options: BurstOptions = {}): void {
    if (this.settings.reduced) return;
    const colors = options.colors ?? this.settings.colors;
    const factor = this.settings.quality === 'low' ? 0.5 : 1;
    const count = Math.round((options.count ?? 40) * factor);
    const speed = options.speed ?? 160;
    const life = options.life ?? 1.6;
    for (let i = 0; i < count && this.transients.length < MAX_TRANSIENTS; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = speed * (0.35 + Math.random() * 0.65);
      this.transients.push({
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v,
        size: 1 + Math.random() * 2.2,
        color: colors[i % colors.length] ?? '#fff',
        life: life * (0.6 + Math.random() * 0.4),
        maxLife: life,
        ring: false,
      });
    }
    this.start();
  }

  ripple(x: number, y: number, color?: string): void {
    if (this.settings.reduced || this.transients.length >= MAX_TRANSIENTS) return;
    this.transients.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 4,
      color: color ?? this.settings.colors[0] ?? '#fff',
      life: 0.9,
      maxLife: 0.9,
      ring: true,
    });
    this.start();
  }

  /** Draws ambient particles toward a point (used by the finale). */
  gather(x: number, y: number): void {
    this.gatherPoint = { x, y };
  }

  /** Releases gathered particles outward. */
  release(strength = 220): void {
    const point = this.gatherPoint;
    this.gatherPoint = null;
    if (!point || this.settings.reduced) return;
    for (const p of this.ambient) {
      const dx = p.x - point.x;
      const dy = p.y - point.y;
      const d = Math.hypot(dx, dy) || 1;
      const v = strength * (0.4 + Math.random() * 0.6);
      p.vx += (dx / d) * v;
      p.vy += (dy / d) * v;
    }
  }

  // -- internals -------------------------------------------------------------

  private resize() {
    const cap = this.settings.quality === 'low' ? 1 : 2;
    this.dpr = Math.min(window.devicePixelRatio || 1, cap);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.settings.reduced) this.draw(0, performance.now() / 1000);
  }

  private syncPopulation() {
    const target = this.preset
      ? particleCount(this.preset, this.width, this.height, this.settings.quality)
      : 0;
    const alive = this.ambient.filter((p) => p.target > 0);
    if (alive.length > target) {
      alive.slice(target).forEach((p) => (p.target = 0));
    } else {
      for (let i = alive.length; i < target; i++) this.ambient.push(this.spawn());
    }
  }

  private spawn(): Ambient {
    const preset = this.preset;
    const [minSize, maxSize] = preset?.size ?? [1, 2];
    const angle = Math.random() * Math.PI * 2;
    const speed = (preset?.speed ?? 0) * (0.3 + Math.random() * 0.7);
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: minSize + Math.random() * (maxSize - minSize),
      phase: Math.random() * Math.PI * 2,
      color: Math.floor(Math.random() * this.settings.colors.length),
      alpha: 0,
      target: 1,
      depth: Math.random(),
    };
  }

  private sprite(key: string): HTMLCanvasElement {
    let sprite = this.sprites.get(key);
    if (sprite) return sprite;
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = SPRITE_SIZE;
    const g = sprite.getContext('2d');
    if (g) {
      // Normalise any CSS colour to #rrggbb so alpha suffixes can be appended.
      g.fillStyle = '#ffffff';
      g.fillStyle = key;
      const color = /^#[0-9a-f]{6}$/i.test(String(g.fillStyle)) ? String(g.fillStyle) : '#ffffff';
      const r = SPRITE_SIZE / 2;
      const gradient = g.createRadialGradient(r, r, 0, r, r, r);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.12, color);
      gradient.addColorStop(0.3, `${color}55`);
      gradient.addColorStop(1, `${color}00`);
      g.fillStyle = gradient;
      g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
    }
    this.sprites.set(key, sprite);
    return sprite;
  }

  private start() {
    if (this.running || this.settings.reduced || document.hidden) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private tick = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt, now);
    this.draw(dt, now / 1000);
    // Nothing to animate: let the loop sleep until the next configure/effect.
    if (this.ambient.length === 0 && this.transients.length === 0) {
      this.running = false;
      return;
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  private update(dt: number, now: number) {
    const preset = this.preset;
    const fadeRate = dt / (preset?.fade ?? 1);
    if (this.pointer.active && now - this.pointer.lastMove > 2500) this.pointer.active = false;

    for (const p of this.ambient) {
      p.alpha += Math.sign(p.target - p.alpha) * fadeRate;
      p.alpha = Math.max(0, Math.min(1, p.alpha));

      if (preset) {
        // Ease back toward base drift after pushes.
        const drag = 1 - Math.min(1, dt * 1.2);
        p.vx = p.vx * drag + (preset.drift.x + Math.cos(p.phase) * preset.speed * 0.3) * (1 - drag);
        p.vy = p.vy * drag + (preset.drift.y + Math.sin(p.phase) * preset.speed * 0.3) * (1 - drag);

        if (this.pointer.active && preset.pointer !== 'none') {
          const dx = p.x - this.pointer.x;
          const dy = p.y - this.pointer.y;
          const d = Math.hypot(dx, dy);
          if (d < preset.interactionRadius && d > 0.001) {
            const force = (1 - d / preset.interactionRadius) * preset.interactionStrength;
            const dir = preset.pointer === 'repel' ? 1 : -0.4;
            p.vx += (dx / d) * force * dir * dt * 8;
            p.vy += (dy / d) * force * dir * dt * 8;
          }
        }
      }

      if (this.gatherPoint) {
        const dx = this.gatherPoint.x - p.x;
        const dy = this.gatherPoint.y - p.y;
        p.vx += dx * dt * 1.6;
        p.vy += dy * dt * 1.6;
        p.vx *= 0.94;
        p.vy *= 0.94;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.phase += dt * 0.4;

      // Wrap softly around the viewport.
      const m = 20;
      if (p.x < -m) p.x = this.width + m;
      else if (p.x > this.width + m) p.x = -m;
      if (p.y < -m) p.y = this.height + m;
      else if (p.y > this.height + m) p.y = -m;
    }
    this.ambient = this.ambient.filter((p) => p.target > 0 || p.alpha > 0);

    for (const t of this.transients) {
      t.life -= dt;
      if (!t.ring) {
        t.vx *= 1 - dt * 1.4;
        t.vy = t.vy * (1 - dt * 1.4) + 18 * dt;
        t.x += t.vx * dt;
        t.y += t.vy * dt;
      } else {
        t.size += dt * 90;
      }
    }
    this.transients = this.transients.filter((t) => t.life > 0);
  }

  private draw(_dt: number, time: number) {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.width, this.height);
    const preset = this.preset;
    const colors = this.settings.colors;
    const reduced = this.settings.reduced;

    // Subtle parallax relative to the pointer.
    const px = this.pointer.active && !reduced ? (this.pointer.x / this.width - 0.5) * 10 : 0;
    const py = this.pointer.active && !reduced ? (this.pointer.y / this.height - 0.5) * 10 : 0;

    ctx.globalCompositeOperation = 'lighter';

    if (preset && preset.connectionDistance > 0) {
      const maxD = preset.connectionDistance;
      const maxD2 = maxD * maxD;
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = colors[1] ?? colors[0] ?? '#fff';
      const list = this.ambient;
      for (let i = 0; i < list.length; i++) {
        const a = list[i]!;
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j]!;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxD2) {
            ctx.globalAlpha = (1 - Math.sqrt(d2) / maxD) * 0.16 * Math.min(a.alpha, b.alpha);
            ctx.beginPath();
            ctx.moveTo(a.x + px * a.depth, a.y + py * a.depth);
            ctx.lineTo(b.x + px * b.depth, b.y + py * b.depth);
            ctx.stroke();
          }
        }
      }
    }

    const glowScale = 3 + (preset?.glow ?? 0.5) * 6;
    const twinkle = reduced ? 0 : (preset?.twinkle ?? 0);
    for (const p of this.ambient) {
      const shimmer = 1 - twinkle * 0.5 * (1 + Math.sin(time * 1.3 + p.phase * 3));
      const alpha = p.alpha * (0.35 + 0.65 * shimmer) * (0.45 + p.depth * 0.55);
      if (alpha <= 0.01) continue;
      const size = p.size * glowScale;
      ctx.globalAlpha = alpha;
      ctx.drawImage(
        this.sprite(colors[p.color % colors.length] ?? '#fff'),
        p.x + px * p.depth - size / 2,
        p.y + py * p.depth - size / 2,
        size,
        size,
      );
    }

    for (const t of this.transients) {
      const k = Math.max(0, t.life / t.maxLife);
      if (t.ring) {
        ctx.globalAlpha = k * 0.35;
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        const size = t.size * 7;
        ctx.globalAlpha = k;
        ctx.drawImage(this.sprite(t.color), t.x - size / 2, t.y - size / 2, size, size);
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
