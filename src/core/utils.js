import { V as Vector3, M as MathUtils, L as Loader, S as Scene, a as Mesh, B as BoxGeometry, b as MeshNormalMaterial, S, V } from './vendor-1d496b00.js';
import * as THREE from 'three'
import { water_plane } from './watergeo.js'

// Earth's radius in meters for coordinate conversions
const EARTH_RADIUS = 6371010;

/**
 * Converts latitude/longitude coordinates to meters using Mercator projection
 * @param {Object} latLng - Object with lat and lng properties
 * @returns {Object} Object with x, y coordinates in meters
 */
function latLngToMeters(latLng) {
    // Convert longitude to x coordinate (meters)
    const x = EARTH_RADIUS * MathUtils.degToRad(latLng.lng);
    // Convert latitude to y coordinate using Mercator projection formula
    const y = 0 -
        EARTH_RADIUS *
        Math.log(Math.tan(0.5 * (Math.PI * 0.5 - MathUtils.degToRad(latLng.lat))));
    return { x, y };
}

/**
 * Converts latitude/longitude coordinates to a THREE.Vector3 for 3D positioning
 * @param {Object} point - Object with lat and lng properties
 * @param {THREE.Vector3} target - Optional target vector to reuse
 * @returns {THREE.Vector3} 3D vector position
 */
export function latLngToVector3(point, target = new Vector3()) {
    const { x, y } = latLngToMeters(point);
    return target.set(x, 0, -y);
}

/**
 * Converts meter coordinates back to latitude/longitude using inverse Mercator projection
 * @param {Object} meters - Object with x, y coordinates in meters
 * @returns {Object} Object with lat and lng properties
 */
function metersToLatLng(meters) {
    // Convert x coordinate back to longitude
    const lng = MathUtils.radToDeg(meters.x / EARTH_RADIUS);
    // Convert y coordinate back to latitude using inverse Mercator formula
    const latRadians = 2 * Math.atan(Math.exp(meters.y / EARTH_RADIUS)) - Math.PI / 2;
    const lat = MathUtils.radToDeg(latRadians);
    return { lat, lng };
}

/**
 * Converts a THREE.Vector3 back to latitude/longitude coordinates
 * @param {THREE.Vector3} vector3 - 3D vector position
 * @returns {Object} Object with lat and lng properties
 */
export function vector3ToLatLng(vector3) {
    const meters = { x: vector3.x, y: -vector3.z }; // Inverse the y component
    return metersToLatLng(meters);
}

/**
 * Converts separate latitude and longitude numbers to a THREE.Vector3
 * @param {number} lat - Latitude in degrees
 * @param {number} lng - Longitude in degrees
 * @returns {THREE.Vector3} 3D vector position
 */
export function latLngNumToVector3(lat, lng) {
    const x = EARTH_RADIUS * MathUtils.degToRad(lng);
    const y = 0 -
        EARTH_RADIUS *
        Math.log(Math.tan(0.5 * (Math.PI * 0.5 - MathUtils.degToRad(lat))));
    return new Vector3(x, 0, -y);
}

/**
 * Calculates position and velocity on an elliptical path
 * @param {number} a - Semi-major axis of ellipse
 * @param {number} b - Semi-minor axis of ellipse
 * @param {number} t - Time parameter (angle in radians)
 * @param {number} step - Step size (unused, kept for compatibility)
 * @returns {Array} [x, y, dx, dy] - Position and velocity components
 */
export function ellipse(a, b, t, step = 1e-9) {
    // Helper function to calculate position on ellipse
    function _ellipse(a, b, t) {
        var x = a * Math.cos(t)
        var y = b * Math.sin(t)
        return [x, y]
    }
    let x1, y1, dx, dy;
    [x1, y1] = _ellipse(a, b, t);
    // Calculate velocity components (derivatives of position)
    dx = -a * Math.sin(t)
    dy = b * Math.cos(t)
    return [x1, y1, dx, dy];
}

/**
 * Preloads a 3D model and sets up GUI controls for it
 * @param {string} url - URL to the GLTF model file
 * @param {string} name - Name of the model for identification
 * @param {THREE.GLTFLoader} gltfLoader - THREE.js GLTF loader instance
 * @param {THREE.Scene} scene - THREE.js scene to add model to
 * @param {Object} gui - GUI library instance for controls
 * @param {Object} Ui - UI manager instance
 */
