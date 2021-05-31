let circlePos, circleVel;
const circleRadius = 15;

function setup() {
  createCanvas(windowWidth, windowHeight);
  circlePos = createVector(width, height).mult(0.5);
  circleVel = createVector();

  if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) {
    const startButton = createButton("Press to start")
      .style("font-size: 20px")
      .position(50, 50)
      .mousePressed(() => {
        requestDeviceMotionPermission();
        createTextFields();
        startButton.hide();
      })
  } else {
    createDiv("DeviceMotion is not available in this browser. Try visiting this page on a mobile device.")
      .style("font-size: 20px")
      .position(10, 10);
  }
}

function draw() {
  background(255);

  // update the ball position
  circleVel.mult(0.9);
  circlePos.add(circleVel);
  // bounce the ball off the sides
  if ((circlePos.x < 0 || width <= circlePos.x) && circlePos.x * circleVel.x > 0) {
    circlePos.x += circleVel.x;
    circleVel.x *= -1;
  }
  if ((circlePos.y < 0 || height <= circlePos.y) && circlePos.y * circleVel.y > 0) {
    circlePos.y += circleVel.y;
    circleVel.y *= -1;
  }

  circle(circlePos.x, circlePos.y, 2 * circleRadius);
}

function requestDeviceMotionPermission() {
  if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) {
    DeviceMotionEvent.requestPermission()
      .then(() => {
        window.addEventListener('devicemotion', handleMotion, true);
        window.addEventListener('deviceorientation', handleOrientation);
      })
  } else if (window.DeviceMotionEvent) {
    window.ondevicemotion = handleMotionData;
  }
}

function handleMotion(data) {
  const g = data.accelerationIncludingGravity;
  const a = createVector(g.x, -g.y).mult(0.5);
  circleVel.add(a);
  updateLabels(data);
}

function handleOrientation(data) {
  updateLabels({ orientation: data });
}

/*
 * Display the values
 */

const textFields = {};

const sensorNames = {
  // from DeviceMotion
  acceleration: ['x', 'y', 'z'],
  accelerationIncludingGravity: ['x', 'y', 'z'],
  rotationRate: ['alpha', 'beta', 'gamma'],

  // from DeviceOrientation
  orientation: ['alpha', 'beta', 'gamma'],
}

function createTextFields() {
  let y = 20;
  for (const sensorName in sensorNames) {
    for (const axis of sensorNames[sensorName]) {
      const key = sensorName + '.' + axis;
      textFields[key] = createDiv().position(10, y);
      y += 20;
    }
  }
  // textFields['interval'] = createDiv().position(10, y);
}

function updateLabels(data) {
  console.info(data);
  for (const sensorName in sensorNames) {
    if (!data[sensorName]) continue;
    for (const axis of sensorNames[sensorName]) {
      const key = sensorName + '.' + axis;
      const value = data[sensorName][axis];
      textFields[key].elt.innerText = key + ': ' + value.toFixed(2);
    }
  }
  // textFields['interval'].elt.innerText = 'interval: ' + (1 / data.interval).toFixed() + ' Hz';
}
