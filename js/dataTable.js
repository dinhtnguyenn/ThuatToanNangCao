// ============================================
// DATA TABLE MODULE
// ============================================

class DataTable {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.allData = [];
    this.filteredData = [];
    this.displayData = [];
    this.currentPage = 1;
    this.pageSize = 20;
    this.sortField = 'id';
    this.sortOrder = 'asc';
    this.sortAlgorithm = 'selection';
    this.searchQuery = '';
    this.dataLimit = 100000;
    this.lastSortResult = null;
    this.isInitialized = false;
    this.datasetId = 'ecommerce';
  }

  async init(preloadedData = null) {
    if (preloadedData) {
      this.allData = preloadedData;
      this.filteredData = [...this.allData];
      this.isInitialized = true;
      this.render();
      this.bindEvents();
      this.updateStats();
      return;
    }

    try {
      // Try to load from JSON if available, else generate default
      const response = await fetch('data.json').catch(() => null);
      if (response && response.ok) {
        this.allData = await response.json();
      } else {
        this.allData = DatasetManager.getDataset('ecommerce').generate(this.dataLimit);
      }
      this.filteredData = [...this.allData];
      this.isInitialized = true;
      this.render();
      this.bindEvents();
      this.updateStats();
    } catch (error) {
      console.warn('Could not load data.json, using generated data instead.');
      this.allData = DatasetManager.getDataset('ecommerce').generate(this.dataLimit);
      this.filteredData = [...this.allData];
      this.isInitialized = true;
      this.render();
      this.bindEvents();
      this.updateStats();
    }
  }

  render() {
    this.container.innerHTML = `
      <!-- Controls -->
      <div class="controls-bar" id="table-controls">
        <div class="search-wrapper">
          <span class="search-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
          <input type="search" id="search-input" placeholder="Tìm kiếm sản phẩm..." />
        </div>

        <div class="control-group">
          <label>Thuật toán:</label>
          <select id="algo-select">
            <option value="selection">Selection Sort</option>
            <option value="insertion">Insertion Sort</option>
            <option value="bubble">Bubble Sort</option>
            <option value="merge">Merge Sort</option>
            <option value="quick">Quick Sort</option>
          </select>
        </div>

        <div class="control-group">
          <label>Dữ liệu (Tối đa):</label>
          <select id="data-size-select">
            <option value="1000">1.000 phần tử</option>
            <option value="5000">5.000 phần tử</option>
            <option value="10000">10.000 phần tử</option>
            <option value="50000">50.000 phần tử</option>
            <option value="100000" selected>Toàn bộ (100k)</option>
          </select>
        </div>

        <div class="control-group">
          <label>Hiển thị:</label>
          <select id="page-size-select">
            <option value="20" selected>20 dòng/trang</option>
            <option value="50">50 dòng/trang</option>
            <option value="100">100 dòng/trang</option>
            <option value="500">500 dòng/trang</option>
            <option value="1000">1000 dòng/trang</option>
            <option value="100000">Tất cả (Rất lag)</option>
          </select>
        </div>

        <div class="control-group">
          <label>Sắp xếp theo:</label>
          <select id="field-select">
            ${DatasetManager.getDataset(this.datasetId).fields.map(f => `<option value="${f.id}" ${f.id === this.sortField ? 'selected' : ''}>${f.label}</option>`).join('')}
          </select>
        </div>

        <div class="control-group">
          <label>Thứ tự:</label>
          <select id="order-select">
            <option value="asc">Tăng dần ↑</option>
            <option value="desc">Giảm dần ↓</option>
          </select>
        </div>

        <button class="btn btn-primary" id="sort-btn">
          <span><i class="fa-solid fa-bolt"></i></span> Sắp xếp
        </button>

        <button class="btn btn-secondary" id="reset-btn">
          <span><i class="fa-solid fa-rotate"></i></span> Reset
        </button>
      </div>

      <!-- Sort Stats (hidden initially) -->
      <div class="sort-stats" id="sort-stats" style="display: none;">
        <div class="sort-stat-item">
          <span class="label">Thuật toán:</span>
          <span class="value" id="stat-algo">-</span>
        </div>
        <div class="sort-stat-item">
          <span class="label">Thời gian:</span>
          <span class="value" id="stat-time">-</span>
        </div>
        <div class="sort-stat-item">
          <span class="label">So sánh:</span>
          <span class="value" id="stat-comparisons">-</span>
        </div>
        <div class="sort-stat-item">
          <span class="label">Hoán đổi:</span>
          <span class="value" id="stat-swaps">-</span>
        </div>
        <div class="sort-stat-item">
          <span class="label">Số phần tử:</span>
          <span class="value" id="stat-count">-</span>
        </div>
      </div>

      <!-- Table -->
      <div class="table-container">
        <table class="data-table" id="product-table">
          <thead>
            <tr>
              <th data-field="id" style="width: 60px">#</th>
              ${DatasetManager.getDataset(this.datasetId).fields.map(f => `
                <th data-field="${f.id}">${f.label}</th>
              `).join('')}
            </tr>
          </thead>
          <tbody id="table-body"></tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" id="pagination"></div>
    `;

    this.renderTableBody();
    this.renderPagination();
  }

  renderTableBody() {
    const tbody = document.getElementById('table-body');
    if (!tbody) return;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayData = this.filteredData.slice(start, end);

    if (this.displayData.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            Không tìm thấy sản phẩm nào
          </td>
        </tr>
      `;
      return;
    }

    const fields = DatasetManager.getDataset(this.datasetId).fields;
    tbody.innerHTML = this.displayData.map((item, idx) => `
      <tr data-id="${item.id}" data-index="${start + idx}">
        <td style="color: var(--text-muted); font-family: var(--font-mono); font-size: 0.8rem;">${item.id}</td>
        ${fields.map(f => `
          <td>${this.formatValue(item[f.id], f.id)}</td>
        `).join('')}
      </tr>
    `).join('');
  }

  formatValue(value, fieldId) {
    if (this.datasetId === 'ecommerce') {
      if (fieldId === 'price') return Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
      if (fieldId === 'rating') return `
        <div class="rating-stars">
          ${this.renderStars(value)}
          <span class="rating-value">${value}</span>
        </div>
      `;
      if (fieldId === 'stock') return `
        <span class="stock-badge ${value < 20 ? 'low' : value < 100 ? 'medium' : 'high'}">${value}</span>
      `;
    }
    
    if (this.datasetId === 'education') {
      if (fieldId === 'gpa') return `<span style="font-weight: 600; color: ${value > 3.5 ? 'var(--accent-green-light)' : 'var(--text-primary)'}">${value.toFixed(2)}</span>`;
      if (fieldId === 'score') return `<span class="stock-badge ${value < 50 ? 'low' : 'high'}">${value}</span>`;
    }

    if (this.datasetId === 'finance') {
      if (fieldId === 'change') return `<span style="font-weight: 600; color: ${value > 0 ? 'var(--accent-green-light)' : 'var(--accent-red-light)'}">${value > 0 ? '+' : ''}${value}%</span>`;
      if (fieldId === 'price' || fieldId === 'volume') return value.toLocaleString();
    }

    if (this.datasetId === 'geography') {
      if (fieldId === 'population' || fieldId === 'area' || fieldId === 'density') return value.toLocaleString();
    }

    return this.escapeHtml(String(value));
  }

  formatStatValue(value, fieldId) {
    const config = DatasetManager.getDataset(this.datasetId);
    const field = config.fields.find(f => f.id === fieldId);
    const unit = field?.unit || '';

    // Smart number shortening
    const formatShort = (num) => {
      if (num >= 1000000000) return (num / 1000000000).toFixed(1) + ' Tỷ';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + ' Tr';
      return Math.round(num).toLocaleString('vi-VN');
    };

    if (fieldId === 'gpa') return value.toFixed(2);
    if (fieldId === 'change') return (value > 0 ? '+' : '') + value.toFixed(2) + unit;
    if (fieldId === 'rating') return value.toFixed(1) + ' ' + unit;
    
    return formatShort(value) + (unit ? ' ' + unit : '');
  }

  renderStars(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push('<i class="fa-solid fa-star" style="color: var(--accent-yellow)"></i>');
      } else if (i - 0.5 <= rating) {
        stars.push('<i class="fa-solid fa-star-half-stroke" style="color: var(--accent-yellow)"></i>');
      } else {
        stars.push('<i class="fa-regular fa-star" style="opacity: 0.3"></i>');
      }
    }
    return stars.join('');
  }

  renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    const total = this.filteredData.length;
    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, total);

    let buttonsHtml = '';

    // Previous
    buttonsHtml += `<button class="page-btn" ${this.currentPage <= 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">‹</button>`;

    // Page numbers
    const maxVisible = 7;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      buttonsHtml += `<button class="page-btn" data-page="1">1</button>`;
      if (startPage > 2) buttonsHtml += `<span style="color: var(--text-muted); padding: 0 4px;">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      buttonsHtml += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttonsHtml += `<span style="color: var(--text-muted); padding: 0 4px;">...</span>`;
      buttonsHtml += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next
    buttonsHtml += `<button class="page-btn" ${this.currentPage >= totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">›</button>`;

    pagination.innerHTML = `
      <div class="pagination-info">
        Hiển thị <strong>${start}-${end}</strong> trong tổng <strong>${total}</strong> sản phẩm
      </div>
      <div class="pagination-buttons">${buttonsHtml}</div>
    `;
  }

  bindEvents() {
    // Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.searchQuery = e.target.value.trim().toLowerCase();
          this.applyFilters();
        }, 300);
      });
    }

    // Sort button
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) {
      sortBtn.addEventListener('click', () => this.performSort());
    }

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.reset());
    }

    // Algorithm select
    const algoSelect = document.getElementById('algo-select');
    if (algoSelect) {
      algoSelect.addEventListener('change', (e) => {
        this.sortAlgorithm = e.target.value;
      });
    }

    // Data Size select
    const dataSizeSelect = document.getElementById('data-size-select');
    if (dataSizeSelect) {
      dataSizeSelect.addEventListener('change', (e) => {
        this.dataLimit = parseInt(e.target.value);
        this.applyFilters();
        if (window.app) {
          window.app.showToast(`Đã giới hạn dữ liệu ở mức ${this.dataLimit.toLocaleString()} phần tử`, 'info');
        }
      });
    }

    // Page Size select
    const pageSizeSelect = document.getElementById('page-size-select');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        this.pageSize = parseInt(e.target.value);
        this.currentPage = 1;
        this.renderTableBody();
        this.renderPagination();
      });
    }

    // Field select
    const fieldSelect = document.getElementById('field-select');
    if (fieldSelect) {
      fieldSelect.addEventListener('change', (e) => {
        this.sortField = e.target.value;
      });
    }

    // Order select
    const orderSelect = document.getElementById('order-select');
    if (orderSelect) {
      orderSelect.addEventListener('change', (e) => {
        this.sortOrder = e.target.value;
      });
    }

    // Pagination
    const pagination = document.getElementById('pagination');
    if (pagination) {
      pagination.addEventListener('click', (e) => {
        const btn = e.target.closest('.page-btn');
        if (btn && !btn.disabled) {
          this.currentPage = parseInt(btn.dataset.page);
          this.renderTableBody();
          this.renderPagination();
          // Scroll to table
          document.getElementById('product-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    // Table header sort
    const headers = document.querySelectorAll('.data-table th[data-field]');
    headers.forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.field;
        if (this.sortField === field) {
          this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortField = field;
          this.sortOrder = 'asc';
        }
        // Update select dropdowns
        const fieldSelect = document.getElementById('field-select');
        const orderSelect = document.getElementById('order-select');
        if (fieldSelect) fieldSelect.value = this.sortField;
        if (orderSelect) orderSelect.value = this.sortOrder;
        this.performSort();
      });
    });
  }

  applyFilters() {
    const baseData = this.allData.slice(0, this.dataLimit);
    this.filteredData = baseData.filter(item => {
      if (this.searchQuery && !item.name.toLowerCase().includes(this.searchQuery)) {
        return false;
      }
      return true;
    });

    this.currentPage = 1;
    this.renderTableBody();
    this.renderPagination();
  }

  performSort() {
    const field = this.sortField;
    const values = this.filteredData.map(item => {
      if (field === 'name') return item.name.toLowerCase();
      return item[field];
    });

    // For string sorting, we need numeric comparison
    let numericValues;
    
    // Bảo vệ trình duyệt: Không chạy O(N^2) trên dữ liệu > 10,000
    if (values.length > 10000 && (this.sortAlgorithm === 'selection' || this.sortAlgorithm === 'insertion' || this.sortAlgorithm === 'bubble')) {
      if (window.app) {
        window.app.showToast(`Dữ liệu quá lớn (${values.length.toLocaleString()} mục) để chạy ${this.sortAlgorithm} (O(N²)). Vui lòng dùng Merge hoặc Quick Sort!`, 'error');
      }
      const sortBtn = document.getElementById('sort-btn');
      if (sortBtn) {
        sortBtn.disabled = false;
        sortBtn.innerHTML = '<span><i class="fa-solid fa-bolt"></i></span> Sắp xếp';
      }
      return;
    }
    if (field === 'name') {
      // Create index-based sorting using string comparison
      const indices = values.map((_, i) => i);
      const result = this.sortByIndices(indices, values, this.sortAlgorithm, this.sortOrder);
      
      // Reorder filteredData based on sorted indices
      const sorted = result.sortedArray.map(i => this.filteredData[i]);
      this.filteredData = sorted;
      this.lastSortResult = result;
    } else {
      numericValues = values.map(Number);
      const indices = numericValues.map((_, i) => i);
      const result = this.sortByIndices(indices, numericValues, this.sortAlgorithm, this.sortOrder);
      
      const sorted = result.sortedArray.map(i => this.filteredData[i]);
      this.filteredData = sorted;
      this.lastSortResult = result;
    }

    this.currentPage = 1;
    this.renderTableBody();
    this.renderPagination();
    this.showSortStats();
    this.animateSortedRows();

    // Show toast
    if (window.app) {
      const algoInfo = SortingAlgorithms.getInfo(this.sortAlgorithm);
      window.app.showToast(`${algoInfo.name} hoàn thành trong ${this.lastSortResult.timeMs.toFixed(2)}ms`, 'success');
    }
  }

  sortByIndices(indices, values, algorithm, order) {
    // Sort indices based on corresponding values
    const arr = [...indices];
    const n = arr.length;
    let comparisons = 0;
    let swaps = 0;
    const t0 = performance.now();

    const compare = (a, b) => {
      comparisons++;
      const va = values[a];
      const vb = values[b];
      if (typeof va === 'string') {
        return order === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return order === 'asc' ? va - vb : vb - va;
    };

    switch (algorithm) {
      case 'selection': {
        for (let i = 0; i < n - 1; i++) {
          let minIdx = i;
          for (let j = i + 1; j < n; j++) {
            if (compare(arr[j], arr[minIdx]) < 0) minIdx = j;
          }
          if (minIdx !== i) { [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]]; swaps++; }
        }
        break;
      }
      case 'insertion': {
        for (let i = 1; i < n; i++) {
          const key = arr[i];
          let j = i - 1;
          while (j >= 0 && compare(arr[j], key) > 0) {
            arr[j + 1] = arr[j]; swaps++; j--;
          }
          arr[j + 1] = key;
        }
        break;
      }
      case 'bubble': {
        for (let i = 0; i < n - 1; i++) {
          let s = false;
          for (let j = 0; j < n - i - 1; j++) {
            if (compare(arr[j], arr[j + 1]) > 0) {
              [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; swaps++; s = true;
            }
          }
          if (!s) break;
        }
        break;
      }
      case 'merge': {
        const mergeOp = (a, l, m, r) => {
          const L = a.slice(l, m + 1), R = a.slice(m + 1, r + 1);
          let i = 0, j = 0, k = l;
          while (i < L.length && j < R.length) {
            if (compare(L[i], R[j]) <= 0) { a[k++] = L[i++]; }
            else { a[k++] = R[j++]; }
            swaps++;
          }
          while (i < L.length) { a[k++] = L[i++]; swaps++; }
          while (j < R.length) { a[k++] = R[j++]; swaps++; }
        };
        const ms = (a, l, r) => {
          if (l >= r) return;
          const m = (l + r) >> 1;
          ms(a, l, m); ms(a, m + 1, r);
          mergeOp(a, l, m, r);
        };
        ms(arr, 0, n - 1);
        break;
      }
      case 'quick': {
        const part = (a, lo, hi) => {
          const p = a[hi]; let i = lo - 1;
          for (let j = lo; j < hi; j++) {
            if (compare(a[j], p) < 0) { i++; [a[i], a[j]] = [a[j], a[i]]; swaps++; }
          }
          [a[i + 1], a[hi]] = [a[hi], a[i + 1]]; swaps++;
          return i + 1;
        };
        const qs = (a, lo, hi) => {
          if (lo < hi) { const pi = part(a, lo, hi); qs(a, lo, pi - 1); qs(a, pi + 1, hi); }
        };
        qs(arr, 0, n - 1);
        break;
      }
    }

    return {
      sortedArray: arr,
      comparisons,
      swaps,
      timeMs: performance.now() - t0
    };
  }

  showSortStats() {
    const statsEl = document.getElementById('sort-stats');
    if (!statsEl || !this.lastSortResult) return;

    const algoInfo = SortingAlgorithms.getInfo(this.sortAlgorithm);

    document.getElementById('stat-algo').textContent = algoInfo.name;
    document.getElementById('stat-time').textContent = `${this.lastSortResult.timeMs.toFixed(3)} ms`;
    document.getElementById('stat-comparisons').textContent = this.lastSortResult.comparisons.toLocaleString();
    document.getElementById('stat-swaps').textContent = this.lastSortResult.swaps.toLocaleString();
    document.getElementById('stat-count').textContent = this.filteredData.length.toLocaleString();

    statsEl.style.display = 'flex';
    statsEl.style.animation = 'fadeIn 0.3s ease';
  }

  animateSortedRows() {
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach((row, i) => {
      setTimeout(() => {
        row.classList.add('sorted-row');
      }, i * 15);
    });
  }

  reset() {
    this.dataLimit = 100000;
    this.filteredData = [...this.allData];
    this.currentPage = 1;
    this.searchQuery = '';
    this.lastSortResult = null;

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    const dataSizeSelect = document.getElementById('data-size-select');
    if (dataSizeSelect) dataSizeSelect.value = '100000';

    const pageSizeSelect = document.getElementById('page-size-select');
    if (pageSizeSelect) {
      pageSizeSelect.value = '20';
      this.pageSize = 20;
    }

    const statsEl = document.getElementById('sort-stats');
    if (statsEl) statsEl.style.display = 'none';

    this.renderTableBody();
    this.renderPagination();

    if (window.app) {
      window.app.showToast('Đã reset dữ liệu về trạng thái ban đầu', 'info');
    }
  }

  updateStats() {
    const config = DatasetManager.getDataset(this.datasetId);
    
    // Card 1: Total
    const totalItems = document.getElementById('stat-total-products');
    const card1 = totalItems?.closest('.stat-card');
    if (card1) {
      const iconEl = card1.querySelector('.stat-icon i');
      if (iconEl) iconEl.className = `fa-solid ${config.icon}`;
      card1.querySelector('.stat-label').textContent = 'Tổng số mục';
      totalItems.textContent = this.allData.length.toLocaleString('vi-VN');
    }

    const numericFields = config.fields.filter(f => f.type === 'number');

    // Card 2: Average of field 1
    const stat2Value = document.getElementById('stat-avg-price');
    const card2 = stat2Value?.closest('.stat-card');
    if (card2 && numericFields.length > 0) {
      const field = numericFields[0];
      const avg = this.allData.reduce((sum, item) => sum + Number(item[field.id]), 0) / this.allData.length;
      const iconEl = card2.querySelector('.stat-icon i');
      if (iconEl) iconEl.className = `fa-solid ${field.icon}`;
      card2.querySelector('.stat-label').textContent = `TB ${field.label}`;
      stat2Value.textContent = this.formatStatValue(avg, field.id);
    }

    // Card 3: Average of field 2
    const stat3Value = document.getElementById('stat-avg-rating');
    const card3 = stat3Value?.closest('.stat-card');
    if (card3 && numericFields.length > 1) {
      const field = numericFields[1];
      const avg = this.allData.reduce((sum, item) => sum + Number(item[field.id]), 0) / this.allData.length;
      const iconEl = card3.querySelector('.stat-icon i');
      if (iconEl) iconEl.className = `fa-solid ${field.icon}`;
      card3.querySelector('.stat-label').textContent = `TB ${field.label}`;
      stat3Value.textContent = this.formatStatValue(avg, field.id);

      // Color coding for market change
      if (field.id === 'change') {
        stat3Value.style.color = avg > 0 ? 'var(--accent-green-light)' : avg < 0 ? 'var(--accent-red-light)' : 'inherit';
      } else {
        stat3Value.style.color = 'inherit';
      }
    }

    // Card 4: Extra info
    const stat4Value = document.getElementById('stat-total-stock');
    const card4 = stat4Value?.closest('.stat-card');
    if (card4) {
      if (numericFields.length > 2) {
        const field = numericFields[2];
        const total = this.allData.reduce((sum, item) => sum + Number(item[field.id]), 0);
        const iconEl = card4.querySelector('.stat-icon i');
        if (iconEl) iconEl.className = `fa-solid ${field.icon}`;
        card4.querySelector('.stat-label').textContent = `Tổng ${field.label}`;
        stat4Value.textContent = this.formatStatValue(total, field.id);
      } else {
        const iconEl = card4.querySelector('.stat-icon i');
        if (iconEl) iconEl.className = 'fa-solid fa-check-circle';
        card4.querySelector('.stat-label').textContent = 'Trạng thái';
        stat4Value.textContent = 'Sẵn sàng';
      }
    }
  }

  getData() {
    return this.allData;
  }

  escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  updateDataset(datasetId, newData) {
    this.datasetId = datasetId;
    this.allData = newData;
    this.filteredData = [...this.allData];
    this.sortField = DatasetManager.getDataset(datasetId).fields[0].id;
    this.currentPage = 1;
    this.searchQuery = '';
    this.render();
    this.bindEvents();
    this.updateStats();
  }
}

window.DataTable = DataTable;
