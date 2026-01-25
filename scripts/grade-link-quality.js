#!/usr/bin/env node

/**
 * 链接质量分级脚本
 * A级：官方推免通知页面（包含推免关键词）
 * B级：研究生院通知列表页
 * C级：学院首页或研究生院首页
 * D级：第三方平台或无效链接
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../client/src/data/universities.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const universities = rawData.universities;

// 链接质量分级函数
function gradeLinkQuality(url) {
  if (!url) return 'D';
  
  const urlLower = url.toLowerCase();
  
  // D级：第三方平台
  if (urlLower.includes('lianpp.com') || urlLower.includes('baidu.com')) {
    return 'D';
  }
  
  // A级：包含推免关键词的官方通知
  const noticeKeywords = [
    'tuimian', '推免', 'baoming', '报名', 'jieshou', '接收',
    'notice', 'zhaosheng', '招生', 'shenhe', '审核'
  ];
  if (noticeKeywords.some(kw => urlLower.includes(kw))) {
    return 'A';
  }
  
  // C级：首页
  const homePagePatterns = [
    /\/index\.html?$/i,
    /\/main\.html?$/i,
    /\/$/, // 以斜杠结尾
  ];
  if (homePagePatterns.some(pattern => pattern.test(url))) {
    return 'C';
  }
  
  // B级：其他（通知列表页）
  return 'B';
}

// 为每所院校添加linkGrade
for (const uni of universities) {
  uni.linkGrade = gradeLinkQuality(uni.url);
}

// 写回文件
fs.writeFileSync(dataPath, JSON.stringify(rawData, null, 2), 'utf-8');

// 统计
const grades = { A: 0, B: 0, C: 0, D: 0 };
universities.forEach(uni => {
  grades[uni.linkGrade]++;
});

console.log('✅ 链接质量分级完成\n');
console.log('分级统计:');
console.log(`  A级（官方推免通知）: ${grades.A}所 (${(grades.A/universities.length*100).toFixed(1)}%)`);
console.log(`  B级（通知列表页）: ${grades.B}所 (${(grades.B/universities.length*100).toFixed(1)}%)`);
console.log(`  C级（学院首页）: ${grades.C}所 (${(grades.C/universities.length*100).toFixed(1)}%)`);
console.log(`  D级（第三方平台）: ${grades.D}所 (${(grades.D/universities.length*100).toFixed(1)}%)`);
console.log(`\n数据健康度: ${((grades.A+grades.B)/universities.length*100).toFixed(1)}%`);

// 列出需要修复的院校
const needFix = universities.filter(u => u.linkGrade === 'C' || u.linkGrade === 'D');
if (needFix.length > 0) {
  console.log(`\n⚠️  需要修复的院校 (${needFix.length}所):`);
  needFix.forEach(u => {
    console.log(`  - ${u.name} (${u.tier}) [${u.linkGrade}级]`);
  });
}
