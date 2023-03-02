import React, { useState, useEffect } from "react";

export const FunctionDiff1 = () => {
  const [list, setList] = useState([1]);

  useEffect(() => {
    setTimeout(() => {
      setList([1, 2]);
    }, 2000);
  }, []);

  return (
    <>
      {list.map((item) => {
        return <p key={item}>p{item}</p>;
      })}
    </>
  );
};

export const FunctionDiff2 = () => {
  const [list, setList] = useState([1, 2]);

  useEffect(() => {
    setTimeout(() => {
      setList([1]);
    }, 2000);
  }, []);

  return (
    <>
      {list.map((item) => {
        return <p key={item}>p{item}</p>;
      })}
    </>
  );
};

export const FunctionDiff3 = () => {
  const [list, setList] = useState([1, 2]);

  useEffect(() => {
    setTimeout(() => {
      setList([2, 1]);
    }, 2000);
  }, []);

  return (
    <>
      {list.map((item) => {
        return <p key={item}>p{item}</p>;
      })}
    </>
  );
};

export const FunctionDiff4 = () => {
  const [list, setList] = useState([1, 2]);

  useEffect(() => {
    setTimeout(() => {
      setList([1, 3, 2]);
    }, 2000);
  }, []);

  return (
    <>
      {list.map((item) => {
        return <p key={item}>p{item}</p>;
      })}
    </>
  );
};

export const FunctionDiff5 = () => {
  const [list, setList] = useState([1, 2, 3]);

  useEffect(() => {
    setTimeout(() => {
      setList([1, 3]);
    }, 2000);
  }, []);

  return (
    <>
      {list.map((item) => {
        return <p key={item}>p{item}</p>;
      })}
    </>
  );
};

export const FunctionDiff6 = () => {
  const [list, setList] = useState([1, 2, 3, 4, 5]);

  useEffect(() => {
    setTimeout(() => {
      setList([1, 4, 2, 5]);
    }, 2000);
  }, []);

  return (
    <>
      {list.map((item) => {
        return <p key={item}>p{item}</p>;
      })}
    </>
  );
};
