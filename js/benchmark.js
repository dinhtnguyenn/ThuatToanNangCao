// ============================================
// BENCHMARK MODULE - SPEED COMPARISON
// ============================================

class Benchmark {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.allData = [];
    this.sampleSize = 200;
    this.sortField = 'price';
    this.sortOrder = 'asc';
    this.dataType = 'random';
    this.results = [];
    this.isRunning = false;
  }

  init(allData) {
    this.allData = allData;
    this.render();
    this.bindEvents();
  }

  render() {
    this.container.innerHTML = `
      <!-- Controls -->
      <div class="controls-bar">
        <div class="control-group">
          <label>Kích thước:</label>
          <select id="bench-size-select">
            <option value="50">50 phần tử</option>
            <option value="100">100 phần tử</option>
            <option value="200" selected>200 phần tử</option>
            <option value="500">500 phần tử</option>
            <option value="1000">1000 phần tử</option>
            <option value="10000">10.000 phần tử</option>
            <option value="50000">50.000 phần tử</option>
            <option value="100000">100.000 phần tử</option>
          </select>
        </div>

        <div class="control-group">
          <label>Sắp xếp theo:</label>
          <select id="bench-field-select">
            <option value="price">Giá (Price)</option>
            <option value="rating">Đánh giá (Rating)</option>
            <option value="stock">Tồn kho (Stock)</option>
          </select>
        </div>

        <div class="control-group">
          <label>Thứ tự:</label>
          <select id="bench-order-select">
            <option value="asc">Tăng dần</option>
            <option value="desc">Giảm dần</option>
          </select>
        </div>

        <div class="control-group">
          <label>Dữ liệu:</label>
          <div class="data-type-group">
            <button class="data-type-btn active" data-type="random"><i class="fa-solid fa-shuffle"></i> Random</button>
            <button class="data-type-btn" data-type="nearly"><i class="fa-solid fa-chart-line"></i> Gần sắp xếp</button>
            <button class="data-type-btn" data-type="reversed"><i class="fa-solid fa-rotate"></i> Đảo ngược</button>
            <button class="data-type-btn" data-type="few"><i class="fa-solid fa-crosshairs"></i> Ít giá trị</button>
          </div>
        </div>

        <button class="btn btn-primary btn-lg" id="bench-run-btn">
          <span><i class="fa-solid fa-rocket"></i></span> Chạy Benchmark
        </button>
      </div>

      <!-- Progress -->
      <div class="benchmark-progress" id="bench-progress">
        <div class="spinner"></div>
        <div class="progress-text" id="bench-progress-text">Đang chạy benchmark...</div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" id="bench-progress-bar" style="width: 0%"></div>
        </div>
      </div>

      <!-- Results -->
      <div id="bench-results-container" style="display: none;">
        <div class="benchmark-results">
          <!-- Table -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa-solid fa-table-list"></i> Bảng kết quả</div>
              <span class="algo-badge" id="bench-data-info">-</span>
            </div>
            <div class="benchmark-table-container">
              <table class="benchmark-table" id="bench-table">
                <thead>
                  <tr>
                    <th style="width: 50px">#</th>
                    <th>Thuật toán</th>
                    <th>Thời gian</th>
                    <th>So sánh</th>
                    <th>Hoán đổi</th>
                  </tr>
                </thead>
                <tbody id="bench-table-body"></tbody>
              </table>
            </div>
          </div>

          <!-- Chart -->
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa-solid fa-chart-column"></i> Biểu đồ so sánh thời gian</div>
            </div>
            <div class="benchmark-chart" id="bench-chart"></div>
          </div>
        </div>

        <!-- Detailed Comparison Charts -->
        <div style="margin-top: var(--space-lg);">
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa-solid fa-microscope"></i> So sánh chi tiết</div>
            </div>
            <div class="benchmark-results" style="margin-top: 0;">
              <div>
                <h3 style="margin-bottom: var(--space-md); font-size: 0.95rem; color: var(--text-secondary);">Số phép so sánh</h3>
                <div class="benchmark-chart" id="bench-chart-comparisons"></div>
              </div>
              <div>
                <h3 style="margin-bottom: var(--space-md); font-size: 0.95rem; color: var(--text-secondary);">Số phép hoán đổi / di chuyển</h3>
                <div class="benchmark-chart" id="bench-chart-swaps"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Card -->
        <div class="card" style="margin-top: var(--space-lg);">
          <div class="card-header">
            <div class="card-title"><i class="fa-solid fa-lightbulb"></i> Nhận xét</div>
          </div>
          <div id="bench-summary" style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.8;"></div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Size
    document.getElementById('bench-size-select')?.addEventListener('change', (e) => {
      this.sampleSize = parseInt(e.target.value);
    });

    // Field
    document.getElementById('bench-field-select')?.addEventListener('change', (e) => {
      this.sortField = e.target.value;
    });

    // Order
    document.getElementById('bench-order-select')?.addEventListener('change', (e) => {
      this.sortOrder = e.target.value;
    });

    // Data type
    document.querySelectorAll('.data-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.data-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.dataType = btn.dataset.type;
      });
    });

    // Run
    document.getElementById('bench-run-btn')?.addEventListener('click', () => this.runBenchmark());
  }

  prepareData() {
    const shuffled = [...this.allData].sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, this.sampleSize);
    let values = sample.map(item => Number(item[this.sortField]));

    switch (this.dataType) {
      case 'nearly': {
        // Sort first, then swap a few elements
        values.sort((a, b) => this.sortOrder === 'asc' ? a - b : b - a);
        const numSwaps = Math.max(1, Math.floor(values.length * 0.05));
        for (let i = 0; i < numSwaps; i++) {
          const a = Math.floor(Math.random() * values.length);
          const b = Math.floor(Math.random() * values.length);
          [values[a], values[b]] = [values[b], values[a]];
        }
        break;
      }
      case 'reversed': {
        values.sort((a, b) => this.sortOrder === 'asc' ? b - a : a - b);
        break;
      }
      case 'few': {
        // Only use a few unique values
        const uniques = [...new Set(values)].slice(0, 5);
        values = values.map(() => uniques[Math.floor(Math.random() * uniques.length)]);
        break;
      }
      // 'random' - already random
    }

    return values;
  }

  async runBenchmark() {
    if (this.isRunning) return;
    this.isRunning = true;

    const runBtn = document.getElementById('bench-run-btn');
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = '<span><i class="fa-solid fa-spinner fa-spin"></i></span> Đang chạy...';
    }

    const progress = document.getElementById('bench-progress');
    const progressBar = document.getElementById('bench-progress-bar');
    const progressText = document.getElementById('bench-progress-text');
    const resultsContainer = document.getElementById('bench-results-container');

    if (progress) progress.classList.add('active');
    if (resultsContainer) resultsContainer.style.display = 'none';

    const data = this.prepareData();
    const algorithms = SortingAlgorithms.getAllNames();
    this.results = [];
    const numRuns = 5; // Run each algorithm 5 times and average

    for (let algoIdx = 0; algoIdx < algorithms.length; algoIdx++) {
      const algoName = algorithms[algoIdx];
      const info = SortingAlgorithms.getInfo(algoName);

      if (progressText) progressText.textContent = `Đang chạy ${info.name}...`;
      if (progressBar) progressBar.style.width = `${((algoIdx + 0.5) / algorithms.length) * 100}%`;

      // Wait a tick for UI updates
      await new Promise(r => setTimeout(r, 50));

      let totalTime = 0;
      let totalComparisons = 0;
      let totalSwaps = 0;
      let skipped = false;

      // Bảo vệ trình duyệt: Không chạy O(N^2) nếu dữ liệu quá lớn
      if (this.sampleSize >= 10000 && (algoName === 'selection' || algoName === 'insertion' || algoName === 'bubble')) {
        skipped = true;
      } else {
        // Giảm số lần chạy (numRuns) nếu dữ liệu lớn để tránh chờ quá lâu
        const currentRuns = this.sampleSize >= 10000 ? 1 : numRuns;
        for (let run = 0; run < currentRuns; run++) {
          const result = SortingAlgorithms.benchmark(algoName, [...data], this.sortOrder);
          totalTime += result.timeMs;
          totalComparisons += result.comparisons;
          totalSwaps += result.swaps;
        }
        
        // Trung bình cộng nếu có chạy nhiều lần
        if (currentRuns > 1) {
          totalTime /= currentRuns;
          totalComparisons /= currentRuns;
          totalSwaps /= currentRuns;
        }
      }

      this.results.push({
        algorithm: algoName,
        name: info.name,
        timeMs: skipped ? Infinity : totalTime,
        comparisons: skipped ? Infinity : totalComparisons,
        swaps: skipped ? Infinity : totalSwaps,
        average: info.average,
        space: info.space,
        skipped: skipped
      });

      if (progressBar) progressBar.style.width = `${((algoIdx + 1) / algorithms.length) * 100}%`;
    }

    // Sort results by time
    this.results.sort((a, b) => a.timeMs - b.timeMs);

    // Assign ranks
    this.results.forEach((r, i) => r.rank = i + 1);

    await new Promise(r => setTimeout(r, 300));

    if (progress) progress.classList.remove('active');
    if (resultsContainer) resultsContainer.style.display = 'block';

    this.renderResults(data);

    if (runBtn) {
      runBtn.disabled = false;
      runBtn.innerHTML = '<span><i class="fa-solid fa-rocket"></i></span> Chạy Benchmark';
    }

    this.isRunning = false;

    if (window.app) {
      window.app.showToast('Benchmark hoàn thành!', 'success');
    }
  }

  renderResults(data) {
    this.renderTable();
    this.renderTimeChart();
    this.renderComparisonCharts();
    this.renderSummary(data);

    const dataInfo = document.getElementById('bench-data-info');
    const dataTypeNames = { random: 'Random', nearly: 'Gần sắp xếp', reversed: 'Đảo ngược', few: 'Ít giá trị' };
    if (dataInfo) {
      dataInfo.textContent = `${this.sampleSize.toLocaleString()} items | ${dataTypeNames[this.dataType]} | ${this.sortField}`;
    }
  }

  renderTable() {
    const tbody = document.getElementById('bench-table-body');
    if (!tbody) return;

    tbody.innerHTML = this.results.map((r, i) => {
      const isFastest = !r.skipped && this.results.length > 1 && r.timeMs === Math.min(...this.results.filter(res => !res.skipped).map(res => res.timeMs));
      const rowCls = isFastest ? 'fastest' : (r.skipped ? 'skipped' : '');
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'other';
      
      let metricsHtml = '';
      if (r.skipped) {
        metricsHtml = `
          <td colspan="3" style="text-align: center; color: var(--text-muted); font-style: italic;">
            <i class="fa-solid fa-triangle-exclamation"></i> Bỏ qua (O(N²) quá chậm)
          </td>
        `;
      } else {
        metricsHtml = `
          <td>
            <span style="font-weight: 700; font-family: var(--font-mono); color: ${isFastest ? 'var(--accent-green-light)' : 'var(--text-primary)'}">
              ${r.timeMs.toFixed(3)} ms
            </span>
          </td>
          <td style="font-family: var(--font-mono); font-size: 0.85rem;">${r.comparisons.toLocaleString()}</td>
          <td style="font-family: var(--font-mono); font-size: 0.85rem;">${r.swaps.toLocaleString()}</td>
        `;
      }

      return `
        <tr class="${rowCls}">
          <td><span class="rank-badge ${rankClass}">${r.rank}</span></td>
          <td>
            <div style="font-weight: 600;">${r.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: var(--font-mono);">
              ${r.average} | ${r.space}
            </div>
          </td>
          ${metricsHtml}
        </tr>
      `;
    }).join('');
  }

  renderTimeChart() {
    const chart = document.getElementById('bench-chart');
    if (!chart) return;

    const validResults = this.results.filter(r => !r.skipped);
    if (validResults.length === 0) return;

    const maxTime = Math.max(...validResults.map(r => r.timeMs), 0.001);

    chart.innerHTML = validResults.map((r, i) => {
      const width = Math.max((r.timeMs / maxTime) * 100, 5);
      return `
        <div class="benchmark-bar-row">
          <div class="benchmark-bar-label">${r.name}</div>
          <div class="benchmark-bar-track">
            <div class="benchmark-bar-fill algo-${i}" style="width: ${width}%">
              ${r.timeMs.toFixed(3)} ms
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Animate bars
    setTimeout(() => {
      chart.querySelectorAll('.benchmark-bar-fill').forEach(bar => {
        bar.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      });
    }, 50);
  }

  renderComparisonCharts() {
    // Comparisons chart
    const compChart = document.getElementById('bench-chart-comparisons');
    if (compChart) {
      const valid = this.results.filter(r => !r.skipped);
      const maxComp = Math.max(...valid.map(r => r.comparisons), 1);
      const sorted = [...valid].sort((a, b) => a.comparisons - b.comparisons);

      compChart.innerHTML = sorted.map((r) => {
        const origIdx = this.results.findIndex(x => x.algorithm === r.algorithm);
        const width = Math.max((r.comparisons / maxComp) * 100, 5);
        return `
          <div class="benchmark-bar-row">
            <div class="benchmark-bar-label">${r.name}</div>
            <div class="benchmark-bar-track">
              <div class="benchmark-bar-fill algo-${origIdx}" style="width: ${width}%">
                ${r.comparisons.toLocaleString()}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Swaps chart
    const swapChart = document.getElementById('bench-chart-swaps');
    if (swapChart) {
      const valid = this.results.filter(r => !r.skipped);
      const maxSwap = Math.max(...valid.map(r => r.swaps), 1);
      const sorted = [...valid].sort((a, b) => a.swaps - b.swaps);

      swapChart.innerHTML = sorted.map((r) => {
        const origIdx = this.results.findIndex(x => x.algorithm === r.algorithm);
        const width = Math.max((r.swaps / maxSwap) * 100, 5);
        return `
          <div class="benchmark-bar-row">
            <div class="benchmark-bar-label">${r.name}</div>
            <div class="benchmark-bar-track">
              <div class="benchmark-bar-fill algo-${origIdx}" style="width: ${width}%">
                ${r.swaps.toLocaleString()}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  renderSummary(data) {
    const summary = document.getElementById('bench-summary');
    if (!summary) return;

    const validResults = this.results.filter(r => !r.skipped);
    if (validResults.length === 0) {
      summary.innerHTML = '<p><i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-yellow)"></i> Tất cả các thuật toán O(N²) đã bị bỏ qua do dữ liệu quá lớn.</p>';
      return;
    }

    const fastest = validResults.reduce((a, b) => a.timeMs < b.timeMs ? a : b);
    const slowest = validResults.reduce((a, b) => a.timeMs > b.timeMs ? a : b);
    const speedup = slowest.timeMs / Math.max(fastest.timeMs, 0.001);

    const dataTypeNames = { random: 'ngẫu nhiên', nearly: 'gần sắp xếp', reversed: 'đảo ngược', few: 'ít giá trị duy nhất' };

    summary.innerHTML = `
      <p><i class="fa-solid fa-trophy" style="color: var(--accent-yellow)"></i> <strong style="color: var(--accent-green-light);">${fastest.name}</strong> nhanh nhất với thời gian trung bình <strong>${fastest.timeMs.toFixed(3)}ms</strong>, nhanh hơn <strong style="color: var(--accent-red-light);">${slowest.name}</strong> khoảng <strong>${speedup.toFixed(1)}x</strong>.</p>
      <p style="margin-top: 0.5rem;"><i class="fa-solid fa-chart-pie"></i> Trên tập dữ liệu <strong>${this.sampleSize.toLocaleString()} phần tử</strong> ${dataTypeNames[this.dataType]}, sắp xếp theo <strong>${this.sortField}</strong>:</p>
      <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
        ${this.results.map(r => 
          r.skipped 
            ? `<li><strong style="color: var(--text-muted);">${r.name}</strong>: <em>Bỏ qua (quá chậm)</em></li>`
            : `<li><strong>${r.name}</strong> (${r.average}): ${r.timeMs.toFixed(3)}ms, ${r.comparisons.toLocaleString()} so sánh, ${r.swaps.toLocaleString()} hoán đổi</li>`
        ).join('')}
      </ul>
      <p style="margin-top: 0.5rem;"><i class="fa-solid fa-circle-info"></i> <strong>Ghi chú:</strong> Mỗi thuật toán được chạy 5 lần và lấy giá trị trung bình. Thời gian thực tế có thể thay đổi tùy theo trạng thái hệ thống.</p>
      ${this.dataType === 'nearly' ? '<p style="margin-top: 0.5rem;"><i class="fa-solid fa-thumbtack"></i> Với dữ liệu gần sắp xếp, <strong>Insertion Sort</strong> thường hoạt động rất hiệu quả do đặc tính O(n) trong best case.</p>' : ''}
      ${this.dataType === 'reversed' ? '<p style="margin-top: 0.5rem;"><i class="fa-solid fa-thumbtack"></i> Với dữ liệu đảo ngược, <strong>Bubble Sort</strong> và <strong>Insertion Sort</strong> thường hoạt động kém nhất do phải thực hiện nhiều hoán đổi.</p>' : ''}
    `;
  }
}

window.Benchmark = Benchmark;
