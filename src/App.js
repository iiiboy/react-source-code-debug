import React, {
  useState,
  useMemo,
  useEffect,
  useReducer,
  useLayoutEffect,
  useCallback,
  Component,
  PureComponent,
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

class A extends PureComponent {
  handleClick = () => {

  }
  render() {
    return <div>this is A</div>;
  }
}

function App() {
  const [c, setC] = useState(1);
  const handleClick = () => {
    setC(c + 1);
  };
  return (
    <div onClick={handleClick}>
      <A />
    </div>
  );

  // 事件系统
  // return <EventDemo/>

  // return <Hooks/>
  // fiber树
  // return (
  //   <div className="App">
  //     <CC />
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
  return <FunctionDiff4 />;

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
