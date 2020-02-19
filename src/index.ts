import { makepuzzle } from 'sudoku';
import {
  DIMENSIONS,
  CELL_DIMENSION,
  CELL_BORDER_OFFSET,
  COLORS,
  SOLVE_SPEED
} from './constants';

const canvas: HTMLCanvasElement = document.getElementById(
  'canvas'
) as HTMLCanvasElement;
const ctx: CanvasRenderingContext2D = canvas.getContext(
  '2d'
) as CanvasRenderingContext2D;
canvas.height = DIMENSIONS.CANVAS;
canvas.width = DIMENSIONS.CANVAS;
ctx.fillStyle = COLORS.BLACK;
ctx.fillRect(0, 0, DIMENSIONS.CANVAS, DIMENSIONS.CANVAS);
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.font = '2em Montserrat';

let board: string[][] = [];
let timeout: NodeJS.Timeout;

const generate = async () => {
  clearTimeout(timeout);
  initializeBoard();
  generatePuzzle();
  drawGrid();
};

const initializeBoard = () => {
  for (let i = 0; i < 9; i++) {
    board[i] = [];
    for (let j = 0; j < 9; j++) {
      board[i][j] = '';
    }
  }
};

const generatePuzzle = () => {
  let puzzleArr = makepuzzle();
  for (let i = 0; i < puzzleArr.length; i++) {
    board[Math.floor(i / 9)][i % 9] = puzzleArr[i] ? String(puzzleArr[i]) : '';
  }
};

const drawGrid = () => {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      draw([i, j], board[i][j], COLORS.WHITE);
    }
  }
};

// Utility Functions
const draw = (coords: number[], val, color: string): void => {
  ctx.fillStyle = color;

  const [x, y] = coords;
  /**
   * since HTML Canvas' coodinate system has (0,0) as upper left,
   * swapping x and y orients the board like we'd expect.
   */
  ctx.fillRect(
    y * CELL_DIMENSION + CELL_BORDER_OFFSET,
    x * CELL_DIMENSION + CELL_BORDER_OFFSET,
    (y + 1) % 3 === 0
      ? CELL_DIMENSION - CELL_BORDER_OFFSET * 2
      : CELL_DIMENSION - CELL_BORDER_OFFSET,
    (x + 1) % 3 === 0
      ? CELL_DIMENSION - CELL_BORDER_OFFSET * 2
      : CELL_DIMENSION - CELL_BORDER_OFFSET
  );
  ctx.fillStyle = COLORS.BLACK;
  ctx.fillText(
    val,
    y * CELL_DIMENSION + CELL_DIMENSION / 2,
    x * CELL_DIMENSION + CELL_DIMENSION / 2 // centering hack
  );
};

const placeNumber = async (b, r, c, val) => {
  return new Promise(resolve => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      b[r][c] = String(val);
      draw([r, c], board[r][c], COLORS.WHITE);
      resolve();
    }, SOLVE_SPEED);
  });
};

const solve = async (board, row = 0, col = 0) => {
  if (row === 9) return true;
  if (col === 9) return await solve(board, row + 1, 0);

  if (board[row][col] !== '') return await solve(board, row, col + 1); // the number here is pre-existing
  for (let i = 1; i <= 9; i++) {
    if (isValid(board, row, col, String(i))) {
      await placeNumber(board, row, col, String(i));
      if (await solve(board, row, col + 1)) return true;
      await placeNumber(board, row, col, '');
    }
  }
  return false;
};

const isValid = (board, row, col, char) => {
  // check if exists in row
  for (let i = 0; i < 9; i++) if (board[row][i] === char) return false;
  // check if exists in column
  for (let i = 0; i < 9; i++) if (board[i][col] === char) return false;
  // check if exists in sub-grid
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[row - (row % 3) + i][col - (col % 3) + j] === char)
        return false;
    }
  }
  // is valid
  return true;
};

// Selectors
const generateButton = document.querySelector('#generate');
const solveButton = document.querySelector('#solve');
const downloadButton = document.querySelector('#download');

generateButton.addEventListener('click', async () => {
  await generate();
});

solveButton.addEventListener('click', async () => {
  solveButton.classList.add('is-loading');
  await solve(board);
  solveButton.classList.remove('is-loading');
});

downloadButton.addEventListener('click', () => {
  const a = document.createElement('a');

  document.body.appendChild(a);
  a.href = canvas.toDataURL('image/png');
  a.download = 'sudoku-board.png';
  a.click();
  document.removeChild(a);
});

(async () => {
  // when the page very first loads, generate a puzzle
  await generate();
})();
