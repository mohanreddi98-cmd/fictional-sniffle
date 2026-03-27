(function (globalScope) {
  const canvas = document.getElementById("game-canvas");
  const scoreEl = document.getElementById("score");
  const statusEl = document.getElementById("status");
  const pauseBtn = document.getElementById("pause-btn");
  const restartBtn = document.getElementById("restart-btn");
  const directionButtons = document.querySelectorAll(".dir-btn");

  globalScope.SnakeApp.createGameApp({
    canvas,
    scoreEl,
    statusEl,
    pauseBtn,
    restartBtn,
    directionButtons,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
