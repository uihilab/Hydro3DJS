import { V as Vector3, M as MathUtils, L as Loader, S as Scene, a as Mesh, B as BoxGeometry, b as MeshNormalMaterial, S, V } from './vendor-1d496b00.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as Utils from './utils.js';

import { waterVertexShader, waterFragmentShader } from '../shaders/water_shader.js';

/**
 * Hydro3DJS: Main library class for 3D hydrological visualization and simulation.
 * Provides scene management, water, rain, and object handling for Hydro3DJS projects.
 */

/**
 * Returns a random point inside a polygon (GeoJSON format)
 * @param {Object} geojson - GeoJSON polygon
 * @returns {Array} [x, y] random point inside polygon
 */
function randomPointInPolygon(geojson) {
    const polygon = geojson.coordinates[0];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    polygon.forEach(([x, y]) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    });

    let randomPoint;
    do {
        randomPoint = [
            Math.random() * (maxX - minX) + minX,
            Math.random() * (maxY - minY) + minY,
        ];
    } while (!pointInPolygon(randomPoint, polygon));

    return randomPoint;
}

/**
 * Checks if a point is inside a polygon using ray-casting algorithm
 * @param {Array} point - [x, y]
 * @param {Array} polygon - Array of [x, y] points
 * @returns {boolean}
 */
function pointInPolygon(point, polygon) {
    const x = point[0];
    const y = point[1];
    let isInside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0];
        const yi = polygon[i][1];
        const xj = polygon[j][0];
        const yj = polygon[j][1];

        const intersect =
            yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) {
            isInside = !isInside;
        }
    }

    return isInside;
}

/**
 * Main Hydro3DJS controller for managing objects, water, and rain in the scene.
 */
