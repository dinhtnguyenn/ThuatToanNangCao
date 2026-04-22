// ============================================
// VISUALIZER MODULE - STEP-BY-STEP ANIMATION
// ============================================

class Visualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.data = [];
    this.originalData = [];
    this.currentValues = [];
    this.steps = [];
    this.currentStep = -1;
    this.isPlaying = false;
    this.playTimer = null;
    this.speed = 5; // 1-10 scale
    this.algorithm = 'selection';
    this.sortField = 'price';
    this.sortOrder = 'asc';
    this.sampleSize = 30;
    this.sortedIndices = new Set();
    this.comparisons = 0;
    this.swapsCount = 0;
    this.result = null;
  }

  init(allData) {
    this.allData = allData;
    this.render();
    this.bindEvents();
    this.generateSample();
  }

  render() {
    const algorithms = SortingAlgorithms.getAllNames();
    const algoCardsHtml = algorithms.map(name => {
      const info = SortingAlgorithms.getInfo(name);
      return `
        <div class="algo-info-card ${name === this.algorithm ? 'selected' : ''}" data-algo="${name}">
          <div class="algo-name">${info.name}</div>
          <div class="algo-complexity">Avg: ${info.average} | Space: ${info.space}</div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <!-- Algorithm Selection -->
      <div class="algo-info-grid" id="vis-algo-grid">
        ${algoCardsHtml}
      </div>

      <!-- Controls Bar -->
      <div class="controls-bar">
        <div class="control-group">
          <label>Trường sắp xếp:</label>
          <select id="vis-field-select">
            <option value="price">Giá (Price)</option>
            <option value="rating">Đánh giá (Rating)</option>
            <option value="stock">Tồn kho (Stock)</option>
          </select>
        </div>

        <div class="control-group">
          <label>Thứ tự:</label>
          <select id="vis-order-select">
            <option value="asc">Tăng dần ↑</option>
            <option value="desc">Giảm dần ↓</option>
          </select>
        </div>

        <div class="control-group">
          <label>Số phần tử:</label>
          <select id="vis-size-select">
            <option value="15">15</option>
            <option value="20">20</option>
            <option value="30" selected>30</option>
            <option value="50">50</option>
          </select>
        </div>

        <button class="btn btn-success" id="vis-generate-btn">
          <span>🎲</span> Tạo dữ liệu mới
        </button>
      </div>

      <!-- Main Layout -->
      <div class="visualizer-layout">
        <div class="vis-main">
          <!-- Bar Chart -->
          <div class="bar-chart-container">
            <div class="card-header">
              <div class="card-title" id="vis-title">Biểu đồ trực quan</div>
              <div class="legend">
                <div class="legend-item"><div class="legend-color default"></div> Mặc định</div>
                <div class="legend-item"><div class="legend-color comparing"></div> So sánh</div>
                <div class="legend-item"><div class="legend-color swapping"></div> Hoán đổi</div>
                <div class="legend-item"><div class="legend-color pivot"></div> Pivot</div>
                <div class="legend-item"><div class="legend-color sorted"></div> Đã sắp xếp</div>
              </div>
            </div>
            <div class="bar-chart show-values" id="bar-chart"></div>

            <!-- Step Info -->
            <div class="step-info">
              <div>Bước: <span class="step-counter" id="step-counter">0 / 0</span></div>
              <div class="step-description" id="step-description">Nhấn Play để bắt đầu mô phỏng</div>
            </div>

            <!-- Controls -->
            <div class="vis-controls">
              <button class="btn btn-icon tooltip" id="vis-reset-btn" data-tooltip="Reset">⏮</button>
              <button class="btn btn-icon tooltip" id="vis-prev-btn" data-tooltip="Bước trước">⏪</button>
              <button class="btn btn-icon btn-play tooltip" id="vis-play-btn" data-tooltip="Play/Pause">▶</button>
              <button class="btn btn-icon tooltip" id="vis-next-btn" data-tooltip="Bước tiếp">⏩</button>
              <button class="btn btn-icon tooltip" id="vis-end-btn" data-tooltip="Đến cuối">⏭</button>
              
              <div class="speed-control">
                <span>🐢</span>
                <input type="range" id="vis-speed" min="1" max="10" value="5" />
                <span>🐇</span>
                <span class="speed-label" id="speed-label">5x</span>
              </div>
            </div>
          </div>

          <!-- Stats -->
          <div class="vis-stats-grid">
            <div class="vis-stat">
              <div class="label">Bước hiện tại</div>
              <div class="value cyan" id="vis-step-count">0</div>
            </div>
            <div class="vis-stat">
              <div class="label">Số so sánh</div>
              <div class="value yellow" id="vis-comparisons">0</div>
            </div>
            <div class="vis-stat">
              <div class="label">Số hoán đổi</div>
              <div class="value red" id="vis-swaps">0</div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="vis-sidebar">
          <!-- Algorithm Info -->
          <div class="card">
            <div class="card-header">
              <div class="card-title" id="vis-algo-name">Selection Sort</div>
              <span class="algo-badge" id="vis-algo-stable">Unstable</span>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: var(--space-md);" id="vis-algo-desc">
              Tìm phần tử nhỏ nhất và đặt vào đầu.
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm); font-size: 0.8rem;">
              <div><span style="color: var(--text-muted);">Best:</span> <span id="vis-algo-best" class="complexity-badge">O(n²)</span></div>
              <div><span style="color: var(--text-muted);">Avg:</span> <span id="vis-algo-avg" class="complexity-badge">O(n²)</span></div>
              <div><span style="color: var(--text-muted);">Worst:</span> <span id="vis-algo-worst" class="complexity-badge">O(n²)</span></div>
              <div><span style="color: var(--text-muted);">Space:</span> <span id="vis-algo-space" class="complexity-badge">O(1)</span></div>
            </div>
          </div>

          <!-- Pseudocode -->
          <div class="card pseudocode-card">
            <div class="card-header">
              <div class="card-title">📝 Pseudocode</div>
            </div>
            <div class="pseudocode" id="vis-pseudocode"></div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Algorithm selection
    document.getElementById('vis-algo-grid')?.addEventListener('click', (e) => {
      const card = e.target.closest('.algo-info-card');
      if (!card) return;
      this.algorithm = card.dataset.algo;
      document.querySelectorAll('.algo-info-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      this.updateAlgoInfo();
      this.generateSample();
    });

    // Field, Order, Size
    document.getElementById('vis-field-select')?.addEventListener('change', (e) => {
      this.sortField = e.target.value;
      this.generateSample();
    });

    document.getElementById('vis-order-select')?.addEventListener('change', (e) => {
      this.sortOrder = e.target.value;
      this.generateSample();
    });

    document.getElementById('vis-size-select')?.addEventListener('change', (e) => {
      this.sampleSize = parseInt(e.target.value);
      this.generateSample();
    });

    // Generate
    document.getElementById('vis-generate-btn')?.addEventListener('click', () => {
      this.generateSample();
      if (window.app) window.app.showToast('Đã tạo dữ liệu mới!', 'info');
    });

    // Controls
    document.getElementById('vis-play-btn')?.addEventListener('click', () => this.togglePlay());
    document.getElementById('vis-next-btn')?.addEventListener('click', () => this.stepForward());
    document.getElementById('vis-prev-btn')?.addEventListener('click', () => this.stepBackward());
    document.getElementById('vis-reset-btn')?.addEventListener('click', () => this.resetVisualization());
    document.getElementById('vis-end-btn')?.addEventListener('click', () => this.skipToEnd());

    // Speed
    document.getElementById('vis-speed')?.addEventListener('input', (e) => {
      this.speed = parseInt(e.target.value);
      document.getElementById('speed-label').textContent = `${this.speed}x`;
      if (this.isPlaying) {
        this.pause();
        this.play();
      }
    });
  }

  generateSample() {
    this.stop();
    this.currentStep = -1;
    this.sortedIndices = new Set();
    this.comparisons = 0;
    this.swapsCount = 0;

    // Random sample from allData
    const shuffled = [...this.allData].sort(() => Math.random() - 0.5);
    this.data = shuffled.slice(0, this.sampleSize);
    this.originalData = this.data.map(d => d[this.sortField]);
    this.currentValues = [...this.originalData];

    // Ensure all values are numeric
    this.currentValues = this.currentValues.map(Number);
    this.originalData = this.originalData.map(Number);

    // Run algorithm to get steps
    this.result = SortingAlgorithms.run(this.algorithm, this.currentValues, this.sortOrder);
    this.steps = this.result.steps;

    this.renderBars();
    this.updateStepInfo();
    this.updateAlgoInfo();
    this.updateStats();
    this.updatePseudocode(-1);
  }

  renderBars(highlightIndices = {}) {
    const chart = document.getElementById('bar-chart');
    if (!chart) return;

    const maxVal = Math.max(...this.currentValues, 1);

    chart.innerHTML = this.currentValues.map((val, i) => {
      const height = (val / maxVal) * 100;
      let cls = 'bar';

      if (this.sortedIndices.has(i)) cls += ' sorted';
      if (highlightIndices.comparing?.includes(i)) cls += ' comparing';
      if (highlightIndices.swapping?.includes(i)) cls += ' swapping';
      if (highlightIndices.pivot?.includes(i)) cls += ' pivot';
      if (highlightIndices.merge?.includes(i)) cls += ' comparing';

      return `<div class="${cls}" style="height: ${Math.max(height, 2)}%">
        <span class="bar-value">${typeof val === 'number' ? (val % 1 === 0 ? val : val.toFixed(1)) : val}</span>
      </div>`;
    }).join('');
  }

  stepForward() {
    if (this.currentStep >= this.steps.length - 1) {
      this.pause();
      return false;
    }

    this.currentStep++;
    this.applyStep(this.currentStep);
    return true;
  }

  stepBackward() {
    if (this.currentStep < 0) return;

    // Reset and replay up to currentStep - 1
    this.currentValues = [...this.originalData];
    this.sortedIndices = new Set();
    this.comparisons = 0;
    this.swapsCount = 0;

    const targetStep = this.currentStep - 1;
    this.currentStep = -1;

    for (let i = 0; i <= targetStep; i++) {
      this.currentStep = i;
      this.applyStepSilent(i);
    }

    if (targetStep < 0) {
      this.currentStep = -1;
      this.renderBars();
    } else {
      // Re-render the last step with highlights
      this.applyStep(targetStep);
    }

    this.updateStepInfo();
    this.updateStats();
  }

  applyStep(stepIndex) {
    const step = this.steps[stepIndex];
    if (!step) return;

    const highlights = {};

    switch (step.type) {
      case 'compare':
        highlights.comparing = step.indices;
        this.comparisons++;
        break;
      case 'swap':
        highlights.swapping = step.indices;
        if (step.indices.length === 2) {
          const [i, j] = step.indices;
          [this.currentValues[i], this.currentValues[j]] = [this.currentValues[j], this.currentValues[i]];
        }
        this.swapsCount++;
        break;
      case 'insert':
        highlights.swapping = step.indices;
        break;
      case 'merge':
        if (step.values) {
          this.currentValues = [...step.values];
        }
        highlights.merge = step.indices;
        break;
      case 'sorted':
        step.indices.forEach(i => this.sortedIndices.add(i));
        break;
      case 'pivot':
        highlights.pivot = step.indices;
        break;
      case 'done':
        // Mark all as sorted
        for (let i = 0; i < this.currentValues.length; i++) {
          this.sortedIndices.add(i);
        }
        break;
    }

    this.renderBars(highlights);
    this.updateStepInfo();
    this.updateStats();
    this.updatePseudocode(step.line);
  }

  applyStepSilent(stepIndex) {
    const step = this.steps[stepIndex];
    if (!step) return;

    switch (step.type) {
      case 'compare':
        this.comparisons++;
        break;
      case 'swap':
        if (step.indices.length === 2) {
          const [i, j] = step.indices;
          [this.currentValues[i], this.currentValues[j]] = [this.currentValues[j], this.currentValues[i]];
        }
        this.swapsCount++;
        break;
      case 'merge':
        if (step.values) {
          this.currentValues = [...step.values];
        }
        break;
      case 'sorted':
        step.indices.forEach(i => this.sortedIndices.add(i));
        break;
      case 'done':
        for (let i = 0; i < this.currentValues.length; i++) {
          this.sortedIndices.add(i);
        }
        break;
    }
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.currentStep >= this.steps.length - 1) {
      this.resetVisualization();
    }

    this.isPlaying = true;
    const playBtn = document.getElementById('vis-play-btn');
    if (playBtn) playBtn.textContent = '⏸';

    const delay = Math.max(20, 500 / this.speed);

    const step = () => {
      if (!this.isPlaying) return;
      const hasMore = this.stepForward();
      if (hasMore) {
        this.playTimer = setTimeout(step, delay);
      } else {
        this.pause();
      }
    };

    this.playTimer = setTimeout(step, delay);
  }

  pause() {
    this.isPlaying = false;
    clearTimeout(this.playTimer);
    const playBtn = document.getElementById('vis-play-btn');
    if (playBtn) playBtn.textContent = '▶';
  }

  stop() {
    this.pause();
  }

  resetVisualization() {
    this.stop();
    this.currentStep = -1;
    this.currentValues = [...this.originalData];
    this.sortedIndices = new Set();
    this.comparisons = 0;
    this.swapsCount = 0;
    this.renderBars();
    this.updateStepInfo();
    this.updateStats();
    this.updatePseudocode(-1);
  }

  skipToEnd() {
    this.stop();
    
    // Reset state
    this.currentValues = [...this.originalData];
    this.sortedIndices = new Set();
    this.comparisons = 0;
    this.swapsCount = 0;

    // Apply all steps silently
    for (let i = 0; i < this.steps.length; i++) {
      this.currentStep = i;
      this.applyStepSilent(i);
    }

    // Mark all sorted
    for (let i = 0; i < this.currentValues.length; i++) {
      this.sortedIndices.add(i);
    }

    this.renderBars();
    this.updateStepInfo();
    this.updateStats();
  }

  updateStepInfo() {
    const counter = document.getElementById('step-counter');
    const desc = document.getElementById('step-description');

    if (counter) {
      counter.textContent = `${Math.max(0, this.currentStep + 1)} / ${this.steps.length}`;
    }

    if (desc) {
      if (this.currentStep >= 0 && this.currentStep < this.steps.length) {
        desc.textContent = this.steps[this.currentStep].description;
      } else {
        desc.textContent = 'Nhấn Play để bắt đầu mô phỏng';
      }
    }
  }

  updateStats() {
    const stepCount = document.getElementById('vis-step-count');
    const comparisons = document.getElementById('vis-comparisons');
    const swapsEl = document.getElementById('vis-swaps');

    if (stepCount) stepCount.textContent = Math.max(0, this.currentStep + 1);
    if (comparisons) comparisons.textContent = this.comparisons;
    if (swapsEl) swapsEl.textContent = this.swapsCount;
  }

  updateAlgoInfo() {
    const info = SortingAlgorithms.getInfo(this.algorithm);
    if (!info) return;

    const el = (id) => document.getElementById(id);
    if (el('vis-algo-name')) el('vis-algo-name').textContent = info.name;
    if (el('vis-algo-desc')) el('vis-algo-desc').textContent = info.description;
    if (el('vis-algo-best')) el('vis-algo-best').textContent = info.best;
    if (el('vis-algo-avg')) el('vis-algo-avg').textContent = info.average;
    if (el('vis-algo-worst')) el('vis-algo-worst').textContent = info.worst;
    if (el('vis-algo-space')) el('vis-algo-space').textContent = info.space;
    if (el('vis-algo-stable')) {
      el('vis-algo-stable').textContent = info.stable ? '✓ Stable' : '✗ Unstable';
      el('vis-algo-stable').style.background = info.stable
        ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
      el('vis-algo-stable').style.color = info.stable
        ? 'var(--accent-green-light)' : 'var(--accent-red-light)';
    }
    if (el('vis-title')) el('vis-title').textContent = `${info.name} - Biểu đồ trực quan`;

    this.updatePseudocode(-1);
  }

  updatePseudocode(activeLine) {
    const container = document.getElementById('vis-pseudocode');
    if (!container) return;

    const info = SortingAlgorithms.getInfo(this.algorithm);
    if (!info) return;

    container.innerHTML = info.pseudocode.map((line, idx) => {
      const isActive = idx === activeLine;
      return `<div class="pseudocode-line ${isActive ? 'active' : ''}">${line}</div>`;
    }).join('');
  }
}

window.Visualizer = Visualizer;
