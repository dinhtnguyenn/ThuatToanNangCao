// ============================================
// SORTING ALGORITHMS WITH STEP RECORDING
// ============================================

/**
 * Mỗi thuật toán nhận vào mảng giá trị và trả về:
 * {
 *   sortedArray: [...],
 *   steps: [{ type, indices, values?, description }],
 *   comparisons: number,
 *   swaps: number,
 *   timeMs: number
 * }
 * 
 * Step types: 'compare', 'swap', 'insert', 'merge', 'sorted', 'pivot', 'done'
 */

class SortingAlgorithms {

  // ======== SELECTION SORT ========
  static selectionSort(arr, order = 'asc') {
    const a = [...arr];
    const n = a.length;
    const steps = [];
    let comparisons = 0;
    let swaps = 0;
    const t0 = performance.now();

    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      steps.push({
        type: 'info',
        indices: [i],
        description: `Bắt đầu tìm phần tử ${order === 'asc' ? 'nhỏ nhất' : 'lớn nhất'} từ vị trí ${i}`,
        line: 0
      });

      for (let j = i + 1; j < n; j++) {
        comparisons++;
        steps.push({
          type: 'compare',
          indices: [minIdx, j],
          description: `So sánh a[${minIdx}]=${a[minIdx]} với a[${j}]=${a[j]}`,
          line: 2
        });

        const cond = order === 'asc' ? a[j] < a[minIdx] : a[j] > a[minIdx];
        if (cond) {
          minIdx = j;
          steps.push({
            type: 'info',
            indices: [minIdx],
            description: `Cập nhật: phần tử ${order === 'asc' ? 'min' : 'max'} mới tại vị trí ${minIdx} (giá trị ${a[minIdx]})`,
            line: 3
          });
        }
      }

      if (minIdx !== i) {
        steps.push({
          type: 'swap',
          indices: [i, minIdx],
          description: `Hoán đổi a[${i}]=${a[i]} ↔ a[${minIdx}]=${a[minIdx]}`,
          line: 5
        });
        [a[i], a[minIdx]] = [a[minIdx], a[i]];
        swaps++;
      }

      steps.push({
        type: 'sorted',
        indices: [i],
        description: `Vị trí ${i} đã được sắp xếp: ${a[i]}`,
        line: 6
      });
    }

    steps.push({
      type: 'sorted',
      indices: [n - 1],
      description: `Vị trí ${n - 1} đã được sắp xếp: ${a[n - 1]}`,
      line: 7
    });

    steps.push({ type: 'done', indices: [], description: 'Hoàn thành Selection Sort!' });

