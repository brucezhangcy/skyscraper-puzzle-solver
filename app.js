(() => {
  let currentSize = 4;
  let currentDifficulty = 'medium';
  let currentSolution = null;

  const boardEl = document.getElementById('board');
  const messageEl = document.getElementById('message');

  // --- Size buttons ---
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSize = parseInt(btn.dataset.size);
      currentSolution = null;
      buildBoard();
      clearMessage();
    });
  });

  // --- Difficulty buttons ---
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDifficulty = btn.dataset.diff;
    });
  });

  // --- Action buttons ---
  document.getElementById('solveBtn').addEventListener('click', solvePuzzle);
  document.getElementById('generateBtn').addEventListener('click', generatePuzzle);
  document.getElementById('clearBtn').addEventListener('click', () => {
    currentSolution = null;
    buildBoard();
    clearMessage();
  });

  // --- Build the board ---
  function buildBoard() {
    const n = currentSize;
    const total = n + 2;
    boardEl.style.gridTemplateColumns = `repeat(${total}, 56px)`;
    boardEl.style.gridTemplateRows = `repeat(${total}, 56px)`;
    boardEl.innerHTML = '';

    for (let r = 0; r < total; r++) {
      for (let c = 0; c < total; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');

        const isCorner = (r === 0 || r === total - 1) && (c === 0 || c === total - 1);
        const isTopClue = r === 0 && c > 0 && c < total - 1;
        const isBottomClue = r === total - 1 && c > 0 && c < total - 1;
        const isLeftClue = c === 0 && r > 0 && r < total - 1;
        const isRightClue = c === total - 1 && r > 0 && r < total - 1;
        const isGrid = r > 0 && r < total - 1 && c > 0 && c < total - 1;

        if (isCorner) {
          cell.classList.add('corner');
        } else if (isTopClue || isBottomClue || isLeftClue || isRightClue) {
          cell.classList.add('clue');
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.placeholder = '\u00b7';

          if (isTopClue) {
            input.dataset.dir = '0';
            input.dataset.idx = c - 1;
          } else if (isRightClue) {
            input.dataset.dir = '1';
            input.dataset.idx = r - 1;
          } else if (isBottomClue) {
            input.dataset.dir = '2';
            input.dataset.idx = c - 1;
          } else {
            input.dataset.dir = '3';
            input.dataset.idx = r - 1;
          }

          input.addEventListener('input', handleClueInput);
          input.addEventListener('keydown', handleNavigation);
          cell.appendChild(input);
        } else if (isGrid) {
          cell.classList.add('grid-cell');
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.dataset.row = r - 1;
          input.dataset.col = c - 1;
          input.addEventListener('input', handleGridInput);
          input.addEventListener('keydown', handleNavigation);
          cell.appendChild(input);
        }

        boardEl.appendChild(cell);
      }
    }
  }

  function handleClueInput(e) {
    const val = e.target.value;
    const n = currentSize;
    if (val && (!/^[1-9]$/.test(val) || parseInt(val) > n)) {
      e.target.value = '';
    }
  }

  function handleGridInput(e) {
    const val = e.target.value;
    const n = currentSize;
    if (val && (!/^[1-9]$/.test(val) || parseInt(val) > n)) {
      e.target.value = '';
      return;
    }
    e.target.parentElement.classList.remove('solved', 'error');
    if (val) {
      e.target.parentElement.classList.add('user-filled');
    } else {
      e.target.parentElement.classList.remove('user-filled');
    }
  }

  function handleNavigation(e) {
    const allInputs = Array.from(boardEl.querySelectorAll('input'));
    const currentIndex = allInputs.indexOf(e.target);
    let targetIndex = -1;

    if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
      if (e.key === 'Tab') e.preventDefault();
      targetIndex = currentIndex + 1;
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
      if (e.key === 'Tab') e.preventDefault();
      targetIndex = currentIndex - 1;
    } else if (e.key === 'ArrowDown') {
      targetIndex = currentIndex + currentSize;
      if (targetIndex >= allInputs.length) targetIndex = currentIndex;
    } else if (e.key === 'ArrowUp') {
      targetIndex = currentIndex - currentSize;
      if (targetIndex < 0) targetIndex = currentIndex;
    }

    if (targetIndex >= 0 && targetIndex < allInputs.length && targetIndex !== currentIndex) {
      allInputs[targetIndex].focus();
      allInputs[targetIndex].select();
    }
  }

  function readClues() {
    const n = currentSize;
    const clues = new Array(4 * n).fill(0);
    boardEl.querySelectorAll('.clue input').forEach(input => {
      const dir = parseInt(input.dataset.dir);
      const idx = parseInt(input.dataset.idx);
      const val = parseInt(input.value) || 0;
      clues[dir * n + idx] = val;
    });
    return clues;
  }

  function readGrid() {
    const n = currentSize;
    const grid = Array.from({ length: n }, () => new Array(n).fill(0));
    boardEl.querySelectorAll('.grid-cell input').forEach(input => {
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      const val = parseInt(input.value) || 0;
      grid[r][c] = val;
    });
    return grid;
  }

  function writeSolution(grid) {
    boardEl.querySelectorAll('.grid-cell').forEach(cell => {
      const input = cell.querySelector('input');
      const r = parseInt(input.dataset.row);
      const c = parseInt(input.dataset.col);
      if (!input.value) {
        input.value = grid[r][c];
        cell.classList.add('solved');
        cell.classList.remove('error');
      }
    });
  }

  function writeClues(clues) {
    const n = currentSize;
    boardEl.querySelectorAll('.clue input').forEach(input => {
      const dir = parseInt(input.dataset.dir);
      const idx = parseInt(input.dataset.idx);
      const val = clues[dir * n + idx];
      input.value = val > 0 ? val : '';
    });
  }

  function solvePuzzle() {
    const n = currentSize;
    const clues = readClues();
    const userGrid = readGrid();

    if (clues.every(c => c === 0) && userGrid.flat().every(v => v === 0)) {
      showMessage('请先输入边框线索或格子数字！', 'error');
      return;
    }

    const solver = new SkyscraperSolver(n);
    solver.setClues(clues);
    solver.grid = userGrid.map(r => r.slice());

    showMessage('求解中...', 'info');

    setTimeout(() => {
      const solved = solver.solve();
      if (solved) {
        writeSolution(solver.grid);
        currentSolution = solver.grid.map(r => r.slice());
        showMessage('求解成功！', 'success');
      } else {
        showMessage('无解——请检查线索是否正确。', 'error');
      }
    }, 50);
  }

  function generatePuzzle() {
    showMessage('生成谜题中...', 'info');
    buildBoard();

    setTimeout(() => {
      const n = currentSize;
      const solver = new SkyscraperSolver(n);
      const puzzle = solver.generatePuzzle(currentDifficulty);

      writeClues(puzzle.clues);
      currentSolution = puzzle.solution;

      const clueCount = puzzle.clues.filter(c => c > 0).length;
      const totalClues = 4 * n;
      const labels = { easy: '简单', medium: '中等', hard: '困难' };
      showMessage(`谜题已生成！线索 ${clueCount}/${totalClues}（${labels[currentDifficulty]}）`, 'success');
    }, 50);
  }

  function showMessage(text, type) {
    messageEl.textContent = text;
    messageEl.className = 'message ' + type;
  }

  function clearMessage() {
    messageEl.textContent = '';
    messageEl.className = 'message';
  }

  buildBoard();
})();
