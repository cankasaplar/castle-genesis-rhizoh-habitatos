class MapManager {
    constructor() {
        this.map = null;
        this.route = null;
        this.currentPosition = 0;
        this.animationFrame = null;
    }

    init() {
        // TODO: Replace this with your actual Mapbox token
        // Get your token from: https://account.mapbox.com/
        mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace this line with your token
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [0, 0],
            zoom: 2
        });

        this.map.on('load', () => {
            this.map.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                }
            });

            this.map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 3
                }
            });
        });
    }

    async getRoute(start, end) {
        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
            );
            const data = await response.json();
            this.route = data.routes[0].geometry.coordinates;
            
            // Update the route on the map
            this.map.getSource('route').setData({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: this.route
                }
            });

            // Fit map to route bounds
            const bounds = this.route.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(this.route[0], this.route[0]));

            this.map.fitBounds(bounds, {
                padding: 50
            });

            return this.route;
        } catch (error) {
            console.error('Error getting route:', error);
            return null;
        }
    }

    getCurrentPosition() {
        if (!this.route) return null;
        return this.route[this.currentPosition];
    }

    moveToNextPosition() {
        if (!this.route) return null;
        this.currentPosition = (this.currentPosition + 1) % this.route.length;
        return this.getCurrentPosition();
    }

    getBearing(current, next) {
        if (!current || !next) return 0;
        const startLat = current[1];
        const startLng = current[0];
        const destLat = next[1];
        const destLng = next[0];

        const startLatRad = startLat * Math.PI / 180;
        const destLatRad = destLat * Math.PI / 180;
        const deltaLng = (destLng - startLng) * Math.PI / 180;

        const y = Math.sin(deltaLng) * Math.cos(destLatRad);
        const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
            Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(deltaLng);
        const bearing = Math.atan2(y, x) * 180 / Math.PI;
        return (bearing + 360) % 360;
    }
} 