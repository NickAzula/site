// Выпадающее меню соцсетей
const socialToggle = document.getElementById('socialToggle');
const socialDropdown = document.getElementById('socialDropdown');
socialToggle.addEventListener('click', () => {
if (socialDropdown.style.display === 'flex') {
    socialDropdown.style.display = 'none';
} else {
    socialDropdown.style.display = 'flex';
    socialDropdown.style.flexDirection = 'column';
}
});

// Переключение темы с использованием булевой переменной
const themeToggle = document.getElementById('themeToggle');
let isDark = true; // изначально тёмная тема (фон #222, цвет #fff)
themeToggle.addEventListener('click', () => {
    const content = document.querySelector('.content');
    if(isDark) {
        content.style.background = '#eee';
        content.style.color = '#000';
        themeToggle.textContent = '🌙';
        isDark = false;
    } else {
        content.style.background = '#222';
        content.style.color = '#fff';
        themeToggle.textContent = '☀';
        isDark = true;
    }
});

// Реализация эффекта дождя
class RainEffect {
constructor() {
    this.isRaining = false;
    this.drops = [];
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.init();
}
init() {
    this.canvas.style.position = "fixed";
    this.canvas.style.top = "0";
    this.canvas.style.left = "0";
    this.canvas.style.width = "100vw";
    this.canvas.style.height = "100vh";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "500";
    document.body.appendChild(this.canvas);
    this.resize();
    window.addEventListener("resize", () => this.resize());
}
resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.drops = [];
    for (let i = 0; i < 250; i++) {
    this.drops.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: 0.5 - Math.random(),
        vy: Math.random() + 0.2,
        life: 0,
        ttl: Math.random() * 500 + 300,
        size: 2
    });
    }
}
draw() {
    if (!this.isRaining) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(150,180,255,0.8)";
    for (let drop of this.drops) {
    drop.x += drop.vx;
    drop.y += drop.vy;
    drop.life++;
    if (drop.vy < 8) {
        drop.vy += 0.1;
    }
    if (
        drop.x > this.canvas.width ||
        drop.x < -drop.size ||
        drop.y > this.canvas.height + drop.size ||
        drop.life > drop.ttl
    ) {
        drop.x = Math.random() * this.canvas.width;
        drop.y = -drop.size;
        drop.vx = 0.5 - Math.random();
        drop.vy = Math.random() + 0.2;
        drop.life = 0;
        drop.ttl = Math.random() * 500 + 300;
    }
    this.ctx.fillRect(drop.x, drop.y, drop.size, drop.size);
    }
    requestAnimationFrame(() => this.draw());
}
toggleRain() {
    this.isRaining = !this.isRaining;
    if (this.isRaining) {
    requestAnimationFrame(() => this.draw());
    } else {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}
}
const rainEffect = new RainEffect();
const rainToggle = document.getElementById('rainToggle');
rainToggle.addEventListener('click', () => {
    rainEffect.toggleRain();
});