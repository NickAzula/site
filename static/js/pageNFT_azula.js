import { EffectComposer } from "https://unpkg.com/three@0.120.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.120.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.120.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OrbitControls } from "https://unpkg.com/three@0.120.0/examples/jsm/controls/OrbitControls.js";
import * as dat from "https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js";

// Глобальные переменные
let scene, camera, renderer, composer, bloomPass;
let cardMesh, particleSystem;
let clock = new THREE.Clock();

const gui = new dat.GUI();
const params = {
    bloomStrength: 0.5,
    bloomRadius: 0.5,
    bloomThreshold: 0.0,
};
gui.add(params, "bloomStrength", 0.0, 2.0).name("Bloom Strength");
gui.add(params, "bloomRadius", 0.0, 1.0).name("Bloom Radius");
gui.add(params, "bloomThreshold", 0.0, 1.0).name("Bloom Threshold");
gui.close();

// Vertex Shader – просто передаёт uv-координаты
const vertexShader = `
    varying vec2 vUv;
    void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fragment Shader – накладывает изображение Азулы и эффекты:
// • Горящая рамка с огнём (пульсирует и мерцает шумом)
// • Искры, поднимающиеся вверх
// • Молнии – случайные яркие вспышки (белые)
const fragmentShader = `
    uniform sampler2D azulaTex;
    uniform float time;
    varying vec2 vUv;

    // Функция случайного шума
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    // Функция шума (2D)
    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    void main(){
        // Базовый цвет – текстура с изображением Азулы
        vec4 baseColor = texture2D(azulaTex, vUv);
        
        // Эффект горящей рамки:
        // Вычисляем расстояние до ближайшего края UV (чем меньше — тем сильнее эффект)
        float borderDist = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float flameMask = smoothstep(0.12, 0.08, borderDist);
        // Фликер огня с использованием шума и времени
        float flameFlicker = noise(vUv * 20.0 + time * 2.0);
        vec3 flameColor = vec3(0.0, 0.3, 1.0); // Синий цвет пламени
        vec3 colorFlame = mix(baseColor.rgb, flameColor, flameMask * flameFlicker);
        
        // Эффект искр:
        // Если верхняя часть карточки (vUv.y > 0.8), генерируем редкие яркие вспышки
        float spark = 0.0;
        if(vUv.y > 0.8){
            float sparkNoise = noise(vec2(vUv.x * 200.0, (vUv.y - time * 2.0)));
            spark = step(0.95, sparkNoise);
        }
        vec3 sparkColor = vec3(0.8, 0.8, 1.0); // Голубые искры
        
        // Эффект молний:
        // Периодически появляются белые вспышки по всему изображению
        float lightning = step(0.998, noise(vec2(vUv.x * 300.0, time * 10.0))) *
                            smoothstep(0.0, 0.5, 1.0 - abs(vUv.x - 0.5));
        vec3 lightningColor = vec3(1.0);
        
        // Итоговое смешение эффектов:
        vec3 finalColor = colorFlame;
        finalColor += spark * sparkColor;
        finalColor += lightning * lightningColor;
        
        gl_FragColor = vec4(finalColor, baseColor.a);
    }
`;

// Функция инициализации сцены
function init() {
    const container = document.getElementById("world");
    container.style.width = "120vw";
    container.style.height = "100vh";
    container.style.backgroundColor = "#000";
    
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 0, 60);
    scene.add(camera);
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    
    // Настройка EffectComposer для bloom-эффекта (легкое свечение огня)
    const renderPass = new RenderPass(scene, camera);
    bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight),
                                    params.bloomStrength, params.bloomRadius, params.bloomThreshold);
    composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    
    // Создаём карточку
    createCard();
    
    // Создаём систему частиц для искр
    createParticles();
    
    window.addEventListener("resize", onWindowResize, false);
    
    animate();
}

// Функция создания карточки с изображением Азулы и огнёнными эффектами
function createCard() {
    const textureLoader = new THREE.TextureLoader();
    const azulaTexture = textureLoader.load("static/images/azula.png");
    
    const cardMaterial = new THREE.ShaderMaterial({
        uniforms: {
            azulaTex: { value: azulaTexture },
            time: { value: 0.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    
    const geometry = new THREE.PlaneGeometry(30, 30);
    cardMesh = new THREE.Mesh(geometry, cardMaterial);
    cardMesh.position.set(0, 0, 0);
    scene.add(cardMesh);
}

// Функция создания системы частиц для искр
function createParticles() {
    const particleCount = 0;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

        colors[i * 3] = 0.8; // Голубой цвет
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 1.0;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    particleSystem = new THREE.Points(particles, particleMaterial);
    scene.add(particleSystem);
}

// Анимация – обновляем uniform "time" и рендерим сцену через composer
function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    if(cardMesh && cardMesh.material.uniforms) {
        cardMesh.material.uniforms.time.value = elapsed;
    }

    // Анимация частиц (искры поднимаются вверх)
    if (particleSystem) {
        const positions = particleSystem.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
            positions[i] += 0.1; // Поднимаем частицы вверх
            if (positions[i] > 15) {
                positions[i] = -15; // Возвращаем частицы вниз
            }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    composer.render();
}

// Обработка изменения размеров окна
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("load", init, false);