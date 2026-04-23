// ============================================
// RACE MODULE - 5 ALGORITHM FACE-OFF
// ============================================

class Race {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.allData = [];
    this.originalValues = [];

    this.isPlaying = false;
    this.playTimer = null;
    this.speed = 5; // 1-10

    this.sampleSize = 30;
    this.sortField = 'price';
    this.sortOrder = 'asc';
    this.dataType = 'random';

    this.algorithms = ['selection', 'insertion', 'bubble', 'merge', 'quick'];
    this.runners = []; // Stores state for each algorithm
    this.ranks = [];
  }

  init(data) {
    this.allData = data;
    this.render();
    this.bindEvents();
    this.generateSample();
  }

  render() {
    this.container.innerHTML = `
      <div class="controls-bar">
        <div class="control-group">
          <label>Trường sắp xếp:</label>
          <select id="race-field-select">
            <option value="price">Giá (Price)</option>
            <option value="rating">Đánh giá (Rating)</option>
            <option value="stock">Tồn kho (Stock)</option>
          </select>
        </div>

        <div class="control-group">
          <label>Số phần tử:</label>
          <select id="race-size-select">
            <option value="15">15</option>
            <option value="30" selected>30</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </div>

        <div class="control-group">
          <label>Phân bố:</label>
          <select id="race-data-type-select">
            <option value="random">Ngẫu nhiên</option>
            <option value="nearly">Gần sắp xếp</option>
            <option value="reversed">Đảo ngược</option>
            <option value="few">Ít giá trị</option>
          </select>
        </div>

        <button class="btn btn-success" id="race-generate-btn">
          <span><i class="fa-solid fa-shuffle"></i></span> Tạo dữ liệu
        </button>
      </div>

      <!-- Playback Controls -->
      <div class="vis-controls" style="margin-bottom: var(--space-lg);">
        <button class="btn btn-primary" id="race-play-btn" style="width: 120px;">
          <i class="fa-solid fa-play"></i> BẮT ĐẦU ĐUA
        </button>
        <button class="btn btn-outline" id="race-reset-btn">
          <i class="fa-solid fa-rotate-left"></i> Đặt lại
        </button>

        <div class="speed-control">
          <label>Tốc độ: <span id="race-speed-label">5x</span></label>
          <input type="range" id="race-speed" min="1" max="10" value="5">
        </div>
      </div>

      <!-- Race Grid -->
      <div class="race-grid" id="race-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-lg); margin-bottom: var(--space-xl);">
        <!-- Injected via JS -->
      </div>

      <!-- Race Leaderboard -->
      <div class="card" style="margin-top: var(--space-xl);">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-list-ol"></i> Bảng Thống Kê Trực Tiếp</div>
        </div>
        <div class="table-container">
          <table class="data-table" id="race-leaderboard-table">
            <thead>
              <tr>
                <th>Hạng</th>
                <th>Thuật toán</th>
                <th>Trạng thái</th>
                <th>Tốc độ mô phỏng (giây)</th>
                <th>Thực gian thực tế (ms)</th>
                <th>So sánh</th>
                <th>Hoán đổi</th>
                <th>Độ phức tạp</th>
                <th>Không gian</th>
                <th>Ổn định</th>
              </tr>
            </thead>
            <tbody id="race-leaderboard-body">
              <!-- Injected via JS -->
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  bindEvents() {
    document.getElementById('race-field-select')?.addEventListener('change', (e) => {
      this.sortField = e.target.value;
      this.generateSample();
    });
    document.getElementById('race-size-select')?.addEventListener('change', (e) => {
      this.sampleSize = parseInt(e.target.value);
      this.generateSample();
    });
    document.getElementById('race-data-type-select')?.addEventListener('change', (e) => {
      this.dataType = e.target.value;
      this.generateSample();
    });
    document.getElementById('race-generate-btn')?.addEventListener('click', () => {
      this.generateSample();
    });

    document.getElementById('race-play-btn')?.addEventListener('click', () => this.togglePlay());
    document.getElementById('race-reset-btn')?.addEventListener('click', () => this.resetRace());

    document.getElementById('race-speed')?.addEventListener('input', (e) => {
      this.speed = parseInt(e.target.value);
      document.getElementById('race-speed-label').textContent = `${this.speed}x`;
      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    });
  }

  generateSample() {
    this.pause();
    this.ranks = [];

    // Generate base array
    const shuffled = [...this.allData].sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, this.sampleSize);
    let values = sample.map(item => Number(item[this.sortField]));

    switch (this.dataType) {
      case 'nearly':
        values.sort((a, b) => this.sortOrder === 'asc' ? a - b : b - a);
        const numSwaps = Math.max(1, Math.floor(values.length * 0.05));
        for (let s = 0; s < numSwaps; s++) {
          const a = Math.floor(Math.random() * values.length);
          const b = Math.floor(Math.random() * values.length);
          [values[a], values[b]] = [values[b], values[a]];
        }
        break;
      case 'reversed':
        values.sort((a, b) => this.sortOrder === 'asc' ? b - a : a - b);
        break;
      case 'few':
        const uniques = [...new Set(values)].slice(0, 5);
        values = values.map(() => uniques[Math.floor(Math.random() * uniques.length)]);
        break;
    }

    this.originalValues = values;

    // Initialize runners
    this.runners = this.algorithms.map(algo => {
      const info = SortingAlgorithms.getInfo(algo);
      // Run the algorithm to precompute steps
      const result = SortingAlgorithms.run(algo, [...this.originalValues], this.sortOrder);

      return {
        id: algo,
        name: info.name,
        info: info, // store info for leaderboard
        values: [...this.originalValues],
        steps: result.steps,
        comparisons: 0,
        swaps: 0,
        visualTimeMs: 0,
        internalTimeMs: result.timeMs, // Actual JS time
        currentStep: -1,
        isDone: false,
        rank: null
      };
    });

    this.renderGrids();
    this.renderLeaderboard();

    const playBtn = document.getElementById('race-play-btn');
    if (playBtn) {
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i> BẮT ĐẦU ĐUA';
      playBtn.className = 'btn btn-primary';
    }
  }

  renderGrids() {
    const grid = document.getElementById('race-grid');
    if (!grid) return;

    grid.innerHTML = this.runners.map(runner => {
      const algoColors = {
        'selection': '#f472b6', 'insertion': '#a78bfa',
        'bubble': '#fb923c', 'merge': '#22d3ee', 'quick': '#34d399'
      };
      const badgeColor = algoColors[runner.id] || 'var(--accent-cyan)';

      return `
      <div class="card race-card" id="race-card-${runner.id}" style="position: relative; overflow: hidden; border-top: 4px solid ${badgeColor};">
        <div class="card-header" style="padding-bottom: 0;">
          <div class="card-title" style="color: ${badgeColor}; text-shadow: 0 0 10px ${badgeColor}40;">${runner.name}</div>
          <span class="algo-badge" id="race-progress-${runner.id}" style="background: ${badgeColor}20; color: ${badgeColor}; border-color: ${badgeColor}40;">0%</span>
        </div>
        <div class="race-chart-container" style="height: 180px; padding: 10px; display: flex; align-items: flex-end; gap: 1px;">
          <!-- Bars injected here -->
        </div>
        <div class="race-rank-overlay" id="race-rank-${runner.id}" style="display:none; position:absolute; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.7); color: white; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter: blur(2px);">
          <i class="fa-solid fa-trophy" style="font-size: 3rem; color: var(--accent-yellow); margin-bottom: 10px;"></i>
          <h2 style="margin:0;">Hạng 1</h2>
        </div>
      </div>
      `;
    }).join('');

    this.runners.forEach(runner => {
      this.renderBars(runner);
      document.getElementById(`race-rank-${runner.id}`).style.display = 'none';
    });
  }

  renderBars(runner) {
    const card = document.getElementById(`race-card-${runner.id}`);
    if (!card) return;
    const container = card.querySelector('.race-chart-container');

    const maxVal = Math.max(...this.originalValues, 1);
    const n = runner.values.length;
    container.style.gap = n > 100 ? '0px' : '1px';

    const algoColors = {
      'selection': '#f472b6', // pink
      'insertion': '#a78bfa', // purple
      'bubble': '#fb923c',    // orange
      'merge': '#22d3ee',     // cyan
      'quick': '#34d399'      // green
    };

    const baseColor = algoColors[runner.id] || 'var(--accent-cyan)';

    container.innerHTML = runner.values.map((val, i) => {
      const height = Math.max((val / maxVal) * 100, 2);
      let bgColor = baseColor;

      if (runner.isDone) {
        bgColor = '#10b981'; // Green when done
      } else if (runner.highlights?.comparing?.includes(i)) {
        bgColor = '#fbbf24'; // Yellow
      } else if (runner.highlights?.swapping?.includes(i)) {
        bgColor = '#ef4444'; // Red
      }

      return `<div style="flex: 1; height: ${height}%; background: ${bgColor}; border-radius: 2px 2px 0 0; transition: background-color 0.1s;"></div>`;
    }).join('');

    // Update progress
    const progressEl = document.getElementById(`race-progress-${runner.id}`);
    if (progressEl) {
      if (runner.steps.length === 0) {
        progressEl.textContent = '100%';
      } else {
        const pct = Math.min(100, Math.max(0, Math.floor(((runner.currentStep + 1) / runner.steps.length) * 100)));
        progressEl.textContent = `${pct}%`;
      }
    }
  }

  renderLeaderboard() {
    const tbody = document.getElementById('race-leaderboard-body');
    if (!tbody) return;

    const algoColors = {
      'selection': '#f472b6', 'insertion': '#a78bfa',
      'bubble': '#fb923c', 'merge': '#22d3ee', 'quick': '#34d399'
    };

    // Sort by rank if finished, else keep original order or sort by progress
    const sortedRunners = [...this.runners].sort((a, b) => {
      if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
      if (a.rank !== null) return -1;
      if (b.rank !== null) return 1;
      return 0; // maintain order
    });

    tbody.innerHTML = sortedRunners.map(runner => {
      const c = algoColors[runner.id] || 'var(--text-color)';
      const statusHtml = runner.isDone
        ? `<span class="badge" style="background: ${c}20; color: ${c}"><i class="fa-solid fa-check"></i> Hoàn thành</span>`
        : `<span class="badge" style="background: var(--bg-hover); color: var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Đang chạy</span>`;

      const rankHtml = runner.rank
        ? `<strong style="color: ${runner.rank === 1 ? 'var(--accent-yellow)' : c}">#${runner.rank}</strong>`
        : '-';

      // Only show time if done, else show current accumulated
      const timeHtml = runner.isDone
        ? `${(runner.visualTimeMs / 1000).toFixed(2)}s`
        : runner.visualTimeMs > 0 ? `${(runner.visualTimeMs / 1000).toFixed(1)}s` : '-';

      return `
        <tr style="border-left: 3px solid ${c}">
          <td style="text-align: center;">${rankHtml}</td>
          <td>
            <strong style="color: ${c}">${runner.name}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; max-width: 250px;">
              ${runner.info.features || runner.info.description}
            </div>
          </td>
          <td>${statusHtml}</td>
          <td style="text-align: right; font-family: monospace;" id="lb-time-${runner.id}">${timeHtml}</td>
          <td style="text-align: right; font-family: monospace; color: var(--accent-cyan);">${runner.internalTimeMs.toFixed(3)}ms</td>
          <td style="text-align: right; font-family: monospace;" id="lb-cmp-${runner.id}">${runner.comparisons.toLocaleString()}</td>
          <td style="text-align: right; font-family: monospace;" id="lb-swap-${runner.id}">${runner.swaps.toLocaleString()}</td>
          <td><span class="complexity-badge">${runner.info.worst}</span></td>
          <td><span class="complexity-badge">${runner.info.space}</span></td>
          <td>${runner.info.stable ? '<span class="text-success">Có</span>' : '<span class="text-error">Không</span>'}</td>
        </tr>
      `;
    }).join('');
  }

  updateLeaderboardRow(runner) {
    const cmpEl = document.getElementById(`lb-cmp-${runner.id}`);
    const swapEl = document.getElementById(`lb-swap-${runner.id}`);
    const timeEl = document.getElementById(`lb-time-${runner.id}`);

    if (cmpEl) cmpEl.textContent = runner.comparisons.toLocaleString();
    if (swapEl) swapEl.textContent = runner.swaps.toLocaleString();
    if (timeEl) {
      timeEl.textContent = runner.isDone
        ? `${(runner.visualTimeMs / 1000).toFixed(2)}s`
        : `${(runner.visualTimeMs / 1000).toFixed(1)}s`;
    }
  }

  resetRace() {
    this.pause();
    this.ranks = [];
    this.runners.forEach(runner => {
      runner.values = [...this.originalValues];
      runner.currentStep = -1;
      runner.comparisons = 0;
      runner.swaps = 0;
      runner.visualTimeMs = 0;
      runner.isDone = false;
      runner.rank = null;
    });
    this.renderGrids();
    this.renderLeaderboard();

    const playBtn = document.getElementById('race-play-btn');
    if (playBtn) {
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i> BẮT ĐẦU ĐUA';
      playBtn.className = 'btn btn-primary';
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      // Check if all done
      if (this.runners.every(r => r.isDone)) {
        this.resetRace();
      }
      this.play();
    }
  }

  play() {
    this.isPlaying = true;
    const playBtn = document.getElementById('race-play-btn');
    if (playBtn) {
      playBtn.innerHTML = '<i class="fa-solid fa-pause"></i> TẠM DỪNG';
      playBtn.className = 'btn btn-warning';
    }

    const delays = {
      1: 500, 2: 300, 3: 150, 4: 80, 5: 40,
      6: 20, 7: 10, 8: 5, 9: 2, 10: 1
    };

    const stepLoop = () => {
      let anyMoved = false;
      const currentDelay = delays[this.speed] || 40;

      this.runners.forEach(runner => {
        if (runner.isDone) return;

        // Accumulate visual time
        runner.visualTimeMs += currentDelay;

        // Apply 1 step
        runner.currentStep++;
        if (runner.currentStep >= runner.steps.length) {
          runner.isDone = true;
          this.ranks.push(runner.id);
          runner.rank = this.ranks.length;
          this.showRank(runner);
          this.renderLeaderboard(); // full re-render to show ranks and final time
          return;
        }

        anyMoved = true;
        const step = runner.steps[runner.currentStep];
        this.applyStep(runner, step);
        this.renderBars(runner);
        this.updateLeaderboardRow(runner); // fast update
      });

      if (!anyMoved) {
        this.pause();
        if (playBtn) {
          playBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> CHẠY LẠI';
          playBtn.className = 'btn btn-success';
        }
        return;
      }

      this.playTimer = setTimeout(stepLoop, delays[this.speed] || 40);
    };

    stepLoop();
  }

  pause() {
    this.isPlaying = false;
    if (this.playTimer) clearTimeout(this.playTimer);

    const playBtn = document.getElementById('race-play-btn');
    if (playBtn && !this.runners.every(r => r.isDone)) {
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i> TIẾP TỤC';
      playBtn.className = 'btn btn-primary';
    }
  }

  applyStep(runner, step) {
    runner.highlights = { comparing: [], swapping: [] };

    if (step.type === 'compare' || step.type === 'info') {
      runner.highlights.comparing = step.indices || [];
      if (step.type === 'compare') runner.comparisons++;
    } else if (step.type === 'swap') {
      runner.highlights.swapping = step.indices || [];
      runner.swaps++;
      const [i, j] = step.indices;
      [runner.values[i], runner.values[j]] = [runner.values[j], runner.values[i]];
    } else if (step.type === 'insert') {
      runner.highlights.swapping = step.indices || [];
      runner.swaps++;
      if (step.values) {
        runner.values = [...step.values];
      }
    } else if (step.type === 'merge' || step.type === 'merge-done') {
      runner.highlights.swapping = step.indices || [];
      if (step.type === 'merge') runner.swaps++;
      if (step.values) {
        runner.values = [...step.values];
      }
    } else if (step.type === 'pivot' || step.type === 'partition-done' || step.type === 'base-case') {
      runner.highlights.swapping = step.indices || [];
    }
  }

  showRank(runner) {
    const overlay = document.getElementById(`race-rank-${runner.id}`);
    if (!overlay) return;

    let color = 'white';
    let icon = 'fa-medal';
    if (runner.rank === 1) { color = 'var(--accent-yellow)'; icon = 'fa-trophy'; }
    else if (runner.rank === 2) { color = '#cbd5e1'; icon = 'fa-medal'; }
    else if (runner.rank === 3) { color = '#b45309'; icon = 'fa-medal'; }

    overlay.innerHTML = `
      <i class="fa-solid ${icon}" style="font-size: 3rem; color: ${color}; margin-bottom: 10px;"></i>
      <h2 style="margin:0; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">Hạng ${runner.rank}</h2>
    `;
    overlay.style.display = 'flex';
    // Small animation
    overlay.animate([
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1)' }
    ], { duration: 300, fill: 'forwards', easing: 'ease-out' });
  }
}

window.Race = Race;
