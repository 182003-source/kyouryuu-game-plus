// ==========================================
// 1. グローバル変数の定義
// ==========================================
let dino;
let obstacles = [];
let bullets = [];
let score = 0;
let level = 1; 
let gameOver = false;
let gameStarted = false;
let bombAvailable = true;
let highScores = []; 

let bgmStart;
let bgmPlay;

// ==========================================
// 2. 当たり判定用の自作関数（先に定義してエラーを防ぐ）
// ==========================================
function collideRectRect(x, y, w, h, x2, y2, w2, h2) {
  return x < x2 + w2 && x + w > x2 && y < y2 + h2 && y + h > y2;
}

function collideRectCircle(rx, ry, rw, rh, cx, cy, diameter) {
  let testX = cx;
  let testY = cy;
  if (cx < rx) testX = rx;
  else if (cx > rx + rw) testX = rx + rw;
  if (cy < ry) testY = ry;
  else if (cy > ry + rh) testY = ry + rh;
  let d = dist(cx, cy, testX, testY);
  return d <= diameter / 2;
}

// ==========================================
// 3. ゲームを構成するクラス（Dino, Obstacle, Bullet）
// ==========================================
class Dino {
  constructor(groundY) {
    this.r = 26; 
    this.x = 50;
    this.y = groundY - this.r;
    this.vy = 0;
    this.gravity = 0.45; 
  }

  jump() {
    this.vy = -8.5; 
  }

  update(groundY) {
    this.vy += this.gravity;
    this.y += this.vy;
    
    if (this.y < 0) {
      this.y = 0;
      this.vy = 0;
    }
    if (this.y >= groundY - this.r) {
      this.y = groundY - this.r;
      this.vy = 0;
    }
  }

  show() {
    fill(80);
    noStroke();
    rect(this.x, this.y, this.r, this.r, 4);
    rect(this.x + 13, this.y - 8, 18, 13, 2);
  }
}

class Obstacle {
  constructor(groundY, type) {
    this.type = type; 
    this.x = width;
    this.speed = random(3, 4.5);

    if (this.type === 0) {
      this.w = 30; this.h = 40;
      this.y = groundY - this.h;
    } else if (this.type === 1) {
      this.w = 25; this.h = 25;
      this.y = groundY - this.h;
    } else if (this.type === 2) {
      this.w = 35; this.h = 25;
      this.y = random(150, 210);
    } else if (this.type === 3) {
      this.w = 40; this.h = 25;
      this.y = random(30, 90);
    }
  }

  update() {
    this.x -= this.speed;
    if (this.type >= 2) {
      this.y += sin(frameCount * 0.07 + this.x) * 0.8;
    }
  }

  shoot() {
    if (this.type === 1) return; 

    let maxSpeed = 6.5 + (level * 0.3);
    let minSpeed = 3.5 + (level * 0.1);
    let bulletSpeed = random(minSpeed, maxSpeed);

    let baseAngle = PI;
    if (this.type === 3) baseAngle = PI + 0.15; 

    if (level === 1) {
      bullets.push(new Bullet(this.x, this.y + 10, baseAngle, bulletSpeed));
    } else if (level === 2) {
      bullets.push(new Bullet(this.x, this.y + 10, baseAngle - 0.1, bulletSpeed));
      bullets.push(new Bullet(this.x, this.y + 10, baseAngle + 0.1, bulletSpeed));
    } else if (level === 3) {
      bullets.push(new Bullet(this.x, this.y + 10, baseAngle, bulletSpeed));
      bullets.push(new Bullet(this.x, this.y + 10, baseAngle - 0.15, bulletSpeed - 0.5));
      bullets.push(new Bullet(this.x, this.y + 10, baseAngle + 0.15, bulletSpeed - 0.5));
    } else {
      bullets.push(new Bullet(this.x, this.y + 10, baseAngle - 0.2, bulletSpeed));
      bullets.push(new Bullet(this.x, this.y + 10, baseAngle - 0.07, bulletSpeed));
      bullets.push(new Bullet(this.x, this.y + 10, baseAngle + 0.07, bulletSpeed));
      bullets.push(new Bullet(this.x, this.y + 10, baseAngle + 0.2, bulletSpeed));
    }
  }

  show() {
    noStroke();
    if (this.type === 0) {
      fill(200, 50, 50); 
      rect(this.x, this.y, this.w, this.h, 2);
      fill(100); rect(this.x - 5, this.y + 5, 10, 10);
    } else if (this.type === 1) {
      fill(230, 180, 0); 
      triangle(this.x, this.y + this.h, this.x + this.w/2, this.y, this.x + this.w, this.y + this.h);
    } else if (this.type === 2) {
      fill(130, 50, 200); 
      rect(this.x, this.y, this.w, this.h, 6);
      fill(90, 30, 150); rect(this.x + 8, this.y - 4, 18, 4);
    } else if (this.type === 3) {
      fill(50, 100, 200); 
      rect(this.x, this.y, this.w, this.h, 4);
      fill(50); rect(this.x + 5, this.y - 5, this.w - 10, 3);
    }
  }

  hits(dino) {
    return collideRectRect(this.x, this.y, this.w, this.h, dino.x, dino.y, dino.r, dino.r);
  }

  offscreen() {
    return this.x < -this.w;
  }
}

