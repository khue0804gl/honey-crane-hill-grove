const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const healthEl = document.getElementById('health');
const timeEl = document.getElementById('time');
const goalEl = document.getElementById('goal');
const messageEl = document.getElementById('message');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');

const state = {
  started: false,
  ended: false,
  win: false,
  collected: 0,
  health: 5,
  timeLeft: 60,
  goal: 12,
};

const keys = {};
const items = [];
const enemies = [];
const particles = [];

const player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 18,
  speed: 245,
  invulnerable: 0,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function setMessage(text) {
  messageEl.textContent = text;
}

function spawnParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: rand(-120, 120),
      vy: rand(-120, 120),
      radius: rand(2, 5),
      color,
      life: rand(0.35, 0.9),
    });
  }
}

function generateItems(count) {
  items.length = 0;
  for (let i = 0; i < count; i += 1) {
    let x = rand(40, canvas.width - 40);
    let y = rand(40, canvas.height - 40);

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const dx = x - canvas.width / 2;
      const dy = y - canvas.height / 2;
      if (Math.abs(dx) > 180 || Math.abs(dy) > 120) {
        break;
      }
      x = rand(40, canvas.width - 40);
      y = rand(40, canvas.height - 40);
    }

    items.push({
      x,
      y,
      radius: 12,
      value: 1,
    });
  }
}

function generateEnemies(count) {
  enemies.length = 0;
  for (let i = 0; i < count; i += 1) {
    enemies.push({
      x: rand(30, canvas.width - 30),
      y: rand(30, canvas.height - 30),
      radius: rand(14, 20),
      speed: rand(65, 95),
      hue: i % 2 === 0 ? 300 : 200,
    });
  }
}

function resetGame() {
  state.collected = 0;
  state.health = 5;
  state.timeLeft = 60;
  state.ended = false;
  state.win = false;
  player.x = canvas.width / 2;
  player.y = canvas.height / 2;
  player.invulnerable = 0;

  generateItems(state.goal);
  generateEnemies(4);

  updateHud();
  setMessage('Thu thập 12 mật hoa trong 60 giây. Tránh hạt sương đuổi theo!');
}

function startGame() {
  state.started = true;
  state.ended = false;
  state.win = false;
  resetGame();
}

function endGame(win) {
  state.started = false;
  state.ended = true;
  state.win = win;

  if (win) {
    setMessage('Chiến thắng! Rừng đã mở ra và bạn đã mang về mật hoa của thung lũng.');
  } else {
    setMessage('Rừng đã chìm trong sương. Hãy thử lại và giữ bình tĩnh hơn.');
  }
}

function updateHud() {
  scoreEl.textContent = String(state.collected);
  healthEl.textContent = String(state.health);
  timeEl.textContent = String(Math.max(0, Math.ceil(state.timeLeft)));
  goalEl.textContent = String(state.goal);
}

function handleInput(dt) {
  let dx = 0;
  let dy = 0;

  if (keys.ArrowLeft || keys.a) dx -= 1;
  if (keys.ArrowRight || keys.d) dx += 1;
  if (keys.ArrowUp || keys.w) dy -= 1;
  if (keys.ArrowDown || keys.s) dy += 1;

  const length = Math.hypot(dx, dy) || 1;
  if (dx !== 0 || dy !== 0) {
    player.x += (dx / length) * player.speed * dt;
    player.y += (dy / length) * player.speed * dt;
  }

  player.x = clamp(player.x, 18, canvas.width - 18);
  player.y = clamp(player.y, 18, canvas.height - 18);
}

function updateItems() {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    const distance = Math.hypot(player.x - item.x, player.y - item.y);
    if (distance < player.radius + item.radius + 2) {
      items.splice(i, 1);
      state.collected += 1;
      spawnParticles(item.x, item.y, '#f8d77d', 16);
      if (state.collected >= state.goal) {
        endGame(true);
      }
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;

    enemy.x += (dx / dist) * enemy.speed * dt;
    enemy.y += (dy / dist) * enemy.speed * dt;

    const hitDistance = player.radius + enemy.radius + 2;
    if (dist < hitDistance) {
      if (player.invulnerable <= 0) {
        state.health -= 1;
        player.invulnerable = 1.2;
        spawnParticles(player.x, player.y, '#ff8aae', 18);
        if (state.health <= 0) {
          endGame(false);
          return;
        }
      }
    }
  }

  player.invulnerable = Math.max(0, player.invulnerable - dt);
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function update(dt) {
  if (!state.started || state.ended) {
    return;
  }

  state.timeLeft -= dt;
  if (state.timeLeft <= 0) {
    state.timeLeft = 0;
    endGame(false);
    updateHud();
    return;
  }

  handleInput(dt);
  updateItems();
  updateEnemies(dt);
  updateParticles(dt);
  updateHud();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#061922');
  sky.addColorStop(0.6, '#0d2331');
  sky.addColorStop(1, '#112f2a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.arc(120 + i * 150, 90 + (i % 2) * 20, 60, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(255, 215, 125, 0.2)';
  ctx.beginPath();
  ctx.arc(canvas.width - 120, 100, 60, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 12; i += 1) {
    const treeX = i * 85 + 20;
    const trunkW = 12;
    ctx.fillStyle = '#3e2a19';
    ctx.fillRect(treeX, 360, trunkW, 140);

    ctx.fillStyle = '#214a39';
    ctx.beginPath();
    ctx.arc(treeX + 6, 350, 36, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(168, 214, 247, 0.14)';
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.ellipse(120 + i * 120, 250 + (i % 3) * 70, 170, 55, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawItem(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = '#f8d77d';
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 12);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#fff0b5';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, enemy.radius + 14);
  glow.addColorStop(0, `hsla(${enemy.hue}, 90%, 75%, 0.9)`);
  glow.addColorStop(1, `hsla(${enemy.hue}, 90%, 65%, 0.15)`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, enemy.radius + 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `hsla(${enemy.hue}, 80%, 70%, 0.88)`;
  ctx.beginPath();
  ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);

  if (player.invulnerable > 0) {
    ctx.globalAlpha = 0.65 + Math.sin(performance.now() * 0.02) * 0.2;
  }

  const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, player.radius + 14);
  glow.addColorStop(0, '#f8d77d');
  glow.addColorStop(1, 'rgba(248, 215, 125, 0.08)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, player.radius + 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f4c75f';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff1bf';
  ctx.beginPath();
  ctx.arc(-6, -6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.life * 1.2);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawHUDStatus() {
  ctx.fillStyle = 'rgba(11, 18, 30, 0.5)';
  ctx.fillRect(18, 18, 220, 46);

  ctx.fillStyle = '#eef7ff';
  ctx.font = '18px sans-serif';
  ctx.fillText(`Mật hoa: ${state.collected}/${state.goal}`, 30, 38);
  ctx.fillStyle = '#f8d77d';
  ctx.fillText(`Máu: ${state.health}`, 30, 58);
}

function render() {
  drawBackground();

  for (const item of items) {
    drawItem(item);
  }

  for (const enemy of enemies) {
    drawEnemy(enemy);
  }

  drawPlayer();
  drawParticles();
  drawHUDStatus();
}

let lastTime = 0;
function loop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.033) || 0.016;
  lastTime = timestamp;

  update(dt);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys[event.key] = true;
  keys[key] = true;

  if (event.key === ' ') {
    event.preventDefault();
    if (!state.started || state.ended) {
      startGame();
    }
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();
  keys[event.key] = false;
  keys[key] = false;
});

startBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', startGame);

resetGame();
requestAnimationFrame(loop);
