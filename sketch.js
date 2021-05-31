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
      .style("font-size: 20px")
      .position(50, 50)
      .mousePressed(() => {
        requestDeviceMotionPermission();
        createSensorValueDisplay();
        startButton.hide();
      })
  } else if (testMode) {
    createSensorValueDisplay();
    setInterval(() => {
      const accelerationIncludingGravity = {
        x: 8 * noise(frameCount / 100, 0) - 4,
        y: 8 * noise(frameCount / 150, 1) - 4,
      }
      handleMotion({ accelerationIncludingGravity });
      handleOrientation({ webkitCompassHeading: map(mouseX, 0, width, 0, 360), webkitCompassAccuracy: 20 });
    }, 1000 / 60);
  } else {
    createDiv("DeviceMotion is not available in this browser. Try visiting this page on a mobile device.")
      .style("font-size: 20px")
      .position(10, 10);
  }
}

function draw() {
  background(0);
  stroke(255);
  noFill();

  if (compassHeading) {
    drawCompass();
  }

  ball.update();
  ball.draw();
}

function drawCompass() {
  const { heading, accuracy } = compassHeading;
  const northHeading = -90 - heading;

  push();
  translate(width / 2, (labelBottom + height) / 2);
  angleMode(DEGREES);

  // accuracy arc
  noStroke();
  for (let da = -accuracy; da < accuracy; da += 2) {
    fill(map(abs(da), accuracy, 0, 64, 192));
    arc(0, 0, 200, 200, northHeading + da, northHeading + da + 2, PIE);
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
    fill(i ? 160 : color(192, 32, 32));
    textStyle(i ? NORMAL : BOLD);
    text("北东南西".charAt(i), c.x, c.y);
  }
  pop();
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

class Ball {
  constructor() {
    this.radius = 15;
    this.pos = createVector(width, height).mult(0.5);
    this.vel = createVector();
    this.angle = 0;
    this.rotationSpeed = 1 / 50;
  }

  accelerate(acc) {
    ball.vel.add(acc);
  }

  update() {
    // update the ball position
    this.vel.mult(0.9);
    this.pos.add(this.vel);

    // bounce the ball off the sides
    const topLeft = p5.Vector.sub(this.pos, createVector(this.radius, this.radius + 5));
    const botRight = p5.Vector.add(this.pos, createVector(this.radius, this.radius));
    if ((topLeft.x < 0 || width <= botRight.x) && topLeft.x * this.vel.x > 0) {
      this.pos.x = this.vel.x < 0 ? this.radius : width - this.radius;
      if (topLeft.x < 0) {
        this.rotationSpeed = this.vel.y / this.radius;
      } else {
        this.rotationSpeed = - this.vel.y / this.radius;
      }
    }
    if ((topLeft.y < 0 || height <= botRight.y) && topLeft.y * this.vel.y > 0) {
      this.pos.y = this.vel.y < 0 ? 5 + this.radius : height - this.radius;
      if (topLeft.y > 5) {
        this.rotationSpeed = this.vel.x / this.radius;
      } else {
        this.rotationSpeed = - this.vel.x / this.radius;
      }
    }
    this.angle += this.rotationSpeed;
    this.rotationSpeed *= 0.99;
  }

  draw() {
    const dotRadius = 6;
    const dotPos = p5.Vector.add(this.pos, p5.Vector.fromAngle(this.angle, this.radius - dotRadius));
    circle(this.pos.x, this.pos.y, 2 * this.radius);
    circle(dotPos.x, dotPos.y, 2 * dotRadius);
  }
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
  function createDisplay(label, typespec) {
    if (typespec === Number) {
      const div = createDiv('x').position(x, y);
      y += div.elt.clientHeight;
      div.elt.innerText = '';
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
  labelBottom = y;
}

function displaySensorValues(data) {
  sensorValueDisplayFn(data);
}
