import { V as Vector3, M as MathUtils, L as Loader, S as Scene, a as Mesh, B as BoxGeometry, b as MeshNormalMaterial, S, V } from './vendor-1d496b00.js';
import * as THREE from 'three';
import Delaunator from 'delaunator';
import * as Utils from './utils.js'
import { Color, Points } from 'three';
import { waterVertexShader, waterFragmentShader } from '../shaders/water_shader.js';

const pointInPolygon = require('point-in-polygon');
const interval = 10;
const triangulate = require('delaunay-triangulate');

/**
 * Generates a grid of points inside a polygon for triangulation.
 * @param {Array} polygon - Array of [x, y] points defining the polygon
 * @returns {Array} Array of [x, y] points inside the polygon
 */
function girlPoint2D(polygon) {
    var lonArr = [];
    var latArr = [];
    polygon.forEach(elem => {
        (lonArr).push(elem[0]);
        (latArr).push(elem[1]);
    });
    const [lonMin, logMax] = minMax(lonArr);
    const [latMin, latMax] = minMax(latArr);

    const row = Math.ceil((logMax - lonMin) / interval);
    const col = Math.ceil((latMax - latMin) / interval);
    var rectPointsArr = [];
    for (var i = 0; i < row + 1; i++) {
        for (var j = 0; j < col + 1; j++) {
            (rectPointsArr).push([lonMin + i * interval, latMin + j * interval]);
        }
    }
    const pointArr = [];
    rectPointsArr.forEach(elem => {
        if (pointInPolygon(elem, polygon)) {
            (pointArr).push(elem);
        }
    });
    return [...polygon, ...pointArr];
}

/**
 * Triangulates a set of 2D points, filtering triangles to those inside the polygon.
 * @param {Array} polygonPointsArr - Array of [x, y] points
 * @param {Array} polygonData - Polygon boundary for filtering
 * @returns {Array} Array of triangle indices
 */
function delaunay(polygonPointsArr, polygonData) {
    const indexArr = Delaunator.from(polygonPointsArr).triangles;
    var usefulIndexArr = [];
    for (let i = 0; i < indexArr.length; i += 3) {
        const point1 = polygonPointsArr[indexArr[i]];
        const point2 = polygonPointsArr[indexArr[i + 1]];
        const point3 = polygonPointsArr[indexArr[i + 2]];
        const triangleCenter = [(point1[0] + point2[0] + point3[0]) / 3, (point1[1] + point2[1] + point3[1]) / 3];
        if (pointInPolygon(triangleCenter, polygonData)) {
            (usefulIndexArr).push(indexArr[i], indexArr[i + 1], indexArr[i + 2]);
        }
    }
    return usefulIndexArr;
}

/**
 * Returns the min and max of an array, rounded to floor/ceil.
 * @param {Array} arr - Array of numbers
 * @returns {Array} [min, max]
 */
function minMax(arr) {
    arr.sort(compareNum);
    return [Math.floor(arr[0]), Math.ceil(arr[arr.length - 1])];
}

function compareNum(a, b) {
    if (a < b) {
        return -1;
    } else if (a > b) {
        return 1;
    } else {
        return 0;
    }
}

/**
 * Generates a triangulated water surface geometry from GeoJSON polygon data.
 * @param {Object} data - GeoJSON-like object with coordinates
 * @param {THREE.Vector3} mapCenter - Center of the map for local coordinates
 * @returns {THREE.BufferGeometry} Water surface geometry
 */
export function water_plane(data, mapCenter) {
    var pts = data.coordinates[0];
    var points = [];
    for (var i = 0; i < pts.length; i++) {
        var point = Utils.latLngToVector3({ lng: pts[i][0], lat: pts[i][1] })
        pts[i] = point.sub(mapCenter);
        points.push(pts[i].x, pts[i].y, pts[i].z);
    }

    // Convert to 2D for triangulation
    var points = [];
    for (var i = 0; i < pts.length; i++) {
        points.push([pts[i].x, pts[i].z]);
    }

    // Fill the polygon with a grid and triangulate
    const polygonPointsArr = girlPoint2D(points)
    const usefulIndexArr = delaunay(polygonPointsArr, points);
    const posArr = [];
    polygonPointsArr.forEach(elem => {
        (posArr).push(elem[0], 0, elem[1]);
    });

    var geometry = new THREE.BufferGeometry();
    geometry.index = new THREE.BufferAttribute(new Uint16Array(usefulIndexArr), 1);
    geometry.attributes.position = new THREE.BufferAttribute(new Float32Array(posArr), 3);
    return geometry
}

