import { EffectComposer } from "https://unpkg.com/three@0.120.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://unpkg.com/three@0.120.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://unpkg.com/three@0.120.0/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OBJLoader } from "https://unpkg.com/three@0.120.0/examples/jsm/loaders/OBJLoader";
import { OrbitControls } from "https://unpkg.com/three@0.120.0/examples/jsm/controls/OrbitControls";

// Используемые текстуры и ссылки (skullmodel больше не нужен)
var cardtemplate = "https://raw.githubusercontent.com/pizza3/asset/master/cardtemplate3.png";
var cardtemplateback = "https://raw.githubusercontent.com/pizza3/asset/master/cardtemplateback4.png";
var flower = "https://raw.githubusercontent.com/pizza3/asset/master/flower3.png";
var noise2 = "https://raw.githubusercontent.com/pizza3/asset/master/noise2.png";
var color11 = "https://raw.githubusercontent.com/pizza3/asset/master/color11.png";
var backtexture = "https://raw.githubusercontent.com/pizza3/asset/master/color3.jpg";
// var skullmodel = "https://raw.githubusercontent.com/pizza3/asset/master/skull5.obj"; // не используется
var voronoi = "https://raw.githubusercontent.com/pizza3/asset/master/rgbnoise2.png";

var scene,
  sceneRTT,
  camera,
  cameraRTT,
  renderer,
  container,
  width = 1301,
  height = window.innerHeight,
  frontmaterial,
  backmaterial,
  controls,
  bloomPass,
  composer,
  frontcard,
  backcard;
var options = {
  exposure: 2.8,
  bloomStrength: 0.8,
  bloomThreshold: 0,
  bloomRadius: 1.29,
  color0: [197, 81, 245],
  color1: [65, 0, 170],
  color2: [0, 150, 255],
  isanimate: false,
};

var gui = new dat.GUI();

var bloom = gui.addFolder("Bloom");
bloom.add(options, "bloomStrength", 0.0, 5.0).name("bloomStrength").listen();
bloom.add(options, "bloomRadius", 0.1, 2.0).name("bloomRadius").listen();
bloom.open();
var color = gui.addFolder("Colors");
color.addColor(options, "color0").name("Border");
color.addColor(options, "color1").name("Base");
color.addColor(options, "color2").name("Eye");
color.open();
var isanim = gui.addFolder("Animate");
isanim.add(options, "isanimate").name("Animate");
isanim.open();

gui.close();

const vert = `
  varying vec2 vUv;
  varying vec3 camPos;
  varying vec3 eyeVector;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    camPos = cameraPosition;
    vNormal = normal;
    vec4 worldPosition = modelViewMatrix * vec4( position, 1.0);
    eyeVector = normalize(worldPosition.xyz - abs(cameraPosition));
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const fragPlane = `
  varying vec2 vUv;
  uniform sampler2D skullrender;
  uniform sampler2D cardtemplate;
  uniform sampler2D backtexture;
  uniform sampler2D noiseTex;
  uniform sampler2D color;
  uniform sampler2D noise;
  uniform vec4 resolution;
  varying vec3 camPos;
  varying vec3 eyeVector;
  varying vec3 vNormal;

  float Fresnel(vec3 eyeVector, vec3 worldNormal) {
    return pow( 1.0 + dot( eyeVector, worldNormal), 1.80 );
  }

  void main() {
    vec2 uv = gl_FragCoord.xy/resolution.xy ;
    vec4 temptex = texture2D( cardtemplate, vUv);
    vec4 skulltex = texture2D( skullrender, uv - 0.5 );
    gl_FragColor = temptex;
    float f = Fresnel(eyeVector, vNormal);
    vec4 noisetex = texture2D( noise, mod(vUv*2.,1.));
    if(gl_FragColor.g >= .5 && gl_FragColor.r < 0.6){
      gl_FragColor = f + skulltex;
      gl_FragColor += noisetex/5.;
    } else {
      vec4 bactex = texture2D( backtexture, vUv);
      float tone = pow(dot(normalize(camPos), normalize(bactex.rgb)), 1.);
      vec4 colortex = texture2D( color, vec2(tone,0.));
      // sparkle code, don't touch this!
      vec2 uv2 = vUv;
      vec3 pixeltex = texture2D(noiseTex,mod(uv*5.,1.)).rgb;      
      float iTime = 1.*0.004;
      uv.y += iTime / 10.0;
      uv.x -= (sin(iTime/10.0)/2.0);
      uv2.y += iTime / 14.0;
      uv2.x += (sin(iTime/10.0)/9.0);
      float result = 0.0;
      result += texture2D(noiseTex, mod(uv*4.,1.) * 0.6 + vec2(iTime*-0.003)).r;
      result *= texture2D(noiseTex, mod(uv2*4.,1.) * 0.9 + vec2(iTime*+0.002)).b;
      result = pow(result, 10.0);
      gl_FragColor *= colortex;
      gl_FragColor += vec4(sin((tone + vUv.x + vUv.y/10.)*10.))/8.;
    }
    gl_FragColor.a = temptex.a;
  }
