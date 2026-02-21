/**
 * 百度统计组件
 * 在应用启动时加载百度统计脚本
 */

import { useEffect } from 'react';
import { useLocation } from 'wouter';

// 从环境变量获取百度统计 Site ID
const BAIDU_SITE_ID = import.meta.env.VITE_BAIDU_SITE_ID || '';

// 扩展 window 类型
declare global {
  interface Window {
    _hmt: any[];
  }
}

export function BaiduAnalytics() {
  const [location] = useLocation();

  // 初始化百度统计
  useEffect(() => {
    if (!BAIDU_SITE_ID) return;

    // 如果脚本已存在，不重复加载
    if (document.querySelector(`script[src*="hm.baidu.com"]`)) return;

    // 初始化 _hmt 数组
    window._hmt = window._hmt || [];

    // 动态加载百度统计脚本
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://hm.baidu.com/hm.js?${BAIDU_SITE_ID}`;
    document.head.appendChild(script);
  }, []);

  // 路由变化时上报 PV
  useEffect(() => {
    if (!BAIDU_SITE_ID || !window._hmt) return;

    // 上报页面访问
    window._hmt.push(['_trackPageview', location]);
  }, [location]);

  return null;
}

export default BaiduAnalytics;
