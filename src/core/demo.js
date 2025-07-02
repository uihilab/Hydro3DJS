import {
  V as Vector3,
  M as MathUtils,
  L as Loader,
  S as Scene,
  a as Mesh,
  B as BoxGeometry,
  b as MeshNormalMaterial,
  S,
  V,
} from "./vendor-1d496b00.js";
import * as THREE from "three";
import {
  Hydro3DJS,
  Object,
  RainObject,
  WaterObject,
} from "./Hydro3DJS.js";
import * as TWEEN from "@tweenjs/tween.js";
import fetch from "node-fetch";
import * as Utils from "./utils.js";
import * as Ui from "../ui/ui_creek.js";

import { ThreeJSOverlayView } from "./overlay.js";

import mapX from "../maps/map7.json";
import mapA from "../maps/finalA.json";

var water50;
var water100;

const MAP_ID = ""; // Google Maps map ID
const LOADER_OPTIONS = {
  apiKey: "", // google maps API key
  version: "beta",
  libraries: [],
  language: "en",
};

// Main animation and camera state
var time = 0;
var camPos = new THREE.Vector3(0, 0, 0);
var inv_proj = new THREE.Matrix4();

const water_controls = Ui.getVariableByName("water_controls");

// Map initialization options
const mapOptions = {
  center: {
    lng: -91.549757142,
    lat: 41.672523,
  },
  language: "en",
  mapTypeId: "satellite",
  mapId: MAP_ID,
  zoom: 16,
  heading: 45,
  tilt: 67,
  disableDefaultUI: true,
};

var boats = [];

