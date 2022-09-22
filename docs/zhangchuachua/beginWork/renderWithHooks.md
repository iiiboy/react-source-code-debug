## [renderWithHooks](../../../src/react/v17/react-reconciler/src/ReactFiberHooks.old.js)

函数组件一定会执行该函数，对理解 Hooks 非常重要

```flow js
export function renderWithHooks<Props, SecondArg>(
  current: Fiber | null,
  workInProgress: Fiber,
  Component: (p: Props, arg: SecondArg) => any,
  props: Props,
  secondArg: SecondArg,
  nextRenderLanes: Lanes
): any {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;

  if (__DEV__) {
    hookTypesDev =
      current !== null
        ? ((current._debugHookTypes: any): Array<HookType>)
        : null;
    hookTypesUpdateIndexDev = -1;
    // Used for hot reloading:
    ignorePreviousDependencies =
      current !== null && current.type !== workInProgress.type;
  }

  // *重置对应的属性
  // TODO 掘金小册中说对于 ClassCompoennt memoizedState 用于存储 state 信息，对于 FC 用于存储 hooks 信息
  workInProgress.memoizedState = null;
  // TODO 小册中说 updateQueue 对于 FC 存放每个 useEffect/useLayoutEffect 产生的副作用组成的链表。在 commit 阶段更新这些副作用。
  workInProgress.updateQueue = null;
  workInProgress.lanes = NoLanes;

  // The following should have already been reset
  // currentHook = null;
  // workInProgressHook = null;

  // didScheduleRenderPhaseUpdate = false;

  // TODO Warn if no hooks are used at all during mount, then some are used during update.
  // Currently we will identify the update render as a mount because memoizedState === null.
  // This is tricky because it's valid for certain types of components (e.g. React.lazy)

  // Using memoizedState to differentiate between mount/update only works if at least one stateful hook is used.
  // Non-stateful hooks (e.g. context) don't get added to memoizedState,
  // so memoizedState would be null during updates and mounts.
  if (__DEV__) {
    if (current !== null && current.memoizedState !== null) {
      ReactCurrentDispatcher.current = HooksDispatcherOnUpdateInDEV;
    } else if (hookTypesDev !== null) {
      // This dispatcher handles an edge case where a component is updating,
      // but no stateful hooks have been used.
      // We want to match the production code behavior (which will use HooksDispatcherOnMount),
      // but with the extra DEV validation to ensure hooks ordering hasn't changed.
      // This dispatcher does that.
      ReactCurrentDispatcher.current = HooksDispatcherOnMountWithHookTypesInDEV;
    } else {
      ReactCurrentDispatcher.current = HooksDispatcherOnMountInDEV;
    }
  } else {
    // !针对于不同的时期(mount, update)执行的逻辑可能不一样, 所以 react 在这里判断当前是什么时期, 然后对 ReactCurrentDispatcher.current 进行赋值当前时期应当使用的 hooks 到时候直接调用 current 里面的 hooks 就可以了。
    // *具体什么什么时期调用什么 hooks 看下面的 ## hooks
    ReactCurrentDispatcher.current =
      current === null || current.memoizedState === null
        ? HooksDispatcherOnMount
        : HooksDispatcherOnUpdate;
  }

  // *在这里执行函数，同时也执行了 hooks 然后获取返回值
  // *有一个问题，hooks 都是从 react 中引入的，那么怎么还不同时期调用不同的 hooks 呢？ 具体看下面的 ## 执行 hooks
  let children = Component(props, secondArg);

  // *检查是否有渲染阶段更新，这个涉及到 调度与调和 暂时跳过
  // Check if there was a render phase update
  if (didScheduleRenderPhaseUpdateDuringThisPass) {
    // Keep rendering in a loop for as long as render phase updates continue to
    // be scheduled. Use a counter to prevent infinite loops.
    let numberOfReRenders: number = 0;
    do {
      didScheduleRenderPhaseUpdateDuringThisPass = false;
      invariant(
        numberOfReRenders < RE_RENDER_LIMIT,
        'Too many re-renders. React limits the number of renders to prevent ' +
          'an infinite loop.',
      );

      numberOfReRenders += 1;
      if (__DEV__) {
        // Even when hot reloading, allow dependencies to stabilize
        // after first render to prevent infinite render phase updates.
        ignorePreviousDependencies = false;
      }

      // Start over from the beginning of the list
      currentHook = null;
      workInProgressHook = null;

      workInProgress.updateQueue = null;

      if (__DEV__) {
        // Also validate hook order for cascading updates.
        hookTypesUpdateIndexDev = -1;
      }

      ReactCurrentDispatcher.current = __DEV__
        ? HooksDispatcherOnRerenderInDEV
        : HooksDispatcherOnRerender;

      children = Component(props, secondArg);
    } while (didScheduleRenderPhaseUpdateDuringThisPass);
  }

  // *执行函数组件完成，又赋值为报错的 hooks
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;

  if (__DEV__) {
    workInProgress._debugHookTypes = hookTypesDev;
  }

  // This check uses currentHook so that it works the same in DEV and prod bundles.
  // hookTypesDev could catch more cases (e.g. context) but only in DEV bundles.
  const didRenderTooFewHooks =
    currentHook !== null && currentHook.next !== null;

  renderLanes = NoLanes;
  currentlyRenderingFiber = (null: any);

  // *将 currentHook wipHook 重置为 null 这两个变量在 挂载 或 更新 hooks 都会用到
  currentHook = null;
  workInProgressHook = null;

  if (__DEV__) {
    currentHookNameInDev = null;
    hookTypesDev = null;
    hookTypesUpdateIndexDev = -1;
  }

  didScheduleRenderPhaseUpdate = false;

  invariant(
    !didRenderTooFewHooks,
    'Rendered fewer hooks than expected. This may be caused by an accidental ' +
      'early return statement.',
  );

  return children;
}

```

