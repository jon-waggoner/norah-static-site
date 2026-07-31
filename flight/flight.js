let plane;
let obstacles = [];
let clouds = [];
let mountains = [];
let groundY;
let scrollX = 0;
let levelLength = 6000;
let level = 1;
let baseSpeed = 9;
let speed;
let state = "start";
let runwayStart, runwayEnd;
let landingRunwayStart;
let crashParticles = [];
let levelCompleteTimer = 0;
let bgGradient;

function setup() {
  createCanvas(windowWidth, windowHeight);
  groundY = height - 80;
  resetLevel();
}

function resetLevel() {
  speed = baseSpeed + (level - 1) * 0.5;
  scrollX = 0;
  obstacles = [];
  clouds = [];
  crashParticles = [];

  plane = {
    x: 150,
    y: groundY - 20,
    vy: 0,
    angle: 0,
    width: 60,
    height: 20,
    onGround: true,
    thrust: false,
  };

  runwayStart = 0;
  runwayEnd = 400;
  landingRunwayStart = levelLength - 800;

  generateMountains();
  generateObstacles();
  generateClouds();
}

function generateMountains() {
  mountains = [];
  for (let x = 0; x < levelLength + width; x += random(150, 300)) {
    mountains.push({
      x: x,
      w: random(200, 400),
      h: random(100, 250),
      shade: random(30, 60),
    });
  }
}

function generateObstacles() {
  let safeZoneEnd = runwayEnd + 300;
  let landingZoneStart = landingRunwayStart - 300;
  let buildingCount = 6 + level * 3;
  let birdCount = 24 + level * 8;

  for (let i = 0; i < buildingCount; i++) {
    let ox = random(safeZoneEnd, landingZoneStart);
    let h = random(80, 200 + level * 20);
    obstacles.push({
      type: "building",
      x: ox,
      y: groundY - h,
      w: random(40, 70),
      h: h,
      color: [random(60, 120), random(60, 120), random(80, 140)],
    });
  }

  for (let i = 0; i < birdCount; i++) {
    let ox = random(safeZoneEnd, landingZoneStart);
    obstacles.push({
      type: "bird",
      x: ox,
      y: random(60, groundY - 100),
      w: 30,
      h: 15,
      wingPhase: random(TWO_PI),
    });
  }
}


function generateClouds() {
  for (let i = 0; i < 15; i++) {
    clouds.push({
      x: random(-200, levelLength + width),
      y: random(30, groundY - 200),
      w: random(80, 200),
      h: random(30, 60),
      speed: random(0.2, 0.5),
    });
  }
}

function draw() {
  drawSky();
  push();
  translate(-scrollX * 0.3, 0);
  drawMountains();
  pop();

  push();
  translate(-scrollX * 0.5, 0);
  drawClouds();
  pop();

  push();
  translate(-scrollX, 0);
  drawGround();
  drawRunway(runwayStart, runwayEnd);
  drawRunway(landingRunwayStart, landingRunwayStart + 800);
  drawObstacles();
  pop();

  if (state === "start") {
    drawPlane();
    drawStartScreen();
  } else if (state === "flying") {
    updatePlane();
    checkCollisions();
    drawPlane();
    drawHUD();
    scrollX += speed;
  } else if (state === "crashed") {
    updateCrashParticles();
    drawCrashParticles();
    drawCrashScreen();
  } else if (state === "landed") {
    drawPlane();
    levelCompleteTimer++;
    drawLandedScreen();
    if (levelCompleteTimer > 120) {
      level++;
      state = "start";
      resetLevel();
    }
  }
}

function drawSky() {
  for (let y = 0; y < height; y++) {
    let t = map(y, 0, height, 0, 1);
    let r = lerp(100, 200, t);
    let g = lerp(180, 220, t);
    let b = lerp(255, 240, t);
    stroke(r, g, b);
    line(0, y, width, y);
  }
}

function drawMountains() {
  for (let m of mountains) {
    fill(m.shade, m.shade + 20, m.shade + 10);
    noStroke();
    triangle(
      m.x, groundY,
      m.x + m.w / 2, groundY - m.h,
      m.x + m.w, groundY
    );
    fill(m.shade + 15, m.shade + 35, m.shade + 25);
    triangle(
      m.x + m.w * 0.3, groundY,
      m.x + m.w / 2, groundY - m.h,
      m.x + m.w * 0.7, groundY - m.h * 0.5
    );
  }
}

