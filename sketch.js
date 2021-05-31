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
        createSensorValueDisplay();
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
  displaySensorValues(data);
}

function handleOrientation(data) {
  console.info(data)
  displaySensorValues({ orientation: data });
}

/*
 * Display the values
 */

let sensorValueDisplayFn;

const sensorNames = {
  // from DeviceMotion
  acceleration: ['x', 'y', 'z'],
  accelerationIncludingGravity: ['x', 'y', 'z'],
  rotationRate: ['alpha', 'beta', 'gamma'],
  // interval: Number,
  // interval: n => (1 / n).toFixed() + ' Hz';

  // from DeviceOrientation
  orientation: [
    'alpha', 'beta', 'gamma',
    // only on mobile Safari:
    'webkitCompassAccuracy',
    'webkitCompassHeading',
  ]
}

function createSensorValueDisplay() {
  let y = 20;
  function createDisplay(label, typespec) {
    if (typespec === Number) {
      const div = createDiv().position(10, y);
      y += 20;
      return value => div.elt.innerText = label + ': ' + value.toFixed(2);
    } else if (Array.isArray(typespec)) {
      return createDisplay(label, Object.fromEntries(typespec.map(s => [s, Number])));
    } else {
      const propertyNames = Object.keys(typespec);
      const setters = {};
      for (const propertyName of propertyNames) {
        const lab = label ? label + '.' + propertyName : propertyName;
        setters[propertyName] = createDisplay(lab, typespec[propertyName]);
      }
      return values => {
        for (const propertyName of propertyNames) {
          const value = values[propertyName];
          if (value !== undefined)
            setters[propertyName](value);
        }
      }
    }
  }
  sensorValueDisplayFn = createDisplay(null, sensorNames);
}

function displaySensorValues(data) {
  sensorValueDisplayFn(data);
}
