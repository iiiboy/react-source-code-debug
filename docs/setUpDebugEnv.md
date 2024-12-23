# 搭建源码调试环境
使用create-react-app搭建项目，之后执行 npm run eject，将webpack配置文件暴露出来，下载react源码。在src目录下创建源码存放目录： ‘/react’，将React源码（packages文件夹下的所有子文件夹）拷贝到该目录下。
## 修改alias
在config/webpack.config.js中找到alias，进行修改
```
resolve: {
    alias: {
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        // 'react-native': 'react-native-web',
        'react': path.resolve(__dirname, '../src/react/packages/react'),
        'react-dom': path.resolve(__dirname, '../src/react/packages/react-dom'),
        'legacy-events': path.resolve(__dirname, '../src/react/packages/legacy-events'),
        'shared': path.resolve(__dirname, '../src/react/packages/shared'),
        'react-reconciler': path.resolve(__dirname, '../src/react/packages/react-reconciler'),
        // 'react-events': path.resolve(__dirname, '../src/react/packages/events'),
        // 'scheduler': path.resolve(__dirname, '../src/react/packages/scheduler'),
    },
},
```
## 修改环境变量
为config/env.js中的stringifed对象增加属性:
```
  const stringified = {
    'process.env': Object.keys(raw).reduce((env, key) => {
      env[key] = JSON.stringify(raw[key]);
      return env;
    }, {}),

    "__DEV__": false,

    "__PROFILE__": false,

    "__EXPERIMENTAL__": true,

    "__UMD__": true

  };
```
## 关于flow类型检查
安装对应的babel插件忽略flow的类型检查
```
yarn add @babel/plugin-transform-flow-strip-types -D
```
并且在webpack的babel-loader中增加该插件
```
{
    test: /\.(js|mjs|jsx|ts|tsx)$/,
    include: paths.appSrc,
    loader: require.resolve('babel-loader'),
    options: {
        customize: require.resolve(
            'babel-preset-react-app/webpack-overrides'
        ),

        plugins: [
            [
            require.resolve('babel-plugin-named-asset-import'),
            {
                loaderMap: {
                svg: {
                    ReactComponent:
                    '@svgr/webpack?-svgo,+titleProp,+ref![path]',
                },
                },
            },
            ],
            [require.resolve('@babel/plugin-transform-flow-strip-types')] //*************这一行是新加的
        ],
        // This is a feature of `babel-loader` for webpack (not Babel itself).
        // It enables caching results in ./node_modules/.cache/babel-loader/
        // directory for faster rebuilds.
        cacheDirectory: true,
        cacheCompression: isEnvProduction,
        compact: isEnvProduction,
    },
},
```

## 修改ReactSharedInternals
/shared/ReactSharedInternals.js，原有内容注释掉，添加
```
import ReactSharedInternals from '../react/src/ReactSharedInternals';
export default ReactSharedInternals;
```
## 修改ReactFiberHostConfig
修改 /react-reconciler/src/ReactFiberHostConfig.js，原有内容注释掉，
添加一行：
```
export * from './forks/ReactFiberHostConfig.dom';
```

## 关于函数invariant （18版本后已不用修改）
修改 /shared/invariant.js，直接return。不让报错
```
export default function invariant(condition, format, a, b, c, d, e, f) {
  return
  throw new Error(
    'Internal React error: invariant() is meant to be replaced at compile ' +
      'time. There is no runtime version.',
  );
}
```
## 关于scheduler （18版本后已不用修改）
修改 /scheduler/src/Scheduler.js，在最底部加上
```
export {
  unstable_flushAllWithoutAsserting,
  unstable_flushNumberOfYields,
  unstable_flushExpired,
  unstable_clearYields,
  unstable_flushUntilNextPaint,
  unstable_flushAll,
  unstable_yieldValue,
  unstable_advanceTime
} from "./forks/SchedulerHostConfig.mock.js";

export {
  requestHostCallback,
  requestHostTimeout,
  cancelHostTimeout,
  shouldYieldToHost,
  getCurrentTime,
  forceFrameRate,
  requestPaint
} from "./forks/SchedulerHostConfig.default.js";
```

修改src/react/v16.13.1/scheduler/src/SchedulerHostConfig.js，注释掉报错，加上新增内容: *（18版本后已不用修改）*
```
export {
  unstable_flushAllWithoutAsserting,
  unstable_flushNumberOfYields,
  unstable_flushExpired,
  unstable_clearYields,
  unstable_flushUntilNextPaint,
  unstable_flushAll,
  unstable_yieldValue,
  unstable_advanceTime
} from "./forks/SchedulerHostConfig.mock.js";

export {
  requestHostCallback,
  requestHostTimeout,
  cancelHostTimeout,
  shouldYieldToHost,
  getCurrentTime,
  forceFrameRate,
  requestPaint
} from "./forks/SchedulerHostConfig.default.js";

// throw new Error('This module must be shimmed by a specific build.');

```

## 将React 和 ReactDOM默认导出
* /react/index.js
```
import * as React from './src/React' // （该行18版本后已不用修改）
export default React
```
* /react-dom/index.js
```
import * as ReactDOM from './src/client/ReactDOM' // （该行18版本后已不用修改）
export default ReactDOM
```

## 声明空函数
在 scheduler/src/forks/Scheduler.js 增加如下空函数声明：
```javascript
const unstable_yieldValue = () => {}
const unstable_setDisableYieldValue = () => {}

```
然后将它们增加到最下方的export中，暴露出去

```javascript
export {

  ...

  unstable_yieldValue,
  unstable_setDisableYieldValue
};

```

至此搭建完成，即可对源码进行调试。

参考文章：https://segmentfault.com/a/1190000020239791
