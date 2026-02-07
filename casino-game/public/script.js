import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
scene.fog = new THREE.FogExp2(0x1a1a1a, 0.02);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableDamping = true;
controls.minDistance = 10;
controls.maxDistance = 50;
controls.target.set(0, 5, 0);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

const spotLight = new THREE.SpotLight(0xff00ff, 50);
spotLight.position.set(-10, 10, 0);
spotLight.angle = 0.5;
scene.add(spotLight);

// --- Asset Loading ---
const textureLoader = new THREE.TextureLoader();
const fbxLoader = new FBXLoader();

const reels = []; 
let isSpinning = false;
const reelSpeeds = [0, 0, 0];

// CORRECTED PATHS (Matching your GitHub flat structure)
// Note the spelling differences "pachinko" vs "pachinnko" based on your screenshots
const texColor = textureLoader.load('assets/pachinnko_02.png');
const texMetal = textureLoader.load('assets/pachinko_Metalness.png');
const texRough = textureLoader.load('assets/pachinko_Roughness.png');
const texEmissive = textureLoader.load('assets/pachinnko_EM.png');

// Fix texture encoding
texColor.colorSpace = THREE.SRGBColorSpace;
texEmissive.colorSpace = THREE.SRGBColorSpace;

// Create Material
const machineMaterial = new THREE.MeshStandardMaterial({
    map: texColor,
    metalnessMap: texMetal,
    roughnessMap: texRough,
    emissiveMap: texEmissive,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 2.0,
    metalness: 1.0,
    roughness: 1.0
});

// Load Model (CORRECTED PATH)
fbxLoader.load('assets/pachinko.fbx', (object) => {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('spin-btn').disabled = false;

    object.traverse((child) => {
        if (child.isMesh) {
            child.material = machineMaterial;
            
            // Identify Reels based on FBX structure
            if (child.name.includes('Roll') || child.parent.name.includes('Roll')) {
                const reelObj = child.name.includes('Roll') ? child : child.parent;
                if (!reels.includes(reelObj)) {
                    reels.push(reelObj);
                }
            }
        }
    });

    // Sort reels left-to-right
    reels.sort((a, b) => a.position.x - b.position.x);

    // Scale correction
    object.scale.set(0.1, 0.1, 0.1); 
    object.position.set(0, 0, 0);
    
    scene.add(object);
}, undefined, (error) => {
    console.error(error);
    document.getElementById('loading').innerText = "Error loading model";
});

// --- Game Logic ---
const spinButton = document.getElementById('spin-btn');

spinButton.addEventListener('click', () => {
    if (isSpinning) return;
    startSpin();
});

function startSpin() {
    isSpinning = true;
    spinButton.disabled = true;
    spinButton.innerText = "SPINNING...";

    // Start reels
    reels.forEach((reel, index) => {
        setTimeout(() => {
            reelSpeeds[index] = 0.3 + (Math.random() * 0.1); 
        }, index * 200);
    });

    // Stop reels sequence
    setTimeout(() => { stopReel(0); }, 2000);
    setTimeout(() => { stopReel(1); }, 3000);
    setTimeout(() => { stopReel(2); }, 4000);
}

function stopReel(index) {
    const stopInterval = setInterval(() => {
        reelSpeeds[index] *= 0.95; // Decelerate
        if (reelSpeeds[index] < 0.005) {
            reelSpeeds[index] = 0;
            clearInterval(stopInterval);
            
            if (index === 2) {
                isSpinning = false;
                spinButton.disabled = false;
                spinButton.innerText = "SPIN";
                checkWin();
            }
        }
    }, 50);
}

function checkWin() {
    console.log("Spin Complete - Check logic here");
    // You can add your win/loss logic here later
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate reels
    reels.forEach((reel, index) => {
        reel.rotation.x -= reelSpeeds[index]; 
    });

    controls.update();
    renderer.render(scene, camera);
}

animate();

// Handle Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
