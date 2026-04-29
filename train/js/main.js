class TrainSimulator {
    constructor() {
        this.mapManager = new MapManager();
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.train = null;
        this.animationFrame = null;
        this.isAnimating = false;
    }

    init() {
        // Initialize map
        this.mapManager.init();

        // Setup Three.js scene
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById('train-container').appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 1, 0);
        this.scene.add(directionalLight);

        // Setup camera
        this.camera.position.set(0, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Create train
        this.train = new Train(this.scene);

        // Add event listeners
        document.getElementById('start-journey').addEventListener('click', () => this.startJourney());
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();
    }

    async startJourney() {
        const startLocation = document.getElementById('start-location').value;
        const endLocation = document.getElementById('end-location').value;

        if (!startLocation || !endLocation) {
            alert('Please enter both start and end locations');
            return;
        }

        try {
            // Get coordinates from addresses (you would need to implement geocoding)
            const startCoords = await this.geocodeAddress(startLocation);
            const endCoords = await this.geocodeAddress(endLocation);

            // Get route
            const route = await this.mapManager.getRoute(startCoords, endCoords);
            if (route) {
                this.isAnimating = true;
                this.animateTrain();
            }
        } catch (error) {
            console.error('Error starting journey:', error);
            alert('Error getting route. Please try again.');
        }
    }

    async geocodeAddress(address) {
        // This is a placeholder. You would need to implement proper geocoding
        // For now, we'll use some example coordinates
        return [-74.006, 40.7128]; // Example: New York coordinates
    }

    animateTrain() {
        if (!this.isAnimating) return;

        const currentPos = this.mapManager.getCurrentPosition();
        const nextPos = this.mapManager.moveToNextPosition();
        
        if (currentPos && nextPos) {
            // Convert coordinates to Three.js world space
            const position = this.convertCoordinatesToWorldSpace(currentPos);
            const bearing = this.mapManager.getBearing(currentPos, nextPos);
            
            // Update train position and rotation
            this.train.updatePosition(position);
            this.train.updateRotation((bearing * Math.PI) / 180);
        }

        this.animationFrame = requestAnimationFrame(() => this.animateTrain());
    }

    convertCoordinatesToWorldSpace(coords) {
        // Convert map coordinates to Three.js world space
        // This is a simplified conversion - you might need to adjust based on your needs
        return {
            x: (coords[0] - this.mapManager.map.getCenter().lng) * 100,
            y: 0,
            z: (coords[1] - this.mapManager.map.getCenter().lat) * 100
        };
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the simulator when the page loads
window.addEventListener('load', () => {
    const simulator = new TrainSimulator();
    simulator.init();
}); 