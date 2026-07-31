(() => {
  // Difficulty presets
  const DIFFICULTIES = {
    easy:   { cols: 8,  rows: 8,  mines: 10 },
    medium: { cols: 10, rows: 10, mines: 15 },
    hard:   { cols: 16, rows: 16, mines: 40 },
  };

  let difficulty = 'medium';
  let cols, rows, totalMines;
  let grid;       // 2D array of cell objects
  let gameOver;
  let gameWon;
  let firstClick;
  let flagCount;
  let revealedCount;
  let timerInterval;
  let seconds;

  const gridEl = document.getElementById('grid');
  const mineCountEl = document.getElementById('mine-count');
  const timerEl = document.getElementById('timer');
  const resetBtn = document.getElementById('reset-btn');
  const messageEl = document.getElementById('message');

  // --- Initialization ---

  function init() {
    const d = DIFFICULTIES[difficulty];
    cols = d.cols;
    rows = d.rows;
    totalMines = d.mines;

    gameOver = false;
    gameWon = false;
    firstClick = true;
    flagCount = 0;
    revealedCount = 0;
    seconds = 0;

    clearInterval(timerInterval);
    timerInterval = null;
    timerEl.textContent = '000';
    mineCountEl.textContent = String(totalMines);
    resetBtn.textContent = '😊';
    messageEl.textContent = '';
    messageEl.className = 'message';

    // Build logical grid
    grid = [];
    for (let r = 0; r < rows; r++) {
      grid[r] = [];
      for (let c = 0; c < cols; c++) {
        grid[r][c] = {
          mine: false,
          revealed: false,
          flagged: false,
          adjacent: 0,
        };
      }
    }

    renderGrid();
  }

  function placeMines(safeR, safeC) {
    // Place mines avoiding the first-clicked cell and its neighbors
    const safeSet = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = safeR + dr;
        const nc = safeC + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          safeSet.add(nr * cols + nc);
        }
      }
    }

    let placed = 0;
    while (placed < totalMines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const idx = r * cols + c;
      if (!grid[r][c].mine && !safeSet.has(idx)) {
        grid[r][c].mine = true;
        placed++;
      }
    }

    // Calculate adjacency numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].mine) continue;
        let count = 0;
        forNeighbors(r, c, (nr, nc) => {
          if (grid[nr][nc].mine) count++;
        });
        grid[r][c].adjacent = count;
      }
    }
  }

  function forNeighbors(r, c, fn) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          fn(nr, nc);
        }
      }
    }
  }

  // --- Rendering ---

  function renderGrid() {
    gridEl.innerHTML = '';
    gridEl.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'cell hidden';
        cellEl.dataset.row = r;
        cellEl.dataset.col = c;

        // Desktop events
        cellEl.addEventListener('click', onCellClick);
        cellEl.addEventListener('contextmenu', onCellRightClick);

        // Mobile long-press for flagging
        let longPressTimer = null;
        let longPressTriggered = false;

        cellEl.addEventListener('touchstart', (e) => {
          longPressTriggered = false;
          longPressTimer = setTimeout(() => {
            longPressTriggered = true;
            e.preventDefault();
            toggleFlag(r, c);
          }, 400);
        }, { passive: false });

        cellEl.addEventListener('touchend', (e) => {
          clearTimeout(longPressTimer);
          if (longPressTriggered) {
            e.preventDefault();
          }
        });

        cellEl.addEventListener('touchmove', () => {
          clearTimeout(longPressTimer);
        });

        gridEl.appendChild(cellEl);
      }
    }
  }

  function getCellEl(r, c) {
    return gridEl.children[r * cols + c];
  }

  function updateCell(r, c) {
    const cell = grid[r][c];
    const el = getCellEl(r, c);

    el.className = 'cell';

    if (cell.revealed) {
      el.classList.add('revealed');
      if (cell.mine) {
        el.innerHTML = '<span class="mine">💣</span>';
      } else if (cell.adjacent > 0) {
        el.classList.add('n' + cell.adjacent);
        el.textContent = cell.adjacent;
      } else {
        el.textContent = '';
      }
    } else if (cell.flagged) {
      el.classList.add('hidden', 'flagged');
      el.innerHTML = '<span class="flag">🚩</span>';
    } else {
      el.classList.add('hidden');
      el.textContent = '';
    }
  }

  // --- Game Logic ---

  function onCellClick(e) {
    if (gameOver) return;
    const r = parseInt(e.currentTarget.dataset.row);
    const c = parseInt(e.currentTarget.dataset.col);
    reveal(r, c);
  }

  function onCellRightClick(e) {
    e.preventDefault();
    if (gameOver) return;
    const r = parseInt(e.currentTarget.dataset.row);
    const c = parseInt(e.currentTarget.dataset.col);
    toggleFlag(r, c);
  }

  function reveal(r, c) {
    const cell = grid[r][c];
    if (cell.revealed || cell.flagged) return;

    if (firstClick) {
      firstClick = false;
      placeMines(r, c);
      startTimer();
    }

    cell.revealed = true;
    revealedCount++;

    if (cell.mine) {
      // Game over - loss
      gameOver = true;
      clearInterval(timerInterval);
      getCellEl(r, c).classList.add('mine-hit');
      revealAllMines();
      resetBtn.textContent = '😵';
      messageEl.textContent = 'Boom! You hit a mine!';
      messageEl.className = 'message lose';
      return;
    }

    updateCell(r, c);

    // Flood fill for empty cells
    if (cell.adjacent === 0) {
      forNeighbors(r, c, (nr, nc) => {
        if (!grid[nr][nc].revealed && !grid[nr][nc].flagged) {
          reveal(nr, nc);
        }
      });
    }

    checkWin();
  }

  function toggleFlag(r, c) {
    const cell = grid[r][c];
    if (cell.revealed) return;

    if (cell.flagged) {
      cell.flagged = false;
      flagCount--;
    } else {
      cell.flagged = true;
      flagCount++;
    }

    updateCell(r, c);
    mineCountEl.textContent = String(totalMines - flagCount);
  }

  function revealAllMines() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (cell.mine && !cell.revealed) {
          cell.revealed = true;
          updateCell(r, c);
          getCellEl(r, c).classList.add('mine-revealed');
        }
        // Show incorrectly placed flags
        if (cell.flagged && !cell.mine) {
          const el = getCellEl(r, c);
          el.classList.add('revealed');
          el.innerHTML = '<span class="mine" style="opacity:0.4">❌</span>';
        }
      }
    }
  }

  function checkWin() {
    const totalSafe = rows * cols - totalMines;
    if (revealedCount === totalSafe) {
      gameOver = true;
      gameWon = true;
      clearInterval(timerInterval);

      // Auto-flag remaining mines
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c].mine && !grid[r][c].flagged) {
            grid[r][c].flagged = true;
            updateCell(r, c);
          }
        }
      }

      mineCountEl.textContent = '0';
      resetBtn.textContent = '😎';
      messageEl.textContent = 'You win! All mines found!';
      messageEl.className = 'message win';
    }
  }

  // --- Timer ---

  function startTimer() {
    timerInterval = setInterval(() => {
      seconds++;
      timerEl.textContent = String(seconds).padStart(3, '0');
      if (seconds >= 999) {
        clearInterval(timerInterval);
      }
    }, 1000);
  }

  // --- Controls ---

  resetBtn.addEventListener('click', () => {
    init();
  });

  document.querySelectorAll('.difficulty button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelector('.difficulty button.active').classList.remove('active');
      btn.classList.add('active');
      difficulty = btn.dataset.difficulty;
      init();
    });
  });

  // Start with medium difficulty
  init();
})();
