/**
 * Skyscraper Puzzle Solver & Generator
 * Supports N×N grids (4, 5, 6)
 */

class SkyscraperSolver {
  constructor(n) {
    this.n = n;
    // clues: [top0..topN-1, right0..rightN-1, bottom0..bottomN-1, left0..leftN-1]
    // 0 means no clue
    this.clues = new Array(4 * n).fill(0);
    this.grid = Array.from({ length: n }, () => new Array(n).fill(0));
  }

  setClues(clues) {
    this.clues = clues.slice();
  }

  /** Count visible buildings from the start of a line */
  static countVisible(line) {
    let count = 0, max = 0;
    for (const h of line) {
      if (h > max) { count++; max = h; }
    }
    return count;
  }

  /** Get the clue for a given direction and index */
  getClue(dir, idx) {
    // dir: 0=top, 1=right, 2=bottom, 3=left
    return this.clues[dir * this.n + idx];
  }

  /** Extract a line from the grid for a given clue position */
  getLine(dir, idx) {
    const n = this.n;
    const line = [];
    if (dir === 0) { // top: column idx, top to bottom
      for (let r = 0; r < n; r++) line.push(this.grid[r][idx]);
    } else if (dir === 1) { // right: row idx, right to left
      for (let c = n - 1; c >= 0; c--) line.push(this.grid[idx][c]);
    } else if (dir === 2) { // bottom: column idx, bottom to top
      for (let r = n - 1; r >= 0; r--) line.push(this.grid[r][idx]);
    } else { // left: row idx, left to right
      for (let c = 0; c < n; c++) line.push(this.grid[idx][c]);
    }
    return line;
  }

  /** Check if a clue is satisfied (0 = no clue, always OK) */
  checkClue(dir, idx) {
    const clue = this.getClue(dir, idx);
    if (clue === 0) return true;
    const line = this.getLine(dir, idx);
    if (line.includes(0)) return true; // incomplete
    return SkyscraperSolver.countVisible(line) === clue;
  }

  /** Partial check: can the clue still be satisfied? */
  checkCluePartial(dir, idx) {
    const clue = this.getClue(dir, idx);
    if (clue === 0) return true;
    const line = this.getLine(dir, idx);

    // Count visible so far and check feasibility
    let visible = 0, max = 0;
    let filled = 0;
    for (const h of line) {
      if (h === 0) break;
      filled++;
      if (h > max) { visible++; max = h; }
    }

    // If all filled, exact check
    if (filled === this.n) return visible === clue;

    // Already too many visible
    if (visible > clue) return false;

    // If clue is 1, the first must be n
    if (clue === 1 && filled > 0 && line[0] !== this.n) return false;

    // Remaining cells can add at most (n - filled) more visible
    if (visible + (this.n - filled) < clue) return false;

    return true;
  }

  /** Check if placing val at (row, col) is valid */
  isValid(row, col, val) {
    const n = this.n;
    // Row uniqueness
    for (let c = 0; c < n; c++) {
      if (c !== col && this.grid[row][c] === val) return false;
    }
    // Column uniqueness
    for (let r = 0; r < n; r++) {
      if (r !== row && this.grid[r][col] === val) return false;
    }
    return true;
  }

  /** Solve the puzzle using backtracking with constraint checking */
  solve() {
    return this._solveAt(0, 0);
  }

  _solveAt(row, col) {
    const n = this.n;
    if (row === n) return true; // all rows filled

    const nextCol = (col + 1) % n;
    const nextRow = col + 1 >= n ? row + 1 : row;

    // If cell already filled (user input), skip
    if (this.grid[row][col] !== 0) {
      if (!this._checkConstraints(row, col)) return false;
      return this._solveAt(nextRow, nextCol);
    }

    for (let val = 1; val <= n; val++) {
      if (!this.isValid(row, col, val)) continue;
      this.grid[row][col] = val;

      if (this._checkConstraints(row, col)) {
        if (this._solveAt(nextRow, nextCol)) return true;
      }

      this.grid[row][col] = 0;
    }
    return false;
  }

  /** Check all relevant constraints after placing at (row, col) */
  _checkConstraints(row, col) {
    const n = this.n;

    // Top clue for this column (looking down)
    if (!this.checkCluePartial(0, col)) return false;
    // Bottom clue for this column (looking up) — only fully check when column complete
    if (row === n - 1) {
      const clue = this.getClue(2, col);
      if (clue > 0) {
        const line = this.getLine(2, col);
        if (SkyscraperSolver.countVisible(line) !== clue) return false;
      }
    }
    // Left clue for this row (looking right)
    if (!this.checkCluePartial(3, row)) return false;
    // Right clue for this row (looking left) — only fully check when row complete
    if (col === n - 1) {
      const clue = this.getClue(1, row);
      if (clue > 0) {
        const line = this.getLine(1, row);
        if (SkyscraperSolver.countVisible(line) !== clue) return false;
      }
    }

    return true;
  }

