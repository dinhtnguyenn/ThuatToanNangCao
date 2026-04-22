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
    this.sortField = 'price';
    this.sortOrder = 'asc';
    this.sortAlgorithm = 'selection';
    this.searchQuery = '';
    this.lastSortResult = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      const response = await fetch('data.json');
      this.allData = await response.json();
      this.filteredData = [...this.allData];
      this.isInitialized = true;
      this.render();
      this.bindEvents();
      this.updateStats();
    } catch (error) {
      console.error('Failed to load data:', error);
      this.container.innerHTML = `
        <div class="empty-state">
          <div class="icon">⚠️</div>
          <p>Không thể tải dữ liệu. Vui lòng kiểm tra file data.json</p>
        </div>
      `;
    }
  }

  render() {
    this.container.innerHTML = `
      <!-- Controls -->
      <div class="controls-bar" id="table-controls">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
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
          <label>Sắp xếp theo:</label>
          <select id="field-select">
            <option value="price">Giá (Price)</option>
            <option value="rating">Đánh giá (Rating)</option>
            <option value="stock">Tồn kho (Stock)</option>
            <option value="name">Tên (Name)</option>
            <option value="id">ID</option>
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
          <span>⚡</span> Sắp xếp
        </button>

        <button class="btn btn-secondary" id="reset-btn">
          <span>🔄</span> Reset
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
              <th data-field="name">Tên sản phẩm</th>
              <th data-field="price">Giá ($)</th>
              <th data-field="rating">Đánh giá</th>
              <th data-field="stock">Tồn kho</th>
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

    tbody.innerHTML = this.displayData.map((item, idx) => `
      <tr data-id="${item.id}" data-index="${start + idx}">
        <td style="color: var(--text-muted); font-family: var(--font-mono); font-size: 0.8rem;">${item.id}</td>
        <td>
          <div style="font-weight: 500;">${this.escapeHtml(item.name)}</div>
        </td>
        <td class="price-cell">$${Number(item.price).toFixed(2)}</td>
        <td>
          <div class="rating-stars">
            ${this.renderStars(item.rating)}
            <span class="rating-value">${item.rating}</span>
          </div>
        </td>
        <td>
          <span class="stock-badge ${item.stock < 20 ? 'low' : item.stock < 100 ? 'medium' : 'high'}">
            ${item.stock}
          </span>
        </td>
      </tr>
    `).join('');
  }

  renderStars(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push('★');
      } else if (i - 0.5 <= rating) {
        stars.push('⯪');
      } else {
        stars.push('<span style="opacity: 0.3">★</span>');
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
    this.filteredData = this.allData.filter(item => {
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
    this.filteredData = [...this.allData];
    this.currentPage = 1;
    this.searchQuery = '';
    this.lastSortResult = null;

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const statsEl = document.getElementById('sort-stats');
    if (statsEl) statsEl.style.display = 'none';

    this.renderTableBody();
    this.renderPagination();

    if (window.app) {
      window.app.showToast('Đã reset dữ liệu về trạng thái ban đầu', 'info');
    }
  }

  updateStats() {
    // Update hero stats
    const totalProducts = document.getElementById('stat-total-products');
    if (totalProducts) totalProducts.textContent = this.allData.length;

    const avgPrice = document.getElementById('stat-avg-price');
    if (avgPrice) {
      const avg = this.allData.reduce((sum, item) => sum + Number(item.price), 0) / this.allData.length;
      avgPrice.textContent = `$${avg.toFixed(2)}`;
    }

    const avgRating = document.getElementById('stat-avg-rating');
    if (avgRating) {
      const avg = this.allData.reduce((sum, item) => sum + item.rating, 0) / this.allData.length;
      avgRating.textContent = avg.toFixed(1);
    }

    const totalStock = document.getElementById('stat-total-stock');
    if (totalStock) {
      const total = this.allData.reduce((sum, item) => sum + item.stock, 0);
      totalStock.textContent = total.toLocaleString();
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
}

window.DataTable = DataTable;
