class Train {
    constructor(scene) {
        this.scene = scene;
        this.trainGroup = new THREE.Group();
        this.wagons = [];
        this.createTrain();
    }

    createTrain() {
        // Create locomotive
        const locomotive = this.createLocomotive();
        this.trainGroup.add(locomotive);

        // Create 8 wagons
        for (let i = 0; i < 8; i++) {
            const wagon = this.createWagon();
            wagon.position.x = -((i + 1) * 2.5); // Position wagons behind locomotive
            this.wagons.push(wagon);
            this.trainGroup.add(wagon);
        }

        this.scene.add(this.trainGroup);
    }

    createLocomotive() {
        const group = new THREE.Group();

        // Main body
        const bodyGeometry = new THREE.BoxGeometry(3, 1.5, 1.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        // Cabin
        const cabinGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
        const cabinMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 1.25;
        group.add(cabin);

        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 32);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

        for (let i = 0; i < 4; i++) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.y = -0.75;
            wheel.position.x = -1 + (i * 0.7);
            group.add(wheel);
        }

        return group;
    }

    createWagon() {
        const group = new THREE.Group();

        // Wagon body
        const bodyGeometry = new THREE.BoxGeometry(2, 1.2, 1.2);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x4444ff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 32);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

        for (let i = 0; i < 4; i++) {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.y = -0.6;
            wheel.position.x = -0.8 + (i * 0.5);
            group.add(wheel);
        }

        return group;
    }

    updatePosition(position) {
        this.trainGroup.position.set(position.x, position.y, position.z);
    }

    updateRotation(rotation) {
        this.trainGroup.rotation.y = rotation;
    }
} 