/**
 * Creates a cross-section plane mesh and adds it to the scene, also creates a water plane at a fixed height.
 * @param {Object} hydro - Hydro3DJS hydro object (for adding water)
 * @param {Array} pts - Array of [lng, lat, alt] points
 * @param {THREE.Scene} scene - THREE.js scene
 * @param {THREE.Vector3} mapCenter - Center of the map for local coordinates
 */
export function cross_section_plane(hydro, pts, scene, mapCenter) {
    var points = [];
    var points2D = [];
    var heights = [];
    for (var i = 0; i < pts.length; i++) {
        var alt = pts[i][2];
        var point = Utils.latLngToVector3({ lng: pts[i][0], lat: pts[i][1] })
        pts[i] = point.sub(mapCenter);
        points.push([pts[i].x, alt, pts[i].z]);
        points2D.push([pts[i].x, pts[i].z])
        heights.push(alt);
    }

    var minHeight = Math.min(...heights);
    var maxHeight = Math.max(...heights);

    // Triangulate the cross-section in 2D
    const triangles = triangulate(points2D);
    var crossPlane = new THREE.BufferGeometry();
    var positions = new Float32Array(triangles.length * 3 * 3);
    var normals = new Float32Array(triangles.length * 3 * 3);
    for (var i = 0; i < triangles.length; i++) {
        var triangle = triangles[i];
        positions[i * 9 + 0] = points[triangle[0]][0];
        positions[i * 9 + 1] = points[triangle[0]][1];
        positions[i * 9 + 2] = points[triangle[0]][2];
        positions[i * 9 + 3] = points[triangle[1]][0];
        positions[i * 9 + 4] = points[triangle[1]][1];
        positions[i * 9 + 5] = points[triangle[1]][2];
        positions[i * 9 + 6] = points[triangle[2]][0];
        positions[i * 9 + 7] = points[triangle[2]][1];
        positions[i * 9 + 8] = points[triangle[2]][2];
    }
    crossPlane.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Shader material for color-mapped cross-section
    var material = new THREE.ShaderMaterial({
        uniforms: {
            color1: { value: new THREE.Color(0x440154) },
            color2: { value: new THREE.Color(0x208F8C) },
            color3: { value: new THREE.Color(0xFDE724) },
            color4: { value: new THREE.Color(0xFEB019) },
            color5: { value: new THREE.Color(0xFF7E00) },
            color6: { value: new THREE.Color(0x06E817) },
            color7: { value: new THREE.Color(0xFFFFFF) },
            minH: { value: minHeight },
            maxH: { value: maxHeight },
        },
        vertexShader: `
          varying vec4 vPosition;

          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            vPosition = vec4(position.xyz, 1.0);
        }
        `,
        fragmentShader: `
            uniform float minH;
            uniform float maxH;
            varying vec4 vPosition;

            vec3 turbo_colormap(float x)
            {
                float r = 0.1357 + x * ( 4.5974 - x * ( 42.3277 - x * ( 130.5887 - x * ( 150.5666 - x * 58.1375 ))));
                float g = 0.0914 + x * ( 2.1856 + x * ( 4.8052 - x * ( 14.0195 - x * ( 4.2109 + x * 2.7747 ))));
                float b = 0.1067 + x * ( 12.5925 - x * ( 60.1097 - x * ( 109.0745 - x * ( 88.5066 - x * 26.8183 ))));
                return vec3(r,g,b);
            }
            
            void main() {

                float h = (vPosition.y - minH) / (maxH - minH);

                vec3 color = turbo_colormap(h);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });

    var crossMesh = new THREE.Mesh(crossPlane, material);
    crossMesh.position.copy(mapCenter);
    crossMesh.position.y = maxHeight;
    scene.add(crossMesh);

    // Create a water plane at a fixed height (e.g., 50)
    var waterPlane = new THREE.BufferGeometry();
    var waterHeight = 50;
    var positions = new Float32Array(triangles.length * 3 * 3);
    for (var i = 0; i < triangles.length; i++) {
        var triangle = triangles[i];
        positions[i * 9 + 0] = points[triangle[0]][0];
        positions[i * 9 + 1] = waterHeight;
        positions[i * 9 + 2] = points[triangle[0]][2];
        positions[i * 9 + 3] = points[triangle[1]][0];
        positions[i * 9 + 4] = waterHeight;
        positions[i * 9 + 5] = points[triangle[1]][2];
        positions[i * 9 + 6] = points[triangle[2]][0];
        positions[i * 9 + 7] = waterHeight;
        positions[i * 9 + 8] = points[triangle[2]][2];
    }
    waterPlane.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    var waterMesh = hydro.addWater(waterPlane, true, 0.1);
}