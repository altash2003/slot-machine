import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);
// Add some fog for depth
scene.fog = new THREE.FogExp2(0x1a1a1a, 0.02);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 30); // Adjusted viewing angle

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

const reels = []; // Will store the reel objects here
let isSpinning = false;
const reelSpeeds = [0, 0, 0];

// Load Textures
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

// Load Model
fbxLoader.load('assets/pachinko.fbx', (object) => {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('spin-btn').disabled = false;

    object.traverse((child) => {
        if (child.isMesh) {
            child.material = machineMaterial;
            
            // Identify Reels based on your FBX dump data
            // The dump showed "Roll", "Roll1", "Roll2"
            if (child.name.includes('Roll') || child.parent.name.includes('Roll')) {
                // If the mesh itself is the roll or its parent is
                const reelObj = child.name.includes('Roll') ? child : child.parent;
                // Avoid duplicates
                if (!reels.includes(reelObj)) {
                    reels.push(reelObj);
                }
            }
        }
    });

    // Sort reels by X position to ensure left-to-right spinning order
    reels.sort((a, b) => a.position.x - b.position.x);

    // Scale correction (FBX often comes in very small or very large)
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

    // Start reels one by one
    reels.forEach((reel, index) => {
        setTimeout(() => {
            reelSpeeds[index] = 0.3 + (Math.random() * 0.1); // Random speed
        }, index * 200);
    });

    // Stop reels one by one
    setTimeout(() => { stopReel(0); }, 2000);
    setTimeout(() => { stopReel(1); }, 3000);
    setTimeout(() => { stopReel(2); }, 4000);
}

function stopReel(index) {
    // Determine a "snap" angle (assuming 8 icons usually, or 360 degrees)
    // We gradually slow down the speed
    const stopInterval = setInterval(() => {
        reelSpeeds[index] *= 0.95; // Decelerate
        if (reelSpeeds[index] < 0.005) {
            reelSpeeds[index] = 0;
            clearInterval(stopInterval);
            
            // Check if all stopped
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
    // In a real casino, logic is server-side. 
    // Here we just visually stop. 
    // You can calculate rotation % 360 to find the visible symbol.
    console.log("Spin Complete");
}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate reels based on current speeds
    reels.forEach((reel, index) => {
        // Adjust axis based on model orientation (usually X)
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