`;

const fragPlaneback = `
  varying vec2 vUv;
  uniform sampler2D skullrender;
  uniform sampler2D cardtemplate;
  uniform sampler2D backtexture;
  uniform sampler2D noiseTex;
  uniform sampler2D color;
  uniform sampler2D noise;
  uniform vec4 resolution;
  varying vec3 camPos;
  varying vec3 eyeVector;
  varying vec3 vNormal;

  float Fresnel(vec3 eyeVector, vec3 worldNormal) {
    return pow( 1.0 + dot( eyeVector, worldNormal), 1.80 );
  }

  void main() {
    vec2 uv = gl_FragCoord.xy/resolution.xy ;
    vec4 temptex = texture2D( cardtemplate, vUv);
    vec4 skulltex = texture2D( skullrender, vUv );
    gl_FragColor = temptex;
    vec4 noisetex = texture2D( noise, mod(vUv*2.,1.));
    float f = Fresnel(eyeVector, vNormal);

    vec2 uv2 = vUv;
    vec3 pixeltex = texture2D(noiseTex,mod(uv*5.,1.)).rgb;      
    float iTime = 1.*0.004;
    uv.y += iTime / 10.0;
    uv.x -= (sin(iTime/10.0)/2.0);
    uv2.y += iTime / 14.0;
    uv2.x += (sin(iTime/10.0)/9.0);
    float result = 0.0;
    result += texture2D(noiseTex, mod(uv*4.,1.) * 0.6 + vec2(iTime*-0.003)).r;
    result *= texture2D(noiseTex, mod(uv2*4.,1.) * 0.9 + vec2(iTime*+0.002)).b;
    result = pow(result, 10.0);

    vec4 bactex = texture2D( backtexture, vUv);
    float tone = pow(dot(normalize(camPos), normalize(bactex.rgb)), 1.);
    vec4 colortex = texture2D( color, vec2(tone,0.));
    if(gl_FragColor.g >= .5 && gl_FragColor.r < 0.6){
      float tone = pow(dot(normalize(camPos), normalize(skulltex.rgb)), 1.);
      vec4 colortex2 = texture2D( color, vec2(tone,0.));
      if(skulltex.a > 0.2){
        gl_FragColor = colortex;
      } else {
        gl_FragColor = vec4(0.) + f;
        gl_FragColor += noisetex/5.;
      }
      gl_FragColor += noisetex/5.;
    } else {
      // sparkle code, don't touch this!
      gl_FragColor *= colortex;
      gl_FragColor += vec4(sin((tone + vUv.x + vUv.y/10.)*10.))/8.;
    }
  }
`;

const vertskull = `
  varying vec3 vNormal;
  varying vec3 camPos;
  varying vec3 vPosition;
  varying vec2 vUv;
  varying vec3 eyeVector;

  void main() {
    vNormal = normal;
    vUv = uv;
    camPos = cameraPosition;
    vPosition = position;
    vec4 worldPosition = modelViewMatrix * vec4( position, 1.0);
    eyeVector = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;
const fragskull = `
  // ... исходный шейдер для черепа (больше не используется, можно удалить)
`;

// Глобальная переменная для вращающегося изображения (вместо модели-черепа)
var rotatingImage;

function init() {
  container = document.getElementById("world");

  camera = new THREE.PerspectiveCamera(
    30,
    1301 / 2 / window.innerHeight,
    1,
    10000
  );
  camera.position.z = 100;
  cameraRTT = new THREE.PerspectiveCamera(
    30,
    1301 / 2 / window.innerHeight,
    1,
    10000
  );
  cameraRTT.position.z = 30;
  cameraRTT.position.y = -3.5;

  scene = new THREE.Scene();
  sceneRTT = new THREE.Scene();
  renderer = new THREE.WebGLRenderer({ antialias: true, autoSize: true });
  renderer.setPixelRatio(2);
  renderer.setSize(1301 / 2, window.innerHeight);
  renderer.autoClear = false;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.interpolateneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputEncoding = THREE.sRGBEncoding;
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.update();
  document.getElementById("world").appendChild(renderer.domElement);

  var renderScene = new RenderPass(sceneRTT, cameraRTT);
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(1301, window.innerHeight),
    0.7,
    0.4,
    0.85
  );
  composer = new EffectComposer(renderer);
  composer.renderToScreen = false;
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  plane();
  planeback();
  loadskull(); // теперь вместо загрузки модели загружается картинка
  animate();
}

