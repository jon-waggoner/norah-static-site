let stars = [];
let particles = [];
let score = 0;
let missed = 0;
let maxMissed = 5;
let gameOver = false;
let basketWidth = 80;
let starSpeed = 2;
let spawnRate = 60;
let frameCounter = 0;
let level = 1;
let bgStars = [];
let dogImg;
let floatingTexts = [];

function preload() {
  dogImg = loadImage("dog.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  noCursor();

  for (let i = 0; i < 150; i++) {
    bgStars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      twinkle: random(0.02, 0.05),
    });
  }
}

function draw() {
  drawBackground();

  if (gameOver) {
    drawGameOver();
    return;
  }

  frameCounter++;
  level = 1 + floor(score / 10);
  starSpeed = 2 + level * 0.5;
  spawnRate = max(20, 60 - level * 5);

  if (frameCounter % spawnRate === 0) {
    stars.push(makeStar());
  }

  for (let i = stars.length - 1; i >= 0; i--) {
    let s = stars[i];
    s.y += starSpeed;
    s.angle += s.spin;
    if (s.isDog) {
      drawDog(s);
    } else {
      drawStar(s);
    }

    if (catchesStar(s)) {
      score += s.points;
      if (s.isDog) {
        floatingTexts.push({ x: s.x, y: s.y, text: "+3", life: 1.0 });
      }
      spawnCatchParticles(s.x, s.y, s.isDog ? color(255, 200, 100) : s.color);
      stars.splice(i, 1);
    } else if (s.y > height + 20) {
      missed++;
      stars.splice(i, 1);
      if (missed >= maxMissed) {
        gameOver = true;
      }
    }
  }

  updateParticles();
  updateFloatingTexts();
  drawBasket();
  drawHUD();
}

function drawBackground() {
  background(10, 10, 46);

  for (let s of bgStars) {
    let brightness = 150 + 105 * sin(frameCount * s.twinkle);
    fill(brightness);
    noStroke();
    circle(s.x, s.y, s.size);
  }
}

function makeStar() {
  let colors = [
    color(255, 215, 0),
    color(255, 105, 180),
    color(0, 255, 200),
    color(150, 130, 255),
    color(255, 140, 50),
  ];
  let isDog = random() < 0.2;
  return {
    x: random(30, width - 30),
    y: -20,
    size: isDog ? 50 : random(18, 30),
    color: random(colors),
    angle: 0,
    spin: random(-0.05, 0.05),
    isDog: isDog,
    points: isDog ? 3 : 1,
  };
}

function drawStar(s) {
  push();
  translate(s.x, s.y);
  rotate(s.angle);
  fill(s.color);
  noStroke();
  beginShape();
  for (let i = 0; i < 10; i++) {
    let angle = (TWO_PI / 10) * i - HALF_PI;
    let r = i % 2 === 0 ? s.size : s.size * 0.45;
    vertex(cos(angle) * r, sin(angle) * r);
  }
  endShape(CLOSE);

  fill(255, 255, 255, 100);
  beginShape();
  for (let i = 0; i < 10; i++) {
    let angle = (TWO_PI / 10) * i - HALF_PI;
    let r = i % 2 === 0 ? s.size * 0.5 : s.size * 0.2;
    vertex(cos(angle) * r, sin(angle) * r);
  }
  endShape(CLOSE);
  pop();
}

function drawDog(s) {
  push();
  translate(s.x, s.y);
  rotate(s.angle);
  imageMode(CENTER);
  image(dogImg, 0, 0, s.size, s.size);
  pop();

  // golden glow around the dog
  push();
  noFill();
  stroke(255, 220, 100, 80 + 40 * sin(frameCount * 0.1));
  strokeWeight(2);
  circle(s.x, s.y, s.size + 10);
  pop();
}

function drawBasket() {
  let bx = constrain(mouseX, basketWidth / 2, width - basketWidth / 2);
  let by = height - 50;

  stroke(255);
  strokeWeight(3);
  noFill();
  arc(bx, by, basketWidth, 40, 0, PI);
  line(bx - basketWidth / 2, by, bx - basketWidth / 2 + 5, by - 15);
  line(bx + basketWidth / 2, by, bx + basketWidth / 2 - 5, by - 15);

  noStroke();
  fill(255, 255, 255, 30);
  arc(bx, by, basketWidth - 6, 34, 0, PI);

  fill(255, 220, 100, 150 + 50 * sin(frameCount * 0.1));
  noStroke();
  circle(bx, by - 18, 6);
}

function catchesStar(s) {
  let bx = constrain(mouseX, basketWidth / 2, width - basketWidth / 2);
  let by = height - 50;
  return (
    s.y > by - 25 &&
    s.y < by + 20 &&
    s.x > bx - basketWidth / 2 - 5 &&
    s.x < bx + basketWidth / 2 + 5
  );
}

function spawnCatchParticles(x, y, col) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: x,
      y: y,
      vx: random(-3, 3),
      vy: random(-5, -1),
      size: random(3, 8),
      color: col,
      life: 1.0,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.life -= 0.03;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    noStroke();
    let c = color(red(p.color), green(p.color), blue(p.color), p.life * 255);
    fill(c);
    circle(p.x, p.y, p.size * p.life);
  }
}

function updateFloatingTexts() {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    let ft = floatingTexts[i];
    ft.y -= 2;
    ft.life -= 0.02;
    if (ft.life <= 0) {
      floatingTexts.splice(i, 1);
      continue;
    }
    fill(255, 220, 100, ft.life * 255);
    noStroke();
    textSize(28);
    textStyle(BOLD);
    text(ft.text, ft.x, ft.y);
  }
}

function drawHUD() {
  noStroke();

  fill(255, 220, 100);
  textSize(24);
  textStyle(BOLD);
  text("Score: " + score, width / 2, 30);

  textSize(16);
  textStyle(NORMAL);
  fill(200);
  text("Level " + level, width / 2, 55);

  for (let i = 0; i < maxMissed; i++) {
    let hx = 30 + i * 25;
    let hy = 30;
    if (i < maxMissed - missed) {
      fill(255, 100, 150);
    } else {
      fill(80);
    }
    drawMiniHeart(hx, hy, 8);
  }
}

function drawMiniHeart(x, y, s) {
  beginShape();
  vertex(x, y - s * 0.4);
  bezierVertex(x - s, y - s * 1.2, x - s * 1.5, y + s * 0.2, x, y + s);
  bezierVertex(x + s * 1.5, y + s * 0.2, x + s, y - s * 1.2, x, y - s * 0.4);
  endShape(CLOSE);
}

function drawGameOver() {
  fill(0, 0, 0, 150);
  noStroke();
  rect(0, 0, width, height);

  fill(255, 220, 100);
  textSize(48);
  textStyle(BOLD);
  text("Game Over!", width / 2, height / 2 - 40);

  fill(255);
  textSize(28);
  textStyle(NORMAL);
  text("You caught " + score + " stars!", width / 2, height / 2 + 20);

  textSize(20);
  fill(200);
  text("Click to play again", width / 2, height / 2 + 70);
}

function mousePressed() {
  if (gameOver) {
    score = 0;
    missed = 0;
    gameOver = false;
    stars = [];
    particles = [];
    floatingTexts = [];
    frameCounter = 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  bgStars = [];
  for (let i = 0; i < 150; i++) {
    bgStars.push({
      x: random(width),
      y: random(height),
      size: random(1, 3),
      twinkle: random(0.02, 0.05),
    });
  }
}
