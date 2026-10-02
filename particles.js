/**
 * Interactive Particle & Ambient Canvas Engine
 * Adapts visual style based on selected Vibe Theme (Rain, Stars, Matrix, Embers)
 */

class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000, radius: 120 };
    this.theme = 'tokyo-rain';
    this.width = 0;
    this.height = 0;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });

    this.createParticles();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.createParticles();
  }

  setTheme(theme) {
    this.theme = theme;
    this.createParticles();
  }

  createParticles() {
    this.particles = [];
    const count = this.theme === 'tokyo-rain' ? 120 : 80;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.spawnParticle());
    }
  }

  spawnParticle() {
    const isRain = this.theme === 'tokyo-rain';
    const isMatrix = this.theme === 'matrix-core';
    const isSunset = this.theme === 'synth-sunset';

    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      length: isRain ? Math.random() * 20 + 10 : (isMatrix ? Math.random() * 15 + 5 : 0),
      radius: isRain || isMatrix ? 1 : Math.random() * 2.5 + 0.8,
      speedX: isRain ? (Math.random() - 0.5) * 0.5 : (Math.random() - 0.5) * 0.8,
      speedY: isRain ? Math.random() * 6 + 6 : (isMatrix ? Math.random() * 4 + 3 : (Math.random() - 0.5) * 0.6),
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01
    };
  }

  getThemeColor(alpha) {
    switch (this.theme) {
      case 'synth-sunset':
        return `rgba(255, 107, 53, ${alpha})`;
      case 'matrix-core':
        return `rgba(0, 255, 102, ${alpha})`;
      case 'deep-space':
        return `rgba(160, 110, 255, ${alpha})`;
      case 'tokyo-rain':
      default:
        return `rgba(0, 243, 255, ${alpha})`;
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const isRain = this.theme === 'tokyo-rain';
    const isMatrix = this.theme === 'matrix-core';

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Mouse interaction
      const dx = this.mouse.x - p.x;
      const dy = this.mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.mouse.radius && !isRain && !isMatrix) {
        const force = (1 - dist / this.mouse.radius) * 1.5;
        p.x -= (dx / dist) * force;
        p.y -= (dy / dist) * force;
      }

      // Movement
      p.x += p.speedX;
      p.y += p.speedY;

      // Screen wrap
      if (p.y > this.height) {
        p.y = -10;
        p.x = Math.random() * this.width;
      } else if (p.y < -10) {
        p.y = this.height + 10;
      }

      if (p.x > this.width) {
        p.x = 0;
      } else if (p.x < 0) {
        p.x = this.width;
      }

      // Render
      this.ctx.fillStyle = this.getThemeColor(p.alpha);
      this.ctx.strokeStyle = this.getThemeColor(p.alpha);

      if (isRain || isMatrix) {
        this.ctx.beginPath();
        this.ctx.lineWidth = isMatrix ? 1.5 : 1.2;
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x + p.speedX * 2, p.y + p.length);
        this.ctx.stroke();
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Subtle glow for space/sunset
        if (p.radius > 2) {
          this.ctx.shadowBlur = 8;
          this.ctx.shadowColor = this.getThemeColor(p.alpha);
        } else {
          this.ctx.shadowBlur = 0;
        }
      }
    }

    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.particleEngine = new ParticleEngine('bg-canvas');
});