function drawClouds() {
  for (let c of clouds) {
    fill(255, 255, 255, 180);
    noStroke();
    ellipse(c.x, c.y, c.w, c.h);
    ellipse(c.x - c.w * 0.25, c.y + 5, c.w * 0.6, c.h * 0.7);
    ellipse(c.x + c.w * 0.25, c.y + 5, c.w * 0.7, c.h * 0.8);
  }
}

function drawGround() {
  fill(80, 160, 80);
  noStroke();
  rect(-500, groundY, levelLength + 2000, height - groundY + 100);

  fill(70, 140, 70);
  for (let x = -500; x < levelLength + 1000; x += 60) {
    ellipse(x, groundY, 80, 20);
  }
}

function drawRunway(start, end) {
  fill(60);
  noStroke();
  rect(start, groundY - 5, end - start, 10);

  fill(255, 255, 255);
  for (let x = start + 20; x < end - 20; x += 40) {
    rect(x, groundY - 2, 20, 4);
  }

  fill(255, 50, 50);
  rect(start, groundY - 8, 5, 16);
  rect(end - 5, groundY - 8, 5, 16);
}

function drawObstacles() {
  for (let o of obstacles) {
    if (o.type === "building") {
      fill(o.color[0], o.color[1], o.color[2]);
      noStroke();
      rect(o.x, o.y, o.w, o.h);

      fill(255, 220, 80, 180);
      for (let wy = o.y + 10; wy < o.y + o.h - 10; wy += 25) {
        for (let wx = o.x + 8; wx < o.x + o.w - 8; wx += 15) {
          rect(wx, wy, 8, 12);
        }
      }
    } else if (o.type === "bird") {
      let flap = sin(frameCount * 0.15 + o.wingPhase) * 10;
      push();
      translate(o.x, o.y);
      fill(40);
      noStroke();
      ellipse(0, 0, 15, 8);
      stroke(40);
      strokeWeight(2);
      noFill();
      arc(-10, -2, 20, flap, PI, TWO_PI);
      arc(10, -2, 20, flap, PI, TWO_PI);
      pop();
    }
  }
}

function drawPlane() {
  push();
  translate(plane.x, plane.y);
  rotate(plane.angle);

  fill(220, 60, 60);
  noStroke();
  beginShape();
  vertex(30, 0);
  vertex(-25, -8);
  vertex(-30, -5);
  vertex(-30, 5);
  vertex(-25, 8);
  endShape(CLOSE);

  fill(180, 40, 40);
  beginShape();
  vertex(-20, -8);
  vertex(-30, -22);
  vertex(-28, -22);
  vertex(-15, -8);
  endShape(CLOSE);

  beginShape();
  vertex(-20, 8);
  vertex(-30, 22);
  vertex(-28, 22);
  vertex(-15, 8);
  endShape(CLOSE);

  fill(240, 240, 240);
  beginShape();
  vertex(-5, -6);
  vertex(-18, -18);
  vertex(-15, -18);
  vertex(0, -6);
  endShape(CLOSE);

  beginShape();
  vertex(-5, 6);
  vertex(-18, 18);
  vertex(-15, 18);
  vertex(0, 6);
  endShape(CLOSE);

  fill(180, 220, 255, 200);
  ellipse(20, -2, 12, 8);

  if (plane.thrust && frameCount % 4 < 2) {
    fill(255, 150, 0);
    noStroke();
    triangle(-30, -3, -30, 3, -40 - random(5), 0);
  }

  pop();
}

function updatePlane() {
  let lift = 0;
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) {
    lift = -0.6;
    plane.thrust = true;
  } else if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) {
    lift = 0.4;
    plane.thrust = false;
  } else {
    plane.thrust = false;
  }

  plane.vy += 0.2 + lift;
  plane.vy = constrain(plane.vy, -7, 8);
  plane.y += plane.vy;

  plane.angle = plane.vy * 0.04;

  if (plane.y < 20) {
    plane.y = 20;
    plane.vy = 0;
  }

  if (plane.y >= groundY - 20) {
    plane.y = groundY - 20;
    let planeWorldX = plane.x + scrollX;
    let onLandingRunway =
      planeWorldX > landingRunwayStart &&
      planeWorldX < landingRunwayStart + 800;

    if (onLandingRunway && plane.vy < 5 && abs(plane.angle) < 0.5) {
      state = "landed";
      levelCompleteTimer = 0;
      plane.vy = 0;
      plane.angle = 0;
    } else {
      triggerCrash();
    }
  }

  if (scrollX > levelLength) {
    triggerCrash();
  }

  plane.onGround = plane.y >= groundY - 20;
}

