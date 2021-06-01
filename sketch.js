const testMode = window.location.hash === '#test';
let ball;
let labelBottom = 0;
let compassHeading;

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);

  ball = new Ball();

  if (window.DeviceMotionEvent && DeviceMotionEvent.requestPermission) {
    const startButton = createButton("Press to start")
      .addClass("start-button")
      .mousePressed(() => {
        requestDeviceMotionPermission();
        createSensorValueDisplay();
        startButton.hide();
      });
    startButton.position((width - startButton.elt.clientWidth) / 2, 50);
  } else if (testMode) {
    createSensorValueDisplay();
    setInterval(() => {
      const accelerationIncludingGravity = {
        x: 8 * noise(frameCount / 100, 0) - 4,
        y: 8 * noise(frameCount / 150, 1) - 4,
      }
      handleMotion({ accelerationIncludingGravity });

      const webkitCompassHeading = 360 * noise(frameCount / 350, 2);
      // const webkitCompassHeading = map(mouseX, 0, width, 0, 360);
      handleOrientation({ webkitCompassHeading, webkitCompassAccuracy: 20 });
    }, 1000 / 60);
  } else {
    select(".warning").show();
  }
}

function draw() {
  clear();
  stroke(255);
  noFill();

  if (compassHeading) {
    drawCompass();
  }

  ball.update();
  ball.draw();
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
  ball.accelerate(a);

  displaySensorValues(data);
}

function handleOrientation(data) {
  const { webkitCompassHeading: heading, webkitCompassAccuracy: accuracy } = data;
  compassHeading = { heading, accuracy };

  displaySensorValues({ orientation: data });
}

/*
 * Objects
 */

class Ball {
  constructor() {
    this.radius = 15;
    this.pos = createVector(width, height).mult(0.5);
    this.vel = createVector();
    this.angle = 0;
    this.rotationSpeed = 1;
  }

  accelerate(acc) {
    ball.vel.add(acc);
  }

  update() {
    const { pos, vel, radius } = this;
    const margin = 1 / 2;

    // update the ball position
    vel.mult(0.9);
    pos.add(vel);

    // bounce the ball off the sides
    const topLeft = p5.Vector.sub(pos, createVector(radius + margin, radius + margin));
    const botRight = p5.Vector.add(pos, createVector(radius + margin, radius + margin));
    if ((topLeft.x < 0 || width <= botRight.x) && topLeft.x * vel.x > 0) {
      pos.x = vel.x < 0 ? radius + margin : width - radius - margin;
      this.rotationSpeed = vel.y / radius;
      if (topLeft.x > 0) {
        this.rotationSpeed *= -1;
      }
    }
    if ((topLeft.y < 0 || height <= botRight.y) && topLeft.y * vel.y > 0) {
      pos.y = vel.y < 0 ? radius + margin : height - radius - margin;
      this.rotationSpeed = vel.x / radius;
      if (topLeft.y < 0) {
        this.rotationSpeed *= -1;
      }
    }
    this.angle += this.rotationSpeed;
    this.rotationSpeed *= 0.99;
  }

  draw() {
    const { pos, radius } = this;
    const dotRadius = 6;
    const dotPos = p5.Vector.add(pos, p5.Vector.fromAngle(this.angle, radius - dotRadius));

    circle(pos.x, pos.y, 2 * radius);
    circle(dotPos.x, dotPos.y, 2 * dotRadius);
  }
}

function drawCompass() {
  const { heading, accuracy } = compassHeading;
  const northHeading = -90 - heading;

  push();
  translate(width / 2, (labelBottom + height) / 2);
  angleMode(DEGREES);

  // accuracy arc
  noStroke();
  for (let da = accuracy; da > 0; da -= 1) {
    fill(map(abs(da), accuracy, 0, 64, 192));
    arc(0, 0, 200, 200, northHeading - da, northHeading + da, PIE);
  }

  // crosshairs
  {
    // duck from the labels
    const h = abs(heading % 90 - 45) - 45;
    const len = map(abs(h), 0, 45, 30, 60, true);
    stroke(160);
    line(-len, 0, len, 0);
    line(0, -len, 0, len);
    strokeWeight(3);
    line(0, -80 - 3 / 2, 0, -115);
  }

  // indicators
  for (let deg = 0; deg < 360; deg += 5) {
    const rad = radians(deg - heading);
    const sw = deg % 30 ? 1 : 3;
    const p0 = p5.Vector.fromAngle(rad, 80 + sw / 2);
    const p1 = p5.Vector.fromAngle(rad, 100 - sw / 2);
    strokeWeight(sw);
    line(p0.x, p0.y, p1.x, p1.y);
  }

  // direction labels
  stroke(0);
  textAlign(CENTER);
  textSize(25);
  for (let i = 0; i < 4; i++) {
    const c = p5.Vector.fromAngle(radians(northHeading + 90 * i), 55);
    fill(i ? 160 : color(192, 64, 64));
    textStyle(i ? NORMAL : BOLD);
    text("北东南西".charAt(i), c.x, c.y);
  }
  pop();
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
  const x = 5;
  let y = 15;
  function createDisplay(typespec, label = '') {
    if (typespec === Number) {
      const div = createDiv('x').position(x, y);
      y += div.elt.clientHeight;
      div.elt.innerText = '';
      return value => {
        const sign = value < 0 ? '' : '<span class="sign"></span>';
        div.elt.innerHTML = `${label}: ${sign}${value.toFixed(2)}`;
      };
    } else if (Array.isArray(typespec)) {
      return createDisplay(Object.fromEntries(typespec.map(s => [s, Number])), label);
    } else {
      const setters = mapValues(typespec, (propertySpec, propertyName) => {
        const childLabel = `${label}.${propertyName}`.replace(/^\./, '');
        return createDisplay(propertySpec, childLabel);
      });
      return obj => {
        for (const propertyName in typespec) {
          if (propertyName in obj) {
            setters[propertyName](obj[propertyName]);
          }
        }
      }
    }
  }
  sensorValueDisplayFn = createDisplay(sensorNames);
  labelBottom = y;
}

function displaySensorValues(data) {
  sensorValueDisplayFn(data);
}

/*
 * Utilities
 */

function mapValues(obj, fn) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v, k, obj)]))
}
