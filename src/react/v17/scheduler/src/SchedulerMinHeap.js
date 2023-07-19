/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 */

// !Schedule 使用最小堆来作为 TaskQueue, 然后使用过期时间作为排序的属性，所以堆定就是过期时间最小的 task，也就是最紧急的任务
type Heap = Array<Node>;
type Node = {|
  id: number,
    sortIndex: number,
|};

export function push(heap: Heap, node: Node): void {
  const index = heap.length;
  heap.push(node);
  siftUp(heap, node, index);
}

// *获取 堆 的第一个元素，如果元素不存在的话，就返回 null
export function peek(heap: Heap): Node | null {
  const first = heap[0];
  return first === undefined ? null : first;
}

export function pop(heap: Heap): Node | null {
  const first = heap[0];
  if (first !== undefined) {
    const last = heap.pop();
    if (last !== first) {
      heap[0] = last;
      siftDown(heap, last, 0);
    }
    return first;
  } else {
    return null;
  }
}

// *堆的向上移操作；插入一个新值时，把这个值放在堆的末尾，然后不断与其父节点比较，进行上移操作，最终移动到准确的位置
function siftUp(heap, node, i) {
  let index = i;
  while (true) {
    // *>>> 无符号右移，对于正整数可以看作 Math.floor(index / 2);
    const parentIndex = (index - 1) >>> 1;
    // 这是二叉树的性质，父节点的 index 就是等于子节点的 Math.floor(index / 2);
    const parent = heap[parentIndex];
    if (parent !== undefined && compare(parent, node) > 0) {
      // The parent is larger. Swap positions.
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      // The parent is smaller. Exit.
      return;
    }
  }
}

// *向下移的操作：当堆顶被弹出时，会将堆顶重新赋值为堆底, 然后不断的执行下沉操作，这个过程中会重新排序整个堆；
// *使用堆底来替换堆顶是复杂度最低的解法
function siftDown(heap, node, i) {
  let index = i;
  const length = heap.length;
  while (index < length) {
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];

    // If the left or right node is smaller, swap with the smaller of those.
    if (left !== undefined && compare(left, node) < 0) {
      if (right !== undefined && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (right !== undefined && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      // Neither child is smaller. Exit.
      return;
    }
  }
}

function compare(a, b) {
  // Compare sort index first, then task id.
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}
