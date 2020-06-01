/* eslint-env browser */
/* global A */
const C = A.getContext('2d');
const W = 360;
const H = 480;
const messageLabel = { x: 130, y: 15, w: 100, h: 45, text: '' };
const startLabel = { x: 15, y: 60, w: 100, h: 45, text: '' };
const totalLabel = { x: 130, y: 60, w: 100, h: 45, text: '' };
const stopLabel = { x: 245, y: 60, w: 100, h: 45, text: '' };
const startButton = { x: 15, y: 375, w: 100, h: 90, text: '' };
const playButton = { x: 130, y: 375, w: 100, h: 90, text: '' };
const stopButton = { x: 245, y: 375, w: 100, h: 90, text: '' };
const trackY = 120;
const trackH = 240;
const startX = 65;
const finishX = 295;
const lineW = 5;
const laneN = 8;
const laneH = trackH / laneN;
const runners = new Array(laneN);
const runnerR = laneH / 2;
const speed = (finishX - startX) / 3000;
const Scenes = {
  Home: 1,
  Preparing: 2,
  Waiting: 4,
  Running: 8,
  Result: 16,
};
let stageScale;
let stageX;
let stageY;
let target;
let scene;
let lastFrameTime;
let animateTime;
let goTime;
let finishTime;
let startTime;
let stopTime;
let bestScore = +localStorage.bestScore || 0;

(() => {
  A.style.backgroundColor = '#6c6';
  onload = focus;
  onresize = () => {
    A.width = innerWidth;
    A.height = innerHeight;
    stageScale = Math.min(A.width / W, A.height / H);
    stageX = (A.width - W * stageScale) / 2;
    stageY = (A.height - H * stageScale) / 2;
    scrollTo(0, 0);
    render();
  };
  onkeydown = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    preventEvent(event);
    if (startButton.text) {
      doStart();
    } else if (stopButton.text) {
      doStop();
    } else if (scene === Scenes.Home) {
      doPlay();
    } else if (scene === Scenes.Result) {
      doHome();
    }
  };
  A.onmousedown = A.ontouchstart = (event) => {
    focus();
    preventEvent(event);
    const point = event.changedTouches ? event.changedTouches[0] : event;
    const x = (point.clientX - stageX) / stageScale;
    const y = (point.clientY - stageY) / stageScale;
    if (withinRect(startButton, x, y)) {
      if (startButton.text) {
        doStart();
      }
    } else if (withinRect(stopButton, x, y)) {
      if (stopButton.text) {
        doStop();
      }
    } else if (withinRect(playButton, x, y)) {
      if (scene === Scenes.Home) {
        doPlay();
      } else if (scene === Scenes.Result) {
        doHome();
      }
    }
  };
  doHome();
})();

function preventEvent(event) {
  if (event.cancelable) {
    event.preventDefault();
  }
  event.stopPropagation();
  event.stopImmediatePropagation();
}

function withinRect(rect, x, y) {
  return (
    x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h
  );
}

function doHome() {
  scene = Scenes.Home;
  messageLabel.text = document.title;
  startLabel.text = 'Start-Go';
  totalLabel.text = 'Total';
  stopLabel.text = 'Stop-Finish';
  startButton.text = '';
  playButton.text = 'Play';
  stopButton.text = '';
  goTime = 0;
  finishTime = 0;
  startTime = 0;
  stopTime = 0;
  let y = trackY + runnerR;
  for (let i = 0; i < laneN; i++) {
    runners[i] = { x: runnerR, y, d: 0, v: 0, a: 0, n: i + 1 };
    y += laneH;
  }
  target = runners[~~(Math.random() * laneN)];
  onresize();
}

function doPlay() {
  scene = Scenes.Preparing;
  messageLabel.text = 'On your marks';
  startButton.text = 'Start';
  playButton.text = '';
  lastFrameTime = performance.now();
  const t = 2000;
  animateTime = lastFrameTime + t;
  const v = (startX - runnerR - target.x) / t;
  for (const runner of runners) {
    runner.v = v;
  }
  request();
}

function doStart() {
  startButton.text = '';
  stopButton.text = 'Stop';
  startTime = performance.now();
}

function doStop() {
  stopButton.text = '';
  stopTime = performance.now();
}

