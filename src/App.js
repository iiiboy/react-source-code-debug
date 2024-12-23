import React, {
  useState,
  useMemo,
  useEffect,
  useReducer,
  useLayoutEffect,
  useCallback,
  Component,
  PureComponent,
  useRef,
} from "react";
import State from "./components/State";
import LanesDemo from "./components/LanesDemo";
import AppSibling from "./components/AppSibling";
import TasksWithDifferentPriorities from "./components/TasksWithDifferentPriorities";
import SchedulerTask from "./components/SchedulerTask";
import Concurrent from "./components/ConcurrentInput";
import Diff from "./components/Diff";
import {
  FunctionDiff1,
  FunctionDiff2,
  FunctionDiff3,
  FunctionDiff4,
  FunctionDiff5,
  FunctionDiff6,
} from "./components/Diff/FunctionDiff";
import PropsDiff from "./components/PropsDiff";
import Hooks from "./components/Hooks";
import EventDemo from "./components/EventDemo";
import ContextDemo from "./components/Context";
import "./App.css";

// propsDiff
/*class App extends React.Component {
  render() {
    return <PropsDiff/>
  }
}*/

// function App() {
//
//   // 事件系统
//   // return <EventDemo/>
//
//   // return <Hooks/>
//   // fiber树
//   // return (
//   //   <div className="App">
//   //     <CC />s
//   //     <span className={'app-span'} onClick={() => setCount(count + 1)}>App{count}</span>
//   //     <AppSibling count={count}/>
//   //   </div>
//   // );
//
//   // Scheduler调度任务与用户交互
//   // return <SchedulerTask/>
//
//   // 高优先级插队
//   // return <TasksWithDifferentPriorities/>
//
//   // context
//   // return <ContextDemo/>
//
//   // diff 算法
//   // return <FunctionDiff1 />;
//
//   // return <Diff />;
// }

const arr = [1,2,3]

function App() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    setCount(count + 1);
    setCount(count + 2);
    console.log(count);
    setCount((prev) => prev + 3);
  }, [count]);

//  useEffect(() => {
//    setTimeout(() => {
//      setCount(count + 1);
//      setCount(count + 2);
//      console.log(count);
//    }, 100);
//  }, [count]);

  useEffect(() => {
    console.log("effect 1");
  }, [count]);

  useEffect(() => {
    console.log("effect2");
  }, [count]);

  return <button onClick={handleClick}>{count}</button>;

  // 事件系统
  // return <EventDemo/>

  // return <Hooks/>
  // fiber树
  // return (
  //   <div className="App">
  //     <CC />s
  //     <span className={'app-span'} onClick={() => setCount(count + 1)}>App{count}</span>
  //     <AppSibling count={count}/>
  //   </div>
  // );

  // Scheduler调度任务与用户交互
  // return <SchedulerTask/>

  // 高优先级插队
  // return <TasksWithDifferentPriorities/>

  // context
  // return <ContextDemo/>

  // diff 算法
  // return <FunctionDiff4 />;

  // return <Diff />;
}

// class App extends React.Component {
//   constructor() {
//     super();
//   }
//
//   render() {
//     return <Diff />;
//   }
// }

export default App;
