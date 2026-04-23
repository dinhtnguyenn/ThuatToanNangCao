// ============================================
// MAIN APP CONTROLLER - ROBUST DATA SYNC
// ============================================

class App {
  constructor() {
    this.dataTable = null;
    this.visualizer = null;
    this.benchmark = null;
    this.race = null;
    this.currentTab = 'data-table';
    this.toastContainer = null;
    this.currentDatasetId = 'ecommerce';
    this.isGenerating = false;
  }

  async init() {
    try {
      // Create toast container
      if (!document.querySelector('.toast-container')) {
        this.toastContainer = document.createElement('div');
        this.toastContainer.className = 'toast-container';
        document.body.appendChild(this.toastContainer);
      } else {
        this.toastContainer = document.querySelector('.toast-container');
      }

      // Setup navigation
      this.setupNavigation();

      // Setup Dataset Selector
      this.setupDatasetSelector();

      // Init Data Table
      this.dataTable = new DataTable('tab-data-table');
      await this.dataTable.init();

      // Init Visualizer
      if (typeof Visualizer !== 'undefined') {
        this.visualizer = new Visualizer('tab-visualizer');
        this.visualizer.datasetId = this.currentDatasetId;
        this.visualizer.init(this.dataTable.getData());
      }

      // Init Benchmark
      if (typeof Benchmark !== 'undefined') {
        this.benchmark = new Benchmark('tab-benchmark');
        this.benchmark.datasetId = this.currentDatasetId;
        this.benchmark.init(this.dataTable.getData());
      }

      // Init Race Mode
      if (typeof Race !== 'undefined') {
        this.race = new Race('tab-race');
        this.race.datasetId = this.currentDatasetId;
        this.race.init(this.dataTable.getData());
      }

      // Show default tab
      this.switchTab('data-table');
      this.setupKeyboardShortcuts();

      console.log('✅ SortViz App initialized successfully');
    } catch (err) {
      console.error('App Init Error:', err);
      this.showToast('Lỗi khởi tạo ứng dụng: ' + err.message, 'error');
    }
  }

  setupNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    if (tabId !== 'visualizer' && this.visualizer) this.visualizer.pause();
    if (tabId !== 'race' && this.race) this.race.pause();
  }

  setupDatasetSelector() {
    const selector = document.getElementById('global-dataset-select');
    if (!selector) return;

    const datasets = DatasetManager.getAllDatasets();
    selector.innerHTML = datasets.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

    selector.addEventListener('change', async (e) => {
      if (this.isGenerating) return;
      
      const datasetId = e.target.value;
      this.isGenerating = true;
      selector.disabled = true;

      this.showToast(`Đang nạp bộ dữ liệu: ${DatasetManager.getDataset(datasetId).name}...`, 'info');
      
      setTimeout(async () => {
        try {
          this.currentDatasetId = datasetId;
          const config = DatasetManager.getDataset(this.currentDatasetId);
          const newData = config.generate(100000); 

          // Update Data Table
          this.dataTable.updateDataset(this.currentDatasetId, newData);
          const sample = this.dataTable.getData();

          // Sync Visualizer
          if (this.visualizer) {
            this.visualizer.datasetId = this.currentDatasetId;
            this.visualizer.updateFields(config.fields);
            this.visualizer.init(sample);
          }

          // Sync Benchmark
          if (this.benchmark) {
            this.benchmark.datasetId = this.currentDatasetId;
            this.benchmark.updateFields(config.fields);
            this.benchmark.init(sample);
          }

          // Sync Race
          if (this.race) {
            this.race.datasetId = this.currentDatasetId;
            this.race.updateFields(config.fields);
            this.race.init(sample);
          }

          this.showToast(`Đã tải xong bộ dữ liệu ${config.name}`, 'success');
        } catch (err) {
          console.error('Dataset Update Error:', err);
          this.showToast('Lỗi khi đổi dữ liệu: ' + err.message, 'error');
        } finally {
          this.isGenerating = false;
          selector.disabled = false;
        }
      }, 100);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case '1': this.switchTab('data-table'); break;
        case '2': this.switchTab('visualizer'); break;
        case '3': this.switchTab('race'); break;
        case '4': this.switchTab('benchmark'); break;
        case '5': this.switchTab('guide'); break;
        case ' ':
          if (this.currentTab === 'visualizer') { e.preventDefault(); this.visualizer.togglePlay(); }
          break;
        case 'ArrowRight':
          if (this.currentTab === 'visualizer') { e.preventDefault(); this.visualizer.stepForward(); }
          break;
        case 'ArrowLeft':
          if (this.currentTab === 'visualizer') { e.preventDefault(); this.visualizer.stepBackward(); }
          break;
        case 'r':
        case 'R':
          if (this.currentTab === 'visualizer') this.visualizer.resetVisualization();
          break;
      }
    });
  }

  showToast(message, type = 'info') {
    const icons = {
      success: '<i class="fa-solid fa-circle-check" style="color: var(--accent-green)"></i>',
      info: '<i class="fa-solid fa-circle-info" style="color: var(--accent-cyan)"></i>',
      warning: '<i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-yellow)"></i>',
      error: '<i class="fa-solid fa-circle-xmark" style="color: var(--accent-red)"></i>'
    };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span> <span class="toast-msg">${message}</span>`;

    if (this.toastContainer) {
      this.toastContainer.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
