(function (globalScope) {
  const {
    DIRECTIONS,
    createInitialState,
    restart,
    step,
    togglePause,
  } = globalScope.SnakeLogic;

  const THEME = {
    boardA: "#101a3a",
    boardB: "#15224b",
    grid: "rgba(130, 150, 255, 0.15)",
    snakeHeadA: "#7bffbe",
    snakeHeadB: "#2ac77b",
    snakeBodyA: "#56df95",
    snakeBodyB: "#2ca96f",
    foodCore: "#ff7286",
    foodGlow: "rgba(255, 57, 97, 0.75)",
    text: "#edf2ff",
    overlay: "rgba(5, 10, 25, 0.68)",
  };

  const KEY_TO_DIR = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    W: "up",
    a: "left",
    A: "left",
    s: "down",
    S: "down",
    d: "right",
    D: "right",
  };

  function statusLabel(state) {
    if (state.isGameOver) {
      return "Game Over";
    }
    if (state.isPaused) {
      return "Paused";
    }
    return "Running";
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = clamp(r, 0, Math.min(w, h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function readBestScore() {
    try {
      return Number(globalScope.localStorage.getItem("snake_best_score")) || 0;
    } catch (_error) {
      return 0;
    }
  }

  function writeBestScore(score) {
    try {
      globalScope.localStorage.setItem("snake_best_score", String(score));
    } catch (_error) {
      // no-op when storage is not available
    }
  }

  function createGameApp({
    canvas,
    scoreEl,
    bestScoreEl,
    statusEl,
    pauseBtn,
    restartBtn,
    directionButtons,
    config,
    rng = Math.random,
  }) {
    const stateConfig = config ?? undefined;
    let state = createInitialState(stateConfig, rng);
    let pendingDirection = null;
    let bestScore = readBestScore();

    const ctx = canvas.getContext("2d");
    const size = state.config.gridSize;
    const cellSize = canvas.width / size;
    const padding = 1.8;

    function drawBoard() {
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, THEME.boardA);
      bgGradient.addColorStop(1, THEME.boardB);
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = THEME.grid;
      ctx.lineWidth = 1;
      for (let i = 1; i < size; i += 1) {
        const p = i * cellSize;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(canvas.width, p);
        ctx.stroke();
      }
    }

    function drawSnake() {
      state.snake.forEach((segment, index) => {
        const x = segment.x * cellSize + padding;
        const y = segment.y * cellSize + padding;
        const sizePx = cellSize - padding * 2;
        const gradient = ctx.createLinearGradient(x, y, x + sizePx, y + sizePx);
        const head = index === 0;
        gradient.addColorStop(0, head ? THEME.snakeHeadA : THEME.snakeBodyA);
        gradient.addColorStop(1, head ? THEME.snakeHeadB : THEME.snakeBodyB);

        ctx.fillStyle = gradient;
        drawRoundedRect(ctx, x, y, sizePx, sizePx, sizePx * 0.28);
        ctx.fill();
      });

      const head = state.snake[0];
      if (!head) {
        return;
      }
      const dir = DIRECTIONS[state.direction] ?? DIRECTIONS.right;
      const headCenterX = head.x * cellSize + cellSize / 2;
      const headCenterY = head.y * cellSize + cellSize / 2;
      const eyeBase = cellSize * 0.12;
      const eyeOffsetX = dir.x * cellSize * 0.14 + dir.y * cellSize * 0.11;
      const eyeOffsetY = dir.y * cellSize * 0.14 - dir.x * cellSize * 0.11;

      ctx.fillStyle = "#0f1324";
      ctx.beginPath();
      ctx.arc(headCenterX + eyeOffsetX + eyeBase, headCenterY + eyeOffsetY + eyeBase, cellSize * 0.06, 0, Math.PI * 2);
      ctx.arc(headCenterX + eyeOffsetX - eyeBase, headCenterY + eyeOffsetY - eyeBase, cellSize * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawFood() {
      if (!state.food) {
        return;
      }

      const x = state.food.x * cellSize + cellSize / 2;
      const y = state.food.y * cellSize + cellSize / 2;
      const radius = cellSize * 0.23;

      ctx.shadowColor = THEME.foodGlow;
      ctx.shadowBlur = 16;
      ctx.fillStyle = THEME.foodCore;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y - radius * 0.35, radius * 0.34, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawOverlayIfNeeded() {
      if (!state.isGameOver && !state.isPaused) {
        return;
      }

      ctx.fillStyle = THEME.overlay;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = THEME.text;
      ctx.font = "700 32px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(state.isGameOver ? "Game Over" : "Paused", canvas.width / 2, canvas.height / 2 - 12);
      ctx.font = "500 16px Trebuchet MS";
      ctx.fillText("Press R to restart", canvas.width / 2, canvas.height / 2 + 20);
    }

    function render() {
      drawBoard();
      drawSnake();
      drawFood();
      drawOverlayIfNeeded();

      if (state.score > bestScore) {
        bestScore = state.score;
        writeBestScore(bestScore);
      }

      scoreEl.textContent = String(state.score);
      if (bestScoreEl) {
        bestScoreEl.textContent = String(bestScore);
      }
      statusEl.textContent = statusLabel(state);
      pauseBtn.textContent = state.isPaused ? "Resume" : "Pause";
    }

    function queueDirection(direction) {
      pendingDirection = direction;
    }

    function tick() {
      const before = state;
      state = step(state, pendingDirection, rng);
      pendingDirection = null;

      if (before !== state) {
        render();
      }
    }

    function pauseResume() {
      state = togglePause(state);
      render();
    }

    function doRestart() {
      state = restart(state.config, rng);
      pendingDirection = null;
      render();
    }

    function onKeydown(event) {
      const direction = KEY_TO_DIR[event.key];
      if (direction) {
        event.preventDefault();
        queueDirection(direction);
        return;
      }

      if (event.key === " " || event.key === "p" || event.key === "P") {
        event.preventDefault();
        pauseResume();
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        doRestart();
      }
    }

    window.addEventListener("keydown", onKeydown);
    pauseBtn.addEventListener("click", pauseResume);
    restartBtn.addEventListener("click", doRestart);
    directionButtons.forEach((button) => {
      button.addEventListener("click", () => queueDirection(button.dataset.dir));
    });

    render();
    const timer = setInterval(tick, state.config.tickMs);

    return {
      destroy() {
        clearInterval(timer);
        window.removeEventListener("keydown", onKeydown);
      },
    };
  }

  globalScope.SnakeApp = { createGameApp };
})(typeof globalThis !== "undefined" ? globalThis : this);