export function preLoad(url, name, gltfLoader, scene, gui, Ui) {
    // Create GUI folder for this model's controls
    const folder = gui.addFolder(name)
    const controls = Ui.getVariableByName(name)
    
    // Add GUI controls for each property in the model's control object
    for (var property in controls) {
        if (controls[property] != null) {
            // Position controls with step size of 1
            if (property == 'pos_x' || property == 'pos_y' || property == 'pos_z') {
                folder.add(controls, property).step(1)
            }
            // Rotation controls with range 0 to 2π (6.28 radians)
            else if (property == 'rot_x' || property == 'rot_y' || property == 'rot_z') {
                folder.add(controls, property, 0, 6.28, 0.01)
            }
            // Path parameters for elliptical movement
            else if (property == 'path_a' || property == 'path_b') {
                folder.add(controls, property, 1, 10, 0.1)
            }
            // Velocity control for animation speed
            else if (property == 'vel') {
                folder.add(controls, property, 0, 3, 0.01)
            }
            // Default control for other properties
            else {
                folder.add(controls, property)
            }
        }
    }

    // Load the GLTF model
    gltfLoader.load(url, (gltf) => {
        const model = gltf.scene;
        
        // Process each object in the model
        model.traverse((o) => {
            // Remove water objects from the model (handled separately)
            if (o.name == 'water') {
                o.removeFromParent()
            }
            // Set tornado mesh opacity for transparency effect
            if (name == 'tornado' && o.isMesh) {
                o.material.opacity = 0.8
            }
        });

        // Set model name and add to scene
        model.name = name;
        scene.add(model);
    });
}

/**
 * Creates and sets up rain particle system with GUI controls
 * @param {THREE.Scene} scene - THREE.js scene to add rain to
 * @param {Object} gui - GUI library instance for controls
 * @param {THREE.Vector3} mapCenter - Center position of the map
 * @param {Object} Ui - UI manager instance
 * @returns {Array} Array of rain line objects
 */
export function preLoadRain(scene, gui, mapCenter, Ui) {
    // Create GUI folder for rain controls
    var folder = gui.addFolder('rain')
    var controls = Ui.getVariableByName('rain')
    
    // Add GUI controls for rain properties
    for (var property in controls) {
        if (controls[property] != null) {
            if (property == 'pos_x' || property == 'pos_y' || property == 'pos_z') {
                folder.add(controls, property).step(1)
            }
            else if (property == 'rot_x' || property == 'rot_y' || property == 'rot_z') {
                folder.add(controls, property, 0, 6.28, 0.01)
            }
            else if (property == 'path_a' || property == 'path_b') {
                folder.add(controls, property, 1, 10, 0.1)
            }
            else if (property == 'vel') {
                folder.add(controls, property, 0, 3, 0.01)
            }
            else {
                folder.add(controls, property)
            }
        }
    }

    var ui = Ui.getVariableByName('rain')

    // Create rain particle system
    const rain_objects = []
    const rain_material = new THREE.LineBasicMaterial({
        color: 0xaaaaaa
    })
    var rain_num = ui.num;
    
    // Create individual rain drops as line segments
    for (let i = 0; i < rain_num; i++) {
        const rain_points = [];
        // Random starting position within 1000x1000 area
        var p1 = new THREE.Vector3(0, 0, 0)
        p1.add(new THREE.Vector3(1000 * Math.random() - 500, 0, 1000 * Math.random() - 500))
        rain_points.push(p1)
        // End point (will be updated during animation)
        var p2 = new THREE.Vector3()
        p2.copy(p1).add(new THREE.Vector3(0, 0, 0))
        rain_points.push(p2)
        
        // Create line geometry and add to scene
        const rain_geometry = new THREE.BufferGeometry().setFromPoints(rain_points);
        const line = new THREE.Line(rain_geometry, rain_material)
        line.position.copy(mapCenter)
        rain_objects.push(line)
        scene.add(line)
    }
    return rain_objects
}


/**
 * Placeholder function for model animations
 * @param {Object} data - Animation data
 * @param {THREE.Object3D} model - Model to animate
 * @param {number} time - Current time
 */
export const modelAnim = (data, model, time) => {
    // TODO: Implement model animation logic
}

/**
 * Animates wind turbine blades rotation
 * @param {Object} data - Animation data
 * @param {THREE.Object3D} model - Wind turbine model
 * @param {number} time - Current time for rotation
 */
export const turbineAnim = (data, model, time) => {
    model.traverse(function (child) {
        // Rotate all wind turbine blade objects
        if (child.name == 'Windturbine_Blades_1' ||
            child.name == 'Windturbine_Blades_1001' ||
            child.name == 'Windturbine_Blades_1002' ||
            child.name == 'Windturbine_Blades_1003' ||
            child.name == 'Windturbine_Blades_1004') {
            child.rotation.set(0, 0, time)
        }
    })
}

