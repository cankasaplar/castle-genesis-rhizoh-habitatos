import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x87CEEB); // Sky blue background
document.body.appendChild(renderer.domElement);

// Add orbit controls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Castle dimensions
const castleWidth = 20;
const castleLength = 20;
const castleHeight = 10;
const towerHeight = 15;
const towerRadius = 2;

// Castle main structure
const castleGeometry = new THREE.BoxGeometry(castleWidth, castleHeight, castleLength);
const castleMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x8B4513,
    wireframe: false
});
const castle = new THREE.Mesh(castleGeometry, castleMaterial);
scene.add(castle);

// Create towers
const towerPositions = [
    { x: castleWidth/2, z: castleLength/2 },
    { x: -castleWidth/2, z: castleLength/2 },
    { x: castleWidth/2, z: -castleLength/2 },
    { x: -castleWidth/2, z: -castleLength/2 }
];

const towerMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x8B4513,
    wireframe: false
});
towerPositions.forEach(position => {
    const towerGeometry = new THREE.CylinderGeometry(towerRadius, towerRadius, towerHeight, 16);
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(position.x, towerHeight/2, position.z);
    scene.add(tower);
});

// Create rooms (represented as cubes inside the castle)
const roomSize = 2;
const roomMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xCD853F,
    wireframe: false
});
const rooms = [];

for (let x = -castleWidth/2 + roomSize; x < castleWidth/2; x += roomSize * 2) {
    for (let z = -castleLength/2 + roomSize; z < castleLength/2; z += roomSize * 2) {
        const roomGeometry = new THREE.BoxGeometry(roomSize, roomSize, roomSize);
        const room = new THREE.Mesh(roomGeometry, roomMaterial);
        room.position.set(x, roomSize/2, z);
        rooms.push(room);
        scene.add(room);
    }
}

// Create entry (arch)
const entryGeometry = new THREE.BoxGeometry(4, 6, 2);
const entryMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x8B4513,
    wireframe: false
});
const entry = new THREE.Mesh(entryGeometry, entryMaterial);
entry.position.set(0, 3, castleLength/2);
scene.add(entry);

// Add a ground plane
const groundGeometry = new THREE.PlaneGeometry(100, 100);
const groundMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x228B22,
    side: THREE.DoubleSide
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.5;
scene.add(ground);

// Camera position
camera.position.set(30, 30, 30);
camera.lookAt(0, 0, 0);

// Animation
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate(); 