// Load Google Maps and initialize the 3D scene
new Loader(LOADER_OPTIONS).load().then(() => {
  var delta;
  var clock = new THREE.Clock();
  // Instantiate the map
  const map = new google.maps.Map(document.getElementById("map"), mapOptions);
  //const earth = new GoogleEarth(map);
  var mapCenter = Utils.latLngToVector3(mapOptions.center);
  //var mapCenter = new THREE.Vector3(-10375674.046664853,  0, -3847334.102173749)

  // Instantiate a ThreeJS Scene and add lighting
  const scene = new Scene();
  Utils.addLighting(scene);

  // var hydro = new hydroGL({ mapOptions: mapOptions, map: map, scene: scene, ui: Ui, gui: gui });
  var hydro = new Hydro3DJS({
    mapOptions: mapOptions,
    map: map,
    scene: scene,
    ui: Ui,
  });

  const loader = new THREE.ImageLoader();

  // Example: Load an image resource (for icons, etc.)
  loader.load(
    "/icons/stream_gauge.png",
    function (image) {
      // Use the image, e.g. draw part of it on a canvas
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.drawImage(image, 10000, 10000);
    },
    undefined,
    function () {
      console.error("An error happened.");
    }
  );

  const NewMapOptions = {
    center: {
      lng: -91.670298,
      lat: 41.975726,
    },
  };

  // Weather API integration for rain simulation
  window.addEventListener("load", function () {
    /**
     * Fetches weather data for a grid around the map center and adds rain objects if needed.
     * @param {THREE.Vector3} mapCenter
     * @returns {Promise<Array>} List of rain objects
     */
    async function getWeather(mapCenter) {
      const grid = 5;
      const centerLatLng = Utils.vector3ToLatLng(mapCenter);
      const xyGridCall = await fetch(
        `https://api.weather.gov/points/${centerLatLng.lat},${centerLatLng.lng}`
      ).then((response) => response.json());

      var currentRainList = [];

      var gridX = xyGridCall.properties.gridX - Math.floor(grid / 2);
      var gridY = xyGridCall.properties.gridY - Math.floor(grid / 2);
      var gridId = xyGridCall.properties.gridId;

      for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
          try {
            const data = await fetch(
              `https://api.weather.gov/gridpoints/${gridId}/${gridX + i},${
                gridY + j
              }/forecast`
            ).then((response) => response.json());
            let currentRain;

            if (
              data.properties.periods[0].probabilityOfPrecipitation.value >= 60
            ) {
              currentRain = hydro.addRain();
              currentRain.setParam(data.geometry, 1000, 10, 1000, true, 0, 0);

              currentRainList.push(currentRain);
            }
          } catch (error) {
            console.log(error);

            const data = await fetch(
              `https://api.weather.gov/gridpoints/${gridId}/${gridX + i},${
                gridY + j
              }/forecast`
            ).then((response) => response.json());
            let currentRain;

            if (
              data.properties.periods[0].probabilityOfPrecipitation.value >= 60
            ) {
              currentRain = hydro.addRain();
              currentRain.setParam(data.geometry, 1000, 10, 1000, true, 0, 0);

              currentRainList.push(currentRain);
            }
          }
        }
      }

      return currentRainList;
    }

    /**
     * Checks if it is raining in a grid around the map center.
     * @param {THREE.Vector3} mapCenter
     * @returns {Promise<boolean>} True if rain is detected
     */
    async function checkWeather(mapCenter) {
      const grid = 5;
      const centerLatLng = Utils.vector3ToLatLng(mapCenter);
      const xyGridCall = await fetch(
        `https://api.weather.gov/points/${centerLatLng.lat},${centerLatLng.lng}`
      ).then((response) => response.json());

      var isRain = false;

      var gridX = xyGridCall.properties.gridX - Math.floor(grid / 2);
      var gridY = xyGridCall.properties.gridY - Math.floor(grid / 2);
      var gridId = xyGridCall.properties.gridId;

      for (let i = 0; i < grid; i++) {
        for (let j = 0; j < grid; j++) {
          try {
            const data = await fetch(
              `https://api.weather.gov/gridpoints/${gridId}/${gridX + i},${
                gridY + j
              }/forecast`
            ).then((response) => response.json());

            if (
              data.properties.periods[0].probabilityOfPrecipitation.value >= 60
            ) {
              isRain = true;
            }
          } catch (error) {
            console.log(error);
            try {
              const data = await fetch(
                `https://api.weather.gov/gridpoints/${gridId}/${gridX + i},${
                  gridY + j
                }/forecast`
              ).then((response) => response.json());

              if (
                data.properties.periods[0].probabilityOfPrecipitation.value >=
                60
              ) {
                isRain = true;
              }
            } catch (error) {
              console.log(error);
            }
          }
        }
      }

      return isRain;
    }

    // UI panel and icon event handlers
    const panelOverlay = document.querySelector(".overlay-panel");
    const iconPanel = document.querySelector(".icon-panel");

    const locationIcon = document.getElementById("location-icon");
    const floodMapIcon = document.getElementById("flood-map-icon");
    const guageIcon = document.getElementById("guage-icon");
    const rainIcon = document.getElementById("rain-icon");
    const shipIcon = document.getElementById("ship-icon");

    var form = false;

    iconPanel.addEventListener("mouseenter", () => {
      console.log("mouse entered");
      panelOverlay.style.width = "290px";
      panelOverlay.style.padding = "15px";
      panelOverlay.style.left = "64px";
    });

    iconPanel.addEventListener("mouseleave", () => {
      if (!form) {
        panelOverlay.style.width = "0";
        panelOverlay.style.padding = "0";
      }
    });

    console.log("locationIcon");
    console.log(locationIcon);

    locationIcon.addEventListener("mouseover", function () {
      form = false;
      const locationHtml = `
                <h1 class="is-size-4 has-text-black mb-4">Locations</h1>
        
                <div class="box has-text-black" style="background-color: #f5f5f5">
        
                    <div class="field">
                        <label class="label">Lat</label>
                            <div class="control">
                                <input id="lat-input" class="input" type="number" placeholder="e.g. 41.657220870002256" step="any"/>
                            </div>
                    </div>
        
                    <div class="field">
                        <label class="label">Lng</label>
                            <div class="control">
                                <input id="lng-input" class="input" type="number" placeholder="e.g. -91.5413560038852" step="any"/>
                            </div>
                    </div>
        
                    <div class="container mgt-large">
                        <div class="has-text-centered">
                            <button id="set-location-button" class="button is-primary has">Set Location</button>
                        </div>
                    </div>
        
                </div>

              <h1 class="is-size-4 has-text-black mb-4">Pre-set Locations</h1>
              <div class="fixed-grid has-1-cols">
        
                <div class="grid">
                    <div class="cell mt-2 p-2" id="goIC-cell">
                        <button id="goIC" class="hidden ml-4">Iowa City</button>
                    </div>
                    <div class="cell p-2" id="goCR-cell">
                        <button id="goCR" class="hidden ml-4">Cedar Rapids</button>
                    </div>
                    <div class="cell p-2" id="goCF-cell">
                        <button id="goCF" class="hidden ml-4">Cedar Falls</button>
                    </div>
                    <div class="cell mb-2 p-2" id="goM-cell">
                        <button id="goM" class="hidden ml-4">Milwaukee</button>
                    </div>
                </div>

              </div>
              `;

      panelOverlay.innerHTML = locationHtml;

      const setLocationButton = panelOverlay.querySelector(
        "#set-location-button"
      );
      const latInput = panelOverlay.querySelector("#lat-input");
      const lngInput = panelOverlay.querySelector("#lng-input");

      latInput.addEventListener("input", () => {
        console.log(parseFloat(latInput.value));

        if (latInput.value != "") {
          form = true;
        } else if (latInput.value == "" && lngInput.value == "") {
          form = false;
        }
      });

      lngInput.addEventListener("input", () => {
        console.log(parseFloat(lngInput.value));

        if (lngInput.value != "") {
          form = true;
        } else if (lngInput.value == "" && latInput.value == "") {
          form = false;
        }
      });

      setLocationButton.addEventListener("click", () => {
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);

        hydro.changeMapCenter(lat, lng);
      });

      const icButton = panelOverlay.querySelector("#goIC");
      const crButton = panelOverlay.querySelector("#goCR");
      const cfButton = panelOverlay.querySelector("#goCF");
      const mButton = panelOverlay.querySelector("#goM");

      icButton.addEventListener("click", () => {
        console.log("ic button clicked");

        hydro.changeMapCenter(41.65719036564, -91.5414174511665);
      });

      crButton.addEventListener("click", () => {
        console.log("cr button clicked");

        hydro.changeMapCenter(41.975726, -91.670298);
      });

      cfButton.addEventListener("click", () => {
        console.log("cf button clicked");

        hydro.changeMapCenter(42.493793, -92.339671);
      });

      mButton.addEventListener("click", async () => {
        const mLat = 43.036714;
        const mLng = -87.905887;

        console.log("m button clicked");
        hydro.changeMapCenter(mLat, mLng);
      });
    });

    floodMapIcon.addEventListener("mouseover", function () {
      form = false;
      const floodMapHtml = `
                <h1 class="is-size-4 has-text-black mb-4">Flood Maps</h1>
        
                <div class="dropdown is-active">
                    <div class="dropdown-trigger">
                        <button class="button" aria-haspopup="true" aria-controls="dropdown-menu">
                        <span>Iowa City Senario</span>
                        <span class="icon is-small">
                            <i class="fas fa-angle-down" aria-hidden="true"></i>
                        </span>
                        </button>
                    </div>
                    <div class="dropdown-menu" id="dropdown-menu" role="menu">
                        <div class="dropdown-content">
                            <a class="dropdown-item" id="ic-flood-50"> 50 Years flood </a>
                            <hr class="dropdown-divider" />
                            <a class="dropdown-item" id="ic-flood-100"> 100 Years flood</a>
                        </div>
                    </div>
                </div>
        
                <h1 class="is-size-5 has-text-black mb-4">Options</h1>
        
                <label class="checkbox">
                    <input type="checkbox" />
                    Estimate Damage
                </label>
                        
        
                <button id="clearFlood" class="button">Clear Flood</button>
        
                `;

      panelOverlay.innerHTML = floodMapHtml;

      const icFlood50 = panelOverlay.querySelector("#ic-flood-50");
      const icFlood100 = panelOverlay.querySelector("#ic-flood-100");
      const clearFlood = panelOverlay.querySelector("#clearFlood");

      icFlood50.addEventListener("click", () => {
        console.log("50 button clicked");

        if (!water50) {
          water50 = hydro.addWater([mapA]);
        }

        if (water100) {
          if (water100) {
            for (let i = 0; i < water100.length; i++) {
              water100[i].remove();
            }
            water100 = null;
          }
        }
      });

      icFlood100.addEventListener("click", () => {
        console.log("100 button clicked");

        if (!water50) {
          water50 = hydro.addWater([mapA]);
        }

        if (!water100) {
          water100 = hydro.addWater([mapX]);
        }
      });

      clearFlood.addEventListener("click", () => {
        console.log("clear flood clicked");

        console.log("water50");
        console.log(water50);

        if (water50) {
          for (let i = 0; i < water50.length; i++) {
            water50[i].remove();
          }
          water50 = null;
        }

        if (water100) {
          for (let i = 0; i < water100.length; i++) {
            water100[i].remove();
          }
          water100 = null;
        }
      });
    });

    guageIcon.addEventListener("mouseover", function () {
      form = false;
      var guageHtml = `
                <h1 class="is-size-4 has-text-black mb-4">Data Resources</h1>
        
                <article class="panel">
                </article>
        
            
                `;

      var gaugesPanelHtml = ``;

      console.log("gauges");
      console.log(gauges);

      for (let i = 0; i < gauges.length; i++) {
        const element = gauges[i];
        gaugesPanelHtml += `
                    <a class="panel-block" id="${element.name}">
                        ${element.name}
                    </a>
                    
                    `;
      }

      panelOverlay.innerHTML = guageHtml;

      panelOverlay.querySelector(".panel").innerHTML = gaugesPanelHtml;

      for (let i = 0; i < gauges.length; i++) {
        const element = gauges[i];

        const guage = panelOverlay.querySelector(`#${element.name}`);

        guage.addEventListener("click", async () => {
          const pos = element.getPosWLngLat();

          map.panTo({ lat: pos.lat, lng: pos.lng });
          map.setOptions({ zoom: 17.5 });

          await gaugeInfoPanel(element, true);
        });
      }
    });

    rainIcon.addEventListener("mouseover", async function () {
      form = false;
      console.log("rainIcon");

      const rainHtml = `
                <h1 class="is-size-4 has-text-black mb-4">RainFall Forecast</h1>
                
                <div class="container has-text-centered">
                    <button class="button is-loading">Loading</button>
                
                </div>
                
                `;
      panelOverlay.innerHTML = rainHtml;

      const isRain = checkWeather(hydro.mapCenter);

      isRain.then((value) => {
        panelOverlay.querySelector(".button").classList.remove("is-loading");
        if (value) {
          // if it is raining
        } else {
          // if it is not raining
          panelOverlay.querySelector(".container").innerHTML = `
                        <div class="notification is-danger">
                            Looks like there is no rain in your area!
                        </div>
                        `;
        }
      });
    });

    shipIcon.addEventListener("mouseover", function () {
      form = false;
      const shipHtml = `
                <h1 class="is-size-4 has-text-black mb-4">Shipping Routes</h1>

                <article class="panel is-primary">
                    <p class="panel-tabs">
                        <a class="is-active" id="routes">Routes</a>
                        <a id="add-route">Add Routes</a>
                    </p>
                    <div class="panel-content">
                        
                    </div>
                </article>
                `;

      console.log("boats");
      console.log(boats);

      panelOverlay.innerHTML = shipHtml;

      const routes = panelOverlay.querySelector("#routes");
      const addRoute = panelOverlay.querySelector("#add-route");
      const panelContent = panelOverlay.querySelector(".panel-content");

      const addRoutesHtml = `
                <div class="field">
                    <label class="label">Route Name</label>
                    <div class="control">
                    <input class="input" type="text" placeholder="Iowa City River Route">
                    </div>
                </div>

              <div class="field">
                <label class="label">Route (in Geojson)</label>
                <div class="file">
                    <label class="file-label">
                        <input class="file-input" type="file" name="geojson-input" id="geojson-file" />
                        <span class="file-cta">
                        <span class="file-icon">
                            <i class="fal fa-upload"></i>
                        </span>
                        <span class="file-label"> Choose a file… </span>
                        </span>
                    </label>
                    </div>

                </div>
              
              <div class="field">
              <label class="label">Options</label>
                <div class="control">
                  <label class="checkbox">
                    <input type="checkbox">
                    Repeat infinitely
                  </label>
                </div>
              </div>
              
              <div class="field has-text-centered">
                <div class="control">
                  <button class="button is-link" id="submit-button">Submit</button>
                  <button class="button is-link" id="cancel-button">Cancel</button>
                </div>
              </div>
                `;
      var routesHtml = `
                
                `;
      for (let i = 0; i < boats.length; i++) {
        const element = boats[i];

        routesHtml += `
                        <a class="panel-block" id="${boats[i].name}">
                            ${boats[i].name}
                        </a>
                    `;
      }
      panelContent.innerHTML = routesHtml;

      for (let i = 0; i < boats.length; i++) {
        const element = boats[i];

        const boat = panelOverlay.querySelector(`#${element.name}`);

        boat.addEventListener("click", async () => {
          var pos = element.model.position;

          pos = Utils.vector3ToLatLng(pos);

          console.log("pos");
          console.log(pos);

          map.panTo({ lat: pos.lat, lng: pos.lng });
          map.setOptions({ zoom: 17.5 });
        });
      }

      routes.addEventListener("click", () => {
        form = false;
        console.log("routes clicked");
        addRoute.classList.remove("is-active");
        routes.classList.add("is-active");

        panelContent.innerHTML = routesHtml;
      });

      addRoute.addEventListener("click", () => {
        console.log("add-route clicked");
        routes.classList.remove("is-active");
        addRoute.classList.add("is-active");

        form = true;

        panelContent.innerHTML = addRoutesHtml;

        const submitButton = panelOverlay.querySelector("#submit-button");
        const cancelButton = panelOverlay.querySelector("#cancel-button");
        const fileInput = panelContent.querySelector("#geojson-file");

        fileInput.addEventListener("change", () => {
          const file = fileInput.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const fileContent = event.target.result;
              console.log("File content:", fileContent);
              // Process the file content here
            };
          }
        });

        submitButton.addEventListener("click", () => {
          console.log("submit button clicked");

          const file = fileInput.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const fileContent = event.target.result;
              console.log("File content:", fileContent);
              // Process the file content here
            };
            console.log("reader");
            console.log(reader);
          }
        });

        cancelButton.addEventListener("click", () => {
          console.log("cancel button clicked");
        });
      });
    });
  });

  var gauges = [];

  var stream_guage = hydro.addModel(
    "stream_gauge",
    "../models/cube/cube.glb"
  );
  stream_guage.setScale(10);
  stream_guage.setPosWLngLat(-91.541, 41.6566833);
  gauges.push(stream_guage);

  var stream_guage2 = hydro.addModel(
    "stream_gauge2",
    "../models/cube/cube.glb"
  );
  stream_guage2.setScale(10);
  stream_guage2.setPosWLngLat(-91.5076639, 41.65140556);
  gauges.push(stream_guage2);

  var rain_guage = hydro.addModel(
    "rain_gauge",
    "../models/cube/cube.glb"
  );
  rain_guage.setScale(10);
  rain_guage.setPosWLngLat(-91.540775473839, 41.65671628529445);
  gauges.push(rain_guage);

  var rain_guage2 = hydro.addModel(
    "rain_gauge2",
    "../models/cube/cube.glb"
  );
  rain_guage2.setScale(10);
  rain_guage2.setPosWLngLat(-91.54159718087124, 41.64089963628792);
  gauges.push(rain_guage2);

  var rain_guage3 = hydro.addModel(
    "rain_gauge3",
    "../models/cube/cube.glb"
  );
  rain_guage3.setScale(10);
  rain_guage3.setPosWLngLat(-91.54213898709224, 41.64083148396308);
  gauges.push(rain_guage3);

  var ground_well = hydro.addModel(
    "ground_well",
    "../models/cube/cube.glb"
  );
  ground_well.setScale(10);
  ground_well.setPosWLngLat(-91.54210143616604, 41.64073927776181);
  gauges.push(ground_well);

  var moustire_gauge = hydro.addModel(
    "moustire_gauge",
    "../models/cube/cube.glb"
  );
  moustire_gauge.setScale(10);
  moustire_gauge.setPosWLngLat(-91.54206388523983, 41.64078738536154);
  gauges.push(moustire_gauge);

  var objects = [];

  var map_class = new ThreeJSOverlayView({
    scene,
    map,
    THREE,
  });

  Utils.handleObjectsMoveAndRot(objects, map, mapCenter);

  var vector3Path = [
    { lng: -91.54100871057503, lat: 41.658372443693935 },
    { lng: -91.54119490694089, lat: 41.661571923446246 },
    { lng: -91.53928639419134, lat: 41.66442349967747 },
    { lng: -91.53416599413065, lat: 41.670682614400505 },
    { lng: -91.53337465957631, lat: 41.67409009879762 },
  ];

  // convert lat lng to vector3 for ever element in the array
  vector3Path = vector3Path.map((point) => {
    return Utils.latLngToVector3(point);
  });

  vector3Path = vector3Path.map((point) => {
    return new THREE.Vector3(point.x, point.y, point.z);
  });

  var icBoat = hydro.addTravelBoat(
    "Iowa-city-river-boat",
    "../models/boat1/scene.gltf"
  );
  icBoat.setScale(0.16);
  boats.push(icBoat);

  // Create a new tween to animate the object's position
  function rotateObjectToNewDirection(object, finalVector) {
    // Calculate the rotation quaternion from the object's current direction to the final direction
    const currentDir = object.getWorldDirection(new Vector3());
    const finalDir = finalVector.clone().normalize();
    const rotationQuaternion = new THREE.Quaternion().setFromUnitVectors(
      currentDir,
      finalDir
    );

    // Apply the rotation to the object
    object.applyQuaternion(rotationQuaternion);
  }

  function calculateAngleBetweenVectors(initialVector, finalVector) {
    const initialDir = initialVector.clone().normalize();
    const finalDir = finalVector.clone().normalize();

    // Calculate the dot product between the initial and final direction vectors
    const dotProduct = initialDir.dot(finalDir);

    // Use the dot product to find the angle between the vectors (in radians)
    const angleRad = Math.acos(Math.min(Math.max(dotProduct, -1), 1));

    return angleRad * 100000;
  }

  function calculateAngleY(vector) {
    // Calculate the angle of the vector projected onto the YZ-plane
    return Math.atan2(vector.z, vector.y);
  }

  function calculateYAngleDifference(vector1, vector2) {
    // Calculate the angles in the y-axis for both vectors
    const angle1 = calculateAngleY(vector1);
    const angle2 = calculateAngleY(vector2);

    // Find the absolute difference between the angles (in radians)
    const angleDifference = Math.abs(angle1 - angle2);

    // Convert the angle difference from radians to degrees
    const angleDifferenceDegrees = THREE.MathUtils.radToDeg(angleDifference);

    return angleDifferenceDegrees;
  }

  function movePath(moveObject, path, repeat = false) {
    // Make a deep copy of the path to avoid modifying the original array
    var pathCopy = _.cloneDeep(path);

    // Check if the path is too short to animate
    if (pathCopy.length < 2) {
      if (moveObject && moveObject.model) {
        moveObject.model.position.copy(pathCopy[0]);
      } else {
        console.warn("moveObject or moveObject.model is null");
      }
      moveObject?.remove?.(); // optional chaining to prevent crashes
      return;
    }

    function animatePath(currentPath) {
      const boatAnimation = new TWEEN.Tween(currentPath[0])
        .to(currentPath[1], 3000) // Set the end position and duration of the tween
        .onUpdate(() => {
           if (moveObject?.model) {
        moveObject.model.position.copy(currentPath[0]);
    }
        })
        .start() // Start the tween
        .onComplete(() => {
          // Remove the first point from the path as we have reached it
          currentPath.shift();

          // If there are more points to animate to, continue the path
          if (currentPath.length > 1) {
            animatePath(currentPath);
          } else if (repeat) {
            // If repeat is true, restart the animation from the original path
            animatePath(_.cloneDeep(path));
          } else {
            // If not repeating, remove the object
            moveObject.remove();
          }
        });
    }

    // Start the animation with the initial path
    animatePath(pathCopy);
  }

  // Example usage
  movePath(icBoat, vector3Path, true);

  var vectorNums = Utils.latLngToVector3({
    lng: -91.55833147963587,
    lat: 41.659480211770074,
  });
  const startPosition = new THREE.Vector3(
    vectorNums.x,
    vectorNums.y,
    vectorNums.z
  );

  vectorNums = Utils.latLngToVector3({
    lng: -91.55308249063658,
    lat: 41.66300952268125,
  });
  const endPosition = new THREE.Vector3(
    vectorNums.x,
    vectorNums.y,
    vectorNums.z
  );

  console.log("calculateAngleBetweenVectors");
  console.log(calculateAngleBetweenVectors(startPosition, endPosition));

  async function getDamageEstimate() {
    console.log("----------------------------------------------------------");
    const data = await fetch(
      "https://ifis.iowafloodcenter.org/ifis/app/inc/inc_get_hazusdata.php?mapid=1029038"
    )
      .then((response) => response.text())
      .then((data) => {
        console.log(
          "----------------------------------------------------------"
        );
        console.log(data);
      });
  }
  getDamageEstimate();

  // Update the tween on each fram
  const animate = () => {
    delta = clock.getDelta();
    time += delta;
    inv_proj = map_class.camera.projectionMatrix.invert();
    camPos = new THREE.Vector3().applyMatrix4(inv_proj);

    hydro.animate(time, camPos);
    requestAnimationFrame(animate);
    TWEEN.update();
  };
  requestAnimationFrame(animate);

  var DEFAULT_COLOR = 0xffffff;
  var HIGHLIGHT_COLOR = 0xff0000;

  let highlightedObject = null;
  let firstTime = true;

  var mouseClick = () => {};

  function executeScripts(scripts, guageInfo) {
    if (scripts !== null && scripts.length > 0) {
      var loadScript = (index) => {
        if (index < scripts.length) {
          var newScript = document.createElement("script");

          if (scripts[index].innerText) {
            var inlineScript = document.createTextNode(
              scripts[index].innerText
            );
            newScript.appendChild(inlineScript);
          } else {
            newScript.src = scripts[index].src;
          }
          scripts[index].parentNode.removeChild(scripts[index]);
          newScript.addEventListener("load", (event) => loadScript(index + 1));
          newScript.addEventListener("error", (event) => loadScript(index + 1));
          guageInfo.appendChild(newScript);
        }
      };

      loadScript(0); // Start loading script 0. Function is recursive to load the next script after the current one has finished downloading.
    }
  }

  async function gaugeInfoPanel(object, changeColor) {
    const DEFAULT_COLOR = 0xffffff;
    const HIGHLIGHT_COLOR = 0xff0000;
    var name;
    var material;
    var lastName;
    var lastMaterial;

    try {
      name = object.name;
      material = object.model.children[0].material;
    } catch (error) {
      //pass
    }

    try {
      name = object.object.parent.name;
      material = object.object.material;
    } catch {
      //pass
    }

    try {
      lastName = lastInteracted.object.parent.name;
      lastMaterial = lastInteracted.object.material;
    } catch {
      //pass
    }

    console.log("object");
    console.log(object);

    console.log("name");
    console.log(name);

    console.log("lastName");
    console.log(lastName);

    console.log("material");
    console.log(material);

    console.log("lastMaterial");
    console.log(lastMaterial);

    if (changeColor) {
      if (lastInteracted != null && lastName != name) {
        lastMaterial.color.setHex(DEFAULT_COLOR);
        lastInteracted = object;
      }

      material.color.setHex(HIGHLIGHT_COLOR);
      lastInteracted = object;
    }

    if (name === "stream_gauge") {
      // highlightedObject.material.color.set(HIGHLIGHT_COLOR);

      await fetch(
        "https://ifis.iowafloodcenter.org/ifis/app/chart/chart-usgs.php?id=598&idmain=0&type=3&level=0&multi=0&lft=0&rgt=0"
      )
        .then((response) => response.text())
        .then((data) => {
          const guageInfo = document.getElementById("guage-info");
          var guageInfoHtml = `
                <img src="/icons/close_icon.png" alt="Stream Guage" id="infopanel-close-button" class="gauge-info-close">
                `;

          guageInfo.classList.remove("hide");

          guageInfoHtml += data;

          guageInfo.innerHTML = guageInfoHtml;

          const infopanelCloseButton = document.getElementById(
            "infopanel-close-button"
          );

          infopanelCloseButton.addEventListener("click", () => {
            guageInfo.classList.add("hide");
          });

          // Load scripts in the order they are defined
          // Note that inserting scripts into an element using innerHTML doesnt work - hence this logic
          var scripts = guageInfo.querySelectorAll("script");

          executeScripts(scripts, guageInfo);

          guageInfo.querySelectorAll("a").forEach((a) => {
            a.remove();
          });

          // guageInfo.querySelector(".green").remove();
          guageInfo.querySelector("#report").remove();
        });
    } else if (name === "stream_gauge2") {
      // highlightedObject.material.color.set(HIGHLIGHT_COLOR);

      await fetch(
        "https://ifis.iowafloodcenter.org/ifis/app/chart/chart-usgs.php?id=545&idmain=0&type=2&level=0&multi=0&lft=0&rgt=0"
      )
        .then((response) => response.text())
        .then((data) => {
          const guageInfo = document.getElementById("guage-info");
          var guageInfoHtml = `
             <img src="icons/close_icon.png" alt="Stream Guage" id="infopanel-close-button" class="gauge-info-close">
             `;

          guageInfo.classList.remove("hide");

          guageInfoHtml += data;

          guageInfo.innerHTML = guageInfoHtml;

          const infopanelCloseButton = document.getElementById(
            "infopanel-close-button"
          );

          infopanelCloseButton.addEventListener("click", () => {
            guageInfo.classList.add("hide");
          });

          var scripts = guageInfo.querySelectorAll("script");

          executeScripts(scripts, guageInfo);
          guageInfo.querySelectorAll("a").forEach((a) => {
            a.remove();
          });

          // guageInfo.querySelector(".green").remove();
          guageInfo.querySelector("#report").remove();
        });
    } else if (name === "rain_gauge") {
      // highlightedObject.material.color.set(HIGHLIGHT_COLOR);

      await fetch(
        "https://ifis.iowafloodcenter.org/ifis/app/chart/chart-raingauge.php?id=5573&idmain=0&type=17&level=0"
      )
        .then((response) => response.text())
        .then((data) => {
          const guageInfo = document.getElementById("guage-info");
          var guageInfoHtml = `
             <img src="/icons/close_icon.png" alt="Stream Guage" id="infopanel-close-button" class="gauge-info-close">
             `;

          guageInfo.classList.remove("hide");

          guageInfoHtml += data;

          guageInfo.innerHTML = guageInfoHtml;

          const infopanelCloseButton = document.getElementById(
            "infopanel-close-button"
          );

          infopanelCloseButton.addEventListener("click", () => {
            guageInfo.classList.add("hide");
          });

          var scripts = guageInfo.querySelectorAll("script");

          executeScripts(scripts, guageInfo);
          guageInfo.querySelectorAll("a").forEach((a) => {
            a.remove();
          });

          // guageInfo.querySelector(".green").remove();
          guageInfo.querySelector("#report").remove();
        });
    } else if (name === "rain_gauge2") {
      // highlightedObject.material.color.set(HIGHLIGHT_COLOR);

      await fetch(
        "https://ifis.iowafloodcenter.org/ifis/app/chart/chart-raingauge.php?id=788&idmain=0&type=5&level=0"
      )
        .then((response) => response.text())
        .then((data) => {
          const guageInfo = document.getElementById("guage-info");
          var guageInfoHtml = `
             <img src="/icons/close_icon.png" alt="Stream Guage" id="infopanel-close-button" class="gauge-info-close">
             `;

          guageInfo.classList.remove("hide");

          guageInfoHtml += data;

          guageInfo.innerHTML = guageInfoHtml;

          const infopanelCloseButton = document.getElementById(
            "infopanel-close-button"
          );

          infopanelCloseButton.addEventListener("click", () => {
            guageInfo.classList.add("hide");
          });

          var scripts = guageInfo.querySelectorAll("script");

          executeScripts(scripts, guageInfo);
          guageInfo.querySelectorAll("a").forEach((a) => {
            a.remove();
          });

          // guageInfo.querySelector(".green").remove();
          guageInfo.querySelector("#report").remove();
        });
    } else if (name === "rain_gauge3") {
      // highlightedObject.material.color.set(HIGHLIGHT_COLOR);

      await fetch(
        "https://ifis.iowafloodcenter.org/ifis/app/chart/chart-raingauge.php?id=788&idmain=0&type=5&level=0"
      )
        .then((response) => response.text())
        .then((data) => {
          const guageInfo = document.getElementById("guage-info");
          var guageInfoHtml = `
             <img src="/icons/close_icon.png" alt="Stream Guage" id="infopanel-close-button" class="gauge-info-close">
             `;

          guageInfo.classList.remove("hide");

          guageInfoHtml += data;

          guageInfo.innerHTML = guageInfoHtml;

          const infopanelCloseButton = document.getElementById(
            "infopanel-close-button"
          );

          infopanelCloseButton.addEventListener("click", () => {
            guageInfo.classList.add("hide");
          });

          var scripts = guageInfo.querySelectorAll("script");

          executeScripts(scripts, guageInfo);
          guageInfo.querySelectorAll("a").forEach((a) => {
            a.remove();
          });

          // guageInfo.querySelector(".green").remove();
          guageInfo.querySelector("#report").remove();
        });
    } else if (name === "ground_well") {
      // highlightedObject.material.color.set(HIGHLIGHT_COLOR);

      await fetch(
        "https://ifis.iowafloodcenter.org/ifis/app/chart/chart-hydrostation.php?id=3022&idmain=0&type=15&level=0"
      )
        .then((response) => response.text())
        .then((data) => {
          const guageInfo = document.getElementById("guage-info");
          var guageInfoHtml = `
             <img src="/icons/close_icon.png" alt="Stream Guage" id="infopanel-close-button" class="gauge-info-close">
             `;

          guageInfo.classList.remove("hide");

          guageInfoHtml += data;

          guageInfo.innerHTML = guageInfoHtml;

          const infopanelCloseButton = document.getElementById(
            "infopanel-close-button"
          );

          infopanelCloseButton.addEventListener("click", () => {
            guageInfo.classList.add("hide");
          });

          var scripts = guageInfo.querySelectorAll("script");

          executeScripts(scripts, guageInfo);
          guageInfo.querySelectorAll("a").forEach((a) => {
            a.remove();
          });

          // guageInfo.querySelector(".green").remove();
          guageInfo.querySelector("#report").remove();
        });
    } else if (name === "moustire_gauge") {
      // highlightedObject.material.color.set(HIGHLIGHT_COLOR);

      await fetch(
        "https://ifis.iowafloodcenter.org/ifis/app/chart/chart-hydrostation.php?id=3022&idmain=0&type=15&level=0"
      )
        .then((response) => response.text())
        .then((data) => {
          const guageInfo = document.getElementById("guage-info");
          var guageInfoHtml = `
             <img src="/icons/close_icon.png" alt="Stream Guage" id="infopanel-close-button" class="gauge-info-close">
             `;
          guageInfo.classList.remove("hide");

          guageInfoHtml += data;

          guageInfo.innerHTML = guageInfoHtml;

          const infopanelCloseButton = document.getElementById(
            "infopanel-close-button"
          );

          infopanelCloseButton.addEventListener("click", () => {
            guageInfo.classList.add("hide");
          });

          var scripts = guageInfo.querySelectorAll("script");

          executeScripts(scripts, guageInfo);
          guageInfo.querySelectorAll("a").forEach((a) => {
            a.remove();
          });

          // guageInfo.querySelector(".green").remove();
          guageInfo.querySelector("#report").remove();
        });
    } else {
    }
  }

  const mouse = new THREE.Vector2();

  // Flag to track if an object was clicked
  let objectClicked = false;

  // Add an event listener for mouse clicks
  window.addEventListener("click", onMouseClick, false);

  var lastInteracted = null;

  async function onMouseClick(event) {
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const intersections = map_class.raycast(mouse);
    console.log("mouse click");

    if (intersections.length > 0) {
      console.log("intersections");
      console.log(intersections);
      if (lastInteracted != intersections[0]) {
        if (lastInteracted != null) {
          await gaugeInfoPanel(intersections[0], true);
          lastInteracted = intersections[0];
        } else {
          await gaugeInfoPanel(intersections[0], true);
          lastInteracted = intersections[0];
        }
      } else {
        //pass
      }
    } else {
      if (lastInteracted != null) {
        lastInteracted = null;
      }
    }
  }
});

function getGauges() {
  return gauges;
}
