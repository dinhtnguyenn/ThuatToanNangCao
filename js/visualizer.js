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

    // Divide & Conquer tracking
    this.activeRange = null;   // [left, right]
    this.activeDepth = 0;
    this.activeMidPoint = null;
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
                <div class="legend-item"><div class="legend-color range-active"></div> Vùng xử lý</div>
              </div>
            </div>
            
            <!-- Range indicator labels above chart -->
            <div class="range-labels" id="range-labels"></div>
            <div class="bar-chart show-values" id="bar-chart"></div>
            <!-- Range bracket below chart -->
            <div class="range-bracket-row" id="range-bracket-row"></div>

            <!-- Step Info -->
            <div class="step-info">
              <div>Bước: <span class="step-counter" id="step-counter">0 / 0</span></div>
              <div class="step-description" id="step-description">Nhấn Play để bắt đầu mô phỏng</div>
            </div>

            <!-- Depth + Range Context -->
            <div class="dc-context" id="dc-context" style="display: none;">
              <div class="dc-item">
                <span class="dc-label">Depth:</span>
                <span class="dc-value" id="dc-depth">0</span>
              </div>
              <div class="dc-item">
                <span class="dc-label">Range:</span>
                <span class="dc-value" id="dc-range">-</span>
              </div>
              <div class="dc-item">
                <span class="dc-label">Phase:</span>
                <span class="dc-value" id="dc-phase">-</span>
              </div>
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

          <!-- Recursion Tree (only for merge/quick) -->
          <div class="card" id="recursion-tree-card" style="display: none;">
            <div class="card-header">
              <div class="card-title">🌳 Đệ quy hiện tại</div>
            </div>
            <div id="recursion-tree" style="font-size: 0.82rem; font-family: var(--font-mono); color: var(--text-secondary); line-height: 1.7;"></div>
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

  get isDivideConquer() {
    return this.algorithm === 'merge' || this.algorithm === 'quick';
  }

  generateSample() {
    this.stop();
    this.currentStep = -1;
    this.sortedIndices = new Set();
    this.comparisons = 0;
    this.swapsCount = 0;
    this.activeRange = null;
    this.activeDepth = 0;
    this.activeMidPoint = null;

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
    this.updateDCContext(null);
    this.renderRangeBrackets();

    // Show/hide recursion tree card
    const treeCard = document.getElementById('recursion-tree-card');
    if (treeCard) treeCard.style.display = this.isDivideConquer ? 'block' : 'none';
  }

  renderBars(highlightIndices = {}) {
    const chart = document.getElementById('bar-chart');
    if (!chart) return;

    const maxVal = Math.max(...this.currentValues, 1);
    const n = this.currentValues.length;

    chart.innerHTML = this.currentValues.map((val, i) => {
      const height = (val / maxVal) * 100;
      let cls = 'bar';

      // Determine if this bar is in the active range
      const inRange = this.activeRange
        ? (i >= this.activeRange[0] && i <= this.activeRange[1])
        : true;

      if (this.sortedIndices.has(i)) cls += ' sorted';
      if (highlightIndices.comparing?.includes(i)) cls += ' comparing';
      if (highlightIndices.swapping?.includes(i)) cls += ' swapping';
      if (highlightIndices.pivot?.includes(i)) cls += ' pivot';
      if (highlightIndices.merge?.includes(i)) cls += ' merge-highlight';
      if (highlightIndices.baseCase?.includes(i)) cls += ' base-case';
      if (highlightIndices.divideLeft?.includes(i)) cls += ' divide-left';
      if (highlightIndices.divideRight?.includes(i)) cls += ' divide-right';

      // Dim bars outside active range for D&C algorithms
      if (this.isDivideConquer && this.activeRange && !inRange && !this.sortedIndices.has(i)) {
        cls += ' dimmed';
      }

      // If bar is at the midpoint, add midpoint class
      if (this.activeMidPoint !== null && i === this.activeMidPoint && this.activeRange) {
        cls += ' midpoint';
      }

      return `<div class="${cls}" style="height: ${Math.max(height, 2)}%" data-index="${i}">
        <span class="bar-value">${typeof val === 'number' ? (val % 1 === 0 ? val : val.toFixed(1)) : val}</span>
      </div>`;
    }).join('');
  }

  renderRangeBrackets() {
    const bracketRow = document.getElementById('range-bracket-row');
    const labelsRow = document.getElementById('range-labels');
    if (!bracketRow || !labelsRow) return;

    if (!this.isDivideConquer || !this.activeRange) {
      bracketRow.innerHTML = '';
      labelsRow.innerHTML = '';
      return;
    }

    const n = this.currentValues.length;
    const [left, right] = this.activeRange;
    const barWidth = 100 / n;

    // Range bracket
    const bracketLeft = left * barWidth;
    const bracketWidth = (right - left + 1) * barWidth;

    let bracketHtml = `<div class="range-bracket" style="left: ${bracketLeft}%; width: ${bracketWidth}%;">
      <div class="range-bracket-label">[${left}..${right}] depth=${this.activeDepth}</div>
    </div>`;

    // Show midpoint divider if applicable
    if (this.activeMidPoint !== null && this.activeMidPoint >= left && this.activeMidPoint < right) {
      const midPos = (this.activeMidPoint + 1) * barWidth;
      bracketHtml += `<div class="mid-divider" style="left: ${midPos}%;"></div>`;
    }

    bracketRow.innerHTML = bracketHtml;

    // Range labels above
    if (this.activeMidPoint !== null && this.activeMidPoint >= left && this.activeMidPoint < right) {
      const leftPartEnd = this.activeMidPoint;
      const rightPartStart = this.activeMidPoint + 1;

      const leftLabelLeft = left * barWidth;
      const leftLabelWidth = (leftPartEnd - left + 1) * barWidth;
      const rightLabelLeft = rightPartStart * barWidth;
      const rightLabelWidth = (right - rightPartStart + 1) * barWidth;

      labelsRow.innerHTML = `
        <div class="range-half-label left" style="left: ${leftLabelLeft}%; width: ${leftLabelWidth}%;">
          ↙ Trái [${left}..${leftPartEnd}]
        </div>
        <div class="range-half-label right" style="left: ${rightLabelLeft}%; width: ${rightLabelWidth}%;">
          ↘ Phải [${rightPartStart}..${right}]
        </div>
      `;
    } else {
      labelsRow.innerHTML = '';
    }
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
    this.activeRange = null;
    this.activeDepth = 0;
    this.activeMidPoint = null;

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

    // Update active range for D&C algorithms
    if (step.range) {
      this.activeRange = step.range;
      this.activeDepth = step.depth || 0;
    }

    // Handle midpoint
    if (step.midPoint !== undefined) {
      this.activeMidPoint = step.midPoint;
    }

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
      case 'divide':
        // Show the range being divided
        highlights.comparing = step.indices;
        break;
      case 'recurse-left':
        highlights.divideLeft = step.indices;
        this.activeMidPoint = null;
        break;
      case 'recurse-right':
        highlights.divideRight = step.indices;
        this.activeMidPoint = null;
        break;
      case 'merge-start':
        highlights.comparing = step.indices;
        break;
      case 'merge-done':
        // Mark merged range as temporarily highlighted
        highlights.merge = step.indices;
        break;
      case 'base-case':
        highlights.baseCase = step.indices;
        this.sortedIndices.add(step.indices[0]);
        break;
      case 'partition-done':
        highlights.pivot = step.indices;
        this.sortedIndices.add(step.indices[0]);
        break;
      case 'done':
        this.activeRange = null;
        this.activeMidPoint = null;
        for (let i = 0; i < this.currentValues.length; i++) {
          this.sortedIndices.add(i);
        }
        break;
    }

    this.renderBars(highlights);
    this.renderRangeBrackets();
    this.updateStepInfo();
    this.updateStats();
    this.updatePseudocode(step.line);
    this.updateDCContext(step);
    this.updateRecursionTree(step);
  }

  applyStepSilent(stepIndex) {
    const step = this.steps[stepIndex];
    if (!step) return;

    if (step.range) {
      this.activeRange = step.range;
      this.activeDepth = step.depth || 0;
    }
    if (step.midPoint !== undefined) {
      this.activeMidPoint = step.midPoint;
    }

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
      case 'base-case':
        this.sortedIndices.add(step.indices[0]);
        break;
      case 'partition-done':
        this.sortedIndices.add(step.indices[0]);
        break;
      case 'done':
        this.activeRange = null;
        this.activeMidPoint = null;
        for (let i = 0; i < this.currentValues.length; i++) {
          this.sortedIndices.add(i);
        }
        break;
      case 'recurse-left':
      case 'recurse-right':
        this.activeMidPoint = null;
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
    this.activeRange = null;
    this.activeDepth = 0;
    this.activeMidPoint = null;
    this.renderBars();
    this.renderRangeBrackets();
    this.updateStepInfo();
    this.updateStats();
    this.updatePseudocode(-1);
    this.updateDCContext(null);
  }

  skipToEnd() {
    this.stop();
    
    // Reset state
    this.currentValues = [...this.originalData];
    this.sortedIndices = new Set();
    this.comparisons = 0;
    this.swapsCount = 0;
    this.activeRange = null;
    this.activeDepth = 0;
    this.activeMidPoint = null;

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
    this.renderRangeBrackets();
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

  updateDCContext(step) {
    const ctx = document.getElementById('dc-context');
    if (!ctx) return;

    if (!this.isDivideConquer || !step || !step.range) {
      ctx.style.display = 'none';
      return;
    }

    ctx.style.display = 'flex';

    const depthEl = document.getElementById('dc-depth');
    const rangeEl = document.getElementById('dc-range');
    const phaseEl = document.getElementById('dc-phase');

    if (depthEl) {
      depthEl.textContent = step.depth ?? this.activeDepth;
      // Color code depth
      const colors = ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#fb923c'];
      depthEl.style.color = colors[Math.min(step.depth ?? 0, colors.length - 1)];
    }

    if (rangeEl) {
      const [l, r] = step.range;
      rangeEl.textContent = `[${l}..${r}] (${r - l + 1} phần tử)`;
    }

    if (phaseEl) {
      const phaseMap = {
        'divide': '✂ DIVIDE - Chia mảng',
        'recurse-left': '↙ ĐỆ QUY TRÁI',
        'recurse-right': '↘ ĐỆ QUY PHẢI',
        'merge-start': '⤵ CONQUER - Trộn',
        'merge': '⤵ Đang trộn...',
        'merge-done': '✓ Đã trộn xong',
        'compare': '🔍 So sánh',
        'swap': '🔄 Hoán đổi',
        'pivot': '🎯 Chọn Pivot',
        'partition-done': '✓ Phân hoạch xong',
        'base-case': '■ Base Case',
        'sorted': '✓ Đã sắp xếp',
        'info': 'ℹ Thông tin'
      };
      phaseEl.textContent = phaseMap[step.type] || step.type;

      // Color the phase
      const phaseColors = {
        'divide': '#f472b6',
        'recurse-left': '#a78bfa',
        'recurse-right': '#a78bfa',
        'merge-start': '#22d3ee',
        'merge': '#22d3ee',
        'merge-done': '#34d399',
        'compare': '#fbbf24',
        'swap': '#fb923c',
        'pivot': '#c084fc',
        'partition-done': '#34d399',
        'base-case': '#94a3b8'
      };
      phaseEl.style.color = phaseColors[step.type] || 'var(--text-secondary)';
    }
  }

  updateRecursionTree(step) {
    const tree = document.getElementById('recursion-tree');
    const treeCard = document.getElementById('recursion-tree-card');
    if (!tree || !treeCard) return;

    if (!this.isDivideConquer) {
      treeCard.style.display = 'none';
      return;
    }

    treeCard.style.display = 'block';

    if (!step || !step.range) {
      tree.innerHTML = '<span style="color: var(--text-muted);">Chưa bắt đầu...</span>';
      return;
    }

    const [l, r] = step.range;
    const depth = step.depth ?? 0;
    const indent = '  '.repeat(depth);
    const depthColors = ['#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#34d399', '#fb923c'];
    const color = depthColors[Math.min(depth, depthColors.length - 1)];

    let icon = '';
    let label = '';

    switch (step.type) {
      case 'divide':
        icon = '✂';
        label = `DIVIDE [${l}..${r}]`;
        break;
      case 'recurse-left':
        icon = '↙';
        label = `LEFT [${l}..${r}]`;
        break;
      case 'recurse-right':
        icon = '↘';
        label = `RIGHT [${l}..${r}]`;
        break;
      case 'merge-start':
        icon = '⤵';
        label = `MERGE [${l}..${step.midPoint}] + [${(step.midPoint||0)+1}..${r}]`;
        break;
      case 'merge-done':
        icon = '✓';
        label = `MERGED [${l}..${r}]`;
        break;
      case 'base-case':
        icon = '■';
        label = `BASE [${l}]=${this.currentValues[l]}`;
        break;
      case 'pivot':
        icon = '🎯';
        label = `PIVOT @ [${l}..${r}]`;
        break;
      case 'partition-done':
        icon = '✓';
        label = `PARTITIONED → pivot@${step.pivotIndex}`;
        break;
      default:
        icon = '·';
        label = `[${l}..${r}] ${step.type}`;
    }

    // Build a visual representation of current context
    const depthBar = Array.from({ length: depth + 1 }, (_, d) => {
      const c = depthColors[Math.min(d, depthColors.length - 1)];
      return `<span style="color: ${c};">│</span>`;
    }).join('');

    // Show current step context + array state for the range
    const rangeValues = this.currentValues.slice(l, r + 1).map(v => 
      typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(1)) : v
    );

    tree.innerHTML = `
      <div style="margin-bottom: 6px;">
        <span style="color: var(--text-muted);">Depth:</span>
        ${Array.from({ length: depth + 1 }, (_, d) => {
          const c = depthColors[Math.min(d, depthColors.length - 1)];
          return `<span style="display: inline-block; width: 18px; height: 18px; line-height: 18px; text-align: center; border-radius: 4px; background: ${c}20; color: ${c}; font-size: 0.7rem; margin-right: 2px;">${d}</span>`;
        }).join('')}
      </div>
      <div style="color: ${color}; font-weight: 600; margin-bottom: 4px;">
        ${icon} ${label}
      </div>
      <div style="color: var(--text-muted); font-size: 0.75rem;">
        Mảng con: [${rangeValues.join(', ')}]
      </div>
      ${step.midPoint !== undefined ? `<div style="color: var(--text-muted); font-size: 0.75rem; margin-top: 2px;">
        Mid: ${step.midPoint} → Trái[${l}..${step.midPoint}] | Phải[${step.midPoint+1}..${r}]
      </div>` : ''}
    `;
  }
}

window.Visualizer = Visualizer;
