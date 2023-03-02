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

获取 children 后将会进入 reconchileChildren(位于 ReactFiberBeginWork) 函数；

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

[span1] -> [span1, span2]

[span1, span2] -> [span1]

[span1, span2] -> [span2, span1]

[span1, span2] -> [span1, span3, span2]

[span1, span2, span3] -> [span1, span3]

[p1, p2, p3, p4, p5] -> [p1, p4, p2, p5]