export class Hydro3DJS {
    constructor({ mapOptions = null, map = null, scene = null, ui = null, gui = null }) {
        this.mapCenter = Utils.latLngToVector3(mapOptions.center);
        this.map = map;
        this.ui = ui;
        this.scene = scene;
        this.objects = [];
        this.water = [];
        this.waterCombined = [];
        this.rain;
        this.highlightCenterObject = true;
        this.centerObj;
        this.highlightCenter(this.highlightCenterObject);
    }
    /**
     * Change the map center and update the highlight object
     */
    changeMapCenter(lat, lng, callback) {
        this.mapCenter = Utils.latLngToVector3({ lng: lng, lat: lat });
        this.map.setOptions({ center: { lng: lng, lat: lat } });
        this.highlightCenter(this.highlightCenterObject);

        if (callback) {
            callback();
        }
    }
    /**
     * Highlight or remove the center object
     */
    highlightCenter(highlight) {
        this.highlightCenterObject = highlight;

        if (highlight) {
            if (this.centerObj) {
                this.centerObj.remove();
            }
        }
        else {
            this.centerObj.remove();
        }
    }
    /**
     * Check if an object is flooded by any water polygon
     */
    checkIfFlooded(object, waterObj) {
        try {
            for (let i = 0; i < this.waterCombined.length; i++) {
                var pt = turf.point([object.lng, object.lat]);
                var poly = turf.polygon(this.waterCombined[i].coordinates);

                if (turf.booleanPointInPolygon(pt, poly)) {
                    return "flooded";
                }
            }
            return "not flooded";
        } catch (error) {
            console.log("There is no water object");
            console.log(error);
        }
    }
    printCenterObj() {
        console.log(this.centerObj);
    }
    /**
     * Add an icon object to the scene
     */
    addIcon(name, dir) {
        var object = new Icon({
            name: name, scene: this.scene,
            mapCenter: this.mapCenter, ui: this.ui,
            dir: dir, gui: this.gui
        });
        this.objects.push(object);
        return object;
    }
    /**
     * Add a water object to the scene
     */
    addWater(g, preProcessed = false, alpha = 1.0) {
        const geometry = [_.cloneDeep(g[0])]
        const geometry2 = [_.cloneDeep(g[0])]
        let waterObj;

        this.waterCombined.push(geometry2[0]);

        if (geometry[0].type == "MultiPolygon") {
            waterObj = [];
            for (let i = 0; i < 20; i++) {
                const newWater = new WaterObject({
                    geometry: [{ "type": "Polygon", "coordinates": [geometry[0].coordinates[0][i]] }],
                    scene: this.scene, mapCenter: this.mapCenter, ui: this.ui,
                    preProcessed: preProcessed, alpha: alpha
                });
                waterObj.push(newWater);
                this.water.push(newWater);
            }
        }
        else {
            waterObj = new WaterObject({
                geometry: geometry,
                scene: this.scene, mapCenter: this.mapCenter, ui: this.ui,
                preProcessed: preProcessed, alpha: alpha
            });
            this.water.push(waterObj);
        }
        return waterObj;
    }
    /**
     * Add a rain object to the scene
     */
    addRain() {
        var object = new RainObject({
            scene: this.scene, mapCenter: this.mapCenter,
        });
        this.objects.push(object);
        return object;
    }
    /**
     * Add a wind turbine object to the scene
     */
    addTurbine(name, dir) {
        var object = new Object({
            name: name, scene: this.scene,
            mapCenter: this.mapCenter,
            dir: dir, anim: Utils.turbineAnim,
        });
        this.objects.push(object);
        return object;
    }
    /**
     * Add a boat that follows a path
     */
    addTravelBoat(name, dir) {
        var object = new Object({
            name: name, scene: this.scene,
            mapCenter: this.mapCenter,
            dir: dir, anim: Utils.pathAnim
        });
        this.objects.push(object);
        return object;
    }
    /**
     * Add a static (bobbing) boat
     */
    addStaticBoat(name, dir) {
        var object = new Object({
            name: name, scene: this.scene,
            mapCenter: this.mapCenter,
            dir: dir, anim: Utils.boatAnim
        });
        this.objects.push(object);
        return object;
    }
    /**
     * Add a generic 3D model
     */
    addModel(name, dir) {
        var object = new Object({
            name: name, scene: this.scene,
            mapCenter: this.mapCenter, ui: this.ui,
            dir: dir, gui: this.gui
        });
        this.objects.push(object);
        return object;
    }
    setUserData(data = {}) {
        console.log("setUserData");
    }

    /**
     * Animate all water and object instances
     */
    animate(time, camPos) {
        this.water.forEach(function (item) {
            item.animate(time, camPos);
        });
        this.objects.forEach(function (item) {
            item.animate(time);
        });
    }
}

/**
 * Generic 3D object (model, boat, turbine, etc.)
 */
