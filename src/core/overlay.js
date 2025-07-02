import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import {
    MaskPass,
    ClearMaskPass
} from 'three/examples/jsm/postprocessing/MaskPass.js'

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Overlay view for integrating THREE.js scenes with Google Maps WebGLOverlayView.
 * Handles rendering, post-processing, and interaction logic.
 */
export class ThreeJSOverlayView {
    /**
     * @param {Object} options - Configuration options
     * @param {Object} options.anchor - Lat/lng/alt anchor for overlay
     * @param {Float32Array} options.rotation - Rotation quaternion
     * @param {Float32Array} options.scale - Scale vector
     * @param {THREE.Scene} options.scene - Optional THREE.js scene
     * @param {Object} options.THREE - THREE.js namespace
     * @param {Object} options.map - Google Maps instance
     */
    constructor({ anchor = { lat: 0, lng: 0, altitude: 0 }, rotation = new Float32Array([0, 0, 0]), scale = new Float32Array([1, 1, 1]), scene, THREE, map, }) {
        // Internal state for rotation, projection, and raycasting
        this.rotation = new Float32Array(3)
        this.rotationInverse = new THREE.Quaternion()
        this.projectionMatrixInverse = new THREE.Matrix4()
        this.raycaster = new THREE.Raycaster()

        // Google Maps overlay and rendering objects
        this.overlay = new google.maps.WebGLOverlayView();
        this.renderer = null;
        this.camera = null;
        this.composer = null;
        this.anchor = anchor;
        this.rotation = rotation;
        this.scale = scale;
        this.THREE = THREE;
        this.scene = scene !== null && scene !== void 0 ? scene : new this.THREE.Scene();
        // Align scene with y-up convention in THREE.js
        this.scene.rotation.x = Math.PI / 2;
        // Bind overlay lifecycle methods
        this.overlay.onAdd = this.onAdd.bind(this);
        this.overlay.onRemove = this.onRemove.bind(this);
        this.overlay.onContextLost = this.onContextLost.bind(this);
        this.overlay.onContextRestored = this.onContextRestored.bind(this);
        this.overlay.onDraw = this.onDraw.bind(this);
        this.camera = new this.THREE.PerspectiveCamera();
        if (map) {
            this.setMap(map);
        }
    }
    /**
     * Raycast from screen coordinates into the 3D scene.
     * @param {Object} p - Point with x, y in normalized device coordinates
     * @param {Array|Object} optionsOrObjects - Objects to test or options
     * @param {Object} options - Raycast options
     * @returns {Array} Array of intersection results
     */
    raycast(p, optionsOrObjects, options = {}) {
        let objects
        if (Array.isArray(optionsOrObjects)) {
            objects = optionsOrObjects || null
        } else {
            objects = [this.scene]
            options = { ...optionsOrObjects, recursive: true }
        }

        const {
            updateMatrix = true,
            recursive = false,
            raycasterParameters
        } = options

        // Invert the camera projection matrix to go from clip-space to world-space
        if (updateMatrix) {
            this.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert()
        }

        // Set up the ray origin and direction in world space
        this.raycaster.ray.origin
            .set(p.x, p.y, 0)
            .applyMatrix4(this.projectionMatrixInverse)

        this.raycaster.ray.direction
            .set(p.x, p.y, 0.5)
            .applyMatrix4(this.projectionMatrixInverse)
            .sub(this.raycaster.ray.origin)
            .normalize()

        // Backup and optionally override raycaster parameters
        const oldRaycasterParams = this.raycaster.params
        if (raycasterParameters) {
            this.raycaster.params = raycasterParameters
        }

        const results = this.raycaster.intersectObjects(objects, recursive)

        // Restore raycaster parameters
        this.raycaster.params = oldRaycasterParams

        return results
    }
    /**
     * Proxy for overlay state update
     */
    onStateUpdate(options) {
        this.overlay.onStateUpdate(options);
    }
    /**
     * Proxy for requesting overlay state update
     */
    requestStateUpdate() {
        this.overlay.requestStateUpdate();
    }
    /**
     * Called when overlay is added to the map
     */
    onAdd(e) {
        console.log("something added");
    }
    /**
     * Called when overlay is removed from the map
     */
    onRemove() {
        console.log("this.renderer()");
    }
    /**
     * Get the current map instance
     */
    getMap() {
        return this.overlay.getMap();
    }
    /**
     * Request a redraw of the overlay
     */
    requestRedraw() {
        this.overlay.requestRedraw();
    }
    /**
     * Set the map instance for this overlay
     */
    setMap(map) {
        this.overlay.setMap(map);
    }
    /**
     * Add an event listener to the overlay
     */
    addListener(eventName, handler) {
        return this.overlay.addListener(eventName, handler);
    }
    /**
     * Bind overlay property to another object's property
     */
    bindTo(key, target, targetKey, noNotify) {
        this.overlay.bindTo(key, target, targetKey, noNotify);
    }
    /**
     * Get a property value from the overlay
     */
    get(key) {
        return this.overlay.get(key);
    }
    /**
     * Notify overlay of a property change
     */
    notify(key) {
        this.overlay.notify(key);
    }
    /**
     * Set a property value on the overlay
     */
    set(key, value) {
        this.overlay.set(key, value);
    }
    /**
     * Set multiple property values on the overlay
     */
    setValues(values) {
        this.overlay.setValues(values);
    }
    /**
     * Unbind a property from the overlay
     */
    unbind(key) {
        this.overlay.unbind(key);
    }
    /**
     * Unbind all properties from the overlay
     */
    unbindAll() {
        this.overlay.unbindAll();
    }
    /**
     * Called when the WebGL context is restored; sets up renderer and post-processing
     */
    onContextRestored({ gl }) {
        // Create THREE.js renderer using the map's WebGL context
        this.renderer = new this.THREE.WebGLRenderer(Object.assign({ canvas: gl.canvas, context: gl }, gl.getContextAttributes()));
        this.renderer.autoClear = false;
        this.renderer.autoClearDepth = false;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = this.THREE.PCFSoftShadowMap;
        this.renderer.receiveShadow = true;
        this.renderer.castShadow = true;
        this.renderer.outputEncoding = this.THREE.sRGBEncoding;
        const { width, height } = gl.canvas;
        this.renderer.setViewport(0, 0, width, height);
        // Set up post-processing pipeline
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        const mask1 = new MaskPass(this.scene, this.camera)
        const mask2 = new MaskPass(this.scene, this.camera)
        const clearMask = new ClearMaskPass()
        this.composer.addPass(renderPass);
        this.composer.addPass(mask1);
        this.composer.addPass(clearMask);
        const glitchPass = new GlitchPass();
        this.composer.addPass(glitchPass);
        this.composer.addPass(mask2);
        this.composer.addPass(clearMask);
    }
    /**
     * Called when the WebGL context is lost; disposes renderer and composer
     */
    onContextLost() {
        if (!this.renderer) {
            return;
        }
        this.renderer.dispose();
        this.renderer = null;
        this.composer = null;
    }
    /**
     * Called every frame to render the overlay
     */
    onDraw({ gl, transformer }) {
        // Update camera projection matrix from map transformer
        this.camera.projectionMatrix.fromArray(
            transformer.fromLatLngAltitude(this.anchor, this.rotation)
        )
        gl.disable(gl.SCISSOR_TEST)
        this.onBeforeDraw()
        this.renderer.render(this.scene, this.camera)
        this.renderer.resetState()
        this.requestRedraw()
    }
    /**
     * Hook for custom logic before each draw
     */
    onBeforeDraw() {
    }
}