## hooks

具体的 `mountState, updateState` 详见: `src/react/v17/react-reconciler/src/ReactFiberHooks.old.js`

```flow js
// *当hooks不是函数内部调用的时候，调用这个hooks对象下的hooks，所以报错
export const ContextOnlyDispatcher: Dispatcher = {
  readContext,
  ...,
  useState: throwInvalidHookError,// *所以全是 throw
  ...,
  useOpaqueIdentifier: throwInvalidHookError,
  unstable_isNewReconciler: enableNewReconciler,
};
// *挂载时用的 hooks
const HooksDispatcherOnMount: Dispatcher = {
  readContext,
  ...,
  useState: mountState,
  ...,
  useOpaqueIdentifier: mountOpaqueIdentifier,
  unstable_isNewReconciler: enableNewReconciler,
};
// *更新时用的 hooks
const HooksDispatcherOnUpdate: Dispatcher = {
  readContext,
  useState: updateState,
  ...,
  useOpaqueIdentifier: updateOpaqueIdentifier,
  unstable_isNewReconciler: enableNewReconciler,
};
// TODO 暂时还不清楚什么时候调用这个里面的 hooks
const HooksDispatcherOnRerender: Dispatcher = {
  readContext,
  useCallback: updateCallback,
  ...,
  useState: rerenderState,
  unstable_isNewReconciler: enableNewReconciler,
};
```

## 执行 hooks

```flow js
// *这就是 react 中导出的 hooks
function useState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // !这里是重点
  const dispatcher = resolveDispatcher();
  // *使用当前时期应该使用的 hooks
  return dispatcher.useState(initialState);
}

// *这里
function resolveDispatcher() {
  // *答案就是在这里，会通过 ReactCurrentDispatcher.current 这个全局属性进行获取.
  const dispatcher = ReactCurrentDispatcher.current;
  invariant(
    dispatcher !== null,
    'Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for' +
    ' one of the following reasons:\n' +
    '1. You might have mismatching versions of React and the renderer (such as React DOM)\n' +
    '2. You might be breaking the Rules of Hooks\n' +
    '3. You might have more than one copy of React in the same app\n' +
    'See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.',
  );
  // *然后进行返回
  return dispatcher;
}
```

### 执行 hooks 时，hooks 如何与 Fiber 建立关系？

以挂载作为例子：mountState 会执行一个 mountWorkInProgressHook，这个函数会初始化一个 hook 的对象，然后把它挂载到当前 wip 的 Fiber.memoizedState 上。