export class Object {
    constructor({ name = null, scene = null, mapCenter = null, anim = Utils.modelAnim,
        dir = null, }) {
        this.name = name;
        this.scene = scene;
        this.mapCenter = mapCenter;
        this.anim = anim;
        this.dir = dir;

        this.gltfLoader = new GLTFLoader();
        this.model = null;

        this.pos = new THREE.Vector3(0, 0, 0);
        this.rot = new THREE.Vector3(0, 0, 0);
        this.scale = 1;

        this.moving = false;
        this.rotating = false;

        this.path_a = 1;
        this.path_b = 1;
        this.vel = 1;

        this.rot_x = 0;
        this.rot_y = 0;
        this.rot_z = 0;

        this.preload();
    }
    /**
     * Set position using longitude and latitude
     */
    setPosWLngLat(lng, lat) {
        const vectorNums = Utils.latLngNumToVector3(lat, lng)
        this.pos = new THREE.Vector3(vectorNums.x - this.mapCenter.x, 0, vectorNums.z - this.mapCenter.z);
    }
    /**
     * Get position as longitude and latitude
     */
    getPosWLngLat() {
        const vectorNums = Utils.vector3ToLatLng(new THREE.Vector3(this.pos.x + this.mapCenter.x, 0, this.pos.z + this.mapCenter.z));
        return { lat: vectorNums.lat, lng: vectorNums.lng };
    }
    setPos(pos_x, pos_y, pos_z) {
        this.pos = new THREE.Vector3(pos_x, pos_y, pos_z);
    }
    setRot(rot_x, rot_y, rot_z) {
        this.rot_x = rot_x;
        this.rot_y = rot_y;
        this.rot_z = rot_z;
    }
    setScale(scale) {
        this.scale = scale;
    }
    setPath(path_a, path_b, vel) {
        this.path_a = path_a;
        this.path_b = path_b;
        this.vel = vel;
    }
    /**
     * Remove the object from the scene
     */
    remove() {
        try {
            if (this.model) {
                this.model.parent.remove(this.model);
            }
            else {
                setTimeout(() => {
                    this.model.parent.remove(this.model);
                }, 1000);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    /**
     * Load the GLTF model and add to the scene
     */
    preload() {
        this.gltfLoader.load(this.dir, (gltf) => {
            this.model = gltf.scene;
            this.model.traverse((o) => {
                if (o.name == 'water') {
                    o.removeFromParent();
                }
                if (this.name == 'tornado' && o.isMesh) {
                    o.material.opacity = 0.8;
                }
            });
            this.model.name = this.name;
            this.model.renderOrder = 1;
            this.scene.add(this.model);
        });
        return true;
    }
    /**
     * Animate the object (position, rotation, scale, and custom animation)
     */
    animate(time) {
        if (this.model) {
            this.model.position.copy(this.pos).add(this.mapCenter);
            this.model.rotation.set(this.rot_x, this.rot_y, this.rot_z);
            this.model.scale.set(this.scale, this.scale, this.scale);
            this.data = {
                path_a: this.path_a,
                path_b: this.path_b, vel: this.vel
            };
            this.anim(this.data, this.model, time);
        }
    }
}

/**
 * Icon object (sprite-based, e.g. for markers)
 */
export class Icon {
    constructor({ name = null, scene = null, mapCenter = null, anim = Utils.modelAnim,
        dir = null, }) {
        this.name = name;
        this.scene = scene;
        this.mapCenter = mapCenter;
        this.anim = anim;
        this.dir = dir;

        this.gltfLoader = new GLTFLoader();
        this.model = null;

        this.pos = new THREE.Vector3(0, 0, 0);
        this.rot = new THREE.Vector3(0, 0, 0);
        this.scale = 1;

        this.moving = false;
        this.rotating = false;

        //travel boat
        this.path_a = 1;
        this.path_b = 1;
        this.vel = 1;

        this.preload();
    }
    /**
     * Set position using longitude and latitude (after)
     */
    setPosWLngLat(lng, lat) {
        const vectorNums = Utils.latLngNumToVector3(lng, lat)
        this.pos = new THREE.Vector3(vectorNums.x - this.mapCenter.x, 0, vectorNums.z - this.mapCenter.z);
    }
    /**
     * Set position using x, y, z (before)
     */
    setPos(pos_x, pos_y, pos_z) {
        this.pos = new THREE.Vector3(pos_x, pos_y, pos_z);
    }
    setRot(rot_x, rot_y, rot_z) {
        this.rot = new THREE.Vector3(rot_x, rot_y, rot_z);
    }
    setScale(scale) {
        this.scale = scale;
    }
    setPath(path_a, path_b, vel) {
        this.path_a = path_a;
        this.path_b = path_b;
        this.vel = vel;
    }
    /**
     * Remove the icon from the scene
     */
    remove() {
        try {
            if (this.model) {
                this.model.parent.remove(this.model);
            }
            else {
                setTimeout(() => {
                    this.model.parent.remove(this.model);
                }, 1000);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    /**
     * Load a sprite as the icon and add to the scene
     */
    preload() {
        var crateTexture = THREE.ImageUtils.loadTexture('crate.png');
        var crateMaterial = new THREE.SpriteMaterial({ map: crateTexture, useScreenCoordinates: false, color: 0xff0000 });
        var sprite = new THREE.Sprite(crateMaterial);
        sprite.position.set(-100, 50, 0);
        sprite.scale.set(64, 64, 1.0); // imageWidth, imageHeight
        this.model = sprite;
        this.model.name = this.name;
        this.scene.add(this.model);
        return true;
    }
    /**
     * Animate the icon (position and scale)
     */
    animate(time) {
        if (this.model) {
            this.model.position.copy(this.pos).add(this.mapCenter);
            this.model.scale.set(this.scale, this.scale, this.scale);
        }
    }
}

/**
 * Water surface object with animated shader and environment mapping
 */
export class WaterObject {
    constructor({ geometry = null, scene = null, mapCenter = null, ui = null, preProcessed = null, alpha = null }) {
        this.geometry = geometry;
        this.scene = scene;
        this.mapCenter = mapCenter;
        this.ui = ui.getVariableByName(this.name);
        this.preProcessed = preProcessed;
        this.alpha = alpha;

        this.gltfLoader = new GLTFLoader();
        this.water = null;
        this.water_geometries = null;
        this.envMap = null;
        this.water_controls = ui.getVariableByName('water_controls');
        this.preload();
    }
    /**
     * Preload water geometry and material, add to scene
     */
    preload() {
        if (this.preProcessed) {
            this.water_geometries = [this.geometry];
        }
        else {
            this.water_geometries = Utils.generate_water_geos(this.geometry, this.mapCenter);
        }
        var r = './textures/cube/mountain1/';
        var urls = ['posx.jpg', 'negx.jpg',
            'posy.jpg', 'negy.jpg',
            'posz.jpg', 'negz.jpg'];

        this.envMap = new THREE.CubeTextureLoader().setPath(r).load(urls);
        var material = new THREE.ShaderMaterial({
            uniforms: {
                normalSampler: {
                    value: new THREE.TextureLoader().load('./textures/waternormals2.jpg',
                        function (texture) {
                            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                        })
                },
                sunDirection: { value: new THREE.Vector3(0, -0.5, 0).normalize() },
                sunColor: { value: new THREE.Color(0xffffff) },
                waterColor: { value: new THREE.Color(0x006994) },
                distortionScale: { value: 5.7 },
                envMap: { value: this.envMap },
                shiny: { value: this.water_controls.shiny },
                spec: { value: this.water_controls.spec },
                diffuse: { value: this.water_controls.diffuse },
                rf0: { value: this.water_controls.rf0 },
                time: { value: 0 },
                eye: { value: new THREE.Vector3(0.0) },
                size: { value: 0 },
                alpha: { value: this.alpha }
            },
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader
        });
        material.transparent = true;
        var water_level = this.water_controls.level;
        this.water = new Mesh(
            this.water_geometries[water_level - 1],
            material
        );

        this.water.name = "water";
        this.water.position.copy(this.mapCenter);
        this.water.renderOrder = 1;
        this.water.frustumCulled = false;
        this.scene.add(this.water);
    }
    /**
     * Remove the water mesh from the scene
     */
    remove() {
        try {
            if (this.water) {
                this.water.geometry.dispose();
                this.water.material.dispose();
                this.scene.remove(this.water);
            }
            else {
                setTimeout(() => {
                    this.water.parent.remove(this.water);
                }, 1000);
            }
        }
        catch (err) {
            console.log(err);
        }
    }
    /**
     * Animate the water mesh (update shader uniforms)
     */
    animate(time, camPos) {
        if (this.water) {
            var ui_level = this.water_controls.level;
            this.water.geometry = this.water_geometries[ui_level - 1];
            var water_controls = this.water_controls;
            var envMap = this.envMap;
            this.water.traverse(function (child) {
                if (child.isMesh) {
                    child.material.uniforms['time'].value = time;
                    child.material.uniforms['eye'].value = camPos;
                    child.material.uniforms['size'].value = water_controls.textSize;
                    child.material.uniforms['waterColor'].value = new THREE.Color(water_controls.waterColor);
                    child.material.uniforms['shiny'].value = water_controls.shiny;
                    child.material.uniforms['spec'].value = water_controls.spec;
                    child.material.uniforms['diffuse'].value = water_controls.diffuse;
                    child.material.uniforms['rf0'].value = water_controls.rf0;
                    child.material.uniforms['envMap'].value = envMap
                }
            });
        }
    }
}

/**
 * Rain particle system object
 */
export class RainObject {
    constructor({ scene = null, mapCenter = null }) {
        this.scene = scene;
        this.mapCenter = mapCenter;
        this.rain_objects = [];

        this.pos = new THREE.Vector3();

        this.scale = 0;
        this.vel = 0;
        this.num = 0;
        this.is_rain = true;
        this.wind_x = 0;
        this.wind_y = 0;

        this.lineList = [];
    }
    /**
     * Preload rain lines and add to scene
     */
    preload() {
        const rain_material = new THREE.LineBasicMaterial({
            color: 0xaaaaaa
        });
        var rain_num = this.num;
        for (let i = 0; i < rain_num; i++) {
            const rain_points = [];
            var p1 = new THREE.Vector3(0, 0, 0);
            p1.add(new THREE.Vector3(1000 * Math.random() - 500, 0, 1000 * Math.random() - 500));
            rain_points.push(p1);
            var p2 = new THREE.Vector3();
            p2.copy(p1).add(new THREE.Vector3(0, 0, 0));
            rain_points.push(p2);
            const rain_geometry = new THREE.BufferGeometry().setFromPoints(rain_points);
            const line = new THREE.Line(rain_geometry, rain_material);
            line.position.copy(this.mapCenter);
            this.rain_objects.push(line);
            this.scene.add(line);
            this.lineList.push(line);
        }
    }
    /**
     * Remove a percentage of rain lines from the scene
     */
    remove(per = 1) {
        for (let i = 0; i < Math.floor(this.lineList.length * per); i++) {
            this.lineList[i].parent.remove(this.lineList[i]);
        }
    }
    /**
     * Set rain parameters and initialize
     */
    setParam(pol,
        scale, vel, num, is_rain, wind_x, wind_y) {
        this.polygon = pol;
        this.scale = scale;
        this.vel = vel;
        this.num = num;
        this.is_rain = is_rain;
        this.wind_x = wind_x;
        this.wind_y = wind_y;
        this.preload();
    }
    /**
     * Animate the rain lines (falling and wind motion)
     */
    animate() {
        var rain_height = 3701;
        for (let i = 0; i < this.rain_objects.length; i++) {
            var rain_object = this.rain_objects[i];
            var positions = rain_object.geometry.attributes.position.array;
            positions[1] -= this.vel;
            var wind_x = this.wind_x;
            var wind_y = this.wind_y;
            if (this.is_rain) {
                positions[4] = positions[1] + 30;
                positions[0] += wind_x;
                positions[3] += wind_x;
                positions[2] += wind_y;
                positions[5] += wind_y;
            }
            else {
                positions[4] = positions[1] + 3;
                positions[0] += wind_x;
                positions[3] += wind_x;
                positions[2] += wind_y;
                positions[5] += wind_y;
            }
            if (positions[1] < 0 || positions[4] < 0) {
                const randomPoint = randomPointInPolygon(this.polygon);
                const vectorNums = Utils.latLngNumToVector3(randomPoint[1], randomPoint[0])
                var pos = new THREE.Vector3(vectorNums.x - this.mapCenter.x, 0, vectorNums.z - this.mapCenter.z);
                positions[0] = pos.x + wind_x;
                positions[3] = pos.x;
                positions[2] = pos.z + wind_y;
                positions[5] = pos.z;
                positions[1] = rain_height + rain_height * Math.random() - rain_height;
                if (this.is_rain)
                    positions[4] = positions[1] + 30;
                else
                    positions[4] = positions[1] + 3;
            }
            rain_object.geometry.attributes.position.needsUpdate = true;
        }
    }
}