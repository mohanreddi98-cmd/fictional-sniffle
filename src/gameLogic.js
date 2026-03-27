(function (globalScope, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
    return;
  }
  globalScope.SnakeLogic = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const OPPOSITE = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };

  const DEFAULT_CONFIG = {
    gridSize: 20,
    tickMs: 120,
    startLength: 3,
  };

  function normalizeConfig(config = {}) {
    return {
      gridSize: config.gridSize ?? DEFAULT_CONFIG.gridSize,
      tickMs: config.tickMs ?? DEFAULT_CONFIG.tickMs,
      startLength: config.startLength ?? DEFAULT_CONFIG.startLength,
    };
  }

  function cellKey(cell) {
    return `${cell.x},${cell.y}`;
  }

  function spawnFood(gridSize, snake, rng = Math.random) {
    const occupied = new Set(snake.map(cellKey));
    const freeCells = [];

    for (let y = 0; y < gridSize; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        const candidate = { x, y };
        if (!occupied.has(cellKey(candidate))) {
          freeCells.push(candidate);
        }
      }
    }

    if (freeCells.length === 0) {
      return null;
    }

    const index = Math.floor(rng() * freeCells.length);
    return freeCells[index];
  }

  function buildStartingSnake(gridSize, startLength) {
    const center = Math.floor(gridSize / 2);
    const snake = [];
    for (let i = 0; i < startLength; i += 1) {
      snake.push({ x: center - i, y: center });
    }
    return snake;
  }

  function createInitialState(config, rng = Math.random) {
    const resolved = normalizeConfig(config);
    const snake = buildStartingSnake(resolved.gridSize, resolved.startLength);

    return {
      config: resolved,
      snake,
      direction: "right",
      food: spawnFood(resolved.gridSize, snake, rng),
      score: 0,
      isGameOver: false,
      isPaused: false,
    };
  }

  function togglePause(state) {
    if (state.isGameOver) {
      return state;
    }
    return { ...state, isPaused: !state.isPaused };
  }

  function restart(config, rng = Math.random) {
    return createInitialState(config, rng);
  }

  function isOutOfBounds(cell, gridSize) {
    return cell.x < 0 || cell.y < 0 || cell.x >= gridSize || cell.y >= gridSize;
  }

  function equalCells(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function chooseDirection(currentDirection, requestedDirection) {
    if (!requestedDirection || !DIRECTIONS[requestedDirection]) {
      return currentDirection;
    }
    if (OPPOSITE[currentDirection] === requestedDirection) {
      return currentDirection;
    }
    return requestedDirection;
  }

  function step(state, nextDirection, rng = Math.random) {
    if (state.isGameOver || state.isPaused) {
      return state;
    }

    const direction = chooseDirection(state.direction, nextDirection);
    const vector = DIRECTIONS[direction];
    const nextHead = {
      x: state.snake[0].x + vector.x,
      y: state.snake[0].y + vector.y,
    };

    if (isOutOfBounds(nextHead, state.config.gridSize)) {
      return { ...state, direction, isGameOver: true };
    }

    const isEating = state.food && equalCells(nextHead, state.food);
    const bodyToCheck = isEating ? state.snake : state.snake.slice(0, -1);
    const hasSelfCollision = bodyToCheck.some((segment) => equalCells(segment, nextHead));

    if (hasSelfCollision) {
      return { ...state, direction, isGameOver: true };
    }

    const movedSnake = [nextHead, ...state.snake];
    if (!isEating) {
      movedSnake.pop();
    }

    const nextFood = isEating ? spawnFood(state.config.gridSize, movedSnake, rng) : state.food;

    return {
      ...state,
      snake: movedSnake,
      direction,
      food: nextFood,
      score: state.score + (isEating ? 1 : 0),
    };
  }

  return {
    DIRECTIONS,
    DEFAULT_CONFIG,
    spawnFood,
    createInitialState,
    togglePause,
    restart,
    step,
  };
});