    return {
      sortedArray: a,
      steps,
      comparisons,
      swaps,
      timeMs: performance.now() - t0
    };
  }

  // ======== INSERTION SORT ========
  static insertionSort(arr, order = 'asc') {
    const a = [...arr];
    const n = a.length;
    const steps = [];
    let comparisons = 0;
    let swaps = 0;
    const t0 = performance.now();

    steps.push({ type: 'sorted', indices: [0], description: `Phần tử đầu tiên a[0]=${a[0]} là đã sắp xếp`, line: 0 });

    for (let i = 1; i < n; i++) {
      const key = a[i];
      let j = i - 1;

      steps.push({
        type: 'info',
        indices: [i],
        description: `Chèn phần tử a[${i}]=${key} vào vị trí đúng`,
        line: 1
      });

      while (j >= 0) {
        comparisons++;
        const cond = order === 'asc' ? a[j] > key : a[j] < key;

        steps.push({
          type: 'compare',
          indices: [j, i],
          description: `So sánh a[${j}]=${a[j]} với key=${key}`,
          line: 3
        });

        if (!cond) break;

        steps.push({
          type: 'swap',
          indices: [j, j + 1],
          description: `Dịch a[${j}]=${a[j]} sang phải (vị trí ${j + 1})`,
          line: 4
        });

        a[j + 1] = a[j];
        swaps++;
        j--;
      }

      a[j + 1] = key;
      steps.push({
        type: 'insert',
        indices: [j + 1],
        description: `Chèn key=${key} vào vị trí ${j + 1}`,
        line: 5
      });

      // Mark sorted portion
      steps.push({
        type: 'sorted',
        indices: Array.from({ length: i + 1 }, (_, k) => k),
        description: `Đã sắp xếp ${i + 1} phần tử đầu tiên`,
        line: 6
      });
    }

    steps.push({ type: 'done', indices: [], description: 'Hoàn thành Insertion Sort!' });

    return {
      sortedArray: a,
      steps,
      comparisons,
      swaps,
      timeMs: performance.now() - t0
    };
  }

  // ======== BUBBLE SORT ========
  static bubbleSort(arr, order = 'asc') {
    const a = [...arr];
    const n = a.length;
    const steps = [];
    let comparisons = 0;
    let swaps = 0;
    const t0 = performance.now();

    for (let i = 0; i < n - 1; i++) {
      let swapped = false;

      steps.push({
        type: 'info',
        indices: [],
        description: `Lượt duyệt thứ ${i + 1}`,
        line: 0
      });

      for (let j = 0; j < n - i - 1; j++) {
        comparisons++;
        steps.push({
          type: 'compare',
          indices: [j, j + 1],
          description: `So sánh a[${j}]=${a[j]} với a[${j + 1}]=${a[j + 1]}`,
          line: 2
        });

        const cond = order === 'asc' ? a[j] > a[j + 1] : a[j] < a[j + 1];
        if (cond) {
          steps.push({
            type: 'swap',
            indices: [j, j + 1],
            description: `Hoán đổi a[${j}]=${a[j]} ↔ a[${j + 1}]=${a[j + 1]}`,
            line: 3
          });
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          swaps++;
          swapped = true;
        }
      }

      steps.push({
        type: 'sorted',
        indices: [n - i - 1],
        description: `Vị trí ${n - i - 1} đã được đặt đúng: ${a[n - i - 1]}`,
        line: 5
      });

      if (!swapped) {
        steps.push({
          type: 'info',
          indices: [],
          description: `Không có hoán đổi → mảng đã sắp xếp xong!`,
          line: 6
        });
        break;
      }
    }

    steps.push({ type: 'done', indices: [], description: 'Hoàn thành Bubble Sort!' });

    return {
      sortedArray: a,
      steps,
      comparisons,
      swaps,
      timeMs: performance.now() - t0
    };
  }

  // ======== MERGE SORT ========
  static mergeSort(arr, order = 'asc') {
    const a = [...arr];
    const n = a.length;
    const steps = [];
    let comparisons = 0;
    let swaps = 0; // In merge sort, we count "moves" as swaps
    const t0 = performance.now();

    function merge(a, left, mid, right) {
      const leftArr = a.slice(left, mid + 1);
      const rightArr = a.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;

      steps.push({
        type: 'info',
        indices: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
        description: `Trộn hai nửa [${left}..${mid}] và [${mid + 1}..${right}]`,
        line: 3
      });

      while (i < leftArr.length && j < rightArr.length) {
        comparisons++;
        steps.push({
          type: 'compare',
          indices: [left + i, mid + 1 + j],
          description: `So sánh ${leftArr[i]} với ${rightArr[j]}`,
          line: 4
        });

        const cond = order === 'asc' ? leftArr[i] <= rightArr[j] : leftArr[i] >= rightArr[j];
        if (cond) {
          a[k] = leftArr[i];
          steps.push({
            type: 'merge',
            indices: [k],
            values: [...a],
            description: `Đặt ${leftArr[i]} vào vị trí ${k}`,
            line: 5
          });
          i++;
        } else {
          a[k] = rightArr[j];
          steps.push({
            type: 'merge',
            indices: [k],
            values: [...a],
            description: `Đặt ${rightArr[j]} vào vị trí ${k}`,
            line: 6
          });
          j++;
        }
        swaps++;
        k++;
      }

      while (i < leftArr.length) {
        a[k] = leftArr[i];
        steps.push({
          type: 'merge',
          indices: [k],
          values: [...a],
          description: `Đặt phần tử còn lại ${leftArr[i]} vào vị trí ${k}`,
          line: 7
        });
        swaps++;
        i++;
        k++;
      }

      while (j < rightArr.length) {
        a[k] = rightArr[j];
        steps.push({
          type: 'merge',
          indices: [k],
          values: [...a],
          description: `Đặt phần tử còn lại ${rightArr[j]} vào vị trí ${k}`,
          line: 7
        });
        swaps++;
        j++;
        k++;
      }
    }

    function mergeSortRec(a, left, right) {
      if (left >= right) return;

      const mid = Math.floor((left + right) / 2);

      steps.push({
        type: 'info',
        indices: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
        description: `Chia mảng [${left}..${right}] tại mid=${mid}`,
        line: 0
      });

      mergeSortRec(a, left, mid);
      mergeSortRec(a, mid + 1, right);
      merge(a, left, mid, right);

      // Mark as sorted if full range
      if (left === 0 && right === n - 1) {
        steps.push({
          type: 'sorted',
          indices: Array.from({ length: n }, (_, i) => i),
          description: 'Toàn bộ mảng đã được sắp xếp!',
          line: 8
        });
      }
    }

    mergeSortRec(a, 0, n - 1);
    steps.push({ type: 'done', indices: [], description: 'Hoàn thành Merge Sort!' });

    return {
      sortedArray: a,
      steps,
      comparisons,
      swaps,
      timeMs: performance.now() - t0
    };
  }

  // ======== QUICK SORT ========
  static quickSort(arr, order = 'asc') {
    const a = [...arr];
    const n = a.length;
    const steps = [];
    let comparisons = 0;
    let swaps = 0;
    const t0 = performance.now();

    function partition(a, low, high) {
      const pivot = a[high];
      steps.push({
        type: 'pivot',
        indices: [high],
        description: `Chọn pivot = a[${high}] = ${pivot}`,
        line: 1
      });

      let i = low - 1;

      for (let j = low; j < high; j++) {
        comparisons++;
        steps.push({
          type: 'compare',
          indices: [j, high],
          description: `So sánh a[${j}]=${a[j]} với pivot=${pivot}`,
          line: 3
        });

        const cond = order === 'asc' ? a[j] < pivot : a[j] > pivot;
        if (cond) {
          i++;
          if (i !== j) {
            steps.push({
              type: 'swap',
              indices: [i, j],
              description: `Hoán đổi a[${i}]=${a[i]} ↔ a[${j}]=${a[j]}`,
              line: 4
            });
            [a[i], a[j]] = [a[j], a[i]];
            swaps++;
          }
        }
      }

      if (i + 1 !== high) {
        steps.push({
          type: 'swap',
          indices: [i + 1, high],
          description: `Đặt pivot vào đúng vị trí: hoán đổi a[${i + 1}]=${a[i + 1]} ↔ pivot=${a[high]}`,
          line: 6
        });
        [a[i + 1], a[high]] = [a[high], a[i + 1]];
        swaps++;
      }

      steps.push({
        type: 'sorted',
        indices: [i + 1],
        description: `Pivot ${a[i + 1]} đã ở đúng vị trí ${i + 1}`,
        line: 7
      });

      return i + 1;
    }

    function quickSortRec(a, low, high) {
      if (low < high) {
        steps.push({
          type: 'info',
          indices: Array.from({ length: high - low + 1 }, (_, idx) => low + idx),
          description: `Phân hoạch mảng con [${low}..${high}]`,
          line: 0
        });

        const pi = partition(a, low, high);
        quickSortRec(a, low, pi - 1);
        quickSortRec(a, pi + 1, high);
      } else if (low === high) {
        steps.push({
          type: 'sorted',
          indices: [low],
          description: `Phần tử đơn a[${low}]=${a[low]} đã sắp xếp`,
          line: 7
        });
      }
    }

    quickSortRec(a, 0, n - 1);
    steps.push({ type: 'done', indices: [], description: 'Hoàn thành Quick Sort!' });

    return {
      sortedArray: a,
      steps,
      comparisons,
      swaps,
      timeMs: performance.now() - t0
    };
  }

  // ======== Run a named algorithm ========
  static run(algorithmName, arr, order = 'asc') {
    switch (algorithmName) {
      case 'selection': return this.selectionSort(arr, order);
      case 'insertion': return this.insertionSort(arr, order);
      case 'bubble': return this.bubbleSort(arr, order);
      case 'merge': return this.mergeSort(arr, order);
      case 'quick': return this.quickSort(arr, order);
      default: throw new Error(`Unknown algorithm: ${algorithmName}`);
    }
  }

  // ======== Run for benchmark (no steps, just stats) ========
  static benchmark(algorithmName, arr, order = 'asc') {
    const a = [...arr];
    const n = a.length;
    let comparisons = 0;
    let swaps = 0;

    const t0 = performance.now();

    switch (algorithmName) {
      case 'selection': {
        for (let i = 0; i < n - 1; i++) {
          let minIdx = i;
          for (let j = i + 1; j < n; j++) {
            comparisons++;
            const cond = order === 'asc' ? a[j] < a[minIdx] : a[j] > a[minIdx];
            if (cond) minIdx = j;
          }
          if (minIdx !== i) {
            [a[i], a[minIdx]] = [a[minIdx], a[i]];
            swaps++;
          }
        }
        break;
      }
      case 'insertion': {
        for (let i = 1; i < n; i++) {
          const key = a[i];
          let j = i - 1;
          while (j >= 0) {
            comparisons++;
            const cond = order === 'asc' ? a[j] > key : a[j] < key;
            if (!cond) break;
            a[j + 1] = a[j];
            swaps++;
            j--;
          }
          a[j + 1] = key;
        }
        break;
      }
      case 'bubble': {
        for (let i = 0; i < n - 1; i++) {
          let swapped = false;
          for (let j = 0; j < n - i - 1; j++) {
            comparisons++;
            const cond = order === 'asc' ? a[j] > a[j + 1] : a[j] < a[j + 1];
            if (cond) {
              [a[j], a[j + 1]] = [a[j + 1], a[j]];
              swaps++;
              swapped = true;
            }
          }
          if (!swapped) break;
        }
        break;
      }
      case 'merge': {
        function mergeB(a, l, m, r) {
          const L = a.slice(l, m + 1), R = a.slice(m + 1, r + 1);
          let i = 0, j = 0, k = l;
          while (i < L.length && j < R.length) {
            comparisons++;
            if ((order === 'asc' ? L[i] <= R[j] : L[i] >= R[j])) {
              a[k++] = L[i++];
            } else {
              a[k++] = R[j++];
            }
            swaps++;
          }
          while (i < L.length) { a[k++] = L[i++]; swaps++; }
          while (j < R.length) { a[k++] = R[j++]; swaps++; }
        }
        function mSort(a, l, r) {
          if (l >= r) return;
          const m = (l + r) >> 1;
          mSort(a, l, m);
          mSort(a, m + 1, r);
          mergeB(a, l, m, r);
        }
        mSort(a, 0, n - 1);
        break;
      }
      case 'quick': {
        function partB(a, lo, hi) {
          const p = a[hi];
          let i = lo - 1;
          for (let j = lo; j < hi; j++) {
            comparisons++;
            if ((order === 'asc' ? a[j] < p : a[j] > p)) {
              i++;
              [a[i], a[j]] = [a[j], a[i]];
              swaps++;
            }
          }
          [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
          swaps++;
          return i + 1;
        }
        function qSort(a, lo, hi) {
          if (lo < hi) {
            const pi = partB(a, lo, hi);
            qSort(a, lo, pi - 1);
            qSort(a, pi + 1, hi);
          }
        }
        qSort(a, 0, n - 1);
        break;
      }
    }

    return {
      sortedArray: a,
      comparisons,
      swaps,
      timeMs: performance.now() - t0
    };
  }

  // ======== Algorithm metadata ========
  static getInfo(name) {
    const info = {
      selection: {
        name: 'Selection Sort',
        best: 'O(n²)',
        average: 'O(n²)',
        worst: 'O(n²)',
        space: 'O(1)',
        stable: false,
        description: 'Tìm phần tử nhỏ nhất và đặt vào đầu, lặp lại cho phần còn lại.',
        pseudocode: [
          'for i = 0 to n-2:',
          '  minIdx = i',
          '  for j = i+1 to n-1:',
          '    if a[j] < a[minIdx]:',
          '      minIdx = j',
          '  swap(a[i], a[minIdx])',
          '  // a[i] đã sắp xếp',
          '// Hoàn thành'
        ]
      },
      insertion: {
        name: 'Insertion Sort',
        best: 'O(n)',
        average: 'O(n²)',
        worst: 'O(n²)',
        space: 'O(1)',
        stable: true,
        description: 'Chèn từng phần tử vào đúng vị trí trong phần đã sắp xếp.',
        pseudocode: [
          'a[0] đã sắp xếp',
          'for i = 1 to n-1:',
          '  key = a[i], j = i-1',
          '  while j >= 0 and a[j] > key:',
          '    a[j+1] = a[j]  // dịch phải',
          '    j--',
          '  a[j+1] = key  // chèn',
          '  // i+1 phần tử đã sắp xếp'
        ]
      },
      bubble: {
        name: 'Bubble Sort',
        best: 'O(n)',
        average: 'O(n²)',
        worst: 'O(n²)',
        space: 'O(1)',
        stable: true,
        description: 'So sánh và hoán đổi các cặp liền kề, đẩy phần tử lớn về cuối.',
        pseudocode: [
          'for i = 0 to n-2:',
          '  swapped = false',
          '  for j = 0 to n-i-2:',
          '    if a[j] > a[j+1]:',
          '      swap(a[j], a[j+1])',
          '      swapped = true',
          '  // a[n-i-1] đã đúng vị trí',
          '  if not swapped: break'
        ]
      },
      merge: {
        name: 'Merge Sort',
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n log n)',
        space: 'O(n)',
        stable: true,
        description: 'Chia đôi mảng, sắp xếp từng nửa, rồi trộn lại.',
        pseudocode: [
          'mergeSort(a, left, right):',
          '  if left >= right: return',
          '  mid = (left+right) / 2',
          '  mergeSort(a, left, mid)',
          '  mergeSort(a, mid+1, right)',
          '  merge(a, left, mid, right)',
          '  // Trộn hai nửa đã sắp xếp',
          '  // Đặt phần tử nhỏ hơn trước',
          '  // Hoàn thành trộn'
        ]
      },
      quick: {
        name: 'Quick Sort',
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n²)',
        space: 'O(log n)',
        stable: false,
        description: 'Chọn pivot, phân hoạch xung quanh pivot, đệ quy hai bên.',
        pseudocode: [
          'quickSort(a, low, high):',
          '  pivot = a[high]',
          '  i = low - 1',
          '  for j = low to high-1:',
          '    if a[j] < pivot:',
          '      i++; swap(a[i], a[j])',
          '  swap(a[i+1], a[high])',
          '  // pivot ở đúng vị trí',
          '  // Đệ quy hai phân hoạch'
        ]
      }
    };
    return info[name];
  }

  static getAllNames() {
    return ['selection', 'insertion', 'bubble', 'merge', 'quick'];
  }
}

// Export for use
window.SortingAlgorithms = SortingAlgorithms;
