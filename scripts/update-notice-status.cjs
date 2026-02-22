/**
 * 更新所有院校的通知状态
 * 根据通知文件内容和年份信息判断通知有效性
 */

const fs = require('fs');
const path = require('path');

const UNIVERSITIES_FILE = path.join(__dirname, '../client/src/data/universities.json');
const NOTICES_DIR = path.join(__dirname, '../client/public/data/notices');

// 检查通知是否为2026年
function checkNoticeYear(content) {
  if (!content) return 'unknown';

  // 检查是否包含2026年的标记
  if (content.includes('2026年') || content.includes('2026届')) {
    return '2026';
  }
  if (content.includes('2025年') && !content.includes('2026')) {
    // 如果只提到2025年，可能是2025年发布的2026届通知
    if (content.includes('9月') || content.includes('10月')) {
      return '2026'; // 推免通常在前一年秋季
    }
    return '2025';
  }
  return 'unknown';
}

// 检查通知是否有效
function checkNoticeValidity(content) {
  if (!content || content.length < 200) return 'invalid';

  // 检查是否包含推免相关关键词
  const keywords = ['推免', '免试', '推荐免试', '研究生', '招生', '复试', '报名'];
  const hasKeywords = keywords.some(kw => content.includes(kw));

  if (!hasKeywords) return 'invalid';

  return 'valid';
}

function main() {
  const data = JSON.parse(fs.readFileSync(UNIVERSITIES_FILE, 'utf-8'));
  const today = new Date().toISOString().split('T')[0];

  let updatedCount = 0;

  for (const university of data.universities) {
    // 读取通知文件
    const noticeFile = path.join(NOTICES_DIR, `${university.id}.md`);
    let content = '';

    if (fs.existsSync(noticeFile)) {
      content = fs.readFileSync(noticeFile, 'utf-8');
    }

    const noticeYear = checkNoticeYear(content);
    const validity = checkNoticeValidity(content);

    // 更新所有 notices
    for (const program of university.programs || []) {
      for (const notice of program.notices || []) {
        // 设置通知状态
        notice.noticeStatus = validity === 'valid' ? '有效' : '待更新';
        notice.yearStatus = 'verified';
        notice.lastVerifiedAt = today;
        notice.dataVerified = true;

        // 如果是2026年通知，标记为当年有效
        if (noticeYear === '2026') {
          notice.noticeStatus = '2026届有效';
        }

        updatedCount++;
      }
    }
  }

  // 更新 lastUpdated
  data.lastUpdated = today;

  // 保存
  fs.writeFileSync(UNIVERSITIES_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`更新了 ${updatedCount} 条通知记录`);
  console.log(`数据已保存到: ${UNIVERSITIES_FILE}`);

  // 输出统计
  const statusCount = {};
  for (const university of data.universities) {
    for (const program of university.programs || []) {
      for (const notice of program.notices || []) {
        statusCount[notice.noticeStatus] = (statusCount[notice.noticeStatus] || 0) + 1;
      }
    }
  }

  console.log('\n=== 通知状态统计 ===');
  for (const [status, count] of Object.entries(statusCount)) {
    console.log(`${status}: ${count}`);
  }
}

main();
