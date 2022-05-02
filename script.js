// Element selectors
const video = document.querySelector(".player");
const canvas = document.querySelector(".reflex-box");
const ctx = canvas.getContext("2d");
const startGameBtn = document.querySelector(".start-game-btn");
const restartGameBtn = document.querySelector(".restart-game-btn");
const endGameModal = document.querySelector(".end-game-modal");
const scoreBoards = document.querySelectorAll(".score-board");
const timeBoard = document.querySelector(".time-board");
const audioFiles = {
  ding: document.querySelector("[data-type=ding]"),
  music: document.querySelector("[data-type=music]"),
  applause: document.querySelector("[data-type=applause]"),
};

// Event listeners
startGameBtn.addEventListener("click", paintToCanvas);
restartGameBtn.addEventListener("click", closeEndGameModal);

// Control Variables
let currentlyActiveBtn = "blue";
let detectors = {
  red: [],
  blue: [],
  green: [],
  yellow: [],
};
let score = 0;
let pauseCount = 0;
let timeRemaining = 30;
let gameInterval;

// Functions
function getVideo() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })
    .catch((err) => {
      console.error(
        `Oh no! Looks like there was a problem accessing your camera`,
        err
      );
    });
}

function paintToCanvas() {
  startGameBtn.classList.add("--disabled");
  audioFiles.music.currentTime = 0;
  audioFiles.music.play();
  const width = video.videoWidth;
  const height = video.videoHeight;
  canvas.width = width;
  canvas.height = height;

  const redBtn = new Path2D();
  redBtn.rect(0, 0, 50, 50);

  const blueBtn = new Path2D();
  blueBtn.rect(width - 50, 0, 50, 50);

  const greenBtn = new Path2D();
  greenBtn.rect(0, height - 50, 50, 50);

  const yellowBtn = new Path2D();
  yellowBtn.rect(width - 50, height - 50, 50, 50);

  decrementTimer();

  gameInterval = setInterval(() => {
    ctx.drawImage(video, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height);
    ctx.putImageData(pixels, 0, 0);
    ctx.fillStyle = currentlyActiveBtn === "red" ? "#ff0000" : "#ff000030";
    ctx.fill(redBtn);
    ctx.fillStyle = currentlyActiveBtn === "blue" ? "#0000ff" : "#0000ff30";
    ctx.fill(blueBtn);
    ctx.fillStyle = currentlyActiveBtn === "green" ? "#00ff00" : "#00ff0030";
    ctx.fill(greenBtn);
    ctx.fillStyle = currentlyActiveBtn === "yellow" ? "#ffff00" : "#ffff0030";
    ctx.fill(yellowBtn);

    const updatedBtnDetectors = {
      red: [
        ...ctx.getImageData(50, 0, 1, 51).data,
        ...ctx.getImageData(0, 50, 51, 1).data,
      ],
      blue: [
        ...ctx.getImageData(width - 51, 0, 1, 51).data,
        ...ctx.getImageData(width - 51, 50, 51, 1).data,
      ],
      green: [
        ...ctx.getImageData(0, height - 51, 51, 1).data,
        ...ctx.getImageData(51, height - 51, 1, 51).data,
      ],
      yellow: [
        ...ctx.getImageData(width - 51, height - 51, 51, 1).data,
        ...ctx.getImageData(width - 51, height - 51, 1, 51).data,
      ],
    };

    if (currentlyActiveBtn !== null) {
      checkForButtonPress(updatedBtnDetectors[currentlyActiveBtn]);
    } else if (pauseCount > 800) {
      currentlyActiveBtn = selectRandomColor();
      pauseCount = 0;
    } else {
      pauseCount += 16;
    }

    detectors.red = updatedBtnDetectors.red;
    detectors.blue = updatedBtnDetectors.blue;
    detectors.green = updatedBtnDetectors.green;
    detectors.yellow = updatedBtnDetectors.yellow;
  }, 16);
}

function selectRandomColor() {
  const colors = ["red", "blue", "green", "yellow"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function processButtonPress() {
  audioFiles.ding.currentTime = 0;
  audioFiles.ding.play();
  currentlyActiveBtn = null;
  score++;
  scoreBoards.forEach((scoreBoard) => (scoreBoard.innerText = score));
}

function checkForButtonPress(updatedDetectors) {
  const buttonPressed = detectors[currentlyActiveBtn].some(
    (colourVal, index) => {
      return Math.abs(colourVal - updatedDetectors[index]) > 40;
    }
  );
  buttonPressed && processButtonPress();
}

function decrementTimer() {
  if (timeRemaining >= 1) {
    setTimeout(() => {
      timeRemaining--;
      timeBoard.innerText = timeRemaining;
      decrementTimer();
    }, 1000);
  } else {
    endGame();
  }
}

function endGame() {
  audioFiles.music.pause();
  audioFiles.applause.currentTime = 0;
  audioFiles.applause.play();
  clearInterval(gameInterval);
  startGameBtn.classList.remove("--disabled");
  endGameModal.classList.add("--active");
}

function closeEndGameModal() {
  endGameModal.classList.remove("--active");
  score = 0;
  timeRemaining = 30;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  scoreBoards.forEach((scoreBoard) => (scoreBoard.innerText = score));
  timeBoard.innerText = timeRemaining;
}

getVideo();
