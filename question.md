## 专门用于记录学习 react 源码过程中的问题

### updateQueue

1. updateQueue 的作用是什么？
2. 它在哪里进行了使用？
3. useEffect 将会将 effect 对象放到了 updateQueue 中，但是 effect 对象真正使用的时候是在 [flushPassiveEffectsImpl](src/react/v17/react-reconciler/src/ReactFiberWorkLoop.old.js) 中，由 effect 对象，到异步调用 副作用函数 的具体流程是什么？
4. 因为 副作用函数 是异步调用的，那么每次异步调用 副作用函数 时，将调用整个 react 项目中所有的 (应该更新的)副作用函数 吗？