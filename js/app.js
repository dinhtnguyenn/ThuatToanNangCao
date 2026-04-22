// ============================================
// MAIN APP CONTROLLER
// ============================================

class App {
  constructor() {
    this.dataTable = null;
    this.visualizer = null;
    this.benchmark = null;
    this.currentTab = 'data-table';
    this.toastContainer = null;
  }

  async init() {
    // Create toast container
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container';
    document.body.appendChild(this.toastContainer);

    // Setup navigation
    this.setupNavigation();

    // Init Data Table
    this.dataTable = new DataTable('tab-data-table');
    await this.dataTable.init();

    // Init Visualizer (after data is loaded)
    this.visualizer = new Visualizer('tab-visualizer');
    this.visualizer.init(this.dataTable.getData());

    // Init Benchmark
    this.benchmark = new Benchmark('tab-benchmark');
    this.benchmark.init(this.dataTable.getData());

    // Show default tab
    this.switchTab('data-table');

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();

    console.log('✅ SortViz App initialized successfully');
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

    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });

    // Pause visualizer when switching away
    if (tabId !== 'visualizer' && this.visualizer) {
      this.visualizer.pause();
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case '1':
          this.switchTab('data-table');
          break;
        case '2':
          this.switchTab('visualizer');
          break;
        case '3':
          this.switchTab('benchmark');
          break;
        case ' ':
          if (this.currentTab === 'visualizer') {
            e.preventDefault();
            this.visualizer.togglePlay();
          }
          break;
        case 'ArrowRight':
          if (this.currentTab === 'visualizer') {
            e.preventDefault();
            this.visualizer.stepForward();
          }
          break;
        case 'ArrowLeft':
          if (this.currentTab === 'visualizer') {
            e.preventDefault();
            this.visualizer.stepBackward();
          }
          break;
        case 'r':
        case 'R':
          if (this.currentTab === 'visualizer') {
            this.visualizer.resetVisualization();
          }
          break;
      }
    });
  }

  showToast(message, type = 'info') {
    const icons = { success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  window.app.init();
});
