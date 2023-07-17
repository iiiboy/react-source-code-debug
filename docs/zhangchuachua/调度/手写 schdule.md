## 手写 schedule

### 参考

- [mini-react 讲得非常好，我这里几乎等于照搬了，并不是自己在探索，而是跟着大佬在学习](https://github.com/lizuncong/mini-react)

### 从一个故事开始

老板要求我做一个无限循环的动画；如下：

```html
<style>
  #animation {
    width: 30px;
    height: 30px;
    background: red;
    animation: myfirst 3s infinite alternate;
  }

  @keyframes myfirst {
    from {
      width: 30px;
      height: 30px;
      border-radius: 0;
      background: red;
    }

    to {
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: yellow;
    }
  }
</style>
<body>
  <div id="animation">test</div>
</body>
```

#### 新的需求

此时有了一个新的需求，在动画的基础上，需要执行一系列的任务，然后在任务结束后将处理任务所耗费的时间更新在页面上

```js
// *平均用时 2ms
function work() {
  const start = Date.now();

  while (Date.now() - start < 2) { };
}

function createWorks(length) {
  return new Array(length).fill(0).map(() => {
    return work;
  })
}

const works = createWorks(3000);
```

#### 同步执行

```js
function flushWorkSync() {
  console.log('invoke')
  const el = document.getElementById('animation');
  const start = Date.now();
  for (const i of works) {
    i();
  }
  el.innerText = `${Date.now() - start}ms`;
}
```

3000 个 work，每个 work 平均占用 2ms 那么一共将占用 6000ms 的时间；因为使用同步执行，所以在这 6s 中将会一直阻塞 js 主线程，导致画面卡住，无法进行渲染等操作；

所以同步执行肯定是不可行的;

#### setTimeout 异步执行

```js
function flushWorkSetTimeout() {
  start = Date.now();
  setTimeout(workLoop, 0);
}

function workLoop() {
  const work = works.shift();
  if (work) {
    work();
    setTimeout(workLoop, 0)
  } else {
    el.innerText = `${Date.now() - start}ms`;
  }
}
```

使用了 setTimeout 倒是不会阻塞主线程了，但是发现最后的用时是 `17991ms(每次的结果肯定不一样，只是一个大概)` 6s 的任务整整执行了 18s 才执行完成；

其实这是 setTimeout 的一个特性；setTimeout 是可以嵌套执行的，而且我们这里正是这样使用的；[当 setTimeout 的嵌套调用超过 4次 那么浏览器将强制执行 4 毫秒作为最小 timeout](https://developer.mozilla.org/zh-CN/docs/Web/API/setTimeout#%E5%BB%B6%E6%97%B6%E6%AF%94%E6%8C%87%E5%AE%9A%E5%80%BC%E6%9B%B4%E9%95%BF%E7%9A%84%E5%8E%9F%E5%9B%A0);

如果我们观察对应的 performance 就可以发现，前四次的间隔几乎为 0，第四次后，间隔就在 4ms 左右了；

![settimeout-performance](settimeout-performance.png)

---

setInterval 也会有这样的特性，只要 setInterval 中的回调连续连续调用超过 4次 那么浏览器就会强制执行 4ms 作为最小 timeout；

如下代码：

```js
function flushWorkSetInterval() {
  start = Date.now();
  const id = setInterval(() => {
    const work = works.shift();
    if (work) {
      work();
    } else {
      el.innerText = `${Date.now() - start}ms`;
      clearInterval(id);
    }
  }, 0);
}
```

如下 performance 图:

![interval-performance](interval-performance.png)

---

> 为什么 setTimeout 和 setInterval 不会阻塞主线程呢？
> 这里的知识其实是 **事件循环** 的知识，首先，准确的来说是，是**宏任务**不会阻塞主线程，因为在 事件循环 中，每执行完一个宏任务，就会去检查是否有其他的任务需要执行，比如微任务；如果没有就会进入下一次事件循环，就会再执行宏任务，然后去检查其他的任务；
>
> 在一帧中，浏览器会执行以下操作：
> 1. 事件循环
> 2. 执行 requestAnimationFrame
> 3. 执行样式计算，布局和绘制
> 4. 如果还有空闲时间，就执行 requestIdleCallback
>
> 如果在某个操作中，阻塞了 js 主线程，那么就会导致卡顿，掉帧的情况
>
> 因为宏任务在每次事件循环只会执行一次的这个机制，所以不会阻塞主线程（任务执行的时间也很重要）；
>
> 如果我们把这里的 setTimeout 换成 Promise 就同样会阻塞主线程；因为微任务的特性；

#### MessageChannel 异步执行

```js
function flushWorkChannel() {
  start = Date.now();
  const channel = new MessageChannel();

  channel.port1.onmessage = workLoopChannel;
  // *必须传入一个参数，不然会报错
  channel.port2.postMessage(null);

  function workLoopChannel() {
    const work = works.shift();
    if (work) {
      work();
      channel.port2.postMessage(null);
    } else {
      el.innerText = `${Date.now() - start}ms`;
    }
  }
}
```

MessageChannel 不会有 setTimeout 和 setInterval 的特性，所以可以频繁的触发 postMessage;

performance 图：

![channel-performance](channel-performance.png)

#### 在 MessageChannel 中一次尽可能执行多的任务

根据上面的 performance 可以看到，其实 postMessage 自身的调用也是会浪费时间的，并且在一帧里，将会有多次的 postMessage 说明我们并没有把空闲时间时间利用到位；

正确的做法是，将在一次的 postMessage 中我们应该尽可能多的执行任务；

比如我的显示器，75赫兹刷新率，那么一帧就是 13.3ms；一次任务大概 2ms 所以我在一次 postMessage 中执行 6 个任务；剩下的时间留给浏览器进行其他操作；

```js
function flushWorkChannelMultiTask() {
  start = Date.now();
  const channel = new MessageChannel();

  channel.port1.onmessage = workLoopChannel;
  // *必须传入一个参数，不然会报错
  channel.port2.postMessage(null);

  function workLoopChannel() {
    for (let i = 0; i < 6; i++) {
      const work = works.shift();
      if (work) {
        work();
      } else {
        break;
      }
    }
    if (works.length) channel.port2.postMessage(null);
    else el.innerText = `${Date.now() - start}ms`;

  }
}
```

在执行速度上还是有一部分的提升：

![channel-multitask-performance](channel-multitask-performance.png)

#### 处理执行耗时未知的任务

在上一节中，明确了优化的方向，在一次 workLoop 中执行尽可能多的任务；但是上一节的任务耗时都是接近的；如果任务耗时未知呢？

如果我们不能控制单个任务的耗时，但是我们可以控制 workLoop 的耗时；其实这就是时间切片；比如我们将 workLoop 的耗时控制在 5ms 内，每次执行完一个 work 就检查当前执行时间是否超过了 5ms;

```js
function flushWorkChannelUnknownTask() {
  start = Date.now();
  const channel = new MessageChannel();
  channel.port1.onmessage = workLoop;
  channel.port2.postMessage(null);

  function workLoop() {
    const loopStart = Date.now();
    let work = works.shift();

    while (work) {
      work();
      if (Date.now() - loopStart >= 5) {
        break;
      }
      work = works.shift();
    }

    if (!works.length) {
      el.innerText = `${Date.now() - start}ms`;
    } else channel.port2.postMessage(null);
  }
}
```

performance 图中可以看到每次 workLoop 的执行耗时都在 5ms 左右：

![channel-unknowntask-performance](channel-unknowntask-performance.png)

### 开始封装

```js
// *scheduleCallback 会创建一个 task，并且放到 **taskQueue** 中，如果开始「调度」，但是为了防止同时触发多次事件，所以还需要一个全局变量(**scheduledHostCallback**)，存储当前是否已有已调度的任务
const taskQueue = [];
let scheduledHostCallback = false;

// *需要暴露出来一个方法，让用户可以使用该方法来调度任务，这个方法就是 `scheudleCallback`

// *scheduleCallback 接收一个 callback (react 中的 schedule 有三个参数：优先级, callback, 选项)
function schduleCallback(callback) {
  const newTask = {
    callback: callback,
  }
  taskQueue.push(newTask);
  
  if(!scheduledHostCallback) {
    scheduledHostCallback = true;
    // *「调度」的应该是内部的函数，而不是传入的 callback ，因为使用内部函数才能更好的掌控调度的细节；
    requestHostCallback(flushWork)
  }
  
  return newTask;
}

// *flushWork 在正式执行任务之前触发，所以可以包含一些在 workLoop 之前需要的操作；这个例子比较简单就没有；
function flushWork(initialTime) {
  return workLoop(initialTime);
}

// *将在这个函数内正式执行任务, 将在允许的时间里尽可能多的执行任务；
function workLoop(initialTime) {
  let currentTask = taskQueue[0];
  
  while(currentTask) {
    if(Date.now() > deadLine) {
      break;
    }
    
    let callback = currentTask.callback;
    callback();
    
    taskQueue.shift();
    currentTask = taskQueue[0];
  }
  
  if(currentTask) {
    return true;
  } {
    isHostCallbackScheduled = false;
    return false;
  }
}
```

调度系统使用 channel

requestCallback 专门用于触发宏任务事件

performWorkUntilDeadline 监听 channel 事件；开始执行回调，并且计算 deadline；

deadline 就是任务的结束时间，应该是「任务的开始时间」+ yieldInterval 也就是 5ms


```js
const yieldInterval = 5;
let deadline;
let scheduledHostCallback = null;
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadLine;

function performWorkUntilDealine() {
  if(scheduledHostCallback) {
    const current = Date.now();
    deadline = current + yieldInterval;
    const hasMoreTask = scheduledHostCallback(current);
    
    if(hasMoreTask) {// *如果还有任务，就放到下一个宏任务中进行
      port.postMessage(null);
    } else {
      scheduledHostCallback = null;
    }
  }
}

// *专门用于请求回调，即触发 postMessage 事件；
function requestHostCallback(callback) {
  scheduledHostCallback = callback;
  // 这里的 null 必须传 不然会报错；
  port.postMessage(null);
}
```

这个简易的 schedule 系统的大致流程是：

```mermaid
flowchart TB
    scheduleCallback["scheduleCallback 是暴露出来的接口，负责接收 callback\n 将会使用 callback 创建一个 task 并且放到 taskQueue 里面"]
    --> |"requestHostCallback(flushWork)"|requestHostCallback["requestCallback 负责触发宏任务事件\n也就是触发 postMessage 函数"]
    --> performWorkUtilDeadline["performWorkUtilDeadline 函数就是宏任务对应的处理函数\n将会在这个函中获取任务开始的事件，计算 deadline \n 然后开始执行回调，并且获取回调(flushWork)的返回值（是否还有任务）\n 如果还有任务将会触发 postMessage 函数，下一次宏任务继续，有点类似与递归"]
    --> flushWork["flushWork 作正式执行任务前的函数，可以进行一些执行任务前的操作"]
    --> workLoop["workLoop 将正式开始执行任务；将会在运行的时间里，尽可能多的执行任务；\n 将会使用 while 循环从 taskQueue 里面拿出任务，并且执行；\n 如果到达了 deadline 将会直接 break，如果还有任务就返回 true"]
```

> 注意：其中 performWorkUtilDeadline 和后面的 flushWork, workLoop 都是宏任务中的操作，都是异步的；
> 
> ---
> 
> 注意：这里的schedule 只能将若干个任务切片完成，并不能将一个任务进行切片；所以如果有那种一个任务执行太久的情况，也是没有办法的；
>
> 所以说，在 schedule 真实的实现中， callback 可以返回一个函数说明当前的 callback 并没有执行完成；
> 
> 但是需要使用 schedule 的 shouldYield 来判断是否要中断了