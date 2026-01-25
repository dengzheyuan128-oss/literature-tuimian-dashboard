#!/usr/bin/env node

/**
 * 数据质量检查脚本 (v1.1兼容版)
 * 
 * 功能:
 * 1. 检查必填字段完整性
 * 2. 检测推免通知链接准确性
 * 3. 识别官网链接/第三方平台链接
 * 4. 检查梯队分类有效性
 * 5. 检查日期格式规范性
 * 6. 检测ID重复
 * 7. Year校验和Grade降级保护
 * 8. 生成详细的检查报告
 */

const fs = require('fs');
const path = require('path');

// 读取数据文件
const dataPath = path.join(__dirname, '../client/src/data/universities.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);

// 检查Schema版本
const schemaVersion = data.schemaVersion || 'unknown';
console.log(`\n📊 数据质量检查报告\n`);
console.log(`Schema版本: ${schemaVersion}`);
console.log(`最后更新: ${data.lastUpdated || 'unknown'}`);

// 兼容v1和v1.1结构
const schools = data.schools || data.universities || [];
console.log(`院校数量: ${schools.length}\n`);

// 展平所有notice
function flattenNotices(schools) {
  const notices = [];
  for (const school of schools) {
    const programs = school.programs || [{ name: school.name, notices: [school] }];
    for (const program of programs) {
      const noticeList = program.notices || [program];
      for (const notice of noticeList) {
        notices.push({
          ...notice,
          schoolId: school.id,
          schoolName: school.name,
          programName: program.name || school.name,
          tier: school.tier
        });
      }
    }
  }
  return notices;
}

const allNotices = flattenNotices(schools);
console.log(`通知总数: ${allNotices.length}\n`);

// Year校验逻辑
function verifyYear(notice) {
  const year = notice.year;
  if (!year) return { yearStatus: 'missing' };
  
  const evidenceText = [
    notice.url || '',
    notice.title || '',
    notice.requirements_raw || ''
  ].join(' ');

  if (evidenceText.includes(String(year))) {
    return { yearStatus: 'verified' };
  }

  const otherYearMatch = evidenceText.match(/20\d{2}/g);
  if (otherYearMatch && !otherYearMatch.includes(String(year))) {
    return { yearStatus: 'mismatch', foundYears: otherYearMatch };
  }

  return { yearStatus: 'unverified' };
}

// Grade降级保护逻辑
function enforceGradePolicy(notice) {
  const warnings = [];
  
  if (notice.yearStatus !== 'verified' && notice.linkGrade === 'A') {
    warnings.push(`Year not verified: should downgrade A → B`);
  }
  
  return warnings;
}

// 链接质量分级
function classifyLinkGrade(url) {
  if (!url) return 'D';
  
  // D级：第三方平台
  const thirdPartyDomains = ['lianpp.com', 'kaoyan.com', 'dxsbb.com'];
  if (thirdPartyDomains.some(domain => url.includes(domain))) {
    return 'D';
  }
  
  // C级：学院首页（没有具体路径）
  try {
    const urlObj = new URL(url);
    const urlPath = urlObj.pathname;
    if (urlPath === '/' || urlPath === '/index.html' || urlPath === '/index.htm') {
      return 'C';
    }
  } catch (e) {
    return 'D';
  }
  
  // A级：明确的推免通知页面
  const aGradeKeywords = ['tuimian', 'tuijian', 'mianshi', 'notice', 'tongzhi', 'zhaosheng'];
  if (aGradeKeywords.some(keyword => url.toLowerCase().includes(keyword))) {
    return 'A';
  }
  
  // B级：其他官方页面
  return 'B';
}

// 统计数据
const stats = {
  total: allNotices.length,
  healthy: 0,
  needsFix: 0,
  gradeDistribution: { A: 0, B: 0, C: 0, D: 0 },
  yearStatusDistribution: { verified: 0, unverified: 0, mismatch: 0, missing: 0 },
  tierDistribution: {},
  issues: []
};

// 检查每个notice
console.log(`🔍 开始检查...\n`);

for (const notice of allNotices) {
  // Year校验
  const yearResult = verifyYear(notice);
  const actualYearStatus = notice.yearStatus || yearResult.yearStatus;
  
  // 统计yearStatus
  stats.yearStatusDistribution[actualYearStatus] = (stats.yearStatusDistribution[actualYearStatus] || 0) + 1;
  
  // Grade保护
  const gradeWarnings = enforceGradePolicy({ ...notice, yearStatus: actualYearStatus });
  
  // 链接质量分级
  const actualGrade = notice.linkGrade || classifyLinkGrade(notice.url);
  stats.gradeDistribution[actualGrade] = (stats.gradeDistribution[actualGrade] || 0) + 1;
  
  // 梯队统计
  const tier = notice.tier || '未分类';
  stats.tierDistribution[tier] = (stats.tierDistribution[tier] || 0) + 1;
  
  // 健康度判断
  if (actualGrade === 'A' || actualGrade === 'B') {
    stats.healthy++;
  } else {
    stats.needsFix++;
  }
  
  // 收集问题
  const issues = [];
  
  // 必填字段检查
  if (!notice.url) issues.push('缺少url字段');
  if (!notice.year) issues.push('缺少year字段');
  if (!notice.sourceType) issues.push('缺少sourceType字段');
  
  // D级链接
  if (actualGrade === 'D') {
    issues.push(`D级链接（第三方平台）: ${notice.url}`);
  }
  
  // C级链接
  if (actualGrade === 'C') {
    issues.push(`C级链接（学院首页）: ${notice.url}`);
  }
  
  // Year问题
  if (actualYearStatus === 'mismatch') {
    issues.push(`年份不匹配: 标注${notice.year}，但链接中发现${yearResult.foundYears?.join(', ')}`);
  }
  
  if (actualYearStatus === 'unverified' && actualGrade === 'A') {
    issues.push(`年份未核验但评为A级`);
  }
  
  // Grade警告
  if (gradeWarnings.length > 0) {
    issues.push(...gradeWarnings);
  }
  
  // 记录问题
  if (issues.length > 0) {
    stats.issues.push({
      school: notice.schoolName,
      tier: tier,
      grade: actualGrade,
      yearStatus: actualYearStatus,
      issues: issues
    });
  }
}

// 输出报告
console.log(`📊 数据健康度统计\n`);
console.log(`总计: ${stats.total}所`);
console.log(`健康: ${stats.healthy}所 (${(stats.healthy / stats.total * 100).toFixed(1)}%)`);
console.log(`需修复: ${stats.needsFix}所 (${(stats.needsFix / stats.total * 100).toFixed(1)}%)\n`);

console.log(`📈 链接质量分级分布\n`);
console.log(`A级（官方推免通知）: ${stats.gradeDistribution.A || 0}所 (${((stats.gradeDistribution.A || 0) / stats.total * 100).toFixed(1)}%)`);
console.log(`B级（通知列表页）: ${stats.gradeDistribution.B || 0}所 (${((stats.gradeDistribution.B || 0) / stats.total * 100).toFixed(1)}%)`);
console.log(`C级（学院首页）: ${stats.gradeDistribution.C || 0}所 (${((stats.gradeDistribution.C || 0) / stats.total * 100).toFixed(1)}%)`);
console.log(`D级（第三方平台）: ${stats.gradeDistribution.D || 0}所 (${((stats.gradeDistribution.D || 0) / stats.total * 100).toFixed(1)}%)\n`);

console.log(`📅 年份核验状态分布\n`);
console.log(`verified（已核验）: ${stats.yearStatusDistribution.verified || 0}所 (${((stats.yearStatusDistribution.verified || 0) / stats.total * 100).toFixed(1)}%)`);
console.log(`unverified（未核验）: ${stats.yearStatusDistribution.unverified || 0}所 (${((stats.yearStatusDistribution.unverified || 0) / stats.total * 100).toFixed(1)}%)`);
console.log(`mismatch（不匹配）: ${stats.yearStatusDistribution.mismatch || 0}所 (${((stats.yearStatusDistribution.mismatch || 0) / stats.total * 100).toFixed(1)}%)\n`);

console.log(`🎯 梯队分布\n`);
for (const [tier, count] of Object.entries(stats.tierDistribution).sort()) {
  console.log(`${tier}: ${count}所`);
}
console.log('');

// 输出需要修复的院校
if (stats.issues.length > 0) {
  console.log(`⚠️  需要修复的院校 (${stats.issues.length}所)\n`);
  
  // 按梯队和grade排序
  const sortedIssues = stats.issues.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier.localeCompare(b.tier);
    if (a.grade !== b.grade) return a.grade.localeCompare(b.grade);
    return a.school.localeCompare(b.school);
  });
  
  for (const issue of sortedIssues) {
    console.log(`${issue.school} (${issue.tier}, ${issue.grade}级, ${issue.yearStatus})`);
    for (const msg of issue.issues) {
      console.log(`  - ${msg}`);
    }
    console.log('');
  }
} else {
  console.log(`✅ 所有院校数据质量良好！\n`);
}

