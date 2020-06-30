import 'alpinejs';
import * as numeral from 'numeral';
import proj4 from 'proj4';

/*
TODO:
- add pouchdb connection
- capture point and description to pouch db
- enable pouchdb sync to beehivebeach
 */

//proj4.defs('WGS84', "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
const EPSG_2893 = '+title=NAD83(HARN)/Maryland(ftUS) +proj=lcc +lat_1=39.45 +lat_2=38.3 +lat_0=37.66666666666666 +lon_0=-77 +x_0=399999.9998983998 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=us-ft +no_defs';

const config = {
  sample_interval: 1000,
  projection: EPSG_2893
}

let coord_timeout = null;

window.current_location = {
  timestamp:null,
  x:null,
  y:null,
  z:null,
  tt:null,
  tx:null,
  ty:null,
  tz:null,
  latitude:null,
  longitude:null,
  altitude:null,
  heading:null,
  speed:null,
  accuracy: null,
  altitudeAccuracy: null,
  _dummy:0,
  status: {"bg-error":true, "bg-warning":false, "bg-success":false},
  running: false
}


function transformLocation(longitude, latitude) {
  latitude=39.026995046;
  longitude=-76.563978568;
  let xy = proj4(config.projection).forward([longitude, latitude])
  console.debug(xy);
  return xy;
}


function statusFromAccuracy(acc) {
  let status = {"bg-error":false, "bg-warning":false, "bg-success":false};
  if (acc == null) {
    status["bg-error"] = true;
    return status;
  }
  acc = parseFloat(acc);
  console.debug("ACC = ", acc);
  if (acc > 5) {
    status["bg-error"] = true;
    return status;
  }
  if (acc > 0.1) {
    status["bg-warning"] = true;
    return status;
  }
  status["bg-success"] = true;
  return status;
}

function touchUI() {
  let ele = document.getElementById("ui_current_location");
  ele.__x.$data._dummy = window.current_location._dummy + 1;
}

function updateCoordinates(position) {
  console.debug(position);
  var timestamp = new Date();
  timestamp.setTime(position.timestamp);
  let cl = window.current_location;
  cl.timestamp = timestamp;
  cl.tt = cl.timestamp.toISOString();
  cl.latitude = position.coords.latitude;
  cl.longitude = position.coords.longitude;
  cl.altitude = position.coords.altitude;
  let xy = transformLocation(cl.longitude, cl.latitude);
  cl.x = xy[0];
  cl.y = xy[1];
  cl.z = numeral(cl.altitude)*3.28084;
  cl.tx = numeral(cl.x).format("0.00");
  cl.ty = numeral(cl.y).format("0.00");
  cl.tz = numeral(cl.z).format("0.0");
  cl.heading = position.coords.heading;
  cl.speed = position.coords.speed;
  cl.accuracy = position.coords.accuracy;
  cl.altitudeAccuracy = position.coords.altitudeAccuracy;
  cl.status = statusFromAccuracy(cl.accuracy);
  touchUI();
}


function getLocation() {
    navigator.geolocation.getCurrentPosition(updateCoordinates);
    coord_timeout = setTimeout(getLocation, config.sample_interval);
}

function startStopLocation() {
  if (!window.current_location.running) {
    console.debug("Starting location reporting...")
    window.current_location.running = true;
    getLocation();
  } else {
    console.debug("Stopping location reporting...")
    clearTimeout(coord_timeout);
    window.current_location.running = false;
    touchUI();
  }
}


window.onload = function() {
  document.getElementById("bt_start").onclick = startStopLocation;
  let ele = document.getElementById("ui_current_location");
  ele.setAttribute("x-data", "window.current_location");
  ele.setAttribute("x-init", getLocation);
}