/**
 * Animates objects along elliptical paths
 * @param {Object} data - Animation data with vel, path_a, path_b properties
 * @param {THREE.Object3D} model - Model to animate
 * @param {number} time - Current time
 */
export const pathAnim = (data, model, time) => {
    var vel = data.vel
    var speed = time * vel
    var a = data.path_a * 100
    var b = data.path_b * 100
    var path_var = ellipse(a, b, speed)
    
    // Move model along elliptical path
    model.position.add(new THREE.Vector3(path_var[0], 0, path_var[1]))
    
    // Special handling for boat1 - make it face direction of movement
    if (model.name == 'boat1') {
        var model_target = new THREE.Vector3()
        model.getWorldPosition(model_target)
        var model_dir = new THREE.Vector3(path_var[2], 0, path_var[3])
        model.lookAt(model_target.add(model_dir))
        model.rotation.x += Math.PI / 2
    }
    
    // Special handling for tornado - continuous rotation
    if (model.name == 'tornado') {
        model.rotation.y += time * 10
    }
}

/**
 * Animates boat with realistic bobbing and swaying motion
 * @param {Object} data - Animation data
 * @param {THREE.Object3D} model - Boat model to animate
 * @param {number} time - Current time
 */
export const boatAnim = (data, model, time) => {
    var init_pos_y = 0.0
    var init_rot_x = 0.0
    var init_rot_z = 0.0

    time = time * 3
    
    // Simulate boat bobbing up and down
    var pos = model.position.clone();
    pos.y = init_pos_y + Math.cos(time) * 1;
    model.position.set(pos.x, pos.y, pos.z);

    // Simulate boat swaying and rolling
    var rot = model.rotation.clone();
    rot.x = init_rot_x + Math.cos(time * 0.25) * 0.1  // Slow roll
    rot.z = init_rot_z + Math.sin(time * 0.5) * 0.2   // Faster sway
    const zAxis = new THREE.Vector3(0, 0, 1)
    const xAxis = new THREE.Vector3(1, 0, 0)
    model.rotateOnWorldAxis(xAxis, rot.x)
    model.rotateOnWorldAxis(zAxis, rot.z)
}

/**
 * Applies animation function to a named model in the scene
 * @param {Object} Ui - UI manager instance
 * @param {string} name - Name of the model to animate
 * @param {THREE.Scene} scene - THREE.js scene containing the model
 * @param {THREE.Vector3} mapCenter - Center position of the map
 * @param {Function} func - Animation function to apply
 * @param {number} time - Current time
 */
export function addAnim(Ui, name, scene, mapCenter, func, time) {
    const model = scene.getObjectByName(name)
    var ui = Ui.getVariableByName(name)
    if (model) {
        func(ui, model, mapCenter, time)
    }
}

/**
 * Animates rain particles with wind effects and recycling
 * @param {Object} Ui - UI manager instance
 * @param {Array} rain_objects - Array of rain line objects
 */
export function addRainAnim(Ui, rain_objects) {
    var ui = Ui.getVariableByName('rain')

    var rain_height = ui.pos_y
    for (let i = 0; i < rain_objects.length; i++) {
        var rain_object = rain_objects[i]
        var positions = rain_object.geometry.attributes.position.array
        
        // Move rain drop downward
        positions[1] -= ui.vel
        var wind_x = ui.wind_x
        var wind_y = ui.wind_y
        
        // Apply different effects for rain vs snow
        if (ui.is_rain) {
            positions[4] = positions[1] + 30  // Longer rain drops
            positions[0] += wind_x
            positions[3] += wind_x
            positions[2] += wind_y
            positions[5] += wind_y
        }
        else {
            positions[4] = positions[1] + 3   // Shorter snow flakes
            positions[0] += wind_x
            positions[3] += wind_x
            positions[2] += wind_y
            positions[5] += wind_y
        }

        // Reset rain drop when it goes below ground level
        if (positions[1] < 0 || positions[4] < 0) {
            // Generate new random position within rain area
            var pos = new THREE.Vector3(ui.scale * Math.random() - ui.scale / 2,
                rain_height, ui.scale * Math.random() - ui.scale / 2)
            pos.add(new THREE.Vector3(ui.pos_x, 0, ui.pos_z))
            positions[0] = pos.x + wind_x
            positions[3] = pos.x
            positions[2] = pos.z + wind_y
            positions[5] = pos.z
            positions[1] = rain_height + rain_height * Math.random() - rain_height
            if (ui.is_rain)
                positions[4] = positions[1] + 30
            else
                positions[4] = positions[1] + 3
        }
        
        // Update geometry and visibility
        rain_object.geometry.attributes.position.needsUpdate = true;
        if (ui.visible) {
            rain_object.visible = true
        }
        else {
            rain_object.visible = false
        }
    }
}

