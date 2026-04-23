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
        loopContext: {
          algorithm: 'selection',
          outerIndex: i,
          innerIndex: null,
          minIdx: i,
          minValue: a[i],
          scanRange: [i, n - 1],
          sortedCount: i,
          phase: 'start-scan'
        },
        description: `Bắt đầu tìm phần tử ${order === 'asc' ? 'nhỏ nhất' : 'lớn nhất'} từ vị trí ${i}`,
        line: 0
      });

      for (let j = i + 1; j < n; j++) {
        comparisons++;
        const cond = order === 'asc' ? a[j] < a[minIdx] : a[j] > a[minIdx];
        const cmpResult = a[j] > a[minIdx] ? 'greater' : (a[j] < a[minIdx] ? 'less' : 'equal');
        steps.push({
          type: 'compare',
          indices: [minIdx, j],
          comparedValues: [a[minIdx], a[j]],
          comparisonResult: cmpResult,
          willSwap: cond,
          comparisonDetail: {
            leftLabel: `a[${minIdx}]`,
            rightLabel: `a[${j}]`,
            leftValue: a[minIdx],
            rightValue: a[j],
            operator: cmpResult === 'greater' ? '>' : (cmpResult === 'less' ? '<' : '='),
            action: cond
              ? `${a[j]} ${order === 'asc' ? '<' : '>'} ${a[minIdx]} → Cập nhật ${order === 'asc' ? 'min' : 'max'}!`
              : `${a[j]} ${order === 'asc' ? '≥' : '≤'} ${a[minIdx]} → Giữ nguyên ✓`
          },
          loopContext: {
            algorithm: 'selection',
            outerIndex: i,
            innerIndex: j,
            minIdx: minIdx,
            minValue: a[minIdx],
            scanRange: [i, n - 1],
            sortedCount: i,
            phase: 'comparing'
          },
          description: `So sánh a[${minIdx}]=${a[minIdx]} với a[${j}]=${a[j]} → ${cond ? 'Cập nhật ' + (order === 'asc' ? 'min' : 'max') + '!' : 'Giữ nguyên ✓'}`,
          line: 2
        });

        if (cond) {
          minIdx = j;
          steps.push({
            type: 'min-update',
            indices: [minIdx],
            oldMinIdx: minIdx === j ? i : -1,
            loopContext: {
              algorithm: 'selection',
              outerIndex: i,
              innerIndex: j,
              minIdx: minIdx,
              minValue: a[minIdx],
              scanRange: [i, n - 1],
              sortedCount: i,
              phase: 'min-updated'
            },
            description: `Cập nhật ${order === 'asc' ? 'min' : 'max'} mới: a[${minIdx}]=${a[minIdx]} (vị trí ${minIdx})`,
            line: 3
          });
        }
      }

      if (minIdx !== i) {
        steps.push({
          type: 'swap',
          indices: [i, minIdx],
          loopContext: {
            algorithm: 'selection',
            outerIndex: i,
            innerIndex: null,
            minIdx: minIdx,
            minValue: a[minIdx],
            scanRange: [i, n - 1],
            sortedCount: i,
            phase: 'swapping'
          },
          description: `Hoán đổi a[${i}]=${a[i]} ↔ a[${minIdx}]=${a[minIdx]}`,
          line: 5
        });
        [a[i], a[minIdx]] = [a[minIdx], a[i]];
        swaps++;
      } else {
        steps.push({
          type: 'info',
          indices: [i],
          loopContext: {
            algorithm: 'selection',
            outerIndex: i,
            innerIndex: null,
            minIdx: i,
            minValue: a[i],
            scanRange: [i, n - 1],
            sortedCount: i,
            phase: 'no-swap-needed'
          },
          description: `Phần tử ${order === 'asc' ? 'nhỏ nhất' : 'lớn nhất'} đã đúng vị trí ${i}, không cần hoán đổi ✓`,
          line: 5
        });
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
        loopContext: {
          algorithm: 'insertion',
          outerIndex: i,
          innerIndex: i - 1,
          key: key,
          keyIndex: i,
          sortedCount: i,
          phase: 'pick-key'
        },
        description: `Chèn phần tử a[${i}]=${key} vào vị trí đúng`,
        line: 1
      });

      while (j >= 0) {
        comparisons++;
        const cond = order === 'asc' ? a[j] > key : a[j] < key;
        const cmpResult = a[j] > key ? 'greater' : (a[j] < key ? 'less' : 'equal');

        steps.push({
          type: 'compare',
          indices: [j, i],
          comparedValues: [a[j], key],
          comparisonResult: cmpResult,
          willSwap: cond,
          comparisonDetail: {
            leftLabel: `a[${j}]`,
            rightLabel: `key`,
            leftValue: a[j],
            rightValue: key,
            operator: cmpResult === 'greater' ? '>' : (cmpResult === 'less' ? '<' : '='),
            action: cond
              ? `${a[j]} ${order === 'asc' ? '>' : '<'} ${key} → Dịch phải!`
              : `${a[j]} ${order === 'asc' ? '≤' : '≥'} ${key} → Giữ nguyên ✓`
          },
          loopContext: {
            algorithm: 'insertion',
            outerIndex: i,
            innerIndex: j,
            key: key,
            keyIndex: i,
            sortedCount: i,
            phase: 'comparing'
          },
          description: `So sánh a[${j}]=${a[j]} với key=${key} → ${cond ? 'Dịch phải!' : 'Giữ nguyên ✓'}`,
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
        loopContext: {
          algorithm: 'bubble',
          outerIndex: i,
          pass: i + 1,
          innerIndex: null,
          boundary: n - i - 1,
          sortedCount: i,
          phase: 'start-pass'
        },
        description: `Lượt duyệt thứ ${i + 1}`,
        line: 0
      });

      for (let j = 0; j < n - i - 1; j++) {
        comparisons++;
        const cond = order === 'asc' ? a[j] > a[j + 1] : a[j] < a[j + 1];
        const cmpResult = a[j] > a[j + 1] ? 'greater' : (a[j] < a[j + 1] ? 'less' : 'equal');
        steps.push({
          type: 'compare',
          indices: [j, j + 1],
          comparedValues: [a[j], a[j + 1]],
          comparisonResult: cmpResult,
          willSwap: cond,
          comparisonDetail: {
            leftLabel: `a[${j}]`,
            rightLabel: `a[${j + 1}]`,
            leftValue: a[j],
            rightValue: a[j + 1],
            operator: cmpResult === 'greater' ? '>' : (cmpResult === 'less' ? '<' : '='),
            action: cond
              ? `${a[j]} ${order === 'asc' ? '>' : '<'} ${a[j + 1]} → Hoán đổi!`
              : `${a[j]} ${order === 'asc' ? '≤' : '≥'} ${a[j + 1]} → Giữ nguyên ✓`
          },
          loopContext: {
            algorithm: 'bubble',
            outerIndex: i,
            pass: i + 1,
            innerIndex: j,
            boundary: n - i - 1,
            sortedCount: i,
            phase: 'comparing'
          },
          description: `So sánh a[${j}]=${a[j]} với a[${j + 1}]=${a[j + 1]} → ${cond ? 'Hoán đổi!' : 'Giữ nguyên ✓'}`,
          line: 2
        });

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
        } else {
          steps.push({
            type: 'no-swap',
            indices: [j, j + 1],
            description: `a[${j}]=${a[j]} ${order === 'asc' ? '≤' : '≥'} a[${j + 1}]=${a[j + 1]} → Giữ nguyên vị trí ✓`,
            line: 2
          });
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

    function merge(a, left, mid, right, depth) {
      const leftArr = a.slice(left, mid + 1);
      const rightArr = a.slice(mid + 1, right + 1);
      let i = 0, j = 0, k = left;

      steps.push({
        type: 'merge-start',
        indices: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
        range: [left, right],
        midPoint: mid,
        depth,
        description: `⤵ CONQUER (depth=${depth}): Trộn nửa trái [${left}..${mid}] với nửa phải [${mid + 1}..${right}]`,
        line: 5
      });

      while (i < leftArr.length && j < rightArr.length) {
        comparisons++;
        const lVal = leftArr[i], rVal = rightArr[j];
        const cond = order === 'asc' ? lVal <= rVal : lVal >= rVal;
        const cmpResult = lVal > rVal ? 'greater' : (lVal < rVal ? 'less' : 'equal');
        steps.push({
          type: 'compare',
          indices: [left + i, mid + 1 + j],
          range: [left, right],
          depth,
          comparedValues: [lVal, rVal],
          comparisonResult: cmpResult,
          willSwap: !cond,
          comparisonDetail: {
            leftLabel: `trái[${i}]`,
            rightLabel: `phải[${j}]`,
            leftValue: lVal,
            rightValue: rVal,
            operator: cmpResult === 'greater' ? '>' : (cmpResult === 'less' ? '<' : '='),
            action: cond
              ? `${lVal} ${order === 'asc' ? '≤' : '≥'} ${rVal} → Lấy từ nửa trái`
              : `${lVal} ${order === 'asc' ? '>' : '<'} ${rVal} → Lấy từ nửa phải`
          },
          description: `So sánh trái[${i}]=${lVal} với phải[${j}]=${rVal} → ${cond ? 'Lấy từ nửa trái' : 'Lấy từ nửa phải'}`,
          line: 6
        });

        // cond already computed above
        if (cond) {
          a[k] = leftArr[i];
          steps.push({
            type: 'merge',
            indices: [k],
            values: [...a],
            range: [left, right],
            depth,
            description: `Đặt ${leftArr[i]} (từ nửa trái) vào vị trí ${k}`,
            line: 7
          });
          i++;
        } else {
          a[k] = rightArr[j];
          steps.push({
            type: 'merge',
            indices: [k],
            values: [...a],
            range: [left, right],
            depth,
            description: `Đặt ${rightArr[j]} (từ nửa phải) vào vị trí ${k}`,
            line: 7
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
          range: [left, right],
          depth,
          description: `Đặt phần tử còn lại ${leftArr[i]} (nửa trái) vào vị trí ${k}`,
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
          range: [left, right],
          depth,
          description: `Đặt phần tử còn lại ${rightArr[j]} (nửa phải) vào vị trí ${k}`,
          line: 7
        });
        swaps++;
        j++;
        k++;
      }

      steps.push({
        type: 'merge-done',
        indices: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
        range: [left, right],
        depth,
        description: `✓ Đã trộn xong [${left}..${right}] → [${a.slice(left, right + 1).join(', ')}]`,
        line: 8
      });
    }

    function mergeSortRec(a, left, right, depth) {
      if (left >= right) {
        if (left === right) {
          steps.push({
            type: 'base-case',
            indices: [left],
            range: [left, right],
            depth,
            description: `■ BASE CASE (depth=${depth}): Phần tử đơn a[${left}]=${a[left]}, không cần chia thêm`,
            line: 1
          });
        }
        return;
      }

      const mid = Math.floor((left + right) / 2);

      steps.push({
        type: 'divide',
        indices: Array.from({ length: right - left + 1 }, (_, idx) => left + idx),
        range: [left, right],
        midPoint: mid,
        depth,
        description: `✂ DIVIDE (depth=${depth}): Chia [${left}..${right}] thành [${left}..${mid}] và [${mid + 1}..${right}]`,
        line: 2
      });

      steps.push({
        type: 'recurse-left',
        indices: Array.from({ length: mid - left + 1 }, (_, idx) => left + idx),
        range: [left, mid],
        depth: depth + 1,
        description: `↙ Đệ quy nửa TRÁI [${left}..${mid}] (${mid - left + 1} phần tử)`,
        line: 3
      });

      mergeSortRec(a, left, mid, depth + 1);

      steps.push({
        type: 'recurse-right',
        indices: Array.from({ length: right - mid }, (_, idx) => mid + 1 + idx),
        range: [mid + 1, right],
        depth: depth + 1,
        description: `↘ Đệ quy nửa PHẢI [${mid + 1}..${right}] (${right - mid} phần tử)`,
        line: 4
      });

      mergeSortRec(a, mid + 1, right, depth + 1);
      merge(a, left, mid, right, depth);

      // Mark as sorted if full range
      if (left === 0 && right === n - 1) {
        steps.push({
          type: 'sorted',
          indices: Array.from({ length: n }, (_, i) => i),
          range: [0, n - 1],
          depth: 0,
          description: 'Toàn bộ mảng đã được sắp xếp!',
          line: 8
        });
      }
    }

    mergeSortRec(a, 0, n - 1, 0);
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

    function partition(a, low, high, depth) {
      const pivot = a[high];
      steps.push({
        type: 'pivot',
        indices: [high],
        range: [low, high],
        depth,
        description: `PIVOT (depth=${depth}): Chọn pivot = a[${high}] = ${pivot} trong [${low}..${high}]`,
        line: 1
      });

      let i = low - 1;

      for (let j = low; j < high; j++) {
        comparisons++;
        const cond = order === 'asc' ? a[j] < pivot : a[j] > pivot;
        const cmpResult = a[j] > pivot ? 'greater' : (a[j] < pivot ? 'less' : 'equal');
        steps.push({
          type: 'compare',
          indices: [j, high],
          range: [low, high],
          depth,
          comparedValues: [a[j], pivot],
          comparisonResult: cmpResult,
          willSwap: cond,
          comparisonDetail: {
            leftLabel: `a[${j}]`,
            rightLabel: `pivot`,
            leftValue: a[j],
            rightValue: pivot,
            operator: cmpResult === 'greater' ? '>' : (cmpResult === 'less' ? '<' : '='),
            action: cond
              ? `${a[j]} ${order === 'asc' ? '<' : '>'} ${pivot} → Đưa về bên ${order === 'asc' ? 'trái' : 'phải'}!`
              : `${a[j]} ${order === 'asc' ? '≥' : '≤'} ${pivot} → Giữ nguyên ✓`
          },
          description: `So sánh a[${j}]=${a[j]} với pivot=${pivot} → ${cond ? 'Đưa về bên ' + (order === 'asc' ? 'trái' : 'phải') + '!' : 'Giữ nguyên ✓'}`,
          line: 3
        });

        // cond already computed above
        if (cond) {
          i++;
          if (i !== j) {
            steps.push({
              type: 'swap',
              indices: [i, j],
              range: [low, high],
              depth,
              description: `Hoán đổi a[${i}]=${a[i]} ↔ a[${j}]=${a[j]} (đưa về bên ${order === 'asc' ? 'trái' : 'phải'} pivot)`,
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
          range: [low, high],
          depth,
          description: `Đặt pivot vào đúng vị trí: hoán đổi a[${i + 1}]=${a[i + 1]} ↔ pivot=${a[high]}`,
          line: 5
        });
        [a[i + 1], a[high]] = [a[high], a[i + 1]];
        swaps++;
      }

      steps.push({
        type: 'partition-done',
        indices: [i + 1],
        range: [low, high],
        pivotIndex: i + 1,
        depth,
        leftPart: i + 1 > low ? `[${low}..${i}]` : '(rỗng)',
        rightPart: i + 1 < high ? `[${i + 2}..${high}]` : '(rỗng)',
        description: `✓ PARTITION DONE: pivot=${a[i + 1]} ở vị trí ${i + 1} | Trái: ${i + 1 > low ? `[${low}..${i}]` : '∅'} | Phải: ${i + 1 < high ? `[${i + 2}..${high}]` : '∅'}`,
        line: 6
      });

      return i + 1;
    }

    function quickSortRec(a, low, high, depth) {
      if (low < high) {
        steps.push({
          type: 'divide',
          indices: Array.from({ length: high - low + 1 }, (_, idx) => low + idx),
          range: [low, high],
          depth,
          description: `✂ DIVIDE (depth=${depth}): Phân hoạch mảng con [${low}..${high}] (${high - low + 1} phần tử)`,
          line: 0
        });

        const pi = partition(a, low, high, depth);

        // Mark pivot as sorted
        steps.push({
          type: 'sorted',
          indices: [pi],
          range: [low, high],
          depth,
          description: `✓ Pivot ${a[pi]} cố định tại vị trí ${pi}`,
          line: 7
        });

        if (pi - 1 > low) {
          steps.push({
            type: 'recurse-left',
            indices: Array.from({ length: pi - low }, (_, idx) => low + idx),
            range: [low, pi - 1],
            depth: depth + 1,
            description: `↙ Đệ quy nửa TRÁI [${low}..${pi - 1}] (${pi - low} phần tử, depth=${depth + 1})`,
            line: 8
          });
        }

        quickSortRec(a, low, pi - 1, depth + 1);

        if (pi + 1 < high) {
          steps.push({
            type: 'recurse-right',
            indices: Array.from({ length: high - pi }, (_, idx) => pi + 1 + idx),
            range: [pi + 1, high],
            depth: depth + 1,
            description: `↘ Đệ quy nửa PHẢI [${pi + 1}..${high}] (${high - pi} phần tử, depth=${depth + 1})`,
            line: 8
          });
        }

        quickSortRec(a, pi + 1, high, depth + 1);
      } else if (low === high) {
        steps.push({
          type: 'base-case',
          indices: [low],
          range: [low, high],
          depth,
          description: `■ BASE CASE (depth=${depth}): Phần tử đơn a[${low}]=${a[low]}, đã đúng vị trí`,
          line: 7
        });
      }
    }

    quickSortRec(a, 0, n - 1, 0);
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
        description: 'Tìm phần tử nhỏ nhất và đưa về đầu danh sách.',
        features: 'Đơn giản, Ít hoán đổi nhất, Chậm, Tại chỗ (In-place).',
        pseudocode: [
          'for i = 0 to n-1:',
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
        description: 'Lấy từng phần tử chèn vào đúng vị trí trong mảng con đã sắp xếp bên trái.',
        features: 'Rất nhanh với mảng nhỏ/gần sắp xếp, Online algorithm, Tại chỗ (In-place).',
        pseudocode: [
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
        description: 'Đổi chỗ các cặp phần tử liền kề nếu chúng sai thứ tự, "nổi bong bóng" giá trị lớn về cuối.',
        features: 'Chậm nhất, Dễ hiểu, Phát hiện mảng đã sắp xếp (Adaptive), Tại chỗ.',
        pseudocode: [
          'for i = 0 to n-1:',
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
        description: 'Chia đôi mảng liên tục (Divide) rồi trộn lại (Conquer) theo thứ tự.',
        features: 'Sắp xếp trộn (Divide & Conquer), Nhanh, Không tại chỗ (Out-of-place).',
        pseudocode: [
          'mergeSort(a, left, right):',
          '  if left >= right: return  // base case',
          '  mid = (left+right) / 2   // ✂ DIVIDE',
          '  mergeSort(a, left, mid)   // ↙ nửa trái',
          '  mergeSort(a, mid+1, right)// ↘ nửa phải',
          '  merge(a, left, mid, right)// ⤵ CONQUER',
          '  // So sánh từng cặp phần tử',
          '  // Đặt phần tử nhỏ hơn trước',
          '  // ✓ Đã trộn xong'
        ]
      },
      quick: {
        name: 'Quick Sort',
        best: 'O(n log n)',
        average: 'O(n log n)',
        worst: 'O(n²)',
        space: 'O(log n)',
        stable: false,
        description: 'Chọn pivot, phân hoạch xung quanh pivot, đệ quy hai bên (Divide & Conquer).',
        features: 'Nhanh nhất thực tế, Tại chỗ (In-place), Phụ thuộc vào việc chọn Pivot.',
        pseudocode: [
          'quickSort(a, low, high): // ✂ DIVIDE',
          '  pivot = a[high]         // chọn pivot',
          '  i = low - 1',
          '  for j = low to high-1:  // quét & so sánh',
          '    if a[j] < pivot:',
          '      i++; swap(a[i],a[j])// đưa về trái',
          '  swap(a[i+1], a[high])  // ✓ partition done',
          '  // pivot ở đúng vị trí',
          '  // ↙↘ Đệ quy trái + phải'
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
