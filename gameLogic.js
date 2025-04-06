// gameLogic.js

import { leagues, currentLeague} from './dataManager.js';
import { prizeDisplay, showPrizeAnimation } from './uiManager.js';

const container = document.querySelector('.container');
const claw = document.querySelector('.claw');
const resetButton = document.querySelector('#resetGame');
const toggleAlbumButton = document.querySelector('#toggleAlbum');
const album = document.querySelector('.album');

let isPlaying = false;
let balls = [];
let clawPos = 150;
const speed = 5;

function createBall() {
  const ball = document.createElement('div');
  ball.className = 'ball';
  const teams = leagues[currentLeague].teams;
  const randomTeam = teams[Math.floor(Math.random() * teams.length)];
  ball.teamId = randomTeam.id;
  ball.teamName = randomTeam.name;
  ball.style.left = Math.random() * 240 + 'px';
  ball.style.top = Math.random() * 260 + 100 + 'px';
  ball.dx = (Math.random() - 0.5) * 2;
  ball.dy = (Math.random() - 0.5) * 1;
  container.appendChild(ball);
  balls.push(ball);
}

function moveBalls() {
  balls.forEach(ball => {
    let x = parseFloat(ball.style.left);
    let y = parseFloat(ball.style.top);

    x += ball.dx;
    y += ball.dy;

    if (x <= 0 || x >= 240) ball.dx *= -0.8;
    if (y <= 100 || y >= 360) ball.dy *= -0.8;

    ball.style.left = x + 'px';
    ball.style.top = y + 'px';

    ball.dy += 0.1;
    ball.dx *= 0.99;
    ball.dy *= 0.99;
  });

  if (!isPlaying) requestAnimationFrame(moveBalls);
}

function dropClaw() {
  if (isPlaying) return;
  isPlaying = true;
  resetButton.disabled = true;

  claw.style.transition = 'top 1s ease';
  claw.style.top = '375px';
  claw.classList.add('grabbing');

  setTimeout(() => {
    const clawRect = claw.getBoundingClientRect();
    const clawCenter = {
      x: clawRect.left + clawRect.width / 2,
      y: clawRect.top + clawRect.height / 2
    };

    const closestBall = balls.reduce((closest, ball) => {
      const ballRect = ball.getBoundingClientRect();
      const ballCenter = {
        x: ballRect.left + ballRect.width / 2,
        y: ballRect.top + ballRect.height / 2
      };

      const distance = Math.sqrt(
        Math.pow(ballCenter.x - clawCenter.x, 2) +
        Math.pow(ballCenter.y - clawCenter.y, 2)
      );

      return distance < closest.distance ?
        { ball, distance } :
        closest;
    }, { ball: null, distance: Infinity }).ball;

    if (closestBall) {
      closestBall.classList.add('grabbed');
      balls = balls.filter(b => b !== closestBall);

      setTimeout(() => {
        closestBall.remove();
        showPrizeAnimation(closestBall.teamId, closestBall.teamName);
      }, 500);
    }

    claw.style.top = '0px';
    claw.classList.remove('grabbing');
    isPlaying = false;
    resetButton.disabled = false;
  }, 1000);
}

function randomizeAnimation(prizeAnim) {
  const animations = ['popIn', 'slideUp', 'zoomRotate', 'flipIn'];
  
  // Randomly select three unique animations
  const selectedAnimations = [];
  while (selectedAnimations.length < 3) {
    const randomAnim = animations[Math.floor(Math.random() * animations.length)];
    if (!selectedAnimations.includes(randomAnim)) {
      selectedAnimations.push(randomAnim);
    }
  }
  
  // Apply random animations via CSS custom properties
  prizeAnim.style.setProperty('--anim1', selectedAnimations[0]);
  prizeAnim.style.setProperty('--anim2', selectedAnimations[1]);
  prizeAnim.style.setProperty('--anim3', selectedAnimations[2]);
}

function resetGame() {
  balls.forEach(ball => ball.remove());
  balls = [];
  prizeDisplay.textContent = '';

  for (let i = 0; i < 6; i++) {
    createBall();
  }
  moveBalls();
  resetButton.disabled = false;
  isPlaying = false;
}

document.addEventListener('keydown', (e) => {
  if (isPlaying) return;

  switch (e.key) {
    case 'ArrowLeft':
      clawPos = Math.max(20, clawPos - speed);
      claw.style.left = clawPos + 'px';
      break;
    case 'ArrowRight':
      clawPos = Math.min(380, clawPos + speed);
      claw.style.left = clawPos + 'px';
      break;
    case 'ArrowDown':
      dropClaw();
      break;
  }
});

let initialMouseX = 0;
let isDragging = false;

// Mouse control for claw
document.addEventListener('mousedown', (e) => {
  // Check if we clicked on a button or its children
  if (e.target.closest('button') || isPlaying) return;
  
  isDragging = true;
  initialMouseX = e.clientX;
  const initialClawPos = clawPos;
  
  const moveHandler = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - initialMouseX;
      const newPos = initialClawPos + deltaX;
      clawPos = Math.min(380, Math.max(20, newPos));
      
      claw.style.left = clawPos + 'px';
  };
  
  const releaseHandler = () => {
      if (isDragging) {
          isDragging = false;
          dropClaw();
          
          document.removeEventListener('mousemove', moveHandler);
          document.removeEventListener('mouseup', releaseHandler);
      }
  };
  
  document.addEventListener('mousemove', moveHandler);
  document.addEventListener('mouseup', releaseHandler);
});

resetButton.addEventListener('click', resetGame);
toggleAlbumButton.addEventListener('click', () => {
  album.classList.toggle('visible');
  toggleAlbumButton.textContent = album.classList.contains('visible') ? 'Hide Album' : 'Show Album';
});

export {
  createBall,
  moveBalls,
  dropClaw,
  randomizeAnimation,
  resetGame
};