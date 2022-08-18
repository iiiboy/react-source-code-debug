## 事件系统

react v17

### 事件绑定

根据 [概览](./概览.md) 可知，事件绑定在函数 [setInitialDOMProperties](src/react/v17/react-dom/src/client/ReactDOMComponent.js)

> setInitialDOMProperties 将在 complete 阶段执行， 

```js
function setInitialDOMProperties(
  tag: string,
  domElement: Element,
  rootContainerElement: Element | Document,
  nextProps: Object,
  isCustomComponentTag: boolean
): void {
  // *遍历 props
  for (const propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) { continue; }
    const nextProp = nextProps[propKey];
    if (...) { ... }
    // *registrationNameDependencies 包含 react 支持的所有的事件，如果当前的 propKey 是 react支持的事件就进入该 if
    else if (registrationNameDependencies.hasOwnProperty(propKey)) {
      if (nextProp != null) {
        // !注意，这里与 react v16 有所不同，v16 这里直接执行 ensureListeningTo 函数，但是 v17 这里不会执行。因为 enableEagerRootListeners 是一个常量，值一直为 true，if (false) 自然不会执行，并且在 react-dom.development.js 中直接没有这个 if，只剩下 onScroll 的判断。这样更能说明问题了
        if (!enableEagerRootListeners) {
          // *忽略这个函数，并没有执行
          ensureListeningTo(rootContainerElement, propKey, domElement);
        } else if (propKey === 'onScroll') {
          listenToNonDelegatedEvent('scroll', domElement);
        }
      }
    } else if (nextProp != null) {
      setValueForProperty(domElement, propKey, nextProp, isCustomComponentTag);
    }
  }
}
```

那么在 react v17 中遍历到 onClick 这种事件的时候貌似并没有做什么。那么事件绑定是什么时候绑定的呢？其实在最开始的 `createRootImpl` 也就是创建 `HostRootFiber` 时就通过 `listenToAllSupportedEvents` 将所有支持的事件都绑定到了 `rootContainerElement` (这里也对应了 react v17 就将事件统统绑定到 rootContainer 而不是 document)

那么事件处理函数又是多久绑定的呢？

通过对绑定的事件处理函数进行 debugger 可以发现，**其实根本没有将事件处理函数直接绑定到 rootContainerElement 上**，而是直接使用的上面 `listenToAllSupportedEvents` 中绑定的事件。大概的流程为：

1. `listenToAllSupportedEvents` 为 `rootContainerElement` 绑定所有的事件
2. 点击子组件，其实就相当于在点击 `rootContainerElement` 所以会触发对应的点击事件。
3. 绑定事件的时候会根据[事件优先级](../前置知识/React中的优先级.md)绑定不同的处理函数，但是最终其实都是执行 [dispatchEvent](src/react/v17/react-dom/src/events/ReactDOMEventListener.js)
4. `dispatchEvent` 内部将将进入其他函数，获取触发事件的元素，然后根据对应的 Fiber 然后在根据很多层函数，最终执行事件处理函数。

### 事件触发

点击事件后，自然会执行 dispatchEvent