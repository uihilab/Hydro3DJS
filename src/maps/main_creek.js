import { V as Vector3, M as MathUtils, L as Loader, S as Scene, a as Mesh, B as BoxGeometry, b as MeshNormalMaterial, S, V } from './vendor-1d496b00.js';
import * as THREE from 'three';
import { hydroGL, Object, RainObject, WaterObject } from '../core/object.js'

import * as Utils from '../core/utils.js'
import * as Ui from '../ui/ui.js'
import { GUI } from 'dat.gui';

import { ThreeJSOverlayView } from '../core/overlay.js'

import data from '../geojsons/pleasant_creek_lake/creek.json';


const MAP_ID = ""; // Add the relevant google MAP ID
const LOADER_OPTIONS = {
    apiKey: "", // Add the Google Maps API key
    version: "beta",
    libraries: [],
    language: "en"
};

//get mouse position 
console.log(data);
var time = 0;
var camPos = new THREE.Vector3(0, 0, 0);
var inv_proj = new THREE.Matrix4();

const gui = new GUI();

Utils.addWaterUI(Ui, gui);
const water_controls = Ui.getVariableByName('water_controls');

const mapOptions = {
    center: {
        lng: -91.8402543,
        lat: 42.119872
    },
    language: 'en',
    mapTypeId: 'satellite',
    mapId: MAP_ID,
    zoom: 16,
    heading: 45,
    tilt: 67,
};
new Loader(LOADER_OPTIONS).load().then(() => {

    var delta;
    var clock = new THREE.Clock();
    const map = new google.maps.Map(document.getElementById("map"), mapOptions);
    var mapCenter = Utils.latLngToVector3(mapOptions.center);
    const scene = new Scene();
    Utils.addLighting(scene);

    var hydro = new hydroGL({ mapOptions: mapOptions, scene: scene, ui: Ui, gui: gui });

    hydro.addWater([data]);


    var map_class = new ThreeJSOverlayView({
        scene,
        map,
        THREE,
    });

    const animate = () => {

        delta = clock.getDelta();
        time += delta;
        inv_proj = map_class.camera.projectionMatrix.invert();
        camPos = new THREE.Vector3().applyMatrix4(inv_proj);

        hydro.animate(time, camPos);

        requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
});