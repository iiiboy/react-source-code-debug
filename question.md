## 专门用于记录学习 react 源码过程中的问题

### updateQueue

1. updateQueue 的作用是什么？
2. 它在哪里进行了使用？
3. useEffect 将会将 effect 对象放到了 updateQueue 中，但是 effect 对象真正使用的时候是在 [flushPassiveEffectsImpl](src/react/v17/react-reconciler/src/ReactFiberWorkLoop.old.js) 中，由 effect 对象，到异步调用 副作用函数 的具体流程是什么？
4. 因为 副作用函数 是异步调用的，那么每次异步调用 副作用函数 时，将调用整个 react 项目中所有的 (应该更新的)副作用函数 吗？

### 调度

1. 更新中断后，是如何恢复的？是通过 fiber 中的 updateQueue 吗？
   - 猜想：更新时，将会不断取出 update(应该是从 updateQueue 中取？)取出一个就执行一个，然后将其从链表中删除。中断时，如果还没有执行完成，那么就将该任务再次 push 进 taskQueue 中去。
   - 恢复更新时，取出 task，此时 fiber 已执行的更新已经从 updateQueue 中删除了，所以直接继续执行 updateQueue 中的更新即可。

### classComponent

1. 在 [updateClassInstance](src/react/v17/react-reconciler/src/ReactFiberClassComponent.old.js) 中可以看到，即使 shouldUpdate(简单看作 shouldComponentUpdate 的返回值)为 false，但是只要 props state 前后不一样，依然会为 fiber 添加 update 的副作用，那么是否会执行 componentDidUpdate 函数呢？ 