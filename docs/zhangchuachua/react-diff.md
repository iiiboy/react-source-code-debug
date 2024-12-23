# react-diff

话不多说，直接进入正题

重点文件：

1. [ReactFiberBeginWork](src/react/v17/react-reconciler/src/ReactFiberBeginWork.old.js)
2. [ReactChildFiber](src/react/v17/react-reconciler/src/ReactChildFiber.old.js)

ClassComponent 最终在 updateClassComponent(位于 ReactFiberBeginWork) 执行 render 函数，并且获取 children;

## FunctionComponent

### 获取 children

diff 算法就是用于 diff 前后两次 children 之间的差异的，那么第一步就是要获取 children；

FunctionComponent 最终在 renderWithHooks(位于 ReactFiberBeginWork) 中执行，并且获取 children;

### reconcileChildren 调和 children

获取 children 后将会进入 reconcileChildren(位于 ReactFiberBeginWork) 函数；

在该函数内，将会根据情况进入不同的函数；如果是第一次渲染，Fiber 树还没有挂载到浏览器中，那么将会执行 mountChildFibers；否则将会执行 reconcileChildFibers。

其实这两个函数都是 **ChildReconciler(位于ReactChildFiber)** 函数传入不同参数的返回值；

```js
export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
```

这里传入的 `true` 和 `false` 在 ChildReconciler 中的参数名字是 `shouldTrackSideEffects` 意思是：是否应该跟踪副作用，后续还会说到；

如果 children 是 Array，那么最终就会进入发生 diff 的 reconcileChildrenArray(位于 ReactChildFiber) 中；

> 为什么要 children 是 Array 呢？在 React 中针对与不是 Array 也就是 singleChild 的情况将在 reconcileSingleElement(位于 ReactChildFiber, 这个函数只处理 child 是 ReactElement 的情况) 中进行处理；这个函数中的策略是：不重用已有的 Fiber 直接创建新的 Fiber；

### 重点：进入 reconcileChildrenArray 开始 diff

用于测试的代码

```jsx
const FunctionDiff = () => {
  const [list, setList] = React.useState([1, "hidden", 3, 4, "hidden", 6]);

  React.useEffect(() => {
    setTimeout(() => {
      setList([1, 2, 4, 3, 5, 6]);
    }, 2000);
  }, []);

  return (
    <div>
      {list.map((item) => {
        if (item === "hidden") return false;
        if (item === 4) return <p key={item}>{item}</p>;
        return <span key={item}>{item}</span>;
      })}
    </div>
  );
};
```

直接看代码中的注释吧～

代码稍微精简了一下，不然太长了；

