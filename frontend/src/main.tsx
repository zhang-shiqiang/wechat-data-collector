import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import { useThemeStore } from './stores/themeStore';
import App from './App';
import './index.css';

// 初始化主题
const themeStore = useThemeStore.getState();
document.documentElement.setAttribute('data-theme', themeStore.theme);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);