  /** Count the number of solutions (up to limit) */
  countSolutions(limit = 2) {
    this._solutionCount = 0;
    this._solutionLimit = limit;
    this._countAt(0, 0);
    return this._solutionCount;
  }

  _countAt(row, col) {
    const n = this.n;
    if (this._solutionCount >= this._solutionLimit) return;
    if (row === n) { this._solutionCount++; return; }

    const nextCol = (col + 1) % n;
    const nextRow = col + 1 >= n ? row + 1 : row;

    if (this.grid[row][col] !== 0) {
      if (!this._checkConstraints(row, col)) return;
      this._countAt(nextRow, nextCol);
      return;
    }

    for (let val = 1; val <= n; val++) {
      if (!this.isValid(row, col, val)) continue;
      this.grid[row][col] = val;
      if (this._checkConstraints(row, col)) {
        this._countAt(nextRow, nextCol);
      }
      this.grid[row][col] = 0;
    }
  }

  /** Generate a complete valid grid */
  generateFullGrid() {
    this.grid = Array.from({ length: this.n }, () => new Array(this.n).fill(0));
    this.clues = new Array(4 * this.n).fill(0);
    this._fillRandom(0, 0);
  }

  _fillRandom(row, col) {
    const n = this.n;
    if (row === n) return true;
    const nextCol = (col + 1) % n;
    const nextRow = col + 1 >= n ? row + 1 : row;

    const vals = [];
    for (let i = 1; i <= n; i++) vals.push(i);
    // Shuffle
    for (let i = vals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [vals[i], vals[j]] = [vals[j], vals[i]];
    }

    for (const val of vals) {
      if (!this.isValid(row, col, val)) continue;
      this.grid[row][col] = val;
      if (this._fillRandom(nextRow, nextCol)) return true;
      this.grid[row][col] = 0;
    }
    return false;
  }

  /** Compute all clues from a filled grid */
  computeAllClues() {
    const n = this.n;
    const clues = new Array(4 * n).fill(0);
    for (let i = 0; i < n; i++) {
      clues[0 * n + i] = SkyscraperSolver.countVisible(this.getLine(0, i)); // top
      clues[1 * n + i] = SkyscraperSolver.countVisible(this.getLine(1, i)); // right
      clues[2 * n + i] = SkyscraperSolver.countVisible(this.getLine(2, i)); // bottom
      clues[3 * n + i] = SkyscraperSolver.countVisible(this.getLine(3, i)); // left
    }
    return clues;
  }

  /**
   * Generate a puzzle with given difficulty
   * difficulty: 'easy' | 'medium' | 'hard'
   * Returns { clues, solution }
   */
  generatePuzzle(difficulty = 'medium') {
    const n = this.n;

    // Step 1: generate a full grid
    this.generateFullGrid();
    const solution = this.grid.map(r => r.slice());
    const allClues = this.computeAllClues();

    // Step 2: decide how many clues to keep based on difficulty
    let minClues, maxClues;
    if (difficulty === 'easy') {
      minClues = Math.floor(3.2 * n);
      maxClues = 4 * n;
    } else if (difficulty === 'medium') {
      minClues = Math.floor(2.0 * n);
      maxClues = Math.floor(3.0 * n);
    } else { // hard
      minClues = Math.floor(1.2 * n);
      maxClues = Math.floor(2.0 * n);
    }

    // Step 3: try removing clues while maintaining unique solution
    const indices = [];
    for (let i = 0; i < 4 * n; i++) indices.push(i);
    // Shuffle removal order
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const keptClues = allClues.slice();
    let currentCount = 4 * n;

    for (const idx of indices) {
      if (currentCount <= minClues) break;

      const saved = keptClues[idx];
      keptClues[idx] = 0;

      // Check if still unique solution
      const testSolver = new SkyscraperSolver(n);
      testSolver.setClues(keptClues);
      const solCount = testSolver.countSolutions(2);

      if (solCount === 1 && currentCount - 1 >= minClues) {
        currentCount--;
      } else {
        keptClues[idx] = saved; // restore
      }
    }

    // If we have too many clues for the difficulty, try harder
    // (this is best-effort)

    return {
      clues: keptClues,
      solution: solution
    };
  }
}
