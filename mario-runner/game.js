// Super Runner - A Mario-style side-scrolling platformer
// Built with p5.js for Norah's Games

// ── Game constants ──────────────────────────────────────────────
const CANVAS_W = 800;
const CANVAS_H = 500;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const BASE_SPEED = 3.5;
const GROUND_Y = CANVAS_H - 60; // top of ground
const PLAYER_W = 28;
const PLAYER_H = 36;

// ── Game state ──────────────────────────────────────────────────
let state = "start"; // start | playing | gameover
let score = 0;
let highScore = 0;
let distance = 0;
let speed = BASE_SPEED;
let cameraX = 0;
let frameCount_ = 0; // our own frame counter for animations

// Player
let player;

// World objects
let platforms = [];
let coins = [];
let enemies = [];
let clouds = [];
let bgMountains = [];

// Platform generation
let lastPlatformEnd = 0;
const PLATFORM_MIN_W = 120;
const PLATFORM_MAX_W = 300;
const GAP_MIN = 60;
const GAP_MAX = 140;

// ── Setup & Draw ────────────────────────────────────────────────
function setup() {
  createCanvas(CANVAS_W, CANVAS_H);
  textFont("monospace");
  loadHighScore();
  generateInitialWorld();
  resetGame();
}

function draw() {
  if (state === "start") {
    drawStartScreen();
  } else if (state === "playing") {
    updateGame();
    drawGame();
  } else if (state === "gameover") {
    drawGame();
    drawGameOverScreen();
  }
}

// ── Start Screen ────────────────────────────────────────────────
function drawStartScreen() {
  // Sky
  drawSkyGradient();
  drawCloudsStatic();

  // Ground
  fill(76, 153, 0);
  noStroke();
  rect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
  fill(139, 90, 43);
  rect(0, GROUND_Y, CANVAS_W, 8);

  // Title
  push();
  textAlign(CENTER, CENTER);
  textSize(52);
  fill(255, 220, 50);
  stroke(0);
  strokeWeight(4);
  text("SUPER RUNNER", CANVAS_W / 2, 120);

  // Character preview
  pop();
  drawPlayerCharacter(CANVAS_W / 2 - 14, 200, 0, false);

  // Instructions
  push();
  textAlign(CENTER, CENTER);
  textSize(18);
  fill(255);
  noStroke();
  text("Jump over gaps, stomp enemies, collect stars!", CANVAS_W / 2, 280);

  textSize(15);
  fill(200, 220, 255);
  text("Press SPACE, UP, or Tap to JUMP", CANVAS_W / 2, 320);

  // Blink prompt
  if (Math.floor(millis() / 600) % 2 === 0) {
    textSize(22);
    fill(255, 220, 50);
    text("Press SPACE or Tap to Start!", CANVAS_W / 2, 400);
  }

  textSize(14);
  fill(180);
  text("High Score: " + highScore, CANVAS_W / 2, 450);
  pop();
}

// ── Game Over Screen ────────────────────────────────────────────
function drawGameOverScreen() {
  // Dim overlay
  fill(0, 0, 0, 150);
  rect(0, 0, CANVAS_W, CANVAS_H);

  push();
  textAlign(CENTER, CENTER);

  textSize(48);
  fill(255, 80, 80);
  stroke(0);
  strokeWeight(3);
  text("GAME OVER", CANVAS_W / 2, 150);

  noStroke();
  textSize(24);
  fill(255);
  text("Score: " + score, CANVAS_W / 2, 230);

  if (score >= highScore && score > 0) {
    textSize(20);
    fill(255, 220, 50);
    text("NEW HIGH SCORE!", CANVAS_W / 2, 270);
  } else {
    textSize(18);
    fill(180);
    text("High Score: " + highScore, CANVAS_W / 2, 270);
  }

  if (Math.floor(millis() / 600) % 2 === 0) {
    textSize(20);
    fill(255, 220, 50);
    text("Press SPACE or Tap to Restart", CANVAS_W / 2, 360);
  }
  pop();
}