class Bullet {
  constructor(x, y, angle, speed) {
    this.x = x;
    this.y = y;
    this.r = 4.5; 
    this.speed = speed; 
    this.vx = cos(angle) * this.speed;
    this.vy = sin(angle) * this.speed;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  show() {
    let dangerRed = map(this.speed, 3.5, 9, 140, 255);
    fill(dangerRed, 40, 40);
    noStroke();
    circle(this.x, this.y, this.r * 2);
  }

  hits(dino) {
    return collideRectCircle(dino.x, dino.y, dino.r, dino.r, this.x, this.y, this.r * 2);
  }

  offscreen() {
    return (this.x < -this.r || this.x > width + this.r || this.y < -this.r || this.y > height + this.r);
  }
}

// ==========================================
// 4. p5.js メイン制御関数（preload, setup, draw）
// ==========================================
function preload() {
  bgmStart = loadSound('start.mp3');
  bgmPlay = loadSound('play.mp3');
}

function setup() {
  createCanvas(600, 400);
  
  let savedScores = localStorage.getItem('dinoHighScores');
  if (savedScores) {
    highScores = JSON.parse(savedScores);
  } else {
    highScores = []; 
  }

  resetGame();
  bgmStart.loop();
}

function draw() {
  background(240);
  
  let groundY = height * 0.75;
  
  stroke(150);
  strokeWeight(2);
  line(0, groundY, width, groundY);

  if (!gameStarted) {
    showScreen("恐竜ゲームプラス", "クリック か スペースで上昇\n[ F ] フルスクリーン  |  [ X ] ボム(1回)\n");
    return;
  }
  
  if (gameOver) {
    showScreen("GAME OVER", `スコア: ${score} (LEVEL ${level})\nクリック か スペース でリスタート`);
    return;
  }
  
  if (frameCount % 5 === 0) {
    score++;
    level = floor(score / 200) + 1;
  }
  
  drawHUD();

  dino.update(groundY);
  dino.show();

  let spawnInterval = max(35, 90 - level * 5);
  if (frameCount % floor(spawnInterval) === 0) {
    let type = floor(random(4));
    obstacles.push(new Obstacle(groundY, type));
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].update();
    obstacles[i].show();

    let shootInterval = max(30, 70 - level * 4);
    if (frameCount % floor(shootInterval) === 0 && obstacles[i].x > 120) {
      obstacles[i].shoot();
    }

    if (obstacles[i].hits(dino)) {
      handleGameOver(); 
      break; 
    }
    if (obstacles[i].offscreen()) obstacles.splice(i, 1);
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();

    if (bullets[i].hits(dino)) {
      handleGameOver(); 
      break;
    }
    if (bullets[i].offscreen()) bullets.splice(i, 1);
  }
}

// ==========================================
// 5. イベント制御・UI関連関数
// ==========================================
function keyPressed() {
  if (key === 'f' || key === 'F') {
    let fs = fullscreen();
    fullscreen(!fs);
    return;
  }

  if ((key === 'x' || key === 'X') && gameStarted && !gameOver && bombAvailable) {
    triggerBomb();
    return;
  }

  if (key === ' ') {
    handleAction();
  }
}

function windowResized() {
  if (fullscreen()) {
    resizeCanvas(windowWidth, windowHeight);
  } else {
    resizeCanvas(600, 400);
  }
  if (dino) dino.x = 50;
}

function mousePressed() {
  handleAction();
}

function handleAction() {
  if (!gameStarted) {
    gameStarted = true;
    bgmStart.stop();
    bgmPlay.loop();
  } else if (gameOver) {
    resetGame();
  } else {
    dino.jump();
  }
}

function triggerBomb() {
  bullets = [];
  obstacles = []; 
  bombAvailable = false;
}

function handleGameOver() {
  gameOver = true;
  
  highScores.push(score);                     
  highScores.sort((a, b) => b - a);          
  highScores = highScores.slice(0, 5);       
  localStorage.setItem('dinoHighScores', JSON.stringify(highScores)); 

  bgmPlay.stop();
  bgmStart.loop();
}

function resetGame() {
  let groundY = height * 0.75;
  dino = new Dino(groundY);
  obstacles = [];
  bullets = [];
  score = 0;
  level = 1;
  gameOver = false;
  bombAvailable = true;

  if (gameStarted) {
    bgmStart.stop();
    if (!bgmPlay.isPlaying()) {
      bgmPlay.loop();
    }
  }
}

function drawHUD() {
  fill(50);
  noStroke();
  textSize(20);
  textAlign(LEFT);
  text(`SCORE: ${score}`, 20, 40);
  
  fill(255, 50, 50);
  text(`LEVEL: ${level}`, 180, 40);

  textAlign(RIGHT);
  if (bombAvailable) {
    fill(0, 150, 255);
    text("BOMB [X]: READY", width - 20, 40);
  } else {
    fill(150);
    text("BOMB [X]: EMPTY", width - 20, 40);
  }
}

function showScreen(title, subtitle) {
  fill(50);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(width > 500 ? 32 : 24);
  text(title, width / 2, height / 2 - 80); 
  
  textSize(width > 500 ? 16 : 12);
  text(subtitle, width / 2, height / 2 - 20); 

  fill(80);
  textSize(16);
  text("ーーー TOP 5 SCORES ーーー", width / 2, height / 2 + 40);
  
  textSize(14);
  for (let i = 0; i < highScores.length; i++) {
    let yOffset = height / 2 + 70 + (i * 20); 
    text(`${i + 1}位: ${highScores[i]}点`, width / 2, yOffset);
  }
}