function checkCollisions() {
  let px = plane.x + scrollX;
  let py = plane.y;

  for (let o of obstacles) {
    let hit = false;
    if (o.type === "building") {
      hit =
        px + 25 > o.x &&
        px - 25 < o.x + o.w &&
        py + 8 > o.y &&
        py - 8 < o.y + o.h;
    } else if (o.type === "bird") {
      hit = dist(px, py, o.x, o.y) < 25;
    }
    if (hit) {
      triggerCrash();
      return;
    }
  }
}

function triggerCrash() {
  state = "crashed";
  for (let i = 0; i < 30; i++) {
    crashParticles.push({
      x: plane.x,
      y: plane.y,
      vx: random(-5, 5),
      vy: random(-8, 2),
      size: random(4, 12),
      color: random() < 0.5 ? color(255, 100, 0) : color(255, 200, 0),
      life: 1.0,
    });
  }
}

function updateCrashParticles() {
  for (let i = crashParticles.length - 1; i >= 0; i--) {
    let p = crashParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life -= 0.02;
    if (p.life <= 0) crashParticles.splice(i, 1);
  }
}

function drawCrashParticles() {
  for (let p of crashParticles) {
    noStroke();
    let c = color(
      red(p.color), green(p.color), blue(p.color), p.life * 255
    );
    fill(c);
    circle(p.x, p.y, p.size * p.life);
  }
}

function drawHUD() {
  noStroke();
  fill(0, 0, 0, 100);
  rect(10, 10, 200, 70, 10);

  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  text("Level " + level, 20, 18);

  textStyle(NORMAL);
  textSize(13);
  let alt = max(0, floor(groundY - plane.y));
  text("Altitude: " + alt + " ft", 20, 40);

  let progress = constrain(scrollX / levelLength, 0, 1);
  text("Distance: " + floor(progress * 100) + "%", 20, 58);

  fill(100);
  rect(width - 160, 15, 140, 10, 5);
  fill(100, 220, 100);
  rect(width - 160, 15, 140 * progress, 10, 5);

  if (progress > 0.75) {
    fill(255, 220, 100, 150 + 100 * sin(frameCount * 0.1));
    textAlign(CENTER);
    textSize(16);
    text("Runway ahead! Prepare to land!", width / 2, height - 120);
  }
}

function drawStartScreen() {
  fill(0, 0, 0, 120);
  noStroke();
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(255);
  textSize(48);
  textStyle(BOLD);
  text("Sky Pilot", width / 2, height / 2 - 60);

  fill(220);
  textSize(22);
  textStyle(NORMAL);
  text("Level " + level, width / 2, height / 2 - 10);

  textSize(18);
  fill(200);
  text("Use UP/DOWN arrows to fly", width / 2, height / 2 + 30);
  text("Take off, avoid obstacles, and land safely!", width / 2, height / 2 + 58);

  fill(255, 220, 100, 180 + 70 * sin(frameCount * 0.08));
  textSize(22);
  text("Press SPACE to start", width / 2, height / 2 + 110);
}

function drawCrashScreen() {
  fill(0, 0, 0, min(150, frameCount * 2));
  noStroke();
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(255, 80, 80);
  textSize(48);
  textStyle(BOLD);
  text("Crashed!", width / 2, height / 2 - 30);

  fill(255);
  textSize(22);
  textStyle(NORMAL);
  text("You made it " + floor((scrollX / levelLength) * 100) + "% of the way", width / 2, height / 2 + 20);

  fill(200);
  textSize(18);
  text("Press SPACE to try again", width / 2, height / 2 + 65);
}

function drawLandedScreen() {
  fill(0, 0, 0, 120);
  noStroke();
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(100, 255, 100);
  textSize(48);
  textStyle(BOLD);
  text("Perfect Landing!", width / 2, height / 2 - 40);

  fill(255);
  textSize(24);
  textStyle(NORMAL);
  text("Level " + level + " complete!", width / 2, height / 2 + 15);

  fill(200);
  textSize(18);
  text("Next level starting soon...", width / 2, height / 2 + 55);
}

function keyPressed() {
  if (key === " ") {
    if (state === "start") {
      state = "flying";
      plane.vy = -3;
    } else if (state === "crashed") {
      state = "start";
      resetLevel();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  groundY = height - 80;
}
