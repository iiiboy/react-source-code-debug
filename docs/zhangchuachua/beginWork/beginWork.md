# beginWork

还未解决的问题：

1. 当我点击按钮改变 state 时，进入 scheduleUpdateOnFiber 可是这样获得的 lane 依然是 SyncLane。那么什么情况下才会进入异步的更新呢？ 
2. 因为 lane 一直是 SyncLane 所以不清楚异步更新是否是在 ensureRootIsScheduled 中执行
3. 在 if(lane === SyncLane) 中会进行 context 的判断，需要理解 React Context 的具体含义
4. 需要理解 [Lane](src/react/v17/react-reconciler/src/ReactFiberLane.js) 的具体含义

总体而言，就是对更新流程完全的不了解！！

## render or update

再讲 beginWork 之前先了解一下 react render 和 update

其实 render 与 update 差不太多，毕竟 render 也可以看作是第一次进行 update 嘛

具体的流程如下

还未完成：

1. 更新流程
2. commit 阶段

```mermaid
flowchart TB
  a["render-使用的是 reactDOM.render()"] 
  --> B[legacyRenderSubtreeIntoContainer] 
  --> judge{"container._reactRootContainer \n 即 root 是否存在?"}
  
  judge 
  --> |"不存在，说明第一次渲染"|b["legacyCreateRootFromDOMContainer\n 使用 container 创建 FiberRoot\n 然后在创建 HostRootFiber"] 
  --> |开始更新|render["unbatchedUpdates(() => { updateContainer(...) }) \n unbatchedUpdates -> 不批量更新 \n updateContainer -> 更新 container"]

  render --> update

  judge
  -->
  |"存在，说明并不是第一次渲染"|update["updateContainer"]
  
  update 
  --> ac[更新的核心\nscheduleUpdateOnFiber] 
  
  ac 
  --> judge2{"判断优先级 lane \n 同步 or 异步？"}
  
  judge2
  --> |同步|ad[performSyncWorkOnRoot]
  --> |render 阶段|renderRoorSync["renderRootSync \n 在这个函数内部初始化 wip"]
  --> af[workLoopSync] 
  --> ah[performUnitOfWork] 
  --> ak[beginWork \n 重点] & aj[completeUnitOfWork]

  aj 
  --> al[completeWork \n 重点]

  ad 
  --> |commit 阶段|ba[commitRoot]
  
  judge2
  --> |异步|async[ensureRootIsScheduled]
```

解释上面的一些内容：

1. 上面所说的 root 并不是直接指 FiberRoot 而是 ReactDOMBlockingRoot 对象，大概是这样：`root = new ReactDOMBlockingRoot(...);` 然后 `root._internalRoot = FiberRoot` 无论是 legacy 还是 concurrent 模式 root 都是指 ReactDOMBlockingRoot (应该不是很重要，仅供了解)
2. FiberRoot 当前整个 React应用 的根基，每个 React应用 只能有一个 FiberRoot
3. HostRootFiber 假设当前的 render 是这样的 `ReactDOM.render(<Index />, root);` 那么 HostRootFiber 就是 `<Index />`
   的上层， `HostRootFiber.child = <index />`
4. 对于 FiberRoot 与 HostRootFiber 的关系:
    ```js
    // *双缓存策略，current Fiber树 被渲染在页面上
    FiberRoot.current = HostRootFiber;
    
    // *HostRootFiber 的 stateNode 指向 FiberRoot
    HostRootFiber.stateNode = FiberRoot;
    HostRootFiber.child = <index/>
    ```
5. 上面虽然在 `legacyRenderSubtreeIntoContainer` 中会判断 root 是否存在，如果不存在的话，就直接调用 `updateContainer` 的代码。
   但是其实这并不是正常流程的更新，正常流程的更新一般直接走下面的 `scheduleUpdateOnFiber`。
   目前并不清楚什么情况下会走这里的判断。

## beginWork

beginWork 做的最重要的一件事情就是 `switch (wip.tag) {}` 判断 wip.tag 进入不同的处理函数。

1. HostRootFiber 将会进入 updateHostRoot 处理
2. FunctionComponent 将会进入 updateFunctionComponent
3. ClassComponent 将会进入 updateClassComponent 处理

这里它们内部具体的处理流程可以暂时忽略, 因为处理流程中参加了 context, lane 等很多处理，在尚不理解前可以忽略。

只需要知道一个大概就行了，在对 ClassComponent 的处理中，如果 instance 为 null 那么说明是第一次渲染，将会实例化 ClassComponent，并且执行相应的生命周期函数，比如在 render 之前的 getDerivedStateFromProps. 如果不为 null 那么将会执行更新操作。然后进入 finishClassComponent 调用实例的 render 获取 children 最后进入 reconcileChildren 并返回下一个需要进行的工作。

无论是第一次渲染，还是更新，都会进入 reconcileChildren 调和 children。函数内部通过检查 current 是否为 null 判断当前是 mountChildFibers 还是 reconcileChildFibers，其实这两个函数就是 ChildReconciler 传入不同的参数的返回值；至于不同的参数就是 mountChildFibers 将不会追踪副作用，reconcileChildFibers 将会追踪副作用。

**ChildReconciler** ，它本身是一个函数，函数内还声明了很多功能函数，返回的函数就是 reconcileChildFibers，所以上面那两个函数最终都会进入 reconcileChildFibers 。

reconcileChildFibers 内部同样会根据不同的情况进入不同的处理函数，总之大概的操作就是

1. 对于 mount 阶段，那么直接创建新 Fiber，并且与父节点连接，生成 Fiber 树，某些情况下还会处理 ref。
2. 对于 update 阶段，就进行 diff 选择性复用 Fiber，并打上不同的副作用标记，在 commit 阶段中将会用到。

到这里其实 beginWork 就执行完成了

```mermaid
flowchart TB

beginwork[beginWork]
--> switch["switch(wip.tag) \n 根据 tag 进入不同的处理函数 \n 作用：可能会实例化类，执行生命周期函数"]
--> reconcileChildren[reconcileChildren]
--> judge{"current === null ?"}

judge
--> |"current === null"|mount["mountChildFibers \n 第一次渲染"]
--> |将不会追踪副作用|ChildReconcilers["ChildReconcilers.reconcileChildFibers"]

judge
--> |"current !== null"|update["reconcileChildFibers \n 不是第一次渲染"]
--> |会追踪副作用|ChildReconcilers

ChildReconcilers
--> which_reconcile["根据情况进入不同的 reconciler 函数 \n 作用：生成 child 对应的 Fiber \n 连接 Fiber \n 初始化 ref"]
--> return["返回 第一个子元素 或者 null"]
--> |返回值|performUnitOfWork[performUnitOfWork \n next = 返回值]
--> judge1{"next === null ?"}

judge1
--> |"next !== null"|loop[wip = next]
--> |循环|beginwork

judge1
--> |"next === null"|completeUnitOfWork
--> completeWork
```