```flow js
function mountState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // !重点是这个
  const hook = mountWorkInProgressHook();
  
  if (typeof initialState === 'function') {
    // $FlowFixMe: Flow doesn't like mixed types
    initialState = initialState();// *如果是函数就执行函数，获取返回值作为 初始值
  }
  hook.memoizedState = hook.baseState = initialState;
  const queue = (hook.queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,// *全局函数
    lastRenderedState: (initialState: any),
  });
  // *dispatch 也就是 setState 其实就是 dispatchAction
  const dispatch: Dispatch<BasicStateAction<S>,
    > = (queue.dispatch = (dispatchAction.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ): any));
  // 返回
  return [hook.memoizedState, dispatch];
}

// !mountWorkInProgressHook 将会初始化一个 hook 的存储空间，然后把它挂载到
function mountWorkInProgressHook(): Hook {
  const hook: Hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    // This is the first hook in the list
    // *workInProgressHook 是一个全局的属性，记录当前 wip 的组件的所有 hooks
    // *比如一个 FC 有很多个 hooks 第一次时 memoizedState 为空，所以直接赋值为 hook
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // Append to the end of the list
    // *第二次和后面的 hooks，workInProgressHook 有值，那就像下面这样赋值，形成一个链表
    // !所以 hooks 的结构是一个链表
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```

## 更新时，hooks 的操作

依然使用 useState 作为例子，当前时期执行的自然是 updateState

> 注意：解释了为什么 react 不允许在条件语句中执行 hook