/**
 * Animates water surface with shader uniforms and level changes
 * @param {Object} Ui - UI manager instance
 * @param {THREE.Scene} scene - THREE.js scene
 * @param {number} water_level - Current water level
 * @param {Array} water_geometries - Array of water geometry levels
 * @param {number} time - Current time for wave animation
 * @param {THREE.Vector3} camPos - Camera position for reflections
 * @param {THREE.Texture} envMap - Environment map for reflections
 */
export function addWaterAnim(Ui, scene, water_level, water_geometries, time, camPos, envMap) {
    const water = scene.getObjectByName('water');
    var water_controls = Ui.getVariableByName('water_controls')
    if (water) {
        var ui_level = water_controls.level
        // Update water geometry based on level
        water.geometry = water_geometries[ui_level - 1]
        
        // Update shader uniforms for water material
        water.traverse(function (child) {
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
        })
    }
}

/**
 * Sets up lighting for the 3D scene with ambient and directional lights
 * @param {THREE.Scene} scene - THREE.js scene to add lighting to
 */
export function addLighting(scene) {
    // Add ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75); // soft white light
    scene.add(ambientLight);
    
    // Add directional light for shadows and directional illumination
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.x += (-90)
    directionalLight.position.y += 0
    directionalLight.position.z += 20
    directionalLight.castShadow = true
    
    // Set up shadow camera bounds
    const d = 100;
    directionalLight.shadow.camera.left = - d;
    directionalLight.shadow.camera.right = d;
    directionalLight.shadow.camera.top = d;
    directionalLight.shadow.camera.bottom = - d;
    scene.add(directionalLight);
    
    // Add helper to visualize shadow camera (useful for debugging)
    scene.add(new THREE.CameraHelper(directionalLight.shadow.camera));
}

/**
 * Sets up GUI controls for water properties
 * @param {Object} Ui - UI manager instance
 * @param {Object} gui - GUI library instance
 */
export function addWaterUI(Ui, gui) {
    const folder = gui.addFolder('Water')
    const controls = Ui.getVariableByName('water_controls')
    
    // Add GUI controls for each water property
    for (var property in controls) {
        if (controls[property] != null) {
            if (property == 'textSize') {
                folder.add(controls, property, 0.0, 1.5, 0.01)
            }
            else if (property == 'shiny') {
                folder.add(controls, property, 0.0, 50.0, 0.5)
            }
            else if (property == 'spec') {
                folder.add(controls, property, 0.0, 30.0, 0.1)
            }
            else if (property == 'diffuse') {
                folder.add(controls, property, 0.0, 30, 0.01)
            }
            else if (property == 'rf0') {
                folder.add(controls, property, 0.0, 1.0, 0.01)
            }
            else if (property == 'level') {
                folder.add(controls, property, 1, controls.level, 1)
            }
            else if (property == 'waterColor') {
                folder.addColor(controls, property)
            }
            else {
                folder.add(controls, property)
            }
        }
    }
}

/**
 * Generates water geometry planes for different water levels
 * @param {Array} array - Array of water level data
 * @param {THREE.Vector3} mapCenter - Center position of the map
 * @returns {Array} Array of water plane geometries
 */
export function generate_water_geos(array, mapCenter) {
    var l = array.length
    var planes = []
    console.log("array");
    console.log(array);
    
    // Create water plane geometry for each level
    for (var i = 0; i < l; i++) {
        planes.push(water_plane(array[i], mapCenter))
    }
    return planes
}

/**
 * Sets up map click and mouse move handlers for object manipulation
 * @param {Array} objects - Array of objects that can be moved/rotated
 * @param {Object} map - Google Maps instance
 * @param {THREE.Vector3} mapCenter - Center position of the map
 */
export function handleObjectsMoveAndRot(objects, map, mapCenter) {
    // Handle map clicks for object positioning
    map.addListener('click', function (event) {
        var lat = event.latLng.lat();
        var lng = event.latLng.lng();
        var clickPos = latLngNumToVector3(lat, lng).sub(mapCenter);
        
        // Update object positions and rotation states
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].moving) {
                clickPos.y = objects[i].pos.y;
                objects[i].pos = clickPos;
            }
            if (objects[i].rotating) {
                objects[i].rotating = false;
            }
        }
    });

    // Handle mouse movement for object rotation
    var previousMousePosition = { x: 0, y: 0 };
    map.addListener('mousemove', function (event) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotating) {
                var deltaX = event.pixel.x - previousMousePosition.x;
                objects[i].rot.y += deltaX * 0.01;
            }
        }
        previousMousePosition.x = event.pixel.x;
    });
}