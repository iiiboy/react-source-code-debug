import React, { useState, useMemo, useEffect } from "react";
import State from "./components/State";
import LanesDemo from "./components/LanesDemo";
import AppSibling from "./components/AppSibling";
import TasksWithDifferentPriorities from "./components/TasksWithDifferentPriorities";
import SchedulerTask from "./components/SchedulerTask";
import Concurrent from "./components/ConcurrentInput";
import Diff from "./components/Diff";
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

function random255() {
  return Math.round(Math.random() * 255);
}

// function FC() {
//   const [count, setCount] = useState(0);
//   console.log('render')
//   const handleClick = useMemo(() => {
//     return () => {
//       setCount((prev) => {
//         console.log('123')
//         return prev + 1;
//       });
//     };
//   }, []);
//
//   useEffect(() => {
//     const r = random255();
//     const g = random255();
//     const b = random255();
//     document.body.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
//   }, [count]);
//
//
//   return (
//     <div onClick={handleClick}>
//       this is CC function component,{" "}
//       <span style={{ color: "red" }}>{count}</span>
//       <button
//         onClick={handleClick}
//       >
//         click me
//       </button>
//     </div>
//   );
// }

// const FCC = React.memo(FC, () => true);

class CC extends React.PureComponent {
  constructor() {
    super();
    this.state = {
      name: "",
      age: 23,
      timeId: null,
    };
    this.btnRef = React.createRef();
    this.formRef = React.createRef();
  }

  handleClick = () => {
    this.setState({ age: 24 })
    this.forceUpdate();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      name: "zwx",
    });

  }

  render() {
    console.log(this.btnRef);
    return (
      <div>
        <form
          ref={this.formRef}
          onSubmit={(e) => {
            const formData = new FormData(e.target);
            e.preventDefault();
            console.log(this.formRef);
            console.log(formData.get("text"), "123123");
          }}
        >
          <input
            type="text"
            name="text"
            placeholder={"placeholder"}
            value={this.state.name}
            onInput={(e) => {
              this.setState({ name: e.target.value });
            }}
          />
          <input type="submit" value="submit"/>
        </form>

        <p>{this.state.name}</p>
        <p>{this.state.age}</p>
        <button
          ref={this.btnRef}
          onClick={() => {
            const { age, timeId } = this.state;
            if (timeId) clearTimeout(timeId);
            setTimeout(() => {
              this.btnRef.current = age;
            }, 1000);
            this.setState({ age: age + 1 });
          }}
        >
          click
        </button>
      </div>
    );
  }
}

function FCC() {
  const [age, setAge] = useState(23);

  const handleClick = () => {
    setAge(age + 1);
    setAge(age - 1);
    setAge(age + 2);
  }

  useEffect(() => {
    const btn = document.getElementById('btn');
    btn.addEventListener('click', handleClick);

    return () => {
      btn.removeEventListener('click', handleClick);
    }
  }, [age]);

  return (
    <div>
      <h2>this is FC</h2>
      <p>{age}</p>
      <button id="btn">FCC Click</button>
    </div>
  );
}

class CCC extends React.Component {
  state = {
    name: "zhangxu",
    age: 23,
  };
  handleClick = () => {
    console.log(this);
    this.setState({ age: this.state.age + 1 });
    this.setState({ age: this.state.age + 1 });
    this.setState({ age: this.state.age + 1 });
    this.setState({ age: this.state.age + 1 });
    console.log(this.state.age);
  };

  render() {
    return (
      <div>
        <h2>this is CCC</h2>
        <p>{this.state.name}</p>
        <p>{this.state.age}</p>
        <button onClick={this.handleClick}>click</button>
      </div>
    );
  }
}

function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(100);
  }, []);

  return (
    <>
      <main>
        {/*<CC />*/}
        {/*<FCC number={count} />*/}
        <FCC/>
        {/*<CCC />*/}
        <div>hello</div>
        <p>world</p>
      </main>
      <div><p></p></div>
    </>


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
  // return <Diff ref={'diffRef'}/>
}

export default App;