function request() {
  requestAnimationFrame(() => {
    const frameTime = performance.now();
    const dt = frameTime - lastFrameTime;
    lastFrameTime = frameTime;
    if (scene === Scenes.Preparing) {
      if (frameTime < animateTime) {
        for (const runner of runners) {
          runner.x += runner.v * dt;
        }
      } else {
        scene = Scenes.Waiting;
        messageLabel.text = 'Get set';
        animateTime = frameTime + 2000 + 500 * Math.random();
        for (const runner of runners) {
          runner.v = 0;
          runner.x = startX - runnerR;
        }
      }
    } else if (scene === Scenes.Waiting) {
      if (frameTime >= animateTime) {
        scene = Scenes.Running;
        messageLabel.text = 'Go!';
        goTime = frameTime;
        for (const runner of runners) {
          runner.d = goTime + 100 + 100 * Math.random();
        }
      }
    } else if (scene === Scenes.Running) {
      let endCount = 0;
      for (const runner of runners) {
        if (frameTime < runner.d) {
          continue;
        }
        if (runner.x >= W - runnerR) {
          endCount++;
          continue;
        }
        if (!runner.v) {
          runner.v = speed * (Math.random() + 0.5);
          runner.a = (speed / 1000) * (Math.random() + 0.5);
        }
        runner.v += runner.a * dt;
        runner.x += runner.v * dt;
        if (runner.x > W - runnerR) {
          runner.x = W - runnerR;
        }
      }
      if (!finishTime && target.x > finishX - runnerR) {
        finishTime = frameTime - (target.x - finishX + runnerR) / target.v;
      }
      if (stopTime && endCount === laneN) {
        scene = Scenes.Result;
        const startDiff = startTime - goTime;
        const stopDiff = stopTime - finishTime;
        const totalDiff = stopDiff - startDiff;
        const score =
          10000 -
          100 * Math.abs(Math.round(totalDiff / 10)) -
          Math.min(
            Math.abs(Math.round(startDiff / 10)),
            Math.abs(Math.round(stopDiff / 10))
          );
        messageLabel.text =
          'Score: ' +
          score +
          (score > bestScore ? ' >' : ' <=') +
          ' Best: ' +
          bestScore;
        startLabel.text = formatDiff(startDiff / 1000);
        totalLabel.text = formatDiff(totalDiff / 1000);
        stopLabel.text = formatDiff(stopDiff / 1000);
        startButton.text = '';
        playButton.text = 'Retry';
        stopButton.text = '';
        if (score > bestScore) {
          localStorage.bestScore = bestScore = score;
        }
      }
    }
    render();
    if (scene !== Scenes.Result) {
      request();
    }
  });
}

function formatDiff(diff) {
  return (diff > 0 ? '+' : '') + diff.toFixed(2);
}

function render() {
  C.clearRect(0, 0, A.width, A.height);
  C.save();
  try {
    C.setTransform(stageScale, 0, 0, stageScale, stageX, stageY);
    C.textAlign = 'center';
    C.textBaseline = 'middle';
    C.font = '20px Arial';
    renderLabel(messageLabel);
    renderLabel(startLabel);
    renderLabel(totalLabel);
    renderLabel(stopLabel);
    renderButton(startButton);
    renderButton(playButton);
    renderButton(stopButton);
    C.fillStyle = '#f30';
    C.fillRect(0, trackY, W, trackH);
    C.fillStyle = '#fff';
    C.fillRect(startX, trackY, lineW, trackH);
    C.fillRect(finishX, trackY, lineW, trackH);
    for (const runner of runners) {
      C.beginPath();
      C.arc(runner.x, runner.y, runnerR, 0, 2 * Math.PI);
      C.closePath();
      C.fillStyle = runner === target ? '#000' : '#999';
      C.fill();
      C.fillStyle = '#fff';
      C.fillText(runner.n, runner.x, runner.y);
    }
    C.beginPath();
    let y = trackY;
    for (let i = 0; i <= laneN; i++) {
      C.moveTo(0, y);
      C.lineTo(W, y);
      y += laneH;
    }
    C.strokeStyle = '#fff';
    C.stroke();
  } finally {
    C.restore();
  }
}

function renderButton(button) {
  if (button.text) {
    C.fillStyle = '#ff0';
    C.fillRect(button.x, button.y, button.w, button.h);
    renderLabel(button);
  }
  C.strokeStyle = '#000';
  C.strokeRect(button.x, button.y, button.w, button.h);
}

function renderLabel(label) {
  if (label.text) {
    C.fillStyle = '#000';
    C.fillText(label.text, label.x + label.w / 2, label.y + label.h / 2);
  }
}
