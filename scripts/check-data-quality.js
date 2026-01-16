#!/usr/bin/env node

/**
 * 数据质量检查脚本
 * 用于检查 universities.json 中的数据完整性和准确性
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取数据文件
const dataPath = path.join(__dirname, '../client/src/data/universities.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// 检查结果统计
const issues = {
  missingUrl: [],
  officialWebsiteAsNotice: [],
  missingRequiredFields: [],
  invalidTier: [],
  invalidDate: [],
  duplicateIds: [],
  suspiciousUrls: [],
};

let totalChecked = 0;
let totalIssues = 0;

// 检查是否为官网链接或非推免通知链接
function isOfficialWebsite(url) {
  if (!url) return false;
  
  // 检查是否包含推免相关关键词
  const noticeKeywords = [
    'tuimian', '推免', 'baoming', '报名', 'shenhe', '审核', 
    'mianshi', '面试', 'notice', 'announcement', 'zhaosheng', '招生',
    'jieshou', '接收', 'baoyan', '保研', 'shuoshi', '硕士'
  ];
  
  const urlLower = url.toLowerCase();
  const hasNoticeKeyword = noticeKeywords.some(keyword => urlLower.includes(keyword));
  
  // 如果包含推免关键词，认为是正确的通知链接
  if (hasNoticeKeyword) return false;
  
  // 检查是否为首页或简介页
  const homePagePatterns = [
    /\/index\.html?$/i,
    /\/main\.html?$/i,
    /\/default\.html?$/i,
    /\/$/, // 以斜杠结尾
    /\/about/i,
    /\/introduction/i,
    /\/jyjx\/?$/i, // 教育教学首页
    /\/yjsjy\/?$/i, // 研究生教育首页
  ];
  
  return homePagePatterns.some(pattern => pattern.test(url));
}

// 检查链接是否可疑（可能已失效或不准确）
function isSuspiciousUrl(url) {
  if (!url) return false;
  
  const suspiciousPatterns = [
    /lianpp\.com/i, // 第三方链接平台
    /baidu\.com/i,  // 百度链接
    /google\.com/i, // Google链接
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(url));
}

// 检查日期格式
function isValidDate(dateStr) {
  if (!dateStr) return false;
  
  // 允许的日期格式
  const datePatterns = [
    /^\d{4}年\d{1,2}月\d{1,2}日$/, // 2024年10月15日
    /^\d{4}年\d{1,2}月(初|中旬|下旬)$/, // 2024年10月初
    /^另行通知$/,
    /^待定$/,
  ];
  
  return datePatterns.some(pattern => pattern.test(dateStr));
}

// 检查梯队有效性
function isValidTier(tier) {
  return ['第一梯队', '第二梯队', '第三梯队', '第四梯队', '第五梯队'].includes(tier);
}

// 必填字段
const requiredFields = ['id', 'name', 'tier', 'degreeType', 'specialty', 'deadline', 'url'];

console.log('🔍 开始检查数据质量...\n');
console.log('=' .repeat(80));

// 用于检测重复ID
const idSet = new Set();

data.forEach((university, index) => {
  totalChecked++;
  
  console.log(`\n检查 [${index + 1}/${data.length}]: ${university.name}`);
  
  // 1. 检查必填字段
  const missingFields = requiredFields.filter(field => !university[field]);
  if (missingFields.length > 0) {
    issues.missingRequiredFields.push({
      name: university.name,
      fields: missingFields,
    });
    console.log(`  ❌ 缺少必填字段: ${missingFields.join(', ')}`);
    totalIssues++;
  }
  
  // 2. 检查ID重复
  if (idSet.has(university.id)) {
    issues.duplicateIds.push(university.name);
    console.log(`  ❌ ID重复: ${university.id}`);
    totalIssues++;
  } else {
    idSet.add(university.id);
  }
  
  // 3. 检查梯队有效性
  if (!isValidTier(university.tier)) {
    issues.invalidTier.push({
      name: university.name,
      tier: university.tier,
    });
    console.log(`  ❌ 梯队无效: ${university.tier}`);
    totalIssues++;
  }
  
  // 4. 检查日期格式
  if (!isValidDate(university.deadline)) {
    issues.invalidDate.push({
      name: university.name,
      date: university.deadline,
    });
    console.log(`  ⚠️  日期格式可能不规范: ${university.deadline}`);
  }
  
  // 5. 检查推免通知链接
  if (!university.url) {
    issues.missingUrl.push(university.name);
    console.log(`  ❌ 缺少推免通知链接`);
    totalIssues++;
  } else {
    // 检查是否为可疑链接
    if (isSuspiciousUrl(university.url)) {
      issues.suspiciousUrls.push({
        name: university.name,
        url: university.url,
      });
      console.log(`  ⚠️  可疑链接（第三方平台或搜索引擎）`);
      console.log(`     URL: ${university.url}`);
      totalIssues++;
    }
    // 检查是否为官网首页
    else if (isOfficialWebsite(university.url)) {
      issues.officialWebsiteAsNotice.push({
        name: university.name,
        url: university.url,
      });
      console.log(`  ⚠️  疑似使用官网链接而非推免通知链接`);
      console.log(`     URL: ${university.url}`);
      totalIssues++;
    } else {
      console.log(`  ✅ 通知链接正常`);
    }
  }
});

// 输出检查报告
console.log('\n' + '='.repeat(80));
console.log('\n📊 数据质量检查报告\n');
console.log(`总计检查: ${totalChecked} 所院校`);
console.log(`发现问题: ${totalIssues} 个\n`);

if (issues.missingUrl.length > 0) {
  console.log(`❌ 缺少推免通知链接 (${issues.missingUrl.length}所):`);
  issues.missingUrl.forEach(name => console.log(`   - ${name}`));
  console.log('');
}

if (issues.officialWebsiteAsNotice.length > 0) {
  console.log(`⚠️  疑似使用官网链接而非推免通知 (${issues.officialWebsiteAsNotice.length}所):`);
  issues.officialWebsiteAsNotice.forEach(item => {
    console.log(`   - ${item.name}`);
    console.log(`     ${item.url}`);
  });
  console.log('');
}

if (issues.suspiciousUrls.length > 0) {
  console.log(`⚠️  可疑链接（第三方平台） (${issues.suspiciousUrls.length}所):`);
  issues.suspiciousUrls.forEach(item => {
    console.log(`   - ${item.name}`);
    console.log(`     ${item.url}`);
  });
  console.log('');
}

if (issues.missingRequiredFields.length > 0) {
  console.log(`❌ 缺少必填字段 (${issues.missingRequiredFields.length}所):`);
  issues.missingRequiredFields.forEach(item => {
    console.log(`   - ${item.name}: ${item.fields.join(', ')}`);
  });
  console.log('');
}

if (issues.invalidTier.length > 0) {
  console.log(`❌ 梯队无效 (${issues.invalidTier.length}所):`);
  issues.invalidTier.forEach(item => {
    console.log(`   - ${item.name}: ${item.tier}`);
  });
  console.log('');
}

if (issues.duplicateIds.length > 0) {
  console.log(`❌ ID重复 (${issues.duplicateIds.length}所):`);
  issues.duplicateIds.forEach(name => console.log(`   - ${name}`));
  console.log('');
}

// 输出建议
console.log('💡 修复建议:\n');

if (issues.officialWebsiteAsNotice.length > 0 || issues.suspiciousUrls.length > 0) {
  console.log('1. 对于使用官网链接或可疑链接的院校，请访问其研究生院或文学院官网');
  console.log('   搜索最新的推免招生通知，更新为具体的通知页面链接');
  console.log('   推免通知通常包含关键词：推免、保研、接收、报名、审核等\n');
}

if (issues.missingUrl.length > 0) {
  console.log('2. 对于缺少通知链接的院校，请补充完整的推免招生通知URL\n');
}

console.log('3. 推免通知链接应该指向具体的招生通知页面，而不是：');
console.log('   - 学院首页');
console.log('   - 研究生院首页');
console.log('   - 学院简介页面');
console.log('   - 通用的招生信息栏目');
console.log('   - 第三方链接平台（如lianpp.com）\n');

console.log('4. 推免通知链接获取方法：');
console.log('   a. 访问学校研究生院官网（通常为 grs.xxx.edu.cn 或 yjsy.xxx.edu.cn）');
console.log('   b. 查找"通知公告"、"招生信息"、"推免招生"等栏目');
console.log('   c. 搜索包含"推免"、"保研"、"接收"、"2024年"、"2025年"等关键词的通知');
console.log('   d. 确认链接指向具体的招生通知文件或页面');
console.log('   e. 复制完整的URL并更新到数据文件中\n');

// 统计信息
const healthyCount = totalChecked - issues.officialWebsiteAsNotice.length - issues.suspiciousUrls.length - issues.missingUrl.length;
const healthyRate = ((healthyCount / totalChecked) * 100).toFixed(1);

console.log('📈 数据健康度统计:\n');
console.log(`   健康链接: ${healthyCount}所 (${healthyRate}%)`);
console.log(`   需要修复: ${issues.officialWebsiteAsNotice.length + issues.suspiciousUrls.length + issues.missingUrl.length}所 (${(100 - healthyRate).toFixed(1)}%)\n`);

// 退出码
if (totalIssues > 0) {
  console.log('⚠️  数据质量检查发现问题，建议修复后重新检查\n');
  console.log('提示：可以先修复高优先级问题（❌标记），再处理警告问题（⚠️标记）\n');
  process.exit(1);
} else {
  console.log('✅ 数据质量检查通过！\n');
  process.exit(0);
}