// ── Game Update ─────────────────────────────────────────────────
function updateGame() {
  frameCount_++;

  // Gradually increase speed
  speed = BASE_SPEED + distance * 0.00008;
  if (speed > 8) speed = 8;

  distance += speed;
  cameraX += speed;

  updatePlayer();
  updateEnemies();
  updateCoins();
  generateAhead();
  cleanupBehind();
}

// ── Player ──────────────────────────────────────────────────────
function resetPlayer() {
  player = {
    x: 150,
    y: GROUND_Y - PLAYER_H,
    vy: 0,
    onGround: false,
    alive: true,
    walkFrame: 0,
    squishTimer: 0,
  };
}

function updatePlayer() {
  // Apply gravity
  player.vy += GRAVITY;
  player.y += player.vy;

  player.onGround = false;

  // World-x of player
  let px = player.x + cameraX;

  // Check platform collisions (land on top)
  for (let p of platforms) {
    if (
      px + PLAYER_W > p.x &&
      px < p.x + p.w &&
      player.y + PLAYER_H >= p.y &&
      player.y + PLAYER_H <= p.y + 15 &&
      player.vy >= 0
    ) {
      player.y = p.y - PLAYER_H;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // Ground collision (ground is a special platform at GROUND_Y)
  // The ground has gaps, so only collide where platforms exist at ground level
  // Actually, let's check if player is above ground-level platform
  // If player falls below screen => game over
  if (player.y > CANVAS_H + 50) {
    gameOver();
    return;
  }

  // Walk animation
  if (player.onGround) {
    if (frameCount_ % 6 === 0) {
      player.walkFrame = (player.walkFrame + 1) % 4;
    }
  }

  // Squish animation timer
  if (player.squishTimer > 0) player.squishTimer--;

  // Enemy collision
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    if (!e.alive) continue;
    let ex = e.x - cameraX;
    let ey = e.y;

    // Bounding box overlap
    if (
      player.x + PLAYER_W > ex + 4 &&
      player.x < ex + e.w - 4 &&
      player.y + PLAYER_H > ey + 4 &&
      player.y < ey + e.h
    ) {
      // Stomping from above?
      if (player.vy > 0 && player.y + PLAYER_H < ey + e.h * 0.5) {
        // Stomp!
        e.alive = false;
        e.squished = true;
        e.squishTimer = 20;
        player.vy = JUMP_FORCE * 0.6;
        player.squishTimer = 5;
        score += 100;
      } else {
        // Hit from side
        gameOver();
        return;
      }
    }
  }

  // Coin collection
  for (let i = coins.length - 1; i >= 0; i--) {
    let c = coins[i];
    if (c.collected) continue;
    let cx = c.x - cameraX;
    let cy = c.y;
    let d = dist(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, cx, cy);
    if (d < 22) {
      c.collected = true;
      c.collectTimer = 15;
      score += 50;
    }
  }
}

function gameOver() {
  state = "gameover";
  player.alive = false;
  if (score > highScore) {
    highScore = score;
    saveHighScore();
  }
}

// ── Enemy Update ────────────────────────────────────────────────
function updateEnemies() {
  for (let e of enemies) {
    if (!e.alive) continue;
    e.x += e.dir * e.speed;
    // Reverse at patrol bounds
    if (e.x <= e.patrolLeft || e.x + e.w >= e.patrolRight) {
      e.dir *= -1;
    }
    // Walk animation
    if (frameCount_ % 8 === 0) {
      e.walkFrame = (e.walkFrame + 1) % 2;
    }
  }
}

// ── Coin Update ─────────────────────────────────────────────────
function updateCoins() {
  for (let c of coins) {
    if (c.collected && c.collectTimer > 0) {
      c.collectTimer--;
    }
  }
}

// ── World Generation ────────────────────────────────────────────
function generateInitialWorld() {
  clouds = [];
  bgMountains = [];
  platforms = [];
  coins = [];
  enemies = [];
  lastPlatformEnd = 0;

  // Starting clouds
  for (let i = 0; i < 12; i++) {
    clouds.push({
      x: random(-100, CANVAS_W + 800),
      y: random(30, 180),
      w: random(60, 140),
      speed: random(0.2, 0.5),
    });
  }

  // Background mountains
  for (let i = 0; i < 20; i++) {
    bgMountains.push({
      x: i * 200 + random(-30, 30),
      h: random(60, 150),
      w: random(120, 250),
    });
  }

  // Starting safe ground platform (long)
  platforms.push({ x: -100, y: GROUND_Y, w: 600, isGround: true });
  lastPlatformEnd = 500;

  // Generate more
  for (let i = 0; i < 30; i++) {
    generateNextSegment();
  }
}

function generateNextSegment() {
  // Gap size increases slightly with distance
  let gapRange = GAP_MIN + Math.min(distance * 0.005, 40);
  let gap = random(GAP_MIN, Math.min(gapRange, GAP_MAX));

  let pw = random(PLATFORM_MIN_W, PLATFORM_MAX_W);
  let px = lastPlatformEnd + gap;

  // Decide platform height: mostly ground, sometimes elevated
  let py = GROUND_Y;
  let isGround = true;

  if (random() < 0.25 && distance > 200) {
    // Elevated platform
    py = GROUND_Y - random(50, 130);
    pw = random(80, 180);
    isGround = false;
  }

  platforms.push({ x: px, y: py, w: pw, isGround: isGround });

  // Add coins above platform
  if (random() < 0.6) {
    let numCoins = floor(random(1, 5));
    let coinStartX = px + 20;
    let coinSpacing = Math.min(35, (pw - 40) / numCoins);
    for (let i = 0; i < numCoins; i++) {
      let cx = coinStartX + i * coinSpacing;
      if (cx < px + pw - 10) {
        coins.push({
          x: cx,
          y: py - 40,
          collected: false,
          collectTimer: 0,
        });
      }
    }
  }

  // Add enemy on platform
  if (random() < 0.3 && pw > 100 && distance > 300) {
    let ex = px + random(20, pw - 50);
    enemies.push({
      x: ex,
      y: py - 24,
      w: 26,
      h: 24,
      dir: random() < 0.5 ? 1 : -1,
      speed: random(0.5, 1.2),
      patrolLeft: px + 10,
      patrolRight: px + pw - 10,
      alive: true,
      squished: false,
      squishTimer: 0,
      walkFrame: 0,
    });
  }

  lastPlatformEnd = px + pw;
}

function generateAhead() {
  // Keep generating platforms ahead of camera
  while (lastPlatformEnd < cameraX + CANVAS_W + 600) {
    generateNextSegment();
  }

  // Keep clouds cycling
  for (let c of clouds) {
    if (c.x + c.w < cameraX * c.speed - 200) {
      c.x = cameraX * c.speed + CANVAS_W + random(50, 200);
      c.y = random(30, 180);
      c.w = random(60, 140);
    }
  }
}

function cleanupBehind() {
  // Remove objects far behind camera
  platforms = platforms.filter((p) => p.x + p.w > cameraX - 200);
  coins = coins.filter(
    (c) => c.x > cameraX - 200 && (!c.collected || c.collectTimer > 0)
  );
  enemies = enemies.filter(
    (e) => e.x + e.w > cameraX - 200 && (e.alive || e.squishTimer > 0)
  );
}

// ── Drawing ─────────────────────────────────────────────────────
function drawGame() {
  drawSkyGradient();
  drawMountains();
  drawCloudsParallax();
  drawPlatforms();
  drawCoins();
  drawEnemies();
  drawPlayer();
  drawHUD();
}

function drawSkyGradient() {
  noStroke();
  // Gradient sky
  for (let y = 0; y < CANVAS_H; y++) {
    let t = y / CANVAS_H;
    let r = lerp(100, 200, t);
    let g = lerp(160, 220, t);
    let b = lerp(255, 255, t);
    stroke(r, g, b);
    line(0, y, CANVAS_W, y);
  }
  noStroke();
}

function drawMountains() {
  // Parallax background mountains
  fill(120, 180, 120, 100);
  noStroke();
  for (let m of bgMountains) {
    let sx = m.x - cameraX * 0.15;
    // Wrap mountains
    let wrappedX = ((sx % 2000) + 2000) % 2000 - 200;
    triangle(
      wrappedX,
      GROUND_Y + 20,
      wrappedX + m.w / 2,
      GROUND_Y - m.h,
      wrappedX + m.w,
      GROUND_Y + 20
    );
  }
}

function drawCloudsParallax() {
  fill(255, 255, 255, 200);
  noStroke();
  for (let c of clouds) {
    let sx = c.x - cameraX * c.speed;
    // Wrap
    let wrappedX = ((sx % 1200) + 1200) % 1200 - 200;
    drawCloud(wrappedX, c.y, c.w);
  }
}

function drawCloudsStatic() {
  fill(255, 255, 255, 180);
  noStroke();
  drawCloud(80, 80, 100);
  drawCloud(350, 50, 130);
  drawCloud(600, 100, 90);
  drawCloud(200, 140, 70);
}

function drawCloud(x, y, w) {
  let h = w * 0.35;
  ellipse(x, y, w * 0.5, h * 0.7);
  ellipse(x + w * 0.2, y - h * 0.2, w * 0.6, h);
  ellipse(x + w * 0.5, y, w * 0.5, h * 0.8);
  ellipse(x + w * 0.25, y + h * 0.1, w * 0.7, h * 0.5);
}

function drawPlatforms() {
  for (let p of platforms) {
    let sx = p.x - cameraX;
    // Only draw visible
    if (sx + p.w < -50 || sx > CANVAS_W + 50) continue;

    if (p.isGround) {
      // Ground-level platform: dirt with grass top
      // Dirt body
      fill(139, 90, 43);
      noStroke();
      rect(sx, p.y + 8, p.w, CANVAS_H - p.y);

      // Grass top
      fill(76, 153, 0);
      rect(sx, p.y, p.w, 12);

      // Grass tufts
      fill(50, 130, 0);
      for (let tx = sx; tx < sx + p.w; tx += 16) {
        triangle(tx, p.y + 2, tx + 5, p.y - 4, tx + 10, p.y + 2);
      }

      // Dirt texture dots
      fill(120, 75, 35);
      for (let dx = sx + 10; dx < sx + p.w - 10; dx += 25) {
        for (let dy = p.y + 20; dy < Math.min(p.y + 80, CANVAS_H); dy += 18) {
          ellipse(dx + random(-3, 3), dy, 4, 4);
        }
      }
    } else {
      // Floating platform: brick-like
      // Main body
      fill(180, 120, 60);
      noStroke();
      rect(sx, p.y, p.w, 20, 3);

      // Top grass
      fill(76, 153, 0);
      rect(sx, p.y, p.w, 8, 3, 3, 0, 0);

      // Bottom edge
      fill(140, 90, 40);
      rect(sx + 2, p.y + 16, p.w - 4, 4);

      // Brick lines
      stroke(160, 100, 50);
      strokeWeight(1);
      for (let bx = sx + 20; bx < sx + p.w - 5; bx += 20) {
        line(bx, p.y + 8, bx, p.y + 20);
      }
      noStroke();
    }
  }
}

function drawCoins() {
  for (let c of coins) {
    let sx = c.x - cameraX;
    if (sx < -30 || sx > CANVAS_W + 30) continue;

    if (c.collected) {
      // Float-up animation
      if (c.collectTimer > 0) {
        let alpha = (c.collectTimer / 15) * 255;
        let floatY = c.y - (15 - c.collectTimer) * 2;
        drawStar(sx, floatY, 8, alpha);
      }
    } else {
      // Bobbing animation
      let bob = sin(frameCount_ * 0.08 + c.x * 0.01) * 3;
      drawStar(sx, c.y + bob, 10, 255);
    }
  }
}

function drawStar(x, y, r, alpha) {
  push();
  fill(255, 220, 50, alpha);
  stroke(255, 180, 0, alpha);
  strokeWeight(1);
  // 5-pointed star
  beginShape();
  for (let i = 0; i < 10; i++) {
    let angle = (TWO_PI / 10) * i - HALF_PI;
    let rad = i % 2 === 0 ? r : r * 0.45;
    vertex(x + cos(angle) * rad, y + sin(angle) * rad);
  }
  endShape(CLOSE);
  // Sparkle
  fill(255, 255, 200, alpha * 0.7);
  noStroke();
  ellipse(x - 2, y - 2, 3, 3);
  pop();
}

function drawEnemies() {
  for (let e of enemies) {
    let sx = e.x - cameraX;
    if (sx < -50 || sx > CANVAS_W + 50) continue;

    if (e.squished) {
      if (e.squishTimer > 0) {
        // Flat squished enemy
        push();
        fill(180, 50, 50);
        noStroke();
        ellipse(sx + e.w / 2, e.y + e.h - 4, e.w, 8);
        pop();
        e.squishTimer--;
      }
      continue;
    }

    if (!e.alive) continue;

    drawGoomba(sx, e.y, e.w, e.h, e.dir, e.walkFrame);
  }
}

function drawGoomba(x, y, w, h, dir, walkFrame) {
  push();
  // Body
  fill(180, 70, 50);
  noStroke();
  ellipse(x + w / 2, y + h * 0.6, w, h * 0.8);

  // Head cap
  fill(160, 50, 30);
  arc(x + w / 2, y + h * 0.35, w + 4, h * 0.7, PI, TWO_PI);

  // Eyes
  fill(255);
  let eyeOffset = dir > 0 ? 2 : -2;
  ellipse(x + w * 0.32 + eyeOffset, y + h * 0.4, 8, 9);
  ellipse(x + w * 0.68 + eyeOffset, y + h * 0.4, 8, 9);

  // Pupils (angry)
  fill(0);
  ellipse(x + w * 0.32 + eyeOffset + dir * 1.5, y + h * 0.42, 4, 5);
  ellipse(x + w * 0.68 + eyeOffset + dir * 1.5, y + h * 0.42, 4, 5);

  // Angry eyebrows
  stroke(0);
  strokeWeight(2);
  line(
    x + w * 0.2 + eyeOffset,
    y + h * 0.28,
    x + w * 0.42 + eyeOffset,
    y + h * 0.33
  );
  line(
    x + w * 0.58 + eyeOffset,
    y + h * 0.33,
    x + w * 0.8 + eyeOffset,
    y + h * 0.28
  );
  noStroke();

  // Feet
  fill(50);
  let footBob = walkFrame === 0 ? 0 : 2;
  ellipse(x + w * 0.3, y + h - 2 + footBob, 10, 6);
  ellipse(x + w * 0.7, y + h - 2 - footBob, 10, 6);
  pop();
}

function drawPlayer() {
  drawPlayerCharacter(
    player.x,
    player.y,
    player.walkFrame,
    !player.onGround
  );
}

function drawPlayerCharacter(x, y, walkFrame, jumping) {
  push();
  let bobY = 0;
  if (!jumping && state === "playing") {
    bobY = walkFrame % 2 === 0 ? 0 : -2;
  }

  // Shadow
  if (state === "playing") {
    fill(0, 0, 0, 40);
    noStroke();
    ellipse(x + PLAYER_W / 2, y + PLAYER_H + 2, PLAYER_W * 0.8, 6);
  }

  let drawY = y + bobY;

  // Body (blue overalls)
  fill(60, 100, 220);
  noStroke();
  rect(x + 4, drawY + 14, PLAYER_W - 8, 14, 2);

  // Shirt (red)
  fill(220, 60, 60);
  rect(x + 2, drawY + 10, PLAYER_W - 4, 10, 2);

  // Head (skin)
  fill(255, 200, 150);
  ellipse(x + PLAYER_W / 2, drawY + 8, 20, 18);

  // Hat (red cap)
  fill(220, 40, 40);
  arc(x + PLAYER_W / 2, drawY + 4, 22, 12, PI, TWO_PI);
  rect(x + PLAYER_W / 2 - 2, drawY - 1, 14, 5, 2);

  // Eyes
  fill(0);
  ellipse(x + PLAYER_W / 2 + 3, drawY + 7, 4, 5);
  // Eye shine
  fill(255);
  ellipse(x + PLAYER_W / 2 + 4, drawY + 6, 1.5, 1.5);

  // Mouth (small smile)
  noFill();
  stroke(0);
  strokeWeight(1.5);
  arc(x + PLAYER_W / 2 + 2, drawY + 12, 6, 4, 0, PI);
  noStroke();

  // Arms
  fill(220, 60, 60);
  if (jumping) {
    // Arms up when jumping
    rect(x - 2, drawY + 8, 6, 4, 2);
    rect(x + PLAYER_W - 4, drawY + 6, 6, 4, 2);
    // Hands
    fill(255, 200, 150);
    ellipse(x, drawY + 8, 5, 5);
    ellipse(x + PLAYER_W, drawY + 6, 5, 5);
  } else {
    // Walking arm swing
    let armSwing = walkFrame < 2 ? 2 : -2;
    rect(x - 2, drawY + 12 + armSwing, 6, 4, 2);
    rect(x + PLAYER_W - 4, drawY + 12 - armSwing, 6, 4, 2);
    // Hands
    fill(255, 200, 150);
    ellipse(x, drawY + 14 + armSwing, 5, 5);
    ellipse(x + PLAYER_W, drawY + 14 - armSwing, 5, 5);
  }

  // Legs/shoes
  fill(80, 50, 20);
  if (jumping) {
    // Legs tucked
    rect(x + 6, drawY + 28, 7, 6, 2);
    rect(x + PLAYER_W - 13, drawY + 28, 7, 6, 2);
  } else {
    // Walking
    let legOffset = walkFrame < 2 ? 3 : -3;
    rect(x + 5 + legOffset, drawY + 28, 8, 8, 2);
    rect(x + PLAYER_W - 13 - legOffset, drawY + 28, 8, 8, 2);
  }

  pop();
}

function drawHUD() {
  push();
  // Score
  textAlign(LEFT, TOP);
  textSize(20);
  fill(255);
  stroke(0);
  strokeWeight(3);
  text("Score: " + score, 15, 15);

  // Distance
  textAlign(CENTER, TOP);
  textSize(14);
  fill(200);
  text(Math.floor(distance) + "m", CANVAS_W / 2, 15);

  // High score
  textAlign(RIGHT, TOP);
  textSize(14);
  fill(255, 220, 100);
  text("Best: " + highScore, CANVAS_W - 15, 15);
  pop();
}

// ── Input Handling ──────────────────────────────────────────────
function keyPressed() {
  if (keyCode === 32 || keyCode === UP_ARROW) {
    handleAction();
    return false; // prevent scrolling
  }
}

function mousePressed() {
  handleAction();
}

function touchStarted() {
  handleAction();
  return false; // prevent default
}

function handleAction() {
  if (state === "start") {
    resetGame();
    state = "playing";
  } else if (state === "playing") {
    jump();
  } else if (state === "gameover") {
    resetGame();
    state = "playing";
  }
}

function jump() {
  if (player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }
}

// ── Game Reset ──────────────────────────────────────────────────
function resetGame() {
  score = 0;
  distance = 0;
  speed = BASE_SPEED;
  cameraX = 0;
  frameCount_ = 0;
  platforms = [];
  coins = [];
  enemies = [];
  lastPlatformEnd = 0;

  // Regenerate world
  generateInitialWorld();
  resetPlayer();
}

// ── High Score ──────────────────────────────────────────────────
function loadHighScore() {
  try {
    let saved = localStorage.getItem("superrunner_highscore");
    if (saved) highScore = parseInt(saved);
  } catch (e) {
    // localStorage not available
  }
}

function saveHighScore() {
  try {
    localStorage.setItem("superrunner_highscore", highScore.toString());
  } catch (e) {
    // localStorage not available
  }
}
