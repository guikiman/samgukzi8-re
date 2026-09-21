/**
 * 삼국지 8 리메이크 — 타이틀 스크린 컨트롤러
 *
 * 타이틀 화면 표시/전환, 파티클 연출(봄: 꽃잎 / 겨울: 눈), 계절 테마 동기화.
 * [21] 로비 반응형 캔버스, [1057] 계절 테마 효과
 */
const PARTICLE_COLORS = {
    spring: ['rgba(232,143,176,', 'rgba(248,200,220,'],
    summer: ['rgba(95,181,232,', 'rgba(160,220,255,'],
    autumn: ['rgba(232,160,95,', 'rgba(220,140,60,'],
    winter: ['rgba(220,235,255,', 'rgba(180,205,235,'],
};
class TitleParticleSystem {
    constructor(canvas, season) {
        this.particles = [];
        this.rafId = null;
        this.running = false;
        this.resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.season = season;
        this.resize();
        window.addEventListener('resize', this.resize);
    }
    setSeason(season) {
        this.season = season;
    }
    spawn() {
        const colors = PARTICLE_COLORS[this.season] ?? PARTICLE_COLORS.spring;
        const isPetal = this.season === 'spring' || this.season === 'autumn';
        return {
            x: Math.random() * this.canvas.width,
            y: -20,
            size: isPetal ? 4 + Math.random() * 6 : 2 + Math.random() * 3,
            speedY: 0.4 + Math.random() * 1.2,
            speedX: (Math.random() - 0.5) * 0.8,
            angle: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.05,
            opacity: 0.25 + Math.random() * 0.5,
        };
        void colors;
    }
    step() {
        const colors = PARTICLE_COLORS[this.season] ?? PARTICLE_COLORS.spring;
        const isPetal = this.season === 'spring' || this.season === 'autumn';
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.particles.length < 60 && Math.random() < 0.4) {
            this.particles.push(this.spawn());
        }
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(p.y * 0.01) * 0.4;
            p.angle += p.spin;
            if (p.y > this.canvas.height + 20) {
                this.particles.splice(i, 1);
                continue;
            }
            const color = colors[i % colors.length];
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.angle);
            this.ctx.fillStyle = `${color}${p.opacity})`;
            if (isPetal) {
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }
            else {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.restore();
        }
        if (this.running) {
            this.rafId = requestAnimationFrame(() => this.step());
        }
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.rafId = requestAnimationFrame(() => this.step());
    }
    stop() {
        this.running = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    dispose() {
        this.stop();
        window.removeEventListener('resize', this.resize);
    }
}
// ============================================================
// 타이틀 스크린 컨트롤러
// ============================================================
export class TitleScreen {
    constructor(opts) {
        this.root = document.getElementById('title-screen');
        this.particleCanvas = document.getElementById('title-particles');
        this.btnNew = document.getElementById('btn-title-new');
        this.btnContinue = document.getElementById('btn-title-continue');
        this.onNewGame = opts.onNewGame;
        this.onContinue = opts.onContinue;
        this.particles = new TitleParticleSystem(this.particleCanvas, opts.season ?? 'spring');
        this.btnNew.addEventListener('click', () => this.leave('new'));
        this.btnContinue.addEventListener('click', () => this.leave('continue'));
    }
    /** 세이브 존재 여부에 따라 '이어하기' 버튼 표시/숨김 */
    setHasSave(hasSave) {
        this.btnContinue.style.display = hasSave ? 'block' : 'none';
    }
    /** 계절 테마 갱신 (body data-season + 파티클 색상) */
    setSeason(season) {
        document.body.dataset.season = season;
        this.particles.setSeason(season);
    }
    /** 파티클 연출 시작 (타이틀 표시 시) */
    show() {
        this.root.classList.remove('leaving');
        this.particles.start();
    }
    leave(mode) {
        this.root.classList.add('leaving');
        // 전환 애니메이션(.7s) 후 파티클 정지
        setTimeout(() => this.particles.stop(), 700);
        if (mode === 'new')
            this.onNewGame();
        else
            this.onContinue();
    }
}
//# sourceMappingURL=title_screen.js.map