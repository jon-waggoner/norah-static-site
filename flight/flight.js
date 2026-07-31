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
let planeImg;
let touchActive = false;
let stars = [];
let tanks = [];
let projectiles = [];

function preload() {
  planeImg = loadImage("plane.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  groundY = height - 80;
  for (let i = 0; i < 150; i++) {
    stars.push({ x: random(width), y: random(groundY), size: random(1, 3), twinkle: random(TWO_PI) });
  }
  resetLevel();
}

function resetLevel() {
  speed = baseSpeed + (level - 1) * 0.5;
  scrollX = 0;
  obstacles = [];
  clouds = [];
  crashParticles = [];
  tanks = [];
  projectiles = [];

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

  let dragonCount = 8 + level * 3;
  for (let i = 0; i < dragonCount; i++) {
    let ox = random(safeZoneEnd, landingZoneStart);
    obstacles.push({
      type: "dragon",
      x: ox,
      y: random(60, groundY - 120),
      w: 50,
      h: 30,
      wingPhase: random(TWO_PI),
      fireTimer: random(60, 120),
      fireLength: 0,
    });
  }

  let tankCount = 4 + level * 2;
  for (let i = 0; i < tankCount; i++) {
    let tx = random(safeZoneEnd, landingZoneStart);
    tanks.push({
      x: tx,
      y: groundY,
      w: 50,
      h: 25,
      lastShot: 0,
      shootInterval: floor(random(90, 180)),
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
  drawTanks();
  pop();

  drawProjectiles();

  if (state === "start") {
    drawPlane();
    drawStartScreen();
  } else if (state === "flying") {
    updatePlane();
    updateTanks();
    updateProjectiles();
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
    let r = lerp(5, 25, t);
    let g = lerp(5, 15, t);
    let b = lerp(30, 60, t);
    stroke(r, g, b);
    line(0, y, width, y);
  }
  noStroke();
  for (let s of stars) {
    let brightness = 180 + 75 * sin(frameCount * 0.03 + s.twinkle);
    fill(255, 255, 220, brightness);
    circle(s.x, s.y, s.size);
  }
}

function drawMountains() {
  for (let m of mountains) {
    fill(m.shade * 0.4, m.shade * 0.4 + 10, m.shade * 0.4 + 5);
    noStroke();
    triangle(
      m.x, groundY,
      m.x + m.w / 2, groundY - m.h,
      m.x + m.w, groundY
    );
    fill(m.shade * 0.5, m.shade * 0.5 + 12, m.shade * 0.5 + 8);
    triangle(
      m.x + m.w * 0.3, groundY,
      m.x + m.w / 2, groundY - m.h,
      m.x + m.w * 0.7, groundY - m.h * 0.5
    );
  }
}

function drawClouds() {
  for (let c of clouds) {
    fill(60, 60, 80, 120);
    noStroke();
    ellipse(c.x, c.y, c.w, c.h);
    ellipse(c.x - c.w * 0.25, c.y + 5, c.w * 0.6, c.h * 0.7);
    ellipse(c.x + c.w * 0.25, c.y + 5, c.w * 0.7, c.h * 0.8);
  }
}

function drawGround() {
  fill(20, 50, 20);
  noStroke();
  rect(-500, groundY, levelLength + 2000, height - groundY + 100);

  fill(15, 40, 15);
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
    } else if (o.type === "dragon") {
      let flap = sin(frameCount * 0.1 + o.wingPhase) * 15;
      push();
      translate(o.x, o.y);

      // wings
      fill(80, 20, 20);
      noStroke();
      beginShape();
      vertex(0, -5);
      vertex(-20, -25 + flap);
      vertex(-10, -10 + flap * 0.5);
      vertex(0, -3);
      endShape(CLOSE);
      beginShape();
      vertex(0, -5);
      vertex(20, -25 + flap);
      vertex(10, -10 + flap * 0.5);
      vertex(0, -3);
      endShape(CLOSE);

      // body
      fill(60, 140, 40);
      ellipse(0, 0, 35, 16);

      // head
      fill(50, 120, 35);
      ellipse(20, -3, 16, 12);

      // eye
      fill(255, 200, 0);
      circle(24, -5, 4);
      fill(0);
      circle(24.5, -5, 2);

      // horns
      stroke(100, 80, 30);
      strokeWeight(2);
      line(18, -9, 15, -16);
      line(22, -9, 25, -16);
      noStroke();

      // tail
      fill(50, 110, 30);
      beginShape();
      vertex(-17, 0);
      vertex(-35, -8);
      vertex(-30, 0);
      vertex(-35, 8);
      endShape(CLOSE);

      // fire breath
      o.fireTimer--;
      if (o.fireTimer <= 0) {
        o.fireLength = min(o.fireLength + 2, 40);
        if (o.fireLength >= 40) {
          o.fireTimer = random(90, 160);
          o.fireLength = 0;
        }
      }
      if (o.fireLength > 0) {
        for (let f = 0; f < o.fireLength; f += 4) {
          let flicker = random(-3, 3);
          let alpha = map(f, 0, o.fireLength, 255, 50);
          let r = 255;
          let g = map(f, 0, o.fireLength, 200, 50);
          fill(r, g, 0, alpha);
          circle(28 + f, -3 + flicker, map(f, 0, o.fireLength, 8, 3));
        }
      }

      pop();
    }
  }
}

function drawPlane() {
  push();
  translate(plane.x, plane.y);
  rotate(plane.angle);
  imageMode(CENTER);
  image(planeImg, 0, 0, 120, 43);

  if (plane.thrust && frameCount % 4 < 2) {
    fill(255, 150, 0);
    noStroke();
    triangle(-60, -3, -60, 3, -70 - random(5), 0);
  }

  pop();
}

function updatePlane() {
  let lift = 0;
  if (keyIsDown(UP_ARROW) || keyIsDown(87) || touchActive) {
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
        px + 50 > o.x &&
        px - 50 < o.x + o.w &&
        py + 18 > o.y &&
        py - 18 < o.y + o.h;
    } else if (o.type === "dragon") {
      hit = dist(px, py, o.x, o.y) < 40;
      if (!hit && o.fireLength > 0) {
        for (let f = 0; f < o.fireLength; f += 8) {
          if (dist(px, py, o.x + 28 + f, o.y - 3) < 20) { hit = true; break; }
        }
      }
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

function drawTanks() {
  for (let t of tanks) {
    push();
    translate(t.x, t.y);
    // treads
    fill(90, 90, 80);
    noStroke();
    rect(-25, -8, 50, 10, 4);
    fill(70, 70, 60);
    for (let wx = -22; wx < 23; wx += 9) {
      circle(wx, -3, 8);
    }
    // body
    fill(130, 130, 110);
    rect(-20, -18, 40, 12, 3);
    // turret
    fill(110, 110, 95);
    ellipse(0, -22, 24, 14);
    // barrel
    stroke(100, 100, 85);
    strokeWeight(4);
    line(0, -24, 0, -40);
    noStroke();
    // red warning light
    fill(255, 40, 40, 180 + 75 * sin(frameCount * 0.1));
    circle(0, -22, 5);
    // muzzle flash
    if (frameCount - t.lastShot < 8) {
      fill(255, 220, 80, 240);
      circle(0, -42, 12);
      fill(255, 150, 30, 160);
      circle(0, -44, 18);
    }
    pop();
  }
}

function updateTanks() {
  for (let t of tanks) {
    let screenX = t.x - scrollX;
    if (screenX > -100 && screenX < width + 100) {
      if (frameCount - t.lastShot > t.shootInterval) {
        t.lastShot = frameCount;
        let dx = plane.x - screenX;
        let dy = plane.y - (t.y - 42);
        let angle = atan2(dy, dx) + random(-0.15, 0.15);
        let spd = 5 + random(2);
        projectiles.push({
          x: screenX,
          y: t.y - 42,
          vx: cos(angle) * spd,
          vy: sin(angle) * spd,
          life: 1.0,
        });
      }
    }
  }
}

function drawProjectiles() {
  for (let p of projectiles) {
    noStroke();
    fill(255, 50, 20, p.life * 120);
    circle(p.x, p.y, 18);
    fill(255, 80, 20, p.life * 200);
    circle(p.x, p.y, 10);
    fill(255, 200, 60, p.life * 255);
    circle(p.x, p.y, 5);
  }
}

function updateProjectiles() {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    let p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.008;
    if (p.life <= 0 || p.y < -20) {
      projectiles.splice(i, 1);
      continue;
    }
    if (dist(p.x, p.y, plane.x, plane.y) < 25) {
      projectiles.splice(i, 1);
      triggerCrash();
      return;
    }
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
  text("UP/DOWN arrows or tap and hold to fly", width / 2, height / 2 + 30);
  text("Take off, avoid obstacles, and land safely!", width / 2, height / 2 + 58);

  fill(255, 220, 100, 180 + 70 * sin(frameCount * 0.08));
  textSize(22);
  text("Press SPACE or tap to start", width / 2, height / 2 + 110);
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
  text("Press SPACE or tap to try again", width / 2, height / 2 + 65);
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

function touchStarted() {
  if (state === "start") {
    state = "flying";
    plane.vy = -3;
  } else if (state === "crashed") {
    state = "start";
    resetLevel();
  }
  touchActive = true;
  return false;
}

function touchEnded() {
  touchActive = false;
  return false;
}