```flow js
 function reconcileChildrenArray(
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChildren: Array<*>,// *newChildren 此刻还不是 fiber ，是一个由 React.createElement 的返回值组成的数组
  lanes: Lanes,
): Fiber | null {
  // 因为 Fiber.child 就是指的第一个 child 所以需要使用一个变量存储 FirstChild
  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;
  // 这里的 currentFirstChild 就是指挂载在 DOM 上哪一部分老的 Fiber.child
  let oldFiber = currentFirstChild;
  let lastPlacedIndex = 0;// 这个索引指向：最后一个 复用 fiber，且复用其位置不用重新 placement 的fiber；这样说可能比较难以理解；可以详细看看 placeChild 函数，和最下面的例子的解释
  let newIdx = 0;
  let nextOldFiber = null;

  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    // !注意，oldFiber 中将会存储真实的 index, 比如 children 为: [h1, null, false, Icon, p] 其中 null, false 都无效，所以实际渲染的只有 h1, Icon, p 但是这三个的 Fiber 中将会记录真实的 index; h1.index = 0; Icon.index = 3, p.index = 4;
    // *所以如果这里的 index 对不上了，那么说明插入了新节点：[h1, null, span] -> [h1, p, span] 当第二次遍历时：此时的 oldFiber = span; oldFiber.index = 2; 但是 newIndex = 1, 也就是 p； 所以 oldFiber.index > newIdx 是插入了新节点；
    // *至于为什么 第二次遍历是 oldFiber = span；因为使用的是 oldFiber.sibling 移动指针的; null 没有生成 Fiber;
    if (oldFiber.index > newIdx) {
      nextOldFiber = oldFiber;// *因为 oldFiber.index > newIdx 所以相当于 oldFiber.index 在 newIdx 前面，所以 nextOldFiber 依然指向 oldFiber，让 index 保持不变，让 newIdx 追上；
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }
    // *
    const newFiber = updateSlot(
      returnFiber,// 父 fiber
      oldFiber,
      newChildren[newIdx],
      lanes,
    );
    // !newFiber 为空时，绝大部分情况都是 key 前后不一样 或者 newChild 本身不存在(null, false..)
    if (newFiber === null) {
      // TODO: This breaks on empty slots like null children. That's
      // unfortunate because it triggers the slow path all the time. We need
      // a better way to communicate whether this was a miss or null,
      // boolean, undefined, etc.
      if (oldFiber === null) {// *注意看上面，oldFiber.index > newIdx 时会对 oldFiber 赋值为 null 也就是说，当前的情况是中间插入了新的节点
        oldFiber = nextOldFiber;// !为什么要给 oldFiber 赋值为 nextOldFiber 呢？假设 [span, false, p2] -> [span, p1, p2] 这个时候，第一次循环时是正常的，所以 nextOldFiber = p2; 第二次循环时，因为 p2.index 与 p1.index 对不上号，所以 oldFiber 被赋值为 null; newFiber 也是 null; 但是我们不能让链表就这么断了呀， p2 及其后面的 fiber 还是有可复用的可能性的，恰巧 nextOldFiber 记录了 p2，所以赋值给 oldFiber；
      }
      break;
    }
    if (shouldTrackSideEffects) {// 更新时的 shouldTrackSideEffects 为 true
      if (oldFiber && newFiber.alternate === null) {// !如果复用了 oldFiber 那么 newFiber.alternate 应该指向 oldFiber 但是如果进入这个 if 那么说明没有复用 oldFiber；目前我已知的情况是 elementType 发生了变化，比如说 div -> p 但是 key 一致，就会出现这样的问题；那么删除现有的 child 是合理的
        // We matched the slot, but we didn't reuse the existing fiber, so we need to delete the existing child.
        // *翻译：我们匹配了 slot，但是没有复用已存在的 fiber 所以我们需要删除已存在的 child
        deleteChild(returnFiber, oldFiber);
      }
    }
    lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);// *newIdx 在循环中并未被重新赋值
    if (previousNewFiber === null) {// 这个很好理解吧
      resultingFirstChild = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;// 构建新的fiber链表
    }
    previousNewFiber = newFiber;// 通通指向下一个
    oldFiber = nextOldFiber;// 通通指向下一个
  }
  /***
   * for 循环到这里就结束了，想一想 for 循环结束时是些什么情况
   * *1. 正常结束循环
   *     1) oldFiber 为 null, newChildren 还未遍历完成: 说明在后面增加了新节点
   *     2) newChildren 遍历完成, oldFiber 不为 null: 说明删除了最后面一部分节点
   *     3) oldFiber 为 null && newChildren 遍历完成: 说明没有增加或者删除节点
   * *2. break 结束循环 也就是 newFiber 为 null
   *     1) oldFiber 不为 null: 这一块需要具体分析 updateSlot 中的代码，注意并未分析 React.lazy
   *         1: key 不一样 直接返回 null，也就是节点 key 发生变化
   *         2: newChild 本身不存在(null, false, undefined...)
   *         3: 其他罕见情况（不确定有没有这种情况）
   *     2) oldFiber 为 null：在 oldFiber 之前插入了新节点
   *
   * 在👇就是处理这些情况
   */

  // *对标 1.2) | 1.3) 情况
  if (newIdx === newChildren.length) {
    // We've reached the end of the new children. We can delete the rest.
    deleteRemainingChildren(returnFiber, oldFiber);// *newChildren 遍历完了，删除多余的 oldFiber
    return resultingFirstChild;
  }

  // *对标 1.1) 情况
  if (oldFiber === null) {
    // If we don't have any more existing children we can choose a fast path
    // since the rest will all be insertions.
    for (; newIdx < newChildren.length; newIdx++) {// *循环新增的节点，创建 fiber
      const newFiber = createChild(returnFiber, newChildren[newIdx], lanes);
      if (newFiber === null) {
        continue;
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }

  // 👇 对标所有情况

  // Add all children to a key map for quick lookups.
  // *将 oldFiber 及其后续 (oldFiber.sibling...) 全部存放到 map 中去，以大致结构为 Mao<fiber.key, fiber> 如果 oldFiber 为 null 就为空 map
  const existingChildren = mapRemainingChildren(returnFiber, oldFiber);

  // Keep scanning and use the map to restore deleted items as moves.
  for (; newIdx < newChildren.length; newIdx++) {
    // *与 updateSlot 类似，但是 oldFiber 来自于 map 中；(注意：如果 newChild.key 不存在，那么将使用 newChild.index 作为 newIdx 进行查询，所以这里传入了 newIdx)
    const newFiber = updateFromMap(
      existingChildren,
      returnFiber,
      newIdx,
      newChildren[newIdx],
      lanes,
    );
    // *只有 newChild 本身不存在，或者罕见情况下会返回 null
    if (newFiber !== null) {
      if (shouldTrackSideEffects) {
        if (newFiber.alternate !== null) {
          existingChildren.delete(
            newFiber.key === null ? newIdx : newFiber.key,
          );
        }
      }
      // *放置 child
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
  }

  if (shouldTrackSideEffects) {
    // Any existing children that weren't consumed above were deleted. We need
    // to add them to the deletion list.
    // *删除剩余的 oldFiber
    existingChildren.forEach(child => deleteChild(returnFiber, child));
  }

  return resultingFirstChild;
}

// *比较 oldFiber 与 newChild(还不是 fiber)
// *可以大致理解为，比较 oldFiber 与 newChild 的 key，如果 key 相同，那么一定会返回一个 fiber；如果不同就会返回 null；如果遇到不能判断的类型，也会返回 null
function updateSlot(
  returnFiber: Fiber,
  oldFiber: Fiber | null,
  newChild: any,
  lanes: Lanes,
): Fiber | null {
  // Update the fiber if the keys match, otherwise return null.
  // 翻译：如果 key 匹配，那么就更新对应的 Fiber，否则就返回 null

  const key = oldFiber !== null ? oldFiber.key : null;

  if (typeof newChild === 'string' || typeof newChild === 'number') {// 如果 child 是 string 或者 number
    if (key !== null) {// 文本节点是没有 key 的，但是 oldFiber.key 有值就说明更新前后是不匹配的，一律看作其他操作（比如添加，删除操作）不应该进行更新
      return null;
    }
    return updateTextNode(returnFiber, oldFiber, '' + newChild, lanes);
  }

  if (typeof newChild === 'object' && newChild !== null) {
    switch (newChild.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        if (newChild.key === key) {
          if (newChild.type === REACT_FRAGMENT_TYPE) return updateFragment(...);
          return updateElement(returnFiber, oldFiber, newChild, lanes);// *如果 oldFiber 不存在，那么就直接创建新 fiber，如果 newChild 的 type 没有变化，那么就复用 oldFiber 的部分内容
        } else return null;
      }
      case REACT_PORTAL_TYPE: {
        if (newChild.key === key) {
          return updatePortal(returnFiber, oldFiber, newChild, lanes);
        } else return null;
      }
      case REACT_LAZY_TYPE: { ...
      }

        // *如果是一个 数组 大概这个意思 [h1, [p, p, p], div] 中的 [p, p, p]
        if (isArray(newChild) || getIteratorFn(newChild)) {
          if (key !== null) {// *同理，数组应该也没有 key，如果 oldFiber 有 key，那么说明前后不匹配不应该进行更新
            return null;
          }
          // *否则就使用 Fragment 相当于 React 帮我们加了一个 Fragment
          return updateFragment(returnFiber, oldFiber, newChild, lanes, null);
        }
    }

    // *如果上面的都不匹配的话，那么就返回 null
    return null;
  }

  /**
   * @desc 如果 current 不存在，那么就直接创建新 Fiber；如果 current 存在且 type 一致，那么就直接复用 fiber 部分内容
   * */
  function updateElement(
    returnFiber: Fiber,
    current: Fiber | null,
    element: ReactElement,
    lanes: Lanes,
  ): Fiber {
    if (current !== null) {
      if (current.elementType === element.type) {
        const existing =
      ...
        ;// 复用 fiber
        return existing;
      }
    }
    // Insert  当 elementType 不一样时将会进入这里
    const created =
  ...
    ;// 重新创建 fiber
    return created;
  }

  function mapRemainingChildren(
    returnFiber: Fiber,
    currentFirstChild: Fiber,
  ): Map<string | number, Fiber> {
    const existingChildren: Map<string | number, Fiber> = new Map();

    let existingChild = currentFirstChild;
    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
  }

  function updateFromMap(
    existingChildren: Map<string | number, Fiber>,
    returnFiber: Fiber,
    newIdx: number,
    newChild: any,
    lanes: Lanes,
  ): Fiber | null {
    if (typeof newChild === 'string' || typeof newChild === 'number') {
      const matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, '' + newChild, lanes);
    }

    if (typeof newChild === 'object' && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber =
            existingChildren.get(newChild.key === null ? newIdx : newChild.key) || null;
          if (newChild.type === REACT_FRAGMENT_TYPE) return updateFragment(...);
          return updateElement(returnFiber, matchedFiber, newChild, lanes);
        }
        case REACT_PORTAL_TYPE: {
          const matchedFiber =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key,
            ) || null;
          return updatePortal(returnFiber, matchedFiber, newChild, lanes);
        }
        case REACT_LAZY_TYPE:
          if (enableLazyElements) {...
          }
      }

      if (isArray(newChild) || getIteratorFn(newChild)) {
        const matchedFiber = existingChildren.get(newIdx) || null;
        return updateFragment(returnFiber, matchedFiber, newChild, lanes, null);
      }
    }

    return null;
  }

```

