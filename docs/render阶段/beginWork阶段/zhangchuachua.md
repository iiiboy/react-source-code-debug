# beginWork

再讲 beginWork 之前先了解一下 react render 和 update

其实 render 与 update 差不太多，毕竟 render 也可以看作是第一次进行 update 嘛

具体的流程如下

```mermaid
flowchart TB
  a["render-使用的是 reactDOM.render()"] --> B[legacyRenderSubtreeIntoContainer] --> judge{"container._reactRootContainer \n 即 root 是否存在?"}
  
  judge --> |"不存在，说明第一次渲染"|b["legacyCreateRootFromDOMContainer\n 使用 container 创建 FiberRoot\n 然后在创建 HostRootFiber"] 
  -->
  |开始更新|render["unbatchedUpdates(() => { updateContainer(...) }) \n unbatchedUpdates -> 不批量更新 \n updateContainer -> 更新 container"]

  render --> update

  judge
  -->
  |"存在，说明并不是第一次渲染"|update["updateContainer"]
  
  update -->
  ac[scheduleUpdateOnFiber] 
  --> 
  ad[performSyncWorkOnRoot] 
  --> 
  ae[renderRootSync] 
  --> 
  af[workLoopSync] 
  --> 
  ah[performUnitOfWork] 
  --> 
  ai[beginWork$1] & aj[completeUnitOfWork]

  ai --> ak[beginWork] --> |判断 work 的 tag, 不同 tag 不同处理| aka[几乎最终都会进入reconcileChildren] --> |"current 为 null (第一次渲染时 current 都为 null)"| akb[mountChildFibers]
  aka --> |current 不为 null| akc[reconcileChildFibers] --> |根据当前child 是什么类型进行不同的操作| akd[something] --> ake[createFiberFromElement] --> |最终| akf[createFiber -> new FiberNode]

  aj --> al[completeWork]

  ad --> ba[commitRoot]
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
5. 上面虽然有一个