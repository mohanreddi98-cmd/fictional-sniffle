const assert = require("node:assert/strict");
const {
  createInitialState,
  spawnFood,
  step,
  restart,
} = require("../src/gameLogic.js");

function runTest(name, fn) {
  try {
    fn();
    console.log("PASS", name);
  } catch (error) {
    console.error("FAIL", name);
    console.error(error);
    process.exitCode = 1;
  }
}

runTest("moves one step in the current direction", () => {
  const state = {
    config: { gridSize: 8, tickMs: 100, startLength: 3 },
    snake: [{ x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }],
    direction: "right",
    food: { x: 7, y: 7 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };

  const next = step(state, null, () => 0.1);
  assert.deepEqual(next.snake[0], { x: 4, y: 3 });
  assert.equal(next.snake.length, 3);
});

runTest("rejects immediate reverse direction", () => {
  const state = {
    config: { gridSize: 8, tickMs: 100, startLength: 3 },
    snake: [{ x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }],
    direction: "right",
    food: { x: 0, y: 0 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };

  const next = step(state, "left", () => 0.1);
  assert.equal(next.direction, "right");
  assert.deepEqual(next.snake[0], { x: 4, y: 3 });
});

runTest("grows and increments score when eating food", () => {
  const state = {
    config: { gridSize: 8, tickMs: 100, startLength: 3 },
    snake: [{ x: 3, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 3 }],
    direction: "right",
    food: { x: 4, y: 3 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };

  const next = step(state, "right", () => 0);
  assert.equal(next.score, 1);
  assert.equal(next.snake.length, 4);
  assert.notDeepEqual(next.food, { x: 4, y: 3 });
});

runTest("wall collision causes game over", () => {
  const state = {
    config: { gridSize: 5, tickMs: 100, startLength: 3 },
    snake: [{ x: 4, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 2 }],
    direction: "right",
    food: { x: 0, y: 0 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };

  const next = step(state, "right", () => 0.2);
  assert.equal(next.isGameOver, true);
});

runTest("self collision causes game over", () => {
  const state = {
    config: { gridSize: 7, tickMs: 100, startLength: 3 },
    snake: [
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ],
    direction: "up",
    food: { x: 0, y: 0 },
    score: 0,
    isGameOver: false,
    isPaused: false,
  };

  const next = step(state, "left", () => 0.3);
  assert.equal(next.isGameOver, true);
});

runTest("food spawns only on empty cells", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
  ];

  const food = spawnFood(3, snake, () => 0);
  assert.ok(food !== null);
  assert.notDeepEqual(food, { x: 0, y: 0 });
  assert.notDeepEqual(food, { x: 1, y: 0 });
  assert.notDeepEqual(food, { x: 2, y: 0 });
});

runTest("restart resets score and flags", () => {
  const state = createInitialState({ gridSize: 9, tickMs: 120, startLength: 3 }, () => 0.1);
  const modified = { ...state, score: 5, isPaused: true, isGameOver: true };
  const reset = restart(modified.config, () => 0.1);

  assert.equal(reset.score, 0);
  assert.equal(reset.isPaused, false);
  assert.equal(reset.isGameOver, false);
  assert.equal(reset.snake.length, 3);
});
