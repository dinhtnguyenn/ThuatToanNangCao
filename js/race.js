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
      <div class="race-grid" id="race-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-lg);">
        <!-- Injected via JS -->
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
        values: [...this.originalValues],
        steps: result.steps,
        currentStep: -1,
        isDone: false,
        rank: null
      };
    });

    this.renderGrids();
    
    const playBtn = document.getElementById('race-play-btn');
    if (playBtn) {
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i> BẮT ĐẦU ĐUA';
      playBtn.className = 'btn btn-primary';
    }
  }

  renderGrids() {
    const grid = document.getElementById('race-grid');
    if (!grid) return;

    grid.innerHTML = this.runners.map(runner => `
      <div class="card race-card" id="race-card-${runner.id}" style="position: relative; overflow: hidden;">
        <div class="card-header" style="padding-bottom: 0;">
          <div class="card-title">${runner.name}</div>
          <span class="algo-badge" id="race-progress-${runner.id}">0%</span>
        </div>
        <div class="race-chart-container" style="height: 180px; padding: 10px; display: flex; align-items: flex-end; gap: 1px;">
          <!-- Bars injected here -->
        </div>
        <div class="race-rank-overlay" id="race-rank-${runner.id}" style="display:none; position:absolute; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.7); color: white; display:flex; flex-direction:column; align-items:center; justify-content:center; backdrop-filter: blur(2px);">
          <i class="fa-solid fa-trophy" style="font-size: 3rem; color: var(--accent-yellow); margin-bottom: 10px;"></i>
          <h2 style="margin:0;">Hạng 1</h2>
        </div>
      </div>
    `).join('');

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

    container.innerHTML = runner.values.map(val => {
      const height = Math.max((val / maxVal) * 100, 2);
      return `<div style="flex: 1; height: ${height}%; background: var(--accent-cyan); border-radius: 2px 2px 0 0;"></div>`;
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

  resetRace() {
    this.pause();
    this.ranks = [];
    this.runners.forEach(runner => {
      runner.values = [...this.originalValues];
      runner.currentStep = -1;
      runner.isDone = false;
      runner.rank = null;
    });
    this.renderGrids();
    
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

      this.runners.forEach(runner => {
        if (runner.isDone) return;
        
        // Apply 1 step
        runner.currentStep++;
        if (runner.currentStep >= runner.steps.length) {
          runner.isDone = true;
          this.ranks.push(runner.id);
          runner.rank = this.ranks.length;
          this.showRank(runner);
          return;
        }

        anyMoved = true;
        const step = runner.steps[runner.currentStep];
        this.applyStep(runner, step);
        this.renderBars(runner);
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
    if (step.type === 'swap') {
      const [i, j] = step.indices;
      [runner.values[i], runner.values[j]] = [runner.values[j], runner.values[i]];
    } else if (step.type === 'insert') {
      // In algorithms.js, 'insert' might just be a notification. 
      // The actual array mutation is usually done inside the visualization if we track it.
      // Wait, algorithms.js steps don't mutate for insertion, they just show the state. 
      // Actually, my algorithms.js steps push \`values\` array in \`merge\` steps!
      if (step.values) {
        runner.values = [...step.values];
      }
    } else if (step.type === 'merge') {
      if (step.values) {
        runner.values = [...step.values];
      }
    }
    // We only need basic swapping and overriding for Race visualizer
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