[span1] -> [span1, span2]：正常结束没啥说的，循环结束后，又接着循环 [span2]，为新增的节点创建 Fiber 并且打上标记

[span1, span2] -> [span1]：也是正常结束，循环接受后，删除 oldFiber 多余的部分就是了

[span1, span2] -> [span2, span1]：key不相同，第一次循环时就会 break；然后就开始生成 map 了：map{'1'->span1, '2'->span2}; 然后开始循环；第一次循环：span2 将会获取 oldSpan2Fiber 所以将会复用 oldSpan2Fiber （即使map中没有对应的，也就是获取到的为 null 那么也会为其创建新的 fiber，只是不复用了而已）；第二次循环，复用 oldSpan1Fiber ；

[span1, span2] -> [span1, span3, span2]：第一次循环，span1 没有发生变化，一切正常；第二次循环，span3 与 span2 因为 key 值不相同，所以直接break，然后创建 map；然后循环 [span3, span2] 。。。

[span1, span2] -> [span1, p2, span3]: 第一次循环，一切正常；第二次循环，因为 key 相等，所以直接 updateElement，但是因为两者的 elementType 不同，所以为 p2 创建新的 fiber；然后因为 oldFiber 存在，但是 p2Fiber.alternate 为 null 所以将直接删除 span2Fiber. 第三次循环，因为 oldFiber 为 null 了，所以进入下面的循环开始循环 [span3] 并为其创建新的 fiber；

[span1, span2, span3] -> [span1, span3]: 第一次循环，一切正常，第二次循环，span3 与 span2 key 不一样，所以直接 break；然后创建 map，循环[span3], 从 map 中复用 oldFiber，然后删除多余的 fiber 也就是 span2;

[{index: 1, key: 1}, {index: 2, key: 2}] -> [{index: 2, key: 1}, {index: 1, key: 2}] 标签都为 p：第一次循环，因为 key 相同，标签相同，直接复用；但是在后面的 placeChild 函数中，oldIdx = 1, newIdx = 2；说明还是发生了移动，那么就要给这个 fiber 打上 Placement 标记；因为还不是太懂 flag 和 Placement 所以暂时不去调查 lastPlacedIndex 的具体作用；第二次循环，因为 key 相同，标签相同，直接进入 placeChild 这次的 oldIdx = 2, newIdx = 1, 所以直接返回 oldIdx；

### TODO

1. 将注释分离出来，代码切片进行讲解
2. 示例做成图例
