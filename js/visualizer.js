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
    this.sortField = null; // Will be set in init()
    this.sortOrder = 'asc';
    this.sampleSize = 30;
    this.sortedIndices = new Set();
    this.comparisons = 0;
    this.swapsCount = 0;
    this.dataType = 'random';
    this.result = null;
    this.datasetId = 'ecommerce';

    // Advanced Insights
    this.accessCount = [];     // for heatmap
    this.comparativeCosts = {}; // { algo: stepCount }
    this.isInitialized = false;
  }

  // Helper to wrap primitive values into objects for metadata tracking
  wrapValue(v, label = null) {
    if (v === null || v === undefined) return v;
    const obj = new Number(v);
    obj.label = label !== null ? label : v;
    return obj;
  }

  init(data) {
    this.allData = data;
    
    if (!this.sortField) {
      const config = DatasetManager.getDataset(this.datasetId);
      if (config && config.fields.length > 0) {
        this.sortField = config.fields[0].id;
      }
    }

    if (!this.isInitialized) {
      this.render();
      this.bindEvents();
      this.isInitialized = true;
    }
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
            ${DatasetManager.getDataset(this.datasetId).fields.map(f => `<option value="${f.id}" ${f.id === this.sortField ? 'selected' : ''}>${f.label}</option>`).join('')}
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
            <option value="100">100</option>
            <option value="500">500 (Lag)</option>
            <option value="1000">1000 (Lag)</option>
            <option value="10000">10000 (Rất lag)</option>
            <option value="50000">50000 (Treo máy)</option>
            <option value="100000">100000 (Treo máy)</option>
          </select>
        </div>

        <div class="control-group">
          <label>Phân bố (Data):</label>
          <select id="vis-data-type-select">
            <option value="random">Ngẫu nhiên</option>
            <option value="nearly">Gần sắp xếp</option>
            <option value="reversed">Đảo ngược</option>
            <option value="few">Ít giá trị</option>
            <option value="stability-test">Kiểm tra Ổn định (Stability)</option>
          </select>
        </div>

        <button class="btn btn-success" id="vis-generate-btn">
          <span><i class="fa-solid fa-shuffle"></i></span> Tạo dữ liệu mới
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
                <div class="legend-item"><div class="legend-color keep"></div> Giữ nguyên</div>
                <div class="legend-item"><div class="legend-color current-min"></div> Phần tử MIN</div>
              </div>
            </div>
            
            <!-- Range indicator labels above chart -->
            <div class="range-labels" id="range-labels"></div>
            <div class="bar-chart show-values" id="bar-chart"></div>
            <!-- Access Heatmap Strip -->
            <div class="heatmap-container" id="vis-heatmap"></div>

            <!-- Comparison Detail Panel -->
            <div class="comparison-panel" id="comparison-panel">
              <div class="comparison-content">
                <div class="comparison-box left" id="cmp-left">
                  <div class="cmp-label" id="cmp-left-label">a[0]</div>
                  <div class="cmp-value" id="cmp-left-value">0</div>
                </div>
                <div class="comparison-operator" id="cmp-operator">
                  <div class="cmp-op-symbol" id="cmp-op-symbol">></div>
                </div>
                <div class="comparison-box right" id="cmp-right">
                  <div class="cmp-label" id="cmp-right-label">a[1]</div>
                  <div class="cmp-value" id="cmp-right-value">0</div>
                </div>
              </div>
              <div class="comparison-result" id="cmp-result">
                <span class="cmp-result-icon" id="cmp-result-icon"><i class="fa-solid fa-bolt"></i></span>
                <span class="cmp-result-text" id="cmp-result-text">Hoán đổi!</span>
              </div>
            </div>
            <!-- Loop Tracker Panel -->
            <div class="loop-tracker-panel" id="loop-tracker">
              <div class="loop-tracker-title" id="loop-tracker-title">Trạng thái vòng lặp</div>
              <div class="loop-tracker-vars" id="loop-tracker-vars"></div>
              <div class="loop-tracker-progress" id="loop-tracker-progress"></div>
            </div>
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

            <!-- Timeline Scrubber -->
            <div class="timeline-container" style="padding: 10px 20px; background: var(--bg-card); border-top: 1px solid var(--border-color);">
              <input type="range" id="vis-timeline" min="0" max="0" value="0" style="width: 100%; cursor: pointer;" disabled>
            </div>

            <!-- Controls -->
            <div class="vis-controls">
              <button class="btn btn-icon tooltip" id="vis-reset-btn" data-tooltip="Reset"><i class="fa-solid fa-backward-fast"></i></button>
              <button class="btn btn-icon tooltip" id="vis-prev-btn" data-tooltip="Bước trước"><i class="fa-solid fa-backward-step"></i></button>
              <button class="btn btn-icon btn-play tooltip" id="vis-play-btn" data-tooltip="Play/Pause"><i class="fa-solid fa-play"></i></button>
              <button class="btn btn-icon tooltip" id="vis-next-btn" data-tooltip="Bước tiếp"><i class="fa-solid fa-forward-step"></i></button>
              <button class="btn btn-icon tooltip" id="vis-end-btn" data-tooltip="Đến cuối"><i class="fa-solid fa-forward-fast"></i></button>
              
              <div class="speed-control">
                <span><i class="fa-solid fa-gauge-low"></i></span>
                <input type="range" id="vis-speed" min="1" max="10" value="5" />
                <span><i class="fa-solid fa-gauge-high"></i></span>
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
            <div class="vis-stat vis-stat-wide">
              <div class="label" id="vis-memory-label">Bộ nhớ / Call Stack</div>
              <div class="value purple" id="vis-memory-val">0</div>
            </div>
            <div class="vis-stat">
              <div class="label">Thời gian thực thi</div>
              <div class="value green" id="vis-time-val">0 ms</div>
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
              <div class="card-title"><i class="fa-solid fa-code"></i> Pseudocode</div>
            </div>
            <div class="pseudocode" id="vis-pseudocode"></div>
          </div>

          <!-- Recursion Tree (only for merge/quick) -->
          <div class="card" id="recursion-tree-card" style="display: none;">
            <div class="card-header">
              <div class="card-title"><i class="fa-solid fa-sitemap"></i> Đệ quy hiện tại</div>
            </div>
            <div id="recursion-tree" style="font-size: 0.82rem; font-family: var(--font-mono); color: var(--text-secondary); line-height: 1.7;"></div>
          </div>

          <!-- SMART INSIGHT CARD -->
          <div class="vis-insight-card" id="vis-insight-card">
            <div class="insight-header">
              <i class="fa-solid fa-lightbulb"></i> Tư vấn thông minh
            </div>
            <div class="insight-body" id="vis-insight-body">
              Đang phân tích đặc điểm dữ liệu...
            </div>
          </div>

          <!-- COST COMPARISON CARD -->
          <div class="card cost-comparison-card">
            <div class="card-header">
              <div class="card-title"><i class="fa-solid fa-chart-simple"></i> So sánh chi phí dự kiến</div>
            </div>
            <div class="cost-chart" id="vis-cost-chart">
              <!-- Bars injected here -->
            </div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 10px; font-style: italic;">
              * Tổng số bước dự tính dựa trên tập dữ liệu hiện tại
            </div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Tooltip logic
    let tooltip = document.querySelector('.custom-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';
      document.body.appendChild(tooltip);
    }

    const chart = document.getElementById('bar-chart');
    if (chart) {
      chart.addEventListener('mousemove', (e) => {
        const bar = e.target.closest('.bar');
        if (bar && bar.dataset.tooltip) {
          tooltip.innerHTML = bar.dataset.tooltip;
          tooltip.style.display = 'block';
          
          // Position tooltip relative to mouse
          const x = e.clientX + 15;
          const y = e.clientY + 15;
          
          // Keep within viewport
          const spaceX = window.innerWidth - x;
          const spaceY = window.innerHeight - y;
          
          tooltip.style.left = (spaceX < 260 ? x - 270 : x) + 'px';
          tooltip.style.top = (spaceY < 200 ? y - 150 : y) + 'px';
        } else {
          tooltip.style.display = 'none';
        }
      });

      chart.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
    }

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
    // Data type
    document.getElementById('vis-data-type-select')?.addEventListener('change', (e) => {
      this.dataType = e.target.value;
      this.generateSample();
    });

    // Timeline scrubber
    const timeline = document.getElementById('vis-timeline');
    if (timeline) {
      timeline.addEventListener('input', (e) => {
        this.pause();
        this.goToStep(parseInt(e.target.value));
      });
    }

    document.getElementById('vis-generate-btn')?.addEventListener('click', () => {
      this.generateSample();
      if (window.app) {
        const typeNames = { random: 'Ngẫu nhiên', nearly: 'Gần sắp xếp', reversed: 'Đảo ngược', few: 'Ít giá trị' };
        window.app.showToast(`Đã tạo dữ liệu mới: ${this.sampleSize} phần tử (${typeNames[this.dataType] || 'Mặc định'})`, 'info');
      }
    });

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

    // Generate sample based on data type
    const shuffled = [...this.allData].sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, this.sampleSize);
    
    // Map values for visualization (handle text ranking)
    const fieldConfig = DatasetManager.getDataset(this.datasetId).fields.find(f => f.id === this.sortField);
    const isPrice = this.sortField === 'price';
    const isString = fieldConfig && fieldConfig.type === 'string';

    const localWrapValue = (v, item) => {
      const num = Number(v);
      const obj = new Number(num);
      obj.item = item;
      obj.label = item ? item[this.sortField] : v;
      obj.toString = function() {
        if (this.label && isString) return this.label;
        if (isPrice) return this.valueOf().toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        return this.valueOf() % 1 === 0 ? this.valueOf().toString() : this.valueOf().toFixed(1);
      };
      return obj;
    };

    let values;
    if (isString) {
      const uniqueSorted = [...new Set(sample.map(d => d[this.sortField]))].sort((a, b) => String(a).localeCompare(String(b)));
      values = sample.map(d => {
        const text = d[this.sortField];
        const rank = uniqueSorted.indexOf(text) + 1;
        return localWrapValue(rank, d);
      });
    } else {
      values = sample.map(d => localWrapValue(Number(d[this.sortField]), d));
    }

    switch (this.dataType) {
      case 'nearly':
        values.sort((a, b) => (this.sortOrder === 'asc' ? a - b : b - a));
        const numSwaps = Math.max(1, Math.floor(values.length * 0.05));
        for (let s = 0; s < numSwaps; s++) {
          const a = Math.floor(Math.random() * values.length);
          const b = Math.floor(Math.random() * values.length);
          [values[a], values[b]] = [values[b], values[a]];
        }
        break;
      case 'reversed':
        values.sort((a, b) => (this.sortOrder === 'asc' ? b - a : a - b));
        break;
      case 'few':
        const uniques = [...new Set(values.map(v => Number(v)))].slice(0, 5);
        values = values.map((v) => {
          const newVal = uniques[Math.floor(Math.random() * uniques.length)];
          return localWrapValue(newVal, v.label);
        });
        break;
      case 'stability-test':
        const dist = [10000, 20000, 30000];
        values = values.map((v, i) => {
          const val = dist[Math.floor(Math.random() * dist.length)];
          const obj = localWrapValue(val, v.label);
          obj._originalIndex = i;
          obj._colorHue = (val / 30000) * 360;
          return obj;
        });
        break;
    }

    this.currentValues = values;
    this.originalData = [...this.currentValues];
    this.originalData = [...this.currentValues];

    // Run algorithm to get steps
    this.result = SortingAlgorithms.run(this.algorithm, this.currentValues, this.sortOrder);
    this.steps = this.result.steps;

    // Reset timeline scrubber
    const timeline = document.getElementById('vis-timeline');
    if (timeline) {
      timeline.max = this.steps.length;
      timeline.value = 0;
      timeline.disabled = this.steps.length === 0;
    }

    this.renderBars();
    this.updateStepInfo();
    this.updateAlgoInfo();
    this.updateStats();
    this.updatePseudocode(-1);
    this.updateDCContext(null);
    this.renderRangeBrackets();
    this.hideComparisonPanel();
    this.hideLoopTracker();

    // Show/hide recursion tree card
    const treeCard = document.getElementById('recursion-tree-card');
    if (treeCard) treeCard.style.display = this.isDivideConquer ? 'block' : 'none';

    // Advanced Analysis
    this.accessCount = new Array(this.currentValues.length).fill(0);
    this.renderHeatmap();
    this.runDataAnalysis();
    this.precalculateCosts();
  }

  // ======== HEATMAP RENDER ========
  renderHeatmap() {
    const container = document.getElementById('vis-heatmap');
    if (!container) return;
    
    container.innerHTML = this.accessCount.map((count, i) => {
      return `<div class="heatmap-cell" id="heatmap-${i}" style="background: rgba(34, 211, 238, 0.05);"></div>`;
    }).join('');
  }

  updateHeatmapUI(indices) {
    if (!indices) return;
    indices.forEach(idx => {
      if (idx >= 0 && idx < this.accessCount.length) {
        this.accessCount[idx]++;
        const cell = document.getElementById(`heatmap-${idx}`);
        if (cell) {
          const maxAccess = Math.max(...this.accessCount, 1);
          const ratio = this.accessCount[idx] / maxAccess;
          // Interpolate from Cyan (low) to Orange/Red (high)
          const hue = 180 - (ratio * 180); // 180 (cyan) to 0 (red)
          cell.style.background = `hsla(${hue}, 80%, 50%, ${0.2 + ratio * 0.8})`;
        }
      }
    });
  }

  // ======== SMART INSIGHTS ========
  runDataAnalysis() {
    const vals = this.currentValues.map(v => Number(v));
    const n = vals.length;
    if (n < 2) return;

    let sortedPairs = 0;
    let reversedPairs = 0;
    for (let i = 0; i < n - 1; i++) {
      if (vals[i] <= vals[i+1]) sortedPairs++;
      if (vals[i] >= vals[i+1]) reversedPairs++;
    }

    const sortPct = (sortedPairs / (n - 1)) * 100;
    const reversePct = (reversedPairs / (n - 1)) * 100;
    const uniqueVals = new Set(vals);
    const uniqueRatio = uniqueVals.size / n;

    let trait = "Ngẫu nhiên";
    let recommendation = "";
    let reason = "";

    if (sortPct === 100) {
      trait = "Đã sắp xếp 100%";
      recommendation = "Bất kỳ thuật toán nào";
      reason = "Dữ liệu đã ở trạng thái hoàn hảo, không cần xử lý thêm.";
    } else if (sortPct > 80) {
      trait = "Gần như đã sắp xếp";
      recommendation = "Insertion Sort";
      reason = "Thuật toán này cực kỳ tối ưu (O(n)) cho mảng đã gần đúng vị trí.";
    } else if (reversePct > 80) {
      trait = "Đang bị đảo ngược";
      recommendation = "Quick Sort / Merge Sort";
      reason = "Dữ liệu bị đảo ngược khiến các thuật toán O(n²) gặp khó khăn lớn.";
    } else if (uniqueRatio < 0.3) {
      trait = "Nhiều giá trị trùng lặp";
      recommendation = "Quick Sort";
      reason = "Việc phân hoạch sẽ hiệu quả hơn khi có ít nhóm giá trị khác nhau.";
    } else {
      trait = "Phân bổ ngẫu nhiên";
      recommendation = "Merge Sort / Quick Sort";
      reason = "Với dữ liệu hỗn loạn, các thuật toán chia để trị luôn giữ vững phong độ O(n log n).";
    }

    const body = document.getElementById('vis-insight-body');
    if (body) {
      body.innerHTML = `
        <div style="margin-bottom: 5px;"><strong>Đặc điểm:</strong> <span style="color: var(--accent-cyan);">${trait}</span></div>
        <div style="margin-bottom: 5px;"><strong>Đề xuất:</strong> <span style="color: var(--accent-green);">${recommendation}</span></div>
        <div style="font-style: italic; color: var(--text-muted); font-size: 0.78rem;">${reason}</div>
      `;
    }
  }

  // ======== COST PRECALCULATION ========
  precalculateCosts() {
    const algos = SortingAlgorithms.getAllNames();
    const costs = {};
    
    algos.forEach(name => {
      const result = SortingAlgorithms.run(name, [...this.currentValues], this.sortOrder);
      costs[name] = result.steps.length;
    });

    this.comparativeCosts = costs;
    this.renderCostChart();
  }

  renderCostChart() {
    const container = document.getElementById('vis-cost-chart');
    if (!container) return;

    const algos = Object.keys(this.comparativeCosts);
    const maxSteps = Math.max(...Object.values(this.comparativeCosts), 1);

    container.innerHTML = algos.map(name => {
      const info = SortingAlgorithms.getInfo(name);
      const steps = this.comparativeCosts[name];
      const pct = (steps / maxSteps) * 100;
      const isActive = name === this.algorithm;

      return `
        <div class="cost-row">
          <div class="cost-label" style="${isActive ? 'color: var(--accent-yellow); font-weight: bold;' : ''}">${info.name}</div>
          <div class="cost-bar-bg">
            <div class="cost-bar-fill ${isActive ? 'active' : ''}" style="width: ${pct}%"></div>
          </div>
          <div class="cost-value">${steps.toLocaleString()}</div>
        </div>
      `;
    }).join('');
  }

  renderBars(highlightIndices = {}) {
    const chart = document.getElementById('bar-chart');
    if (!chart) return;

    const maxVal = Math.max(...this.currentValues, 1);
    const n = this.currentValues.length;
    const config = DatasetManager.getDataset(this.datasetId);
    const fieldConfig = config.fields.find(f => f.id === this.sortField);
    const isString = fieldConfig && fieldConfig.type === 'string';
    
    chart.style.gap = n > 200 ? '0px' : (n > 50 ? '1px' : '2px');
    const minWidth = n > 100 ? '0' : '4px';

    chart.innerHTML = this.currentValues.map((val, i) => {
      const height = (val / maxVal) * 100;
      let barClasses = ['bar'];
      let inlineStyle = `height: ${Math.max(height, 2)}%; min-width: ${minWidth};`;

      // Highlights
      if (this.sortedIndices.has(i)) barClasses.push('sorted');
      if (highlightIndices.comparing?.includes(i)) barClasses.push('comparing');
      if (highlightIndices.swapping?.includes(i)) barClasses.push('swapping');
      if (highlightIndices.pivot?.includes(i)) barClasses.push('pivot');
      if (highlightIndices.merge?.includes(i)) barClasses.push('merge-highlight');
      if (highlightIndices.baseCase?.includes(i)) barClasses.push('base-case');
      if (highlightIndices.currentMin?.includes(i)) barClasses.push('current-min');
      if (highlightIndices.outerIdx?.includes(i)) barClasses.push('outer-index');

      if (this.isDivideConquer && this.activeRange) {
        const inRange = i >= this.activeRange[0] && i <= this.activeRange[1];
        if (!inRange && !this.sortedIndices.has(i)) barClasses.push('dimmed');
        if (i === this.activeMidPoint) barClasses.push('midpoint');
      }

      // Colors
      if (this.dataType === 'stability-test' && val._originalIndex !== undefined) {
        inlineStyle += ` background: hsl(${val._colorHue || 0}, 70%, 50%);`;
      } else {
        // Force the same background for all other data types
        inlineStyle += ` background: var(--accent-blue);`;
      }

      // Labels
      let labelHtml = '';
      if (isString && val.label) {
        const chartW = chart.clientWidth || 800;
        const barWidth = chartW / n;
        if (barWidth > 20 && height >= 50) {
          const fontSize = Math.max(8, Math.min(11, barWidth * 0.7));
          labelHtml = `<div class="bar-text-label" style="font-size: ${fontSize}px; max-width: ${n > 12 ? '150px' : (barWidth - 2) + 'px'};">${val.label}</div>`;
        }
      }

      const tooltipContent = `<div class="tooltip-title">${val.label || 'Phần tử'}</div>` + 
        (val.item ? config.fields.map(f => {
          let fVal = val.item[f.id];
          if (f.type === 'number' && f.id === 'price') fVal = fVal.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
          return `<div class="tooltip-row"><span class="tooltip-label">${f.label}:</span><span class="tooltip-value">${fVal}</span></div>`;
        }).join('') : '');

      return `
        <div class="${barClasses.join(' ')}" style="${inlineStyle}" data-index="${i}" id="bar-${i}" data-tooltip='${tooltipContent.replace(/'/g, "&apos;")}'>
          <span class="bar-value">${isString ? '' : val.toString()}</span>
          ${labelHtml}
          ${highlightIndices.comparing?.includes(i) ? '<div class="bar-pointer">▼</div>' : ''}
          ${highlightIndices.currentMin?.includes(i) ? '<div class="bar-min-badge">MIN</div>' : ''}
          ${highlightIndices.outerIdx?.includes(i) ? '<div class="bar-i-badge">i=' + i + '</div>' : ''}
        </div>
      `;
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
    
    const timeline = document.getElementById('vis-timeline');
    if (timeline) timeline.value = this.currentStep;
    
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

  goToStep(targetStep) {
    if (targetStep < -1) targetStep = -1;
    if (targetStep >= this.steps.length) targetStep = this.steps.length;
    
    // Reset and replay up to targetStep
    this.currentValues = [...this.originalData];
    this.sortedIndices = new Set();
    this.comparisons = 0;
    this.swapsCount = 0;
    this.activeRange = null;
    this.activeDepth = 0;
    this.activeMidPoint = null;

    this.currentStep = -1;
    
    // Apply silently up to targetStep - 1
    for (let i = 0; i < targetStep; i++) {
      this.currentStep = i;
      this.applyStepSilent(i);
    }

    if (targetStep < 0) {
      this.currentStep = -1;
      this.renderBars();
      this.updateStepInfo();
      this.updateStats();
      this.updatePseudocode(-1);
      this.hideComparisonPanel();
      this.hideLoopTracker();
      this.updateDCContext(null);
      this.renderRangeBrackets();
      const timeline = document.getElementById('vis-timeline');
      if (timeline) timeline.value = 0;
    } else if (targetStep === this.steps.length) {
      this.currentStep = targetStep - 1;
      for (let i = 0; i < this.currentValues.length; i++) this.sortedIndices.add(i);
      this.renderBars();
      this.updateStepInfo();
      this.updateStats();
      document.getElementById('step-description').innerHTML = `<span style="color: var(--accent-green-light);"><i class="fa-solid fa-check-circle"></i> Đã sắp xếp xong ${this.sampleSize} phần tử!</span>`;
      this.hideComparisonPanel();
      this.hideLoopTracker();
      this.updateDCContext(null);
      this.renderRangeBrackets();
      this.checkStability();
      
      const timeline = document.getElementById('vis-timeline');
      if (timeline) timeline.value = targetStep;
    } else {
      this.currentStep = targetStep;
      this.applyStep(targetStep);
      
      const timeline = document.getElementById('vis-timeline');
      if (timeline) timeline.value = targetStep;
    }
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

    // Extract outer loop index from loopContext to highlight position i
    if (step.loopContext && step.loopContext.outerIndex !== undefined) {
      highlights.outerIdx = [step.loopContext.outerIndex];
    }

    switch (step.type) {
      case 'compare':
        highlights.comparing = step.indices;
        this.comparisons++;
        // Show current min for selection sort
        if (step.loopContext?.algorithm === 'selection' && step.loopContext.minIdx !== undefined) {
          highlights.currentMin = [step.loopContext.minIdx];
        }
        break;
      case 'min-update':
        highlights.currentMin = step.indices;
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
      case 'no-swap':
        highlights.keep = step.indices;
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
    this.updateComparisonPanel(step);
    this.updateLoopTracker(step);
    this.animateStep(step, highlights);
    this.updateStepInfo();
    this.updateStats();
    this.updatePseudocode(step.line);
    this.updateDCContext(step);
    this.updateRecursionTree(step);

    // Heatmap update
    if (step.indices) {
      this.updateHeatmapUI(step.indices);
    }
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
      case 'no-swap':
        break;
      case 'min-update':
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
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';

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
    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
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
    this.hideComparisonPanel();
    this.hideLoopTracker();
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

    // Update memory stats
    const memVal = document.getElementById('vis-memory-val');
    if (memVal) {
      if (this.algorithm === 'merge') {
        memVal.textContent = `O(N) | Aux: ${this.sampleSize}`;
      } else if (this.algorithm === 'quick') {
        memVal.textContent = `O(log N) | Stack: ${this.activeDepth}`;
      } else {
        memVal.textContent = `O(1)`;
      }
    }

    // Update execution time
    const timeVal = document.getElementById('vis-time-val');
    if (timeVal && this.result) {
      timeVal.textContent = `${this.result.timeMs.toFixed(2)} ms`;
    }
  }

  updateAlgoInfo() {
    const info = SortingAlgorithms.getInfo(this.algorithm);
    if (!info) return;

    const el = (id) => document.getElementById(id);
    if (el('vis-algo-name')) el('vis-algo-name').textContent = info.name;
    
    // Build description + features
    let descHtml = info.description;
    if (info.features) {
      descHtml += `<br><span style="color: var(--accent-cyan); display: inline-block; margin-top: 5px;"><i class="fa-solid fa-star"></i> <strong>Đặc điểm:</strong> ${info.features}</span>`;
    }
    if (el('vis-algo-desc')) el('vis-algo-desc').innerHTML = descHtml;
    
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
        'merge-done': '<i class="fa-solid fa-check"></i> Đã trộn xong',
        'compare': '<i class="fa-solid fa-magnifying-glass"></i> So sánh',
        'swap': '<i class="fa-solid fa-right-left"></i> Hoán đổi',
        'pivot': '<i class="fa-solid fa-crosshairs"></i> Chọn Pivot',
        'partition-done': '<i class="fa-solid fa-check"></i> Phân hoạch xong',
        'base-case': '■ Base Case',
        'sorted': '<i class="fa-solid fa-check"></i> Đã sắp xếp',
        'info': '<i class="fa-solid fa-circle-info"></i> Thông tin'
      };
      phaseEl.innerHTML = phaseMap[step.type] || step.type;

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
        icon = '<i class="fa-solid fa-check"></i>';
        label = `MERGED [${l}..${r}]`;
        break;
      case 'base-case':
        icon = '■';
        label = `BASE [${l}]=${this.currentValues[l]}`;
        break;
      case 'pivot':
        icon = '<i class="fa-solid fa-crosshairs"></i>';
        label = `PIVOT @ [${l}..${r}]`;
        break;
      case 'partition-done':
        icon = '<i class="fa-solid fa-check"></i>';
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

  // ======== Comparison Panel ========
  updateComparisonPanel(step) {
    const panel = document.getElementById('comparison-panel');
    if (!panel) return;

    // Only show for compare steps with detail info
    if (step.type === 'compare' && step.comparisonDetail) {
      const d = step.comparisonDetail;
      panel.classList.add('panel-visible');

      // Left box
      const leftLabel = document.getElementById('cmp-left-label');
      const leftValue = document.getElementById('cmp-left-value');
      const leftBox = document.getElementById('cmp-left');
      if (leftLabel) leftLabel.textContent = d.leftLabel;
      if (leftValue) leftValue.textContent = typeof d.leftValue === 'number' ? (d.leftValue % 1 === 0 ? d.leftValue : d.leftValue.toFixed(1)) : d.leftValue;

      // Right box
      const rightLabel = document.getElementById('cmp-right-label');
      const rightValue = document.getElementById('cmp-right-value');
      const rightBox = document.getElementById('cmp-right');
      if (rightLabel) rightLabel.textContent = d.rightLabel;
      if (rightValue) rightValue.textContent = typeof d.rightValue === 'number' ? (d.rightValue % 1 === 0 ? d.rightValue : d.rightValue.toFixed(1)) : d.rightValue;

      // Operator
      const opSymbol = document.getElementById('cmp-op-symbol');
      if (opSymbol) opSymbol.textContent = d.operator;

      // Result
      const resultIcon = document.getElementById('cmp-result-icon');
      const resultText = document.getElementById('cmp-result-text');
      const resultEl = document.getElementById('cmp-result');

      if (resultEl && resultIcon && resultText) {
        resultText.textContent = d.action;
        if (step.willSwap) {
          resultEl.className = 'comparison-result result-swap';
          resultIcon.innerHTML = '<i class="fa-solid fa-bolt"></i>';
          if (leftBox) leftBox.className = 'comparison-box left swap';
          if (rightBox) rightBox.className = 'comparison-box right swap';
        } else {
          resultEl.className = 'comparison-result result-keep';
          resultIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
          if (leftBox) leftBox.className = 'comparison-box left keep';
          if (rightBox) rightBox.className = 'comparison-box right keep';
        }
      }

      // Animate panel entrance
      panel.classList.remove('panel-animate');
      void panel.offsetWidth; // force reflow
      panel.classList.add('panel-animate');

    } else if (step.type === 'no-swap') {
      // Show keep result for no-swap steps
      panel.classList.add('panel-visible');
      const resultEl = document.getElementById('cmp-result');
      const resultIcon = document.getElementById('cmp-result-icon');
      const resultText = document.getElementById('cmp-result-text');
      const leftBox = document.getElementById('cmp-left');
      const rightBox = document.getElementById('cmp-right');
      if (resultEl) resultEl.className = 'comparison-result result-keep';
      if (resultIcon) resultIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
      if (resultText) resultText.textContent = step.description;
      if (leftBox) leftBox.className = 'comparison-box left keep';
      if (rightBox) rightBox.className = 'comparison-box right keep';

    } else if (step.type === 'swap') {
      // Update panel to show swap happening
      const resultEl = document.getElementById('cmp-result');
      const resultIcon = document.getElementById('cmp-result-icon');
      const resultText = document.getElementById('cmp-result-text');
      if (resultEl) resultEl.className = 'comparison-result result-swap';
      if (resultIcon) resultIcon.innerHTML = '<i class="fa-solid fa-right-left"></i>';
      if (resultText) resultText.textContent = step.description;

    } else if (step.type === 'min-update') {
      // Show min update notification
      panel.classList.add('panel-visible');
      const resultEl = document.getElementById('cmp-result');
      const resultIcon = document.getElementById('cmp-result-icon');
      const resultText = document.getElementById('cmp-result-text');
      const leftBox = document.getElementById('cmp-left');
      const rightBox = document.getElementById('cmp-right');
      if (resultEl) resultEl.className = 'comparison-result result-min-update';
      if (resultIcon) resultIcon.innerHTML = '<i class="fa-solid fa-crosshairs"></i>';
      if (resultText) resultText.textContent = step.description;
      if (leftBox) leftBox.className = 'comparison-box left min-updated';
      if (rightBox) rightBox.className = 'comparison-box right min-updated';

      panel.classList.remove('panel-animate');
      void panel.offsetWidth;
      panel.classList.add('panel-animate');

    } else {
      panel.classList.remove('panel-visible');
    }
  }

  hideComparisonPanel() {
    const panel = document.getElementById('comparison-panel');
    if (panel) panel.classList.remove('panel-visible');
  }

  animateStep(step, highlights) {
    // Add swap animation to bars
    if (step.type === 'swap' && step.indices.length === 2) {
      const [i, j] = step.indices;
      const barI = document.getElementById(`bar-${i}`);
      const barJ = document.getElementById(`bar-${j}`);
      if (barI && barJ) {
        // Calculate the distance to swap
        const rectI = barI.getBoundingClientRect();
        const rectJ = barJ.getBoundingClientRect();
        const distance = rectJ.left - rectI.left;

        barI.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        barJ.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
        barI.style.transform = `translateX(${distance}px)`;
        barJ.style.transform = `translateX(${-distance}px)`;

        // Reset after animation
        setTimeout(() => {
          barI.style.transition = '';
          barI.style.transform = '';
          barJ.style.transition = '';
          barJ.style.transform = '';
        }, 380);
      }
    }

    // Keep-position pulse for no-swap
    if (step.type === 'no-swap' && step.indices.length === 2) {
      const [i, j] = step.indices;
      const barI = document.getElementById(`bar-${i}`);
      const barJ = document.getElementById(`bar-${j}`);
      if (barI) barI.classList.add('keep-pulse');
      if (barJ) barJ.classList.add('keep-pulse');
      setTimeout(() => {
        if (barI) barI.classList.remove('keep-pulse');
        if (barJ) barJ.classList.remove('keep-pulse');
      }, 500);
    }
  }

  // ======== Loop Tracker Panel ========
  updateLoopTracker(step) {
    const panel = document.getElementById('loop-tracker');
    if (!panel) return;

    const ctx = step.loopContext;
    if (!ctx) {
      panel.classList.remove('panel-visible');
      return;
    }

    panel.classList.add('panel-visible');
    const title = document.getElementById('loop-tracker-title');
    const vars = document.getElementById('loop-tracker-vars');
    const progress = document.getElementById('loop-tracker-progress');

    const n = this.currentValues.length;

    if (ctx.algorithm === 'selection') {
      if (title) title.innerHTML = '<i class="fa-solid fa-rotate"></i> Selection Sort - Tr\u1EA1ng th\u00E1i v\u00F2ng l\u1EB7p';

      // Phase description
      const phaseText = {
        'start-scan': '<i class="fa-solid fa-magnifying-glass"></i> B\u1EAFt \u0111\u1EA7u qu\u00E9t t\u00ECm min',
        'comparing': '<i class="fa-solid fa-magnifying-glass"></i> \u0110ang so s\u00E1nh...',
        'min-updated': '<i class="fa-solid fa-bolt"></i> \u0110\u00E3 c\u1EADp nh\u1EADt min m\u1EDBi!',
        'swapping': '<i class="fa-solid fa-right-left"></i> \u0110ang ho\u00E1n \u0111\u1ED5i...',
        'no-swap-needed': '<i class="fa-solid fa-check"></i> Kh\u00F4ng c\u1EA7n ho\u00E1n \u0111\u1ED5i'
      };

      if (vars) {
        vars.innerHTML = `
          <div class="lt-var">
            <span class="lt-var-name">i (v\u1ECB tr\u00ED \u0111\u1EB7t)</span>
            <span class="lt-var-value lt-cyan">${ctx.outerIndex}</span>
          </div>
          ${ctx.innerIndex !== null ? `<div class="lt-var">
            <span class="lt-var-name">j (\u0111ang x\u00E9t)</span>
            <span class="lt-var-value lt-yellow">${ctx.innerIndex}</span>
          </div>` : ''}
          <div class="lt-var lt-highlight-min">
            <span class="lt-var-name"><i class="fa-solid fa-crosshairs"></i> minIdx</span>
            <span class="lt-var-value lt-orange">${ctx.minIdx}</span>
          </div>
          <div class="lt-var lt-highlight-min">
            <span class="lt-var-name"><i class="fa-solid fa-chart-simple"></i> minValue</span>
            <span class="lt-var-value lt-orange">${typeof ctx.minValue === 'number' ? (ctx.minValue % 1 === 0 ? ctx.minValue : ctx.minValue.toFixed(1)) : ctx.minValue}</span>
          </div>
          <div class="lt-var">
            <span class="lt-var-name">\u0110\u00E3 s\u1EAFp x\u1EBFp</span>
            <span class="lt-var-value lt-green">${ctx.sortedCount} / ${n}</span>
          </div>
        `;
      }

      if (progress) {
        const scanTotal = n - ctx.outerIndex - 1;
        const scanDone = ctx.innerIndex !== null ? ctx.innerIndex - ctx.outerIndex : 0;
        const scanPct = scanTotal > 0 ? Math.round((scanDone / scanTotal) * 100) : 0;
        const sortedPct = Math.round((ctx.sortedCount / n) * 100);
        progress.innerHTML = `
          <div class="lt-progress-row">
            <span class="lt-progress-label">Qu\u00E9t v\u00F2ng ${ctx.outerIndex + 1}</span>
            <div class="lt-progress-bar">
              <div class="lt-progress-fill lt-fill-yellow" style="width: ${scanPct}%"></div>
            </div>
            <span class="lt-progress-pct">${scanPct}%</span>
          </div>
          <div class="lt-progress-row">
            <span class="lt-progress-label">T\u1ED5ng ti\u1EBFn \u0111\u1ED9</span>
            <div class="lt-progress-bar">
              <div class="lt-progress-fill lt-fill-green" style="width: ${sortedPct}%"></div>
            </div>
            <span class="lt-progress-pct">${sortedPct}%</span>
          </div>
          <div class="lt-phase ${ctx.phase === 'min-updated' ? 'lt-phase-alert' : ''}">
            ${phaseText[ctx.phase] || ctx.phase}
          </div>
        `;
      }

    } else if (ctx.algorithm === 'insertion') {
      if (title) title.innerHTML = '<i class="fa-solid fa-arrow-left"></i> Insertion Sort - Tr\u1EA1ng th\u00E1i v\u00F2ng l\u1EB7p';

      if (vars) {
        vars.innerHTML = `
          <div class="lt-var">
            <span class="lt-var-name">i (ch\u1ECDn ph\u1EA7n t\u1EED)</span>
            <span class="lt-var-value lt-cyan">${ctx.outerIndex}</span>
          </div>
          <div class="lt-var lt-highlight-key">
            <span class="lt-var-name"><i class="fa-solid fa-key"></i> key</span>
            <span class="lt-var-value lt-purple">${typeof ctx.key === 'number' ? (ctx.key % 1 === 0 ? ctx.key : ctx.key.toFixed(1)) : ctx.key}</span>
          </div>
          <div class="lt-var">
            <span class="lt-var-name">j (so s\u00E1nh v\u1EDBi)</span>
            <span class="lt-var-value lt-yellow">${ctx.innerIndex}</span>
          </div>
          <div class="lt-var">
            <span class="lt-var-name">\u0110\u00E3 s\u1EAFp x\u1EBFp</span>
            <span class="lt-var-value lt-green">${ctx.sortedCount} / ${n}</span>
          </div>
        `;
      }

      if (progress) {
        const sortedPct = Math.round((ctx.sortedCount / n) * 100);
        progress.innerHTML = `
          <div class="lt-progress-row">
            <span class="lt-progress-label">T\u1ED5ng ti\u1EBFn \u0111\u1ED9</span>
            <div class="lt-progress-bar">
              <div class="lt-progress-fill lt-fill-green" style="width: ${sortedPct}%"></div>
            </div>
            <span class="lt-progress-pct">${sortedPct}%</span>
          </div>
          <div class="lt-phase">
            ${ctx.phase === 'pick-key' ? '<i class="fa-solid fa-key"></i> Ch\u1ECDn key = ' + (typeof ctx.key === 'number' ? (ctx.key % 1 === 0 ? ctx.key : ctx.key.toFixed(1)) : ctx.key) : '<i class="fa-solid fa-magnifying-glass"></i> So s\u00E1nh v\u00E0 d\u1ECBch ph\u1EA3i...'}
          </div>
        `;
      }

    } else if (ctx.algorithm === 'bubble') {
      if (title) title.innerHTML = '<i class="fa-solid fa-wind"></i> Bubble Sort - Tr\u1EA1ng th\u00E1i v\u00F2ng l\u1EB7p';

      if (vars) {
        vars.innerHTML = `
          <div class="lt-var">
            <span class="lt-var-name">L\u01B0\u1EE3t (pass)</span>
            <span class="lt-var-value lt-cyan">${ctx.pass} / ${n - 1}</span>
          </div>
          ${ctx.innerIndex !== null ? `<div class="lt-var">
            <span class="lt-var-name">j (\u0111ang x\u00E9t)</span>
            <span class="lt-var-value lt-yellow">${ctx.innerIndex}</span>
          </div>` : ''}
          <div class="lt-var">
            <span class="lt-var-name">Ranh gi\u1EDBi</span>
            <span class="lt-var-value lt-orange">${ctx.boundary}</span>
          </div>
          <div class="lt-var">
            <span class="lt-var-name">\u0110\u00E3 s\u1EAFp x\u1EBFp</span>
            <span class="lt-var-value lt-green">${ctx.sortedCount} / ${n}</span>
          </div>
        `;
      }

      if (progress) {
        const passTotal = ctx.boundary;
        const passDone = ctx.innerIndex !== null ? ctx.innerIndex : 0;
        const passPct = passTotal > 0 ? Math.round((passDone / passTotal) * 100) : 0;
        const sortedPct = Math.round((ctx.sortedCount / n) * 100);
        progress.innerHTML = `
          <div class="lt-progress-row">
            <span class="lt-progress-label">L\u01B0\u1EE3t ${ctx.pass}</span>
            <div class="lt-progress-bar">
              <div class="lt-progress-fill lt-fill-yellow" style="width: ${passPct}%"></div>
            </div>
            <span class="lt-progress-pct">${passPct}%</span>
          </div>
          <div class="lt-progress-row">
            <span class="lt-progress-label">T\u1ED5ng ti\u1EBFn \u0111\u1ED9</span>
            <div class="lt-progress-bar">
              <div class="lt-progress-fill lt-fill-green" style="width: ${sortedPct}%"></div>
            </div>
            <span class="lt-progress-pct">${sortedPct}%</span>
          </div>
        `;
      }
    }
  }

  checkStability() {
    if (this.dataType !== 'stability-test') return;

    let isStable = true;
    for (let i = 1; i < this.currentValues.length; i++) {
      const prev = this.currentValues[i - 1];
      const curr = this.currentValues[i];
      if (Number(prev) === Number(curr)) {
        if (prev._originalIndex > curr._originalIndex) {
          isStable = false;
          break;
        }
      }
    }

    if (window.app) {
      if (isStable) {
        window.app.showToast(`Thuật toán ${this.algorithm} là STABLE (Giữ nguyên được thứ tự các phần tử bằng nhau)`, 'success');
      } else {
        window.app.showToast(`Thuật toán ${this.algorithm} là UNSTABLE (Làm xáo trộn thứ tự các phần tử bằng nhau)`, 'error');
      }
    }
  }

  hideLoopTracker() {
    const panel = document.getElementById('loop-tracker');
    if (panel) panel.classList.remove('panel-visible');
  }
  updateFields(fields) {
    const selector = document.getElementById('vis-field-select');
    if (selector) {
      selector.innerHTML = fields.map(f => `<option value="${f.id}">${f.label}</option>`).join('');
      this.sortField = fields[0].id;
    }
  }
}

window.Visualizer = Visualizer;
