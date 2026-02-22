/**
 * 生成数据完整性状态报告
 */

const fs = require('fs');
const path = require('path');

const UNIVERSITIES_FILE = path.join(__dirname, '../client/src/data/universities.json');
const NOTICES_DIR = path.join(__dirname, '../client/public/data/notices');

function main() {
  const data = JSON.parse(fs.readFileSync(UNIVERSITIES_FILE, 'utf-8'));
  const noticeFiles = new Set(
    fs.readdirSync(NOTICES_DIR)
      .filter(f => f.endsWith('.md') && f !== 'undefined.md')
      .map(f => parseInt(f.replace('.md', '')))
  );

  console.log('=== 院校数据完整性报告 ===\n');
  console.log(`总院校数: ${data.universities.length}`);
  console.log(`通知文件数: ${noticeFiles.size}`);
  console.log(`数据更新日期: ${data.lastUpdated}\n`);

  const stats = {
    hasNoticeFile: 0,
    verified: 0,
    hasApplicationPeriod: 0,
    hasDeadline: 0,
    hasExamForm: 0,
    hasEnglishRequirement: 0,
    linkGradeA: 0,
    linkGradeB: 0,
    linkGradeC: 0,
    linkGradeD: 0,
  };

  const incomplete = [];
  const complete = [];

  for (const university of data.universities) {
    const hasFile = noticeFiles.has(university.id);
    if (hasFile) stats.hasNoticeFile++;

    // 获取第一个 notice 的信息（简化处理）
    const firstProgram = university.programs?.[0];
    const firstNotice = firstProgram?.notices?.[0];

    if (!firstNotice) continue;

    // 统计字段完整性
    if (firstNotice.yearStatus === 'verified') stats.verified++;
    if (firstNotice.applicationPeriod && firstNotice.applicationPeriod !== '未注明') stats.hasApplicationPeriod++;
    if (firstNotice.deadline && firstNotice.deadline !== '未注明') stats.hasDeadline++;
    if (firstNotice.examForm && firstNotice.examForm !== '未注明') stats.hasExamForm++;
    if (firstNotice.englishRequirement && firstNotice.englishRequirement !== '未注明') stats.hasEnglishRequirement++;

    // 链接等级统计
    switch (firstNotice.linkGrade) {
      case 'A': stats.linkGradeA++; break;
      case 'B': stats.linkGradeB++; break;
      case 'C': stats.linkGradeC++; break;
      case 'D': stats.linkGradeD++; break;
    }

    // 检查完整性
    const missingFields = [];
    if (!firstNotice.applicationPeriod || firstNotice.applicationPeriod === '未注明') missingFields.push('申请时间');
    if (!firstNotice.deadline || firstNotice.deadline === '未注明') missingFields.push('截止日期');
    if (!firstNotice.examForm || firstNotice.examForm === '未注明') missingFields.push('考核形式');
    if (!firstNotice.englishRequirement || firstNotice.englishRequirement === '未注明') missingFields.push('英语要求');

    if (missingFields.length > 0) {
      incomplete.push({
        id: university.id,
        name: university.name,
        tier: university.tier,
        missing: missingFields,
        hasFile,
      });
    } else {
      complete.push({
        id: university.id,
        name: university.name,
        tier: university.tier,
      });
    }
  }

  // 输出统计
  console.log('=== 数据完整性统计 ===');
  console.log(`通知文件覆盖: ${stats.hasNoticeFile}/${data.universities.length} (${(stats.hasNoticeFile/data.universities.length*100).toFixed(1)}%)`);
  console.log(`已验证状态: ${stats.verified}/${data.universities.length}`);
  console.log(`申请时间完整: ${stats.hasApplicationPeriod}/${data.universities.length}`);
  console.log(`截止日期完整: ${stats.hasDeadline}/${data.universities.length}`);
  console.log(`考核形式完整: ${stats.hasExamForm}/${data.universities.length}`);
  console.log(`英语要求完整: ${stats.hasEnglishRequirement}/${data.universities.length}`);
  console.log('');

  console.log('=== 链接等级分布 ===');
  console.log(`A级: ${stats.linkGradeA}`);
  console.log(`B级: ${stats.linkGradeB}`);
  console.log(`C级: ${stats.linkGradeC}`);
  console.log(`D级: ${stats.linkGradeD}`);
  console.log('');

  console.log(`=== 信息完整的院校 (${complete.length}所) ===`);
  for (const uni of complete) {
    console.log(`[${uni.id}] ${uni.name} (${uni.tier})`);
  }
  console.log('');

  console.log(`=== 信息不完整的院校 (${incomplete.length}所) ===`);
  // 按缺失字段数排序
  incomplete.sort((a, b) => a.missing.length - b.missing.length);
  for (const uni of incomplete) {
    const fileStatus = uni.hasFile ? '✓' : '✗';
    console.log(`[${uni.id}] ${uni.name} (${uni.tier}) [通知${fileStatus}] 缺: ${uni.missing.join(', ')}`);
  }
}

main();
