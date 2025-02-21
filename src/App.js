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

function Count() {
  const [count, setCount] = useState(0);
  const handleConcurrentClick = useCallback(() => {
    setCount(1);
    setCount(1);
    setCount((prev) => prev + 1);
    // setTimeout(() => {
    //   setCount((prev) => prev + 2);
    //   setCount((prev) => prev + 2);
    // })
  }, []);

  // useEffect(() => {
  //   console.log("effect 1");
  // }, [count]);

  return <button onClick={handleConcurrentClick}>{count}</button>;
}

const Static = () => {
  return 'static';
}

function App() {


  return <>
    <Count/>
  </>;

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