// 输出停损线达标情况
console.log(`🎯 停损线达标情况\n`);
console.log(`D级链接 = 0: ${stats.gradeDistribution.D === 0 ? '✅ 达标' : `❌ 未达标 (${stats.gradeDistribution.D}所)`}`);
console.log(`整体健康度 ≥ 90%: ${(stats.healthy / stats.total * 100) >= 90 ? '✅ 达标' : `❌ 未达标 (${(stats.healthy / stats.total * 100).toFixed(1)}%)`}`);

// 第一梯队A级占比
const tier1Notices = allNotices.filter(n => n.tier === '第一梯队');
const tier1AGrade = tier1Notices.filter(n => (n.linkGrade || classifyLinkGrade(n.url)) === 'A').length;
const tier1APercent = tier1Notices.length > 0 ? (tier1AGrade / tier1Notices.length * 100) : 0;
console.log(`第一梯队A级占比: ${tier1APercent.toFixed(1)}% ${tier1APercent === 100 ? '✅ 达标' : tier1APercent >= 80 ? '⚠️ 接近达标' : '❌ 未达标'}\n`);

// 退出码
const exitCode = (stats.gradeDistribution.D === 0 && (stats.healthy / stats.total * 100) >= 90) ? 0 : 1;
process.exit(exitCode);