```flow js
function updateState<S>(
  initialState: (() => S) | S,
): [S, Dispatch<BasicStateAction<S>>] {
  // *实际调用 useReducer
  return updateReducer(basicStateReducer, (initialState: any));
}

function updateReducer<S, I, A>(
  reducer: (S, A) => S,
  initialArg: I,
  init?: I => S,
): [S, Dispatch<A>] {
  // *updateWorkInProgressHook 详细见下面👇
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  invariant(
    queue !== null,
    'Should have a queue. This is likely a bug in React. Please file an issue.',
  );

  queue.lastRenderedReducer = reducer;

  const current: Hook = (currentHook: any);

  // The last rebase update that is NOT part of the base state.
  let baseQueue = current.baseQueue;

  // The last pending update that hasn't been processed yet.
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
    // We have new updates that haven't been processed yet.
    // We'll add them to the base queue.
    if (baseQueue !== null) {
      // Merge the pending queue and the base queue.
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    if (__DEV__) {
      if (current.baseQueue !== baseQueue) {
        // Internal invariant that should never happen, but feasibly could in
        // the future if we implement resuming, or some form of that.
        console.error(
          'Internal error: Expected work-in-progress queue to be a clone. ' +
          'This is a bug in React.',
        );
      }
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }

  if (baseQueue !== null) {
    // We have a queue to process.
    const first = baseQueue.next;
    let newState = current.baseState;

    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateLane = update.lane;
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        // Priority is insufficient. Skip this update. If this is the first
        // skipped update, the previous update/state is the new base
        // update/state.
        const clone: Update<S, A> = {
          lane: updateLane,
          action: update.action,
          eagerReducer: update.eagerReducer,
          eagerState: update.eagerState,
          next: (null: any),
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        // Update the remaining priority in the queue.
        // TODO: Don't need to accumulate this. Instead, we can remove
        // renderLanes from the original lanes.
        currentlyRenderingFiber.lanes = mergeLanes(
          currentlyRenderingFiber.lanes,
          updateLane,
        );
        markSkippedUpdateLanes(updateLane);
      } else {
        // This update does have sufficient priority.

        if (newBaseQueueLast !== null) {
          const clone: Update<S, A> = {
            // This update is going to be committed so we never want uncommit
            // it. Using NoLane works because 0 is a subset of all bitmasks, so
            // this will never be skipped by the check above.
            lane: NoLane,
            action: update.action,
            eagerReducer: update.eagerReducer,
            eagerState: update.eagerState,
            next: (null: any),
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }

        // Process this update.
        if (update.eagerReducer === reducer) {
          // If this update was processed eagerly, and its reducer matches the
          // current reducer, we can use the eagerly computed state.
          newState = ((update.eagerState: any): S);
        } else {
          const action = update.action;
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);

    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = (newBaseQueueFirst: any);
    }

    // Mark that the fiber performed work, but only if the new state is
    // different from the current state.
    if (!is(newState, hook.memoizedState)) {
      markWorkInProgressReceivedUpdate();
    }

    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;

    queue.lastRenderedState = newState;
  }

  const dispatch: Dispatch<A> = (queue.dispatch: any);
  return [hook.memoizedState, dispatch];
}

function updateWorkInProgressHook(): Hook {
  // *注意 renderWithHooks 在执行完 FC 后会重置 currentHook 和 wipHook
  
  let nextCurrentHook: null | Hook;
  // *currentHook 与 wipHook 对应 (详细请看 ### 执行 hooks 时，hooks 如何与 Fiber 建立关系？中的挂载 hook)
  // *与双渲染树有关，currentHook 当然存储的就是当前页面上的 Fiber 的 hook 链表
  
  // *currentlyRenderingFiber 其实就是当前正在渲染的 Fiber 其实就是 workInProgress

  /**
   * !因为 hook 是一个链表，存储在 memoizedState 上
   * !所以使用全局的 currentHook 应该指向当前节点的前一个，可以看作 prev
   * !第一个 if 就是在初始化 nextCurrentHook 指向当前的 hook 的位置。比如当前正在执行 useEffect 那么 nextCurrentHook 就应该指向 useEffect 在链表中的位置
   */
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;// *current 指向页面上的 Fiber
    if (current !== null) {
      nextCurrentHook = current.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    nextCurrentHook = currentHook.next;
  }

  /**
   * *首先知道 currentlyRenderingFiber 就是当前的 wip
   * *wip.memoizedState 在执行 FC 前 renderWithHooks 中将会被清空
   * *workInProgressHook 与 currentHook 对应, 记录当前 wip 的 hooks 链表的 prev
   *
   * !这个 if 需要与接下来一个 if 搭配看
   * !这个函数的作用就是构建 wip.memoizedState 链表，并且这个链表是按照 FC 中 hooks 的顺序的，是有序的，那么就需要按照顺序在末尾添加节点
   * !nextWorkInProgressHook 的作用就像是指向链表的末尾，然后要保证 末尾为 null，这样才不会从中间进行插入。
   */
  let nextWorkInProgressHook: null | Hook;
  if (workInProgressHook === null) {// *workInProgressHook 为空，说明此时链表都为空
    nextWorkInProgressHook = currentlyRenderingFiber.memoizedState;// *同样的 renderWithHooks 会清空 wip.memoizedState
  } else {
    // *链表存在就指向末尾
    nextWorkInProgressHook = workInProgressHook.next;
  }

  // *如果不是末尾的化执行 if，这个情况应该很少，不清楚什么情况下执行这个 if 可以忽略。
  if (nextWorkInProgressHook !== null) {
    // There's already a work-in-progress. Reuse it.
    workInProgressHook = nextWorkInProgressHook;// prev 前进
    nextWorkInProgressHook = workInProgressHook.next;

    // *prevNode = nextNode 移动到末尾
    currentHook = nextCurrentHook;
  } else {
    // Clone from the current hook.

    invariant(
      nextCurrentHook !== null,
      'Rendered more hooks than during the previous render.',
    );
    // *prevNode = nextNode 移动到末尾
    currentHook = nextCurrentHook;
    
    // !这里就解释了为什么 hooks 不能放在条件语句中执行，因为需要复用之前的一些属性，如果放在条件语句中，两次的 hooks 链表都不能保证长度一致，顺序一致，哪还有什么用？
    // 初始化 Hook 对象，并且重用了之前的一些属性
    const newHook: Hook = {
      memoizedState: currentHook.memoizedState,

      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,

      next: null,
    };

    // *与 mount 一样， 连接链表赋值给 wip.memoizedState
    if (workInProgressHook === null) {
      // This is the first hook in the list.
      currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
    } else {
      // Append to the end of the list.
      workInProgressHook = workInProgressHook.next = newHook;
    }
  }
  return workInProgressHook;
}
```
