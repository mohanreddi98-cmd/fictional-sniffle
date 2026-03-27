(function (globalScope) {
  const {
    createInitialState,
    restart,
    step,
    togglePause,
  } = globalScope.SnakeLogic;

  const CELL_COLORS = {
    bg: "#fafafa",
    grid: "#e4e4e4",
    snake: "#2e7d32",
    food: "#c62828",
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

  function createGameApp({
    canvas,
    scoreEl,
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

    const ctx = canvas.getContext("2d");
    const size = state.config.gridSize;
    const cellSize = canvas.width / size;

    function render() {
      ctx.fillStyle = CELL_COLORS.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = CELL_COLORS.grid;
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

      ctx.fillStyle = CELL_COLORS.snake;
      state.snake.forEach((segment) => {
        ctx.fillRect(segment.x * cellSize + 1, segment.y * cellSize + 1, cellSize - 2, cellSize - 2);
      });

      if (state.food) {
        ctx.fillStyle = CELL_COLORS.food;
        ctx.fillRect(
          state.food.x * cellSize + 2,
          state.food.y * cellSize + 2,
          cellSize - 4,
          cellSize - 4
        );
      }

      scoreEl.textContent = String(state.score);
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