function plane() {
  var geometry = new THREE.PlaneGeometry(20, 30);
  frontmaterial = new THREE.ShaderMaterial({
    uniforms: {
      cardtemplate: {
        type: "t",
        value: new THREE.TextureLoader().load(cardtemplate),
      },
      backtexture: {
        type: "t",
        value: new THREE.TextureLoader().load(backtexture),
      },
      noise: {
        type: "t",
        value: new THREE.TextureLoader().load(noise2),
      },
      skullrender: {
        type: "t",
        value: composer.readBuffer.texture,
      },
      resolution: {
        value: new THREE.Vector2(1301 / 2, window.innerHeight),
      },
      noiseTex: {
        type: "t",
        value: new THREE.TextureLoader().load(voronoi),
      },
      color: {
        type: "t",
        value: new THREE.TextureLoader().load(color11),
      },
    },
    fragmentShader: fragPlane,
    vertexShader: vert,
    transparent: true,
    depthWrite: false,
  });

  frontcard = new THREE.Mesh(geometry, frontmaterial);
  scene.add(frontcard);
}

function planeback() {
  var geometry = new THREE.PlaneGeometry(20, 30);
  backmaterial = new THREE.ShaderMaterial({
    uniforms: {
      cardtemplate: {
        type: "t",
        value: new THREE.TextureLoader().load(cardtemplateback),
      },
      backtexture: {
        type: "t",
        value: new THREE.TextureLoader().load(backtexture),
      },
      noise: {
        type: "t",
        value: new THREE.TextureLoader().load(noise2),
      },
      skullrender: {
        type: "t",
        value: new THREE.TextureLoader().load(flower),
      },
      resolution: {
        value: new THREE.Vector2(1301 / 2, window.innerHeight),
      },
      noiseTex: {
        type: "t",
        value: new THREE.TextureLoader().load(voronoi),
      },
      color: {
        type: "t",
        value: new THREE.TextureLoader().load(color11),
      },
    },
    fragmentShader: fragPlaneback,
    vertexShader: vert,
    transparent: true,
    depthWrite: false,
  });
  backcard = new THREE.Mesh(geometry, backmaterial);
  backcard.rotation.set(0, Math.PI, 0);
  scene.add(backcard);
}

/* 
  Функция loadskull() была изменена: вместо загрузки 3D-модели теперь создаётся
  плоскость с текстурой, загружаемой из файла static/images/azula.png.
*/
function loadskull() {
  const texture = new THREE.TextureLoader().load('static/images/azula.png');
  const geometry = new THREE.PlaneGeometry(20, 30);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  rotatingImage = new THREE.Mesh(geometry, material);
  rotatingImage.position.set(0, 0, -10);
  sceneRTT.add(rotatingImage);
}

var matrix = new THREE.Matrix4();
var period = 5;
var clock = new THREE.Clock();

function updateDraw(deltaTime) {
  if (options.isanimate) {
    matrix.makeRotationY((clock.getDelta() * 0.7 * Math.PI) / period);
    camera.position.applyMatrix4(matrix);
    camera.lookAt(frontcard.position);
  }

  bloomPass.threshold = options.bloomThreshold;
  bloomPass.strength = options.bloomStrength;
  bloomPass.radius = options.bloomRadius;

  // Вращаем изображение вокруг оси Y
  if (rotatingImage) {
    rotatingImage.rotation.y += 0.01;
  }
}

function animate(deltaTime) {
  requestAnimationFrame(animate);
  updateDraw(deltaTime);
  composer.render();
  renderer.render(scene, camera);
}

function handleResize() {
  camera.aspect = 1301 / 2 / window.innerHeight;
  camera.updateProjectionMatrix();
  frontcard.material.uniforms.resolution.value = new THREE.Vector2(
    1301 / 2,
    window.innerHeight
  );
  renderer.setPixelRatio(2);
  renderer.setSize(1301 / 2, window.innerHeight);
}
window.addEventListener("load", init, false);
window.addEventListener("resize", handleResize, false);
