/**
 * 复核通知内容并更新院校数据
 * 从提取的通知文件中读取信息，更新 universities.json
 */

const fs = require('fs');
const path = require('path');

const NOTICES_DIR = path.join(__dirname, '../client/public/data/notices');
const UNIVERSITIES_FILE = path.join(__dirname, '../client/src/data/universities.json');

// 正则匹配模式
const patterns = {
  // 申请时间
  applicationPeriod: [
    /(?:预)?报名(?:时间|期间)[：:]\s*([^\n]+)/,
    /(?:网上)?申请(?:时间)?[：:]\s*([^\n]+)/,
    /(\d{1,2}月\d{1,2}日[^\n]*?(?:至|到|-|—)\s*\d{1,2}月\d{1,2}日[^\n]*)/,
  ],
  // 截止日期
  deadline: [
    /(?:截止|截至)(?:时间|日期)?[：:]\s*([^\n]+)/,
    /(?:报名|申请).*?(?:截止|截至)[：:]?\s*(\d{4}年)?\d{1,2}月\d{1,2}日[^\n]*/,
    /(\d{1,2}月\d{1,2}日\d{1,2}[：:]\d{2})[前止]/,
  ],
  // 考核形式
  examForm: [
    /(?:复试|考核)(?:形式|方式|内容)[：:]\s*([^\n]+)/,
    /采[用取]([^\n]*?面试[^\n]*)/,
    /(?:专业[素质能力]+考[查核]|综合[素质能力]+考[核查])[^\n]*/,
  ],
  // 英语要求
  englishRequirement: [
    /(?:英语|外语)(?:水平|能力)?(?:要求)?[：:]\s*([^\n]+)/,
    /(?:CET-?[46]|四级|六级)[^\n]*?(\d{3,}分)/,
    /(?:TOEFL|托福|IELTS|雅思)[^\n]*?(\d+\.?\d*分?)/,
  ],
};

// 从通知内容中提取信息
function extractInfo(content, schoolId) {
  const info = {
    schoolId,
    applicationPeriod: null,
    deadline: null,
    examForm: null,
    englishRequirement: null,
    hasContent: content && content.length > 100,
  };

  if (!content) return info;

  // 提取申请时间
  for (const pattern of patterns.applicationPeriod) {
    const match = content.match(pattern);
    if (match) {
      info.applicationPeriod = match[1] || match[0];
      break;
    }
  }

  // 提取截止日期
  for (const pattern of patterns.deadline) {
    const match = content.match(pattern);
    if (match) {
      info.deadline = match[1] || match[0];
      break;
    }
  }

  // 提取考核形式
  for (const pattern of patterns.examForm) {
    const match = content.match(pattern);
    if (match) {
      info.examForm = match[1] || match[0];
      break;
    }
  }

  // 提取英语要求
  // 先找完整的英语要求描述
  const engMatch = content.match(/英语[^\n]*?(?:CET|四级|六级|TOEFL|托福|IELTS|雅思)[^\n]*/);
  if (engMatch) {
    info.englishRequirement = engMatch[0].substring(0, 100);
  } else {
    // 尝试其他模式
    for (const pattern of patterns.englishRequirement) {
      const match = content.match(pattern);
      if (match) {
        info.englishRequirement = match[1] || match[0];
        break;
      }
    }
  }

  // 清理提取的信息
  for (const key of ['applicationPeriod', 'deadline', 'examForm', 'englishRequirement']) {
    if (info[key]) {
      info[key] = info[key]
        .replace(/^\s*[：:]\s*/, '')
        .replace(/\*+/g, '')
        .trim()
        .substring(0, 100);
    }
  }

  return info;
}

// 读取所有通知文件
function readAllNotices() {
  const notices = {};
  const files = fs.readdirSync(NOTICES_DIR).filter(f => f.endsWith('.md') && f !== 'undefined.md');

  for (const file of files) {
    const schoolId = parseInt(file.replace('.md', ''));
    if (isNaN(schoolId)) continue;

    const content = fs.readFileSync(path.join(NOTICES_DIR, file), 'utf-8');
    notices[schoolId] = extractInfo(content, schoolId);
    notices[schoolId].rawContent = content;
  }

  return notices;
}

// 更新大学数据
function updateUniversities(notices) {
  const data = JSON.parse(fs.readFileSync(UNIVERSITIES_FILE, 'utf-8'));
  const updates = [];
  const today = new Date().toISOString().split('T')[0];

  for (const university of data.universities) {
    const notice = notices[university.id];
    if (!notice || !notice.hasContent) continue;

    // 遍历所有 programs 和 notices
    for (const program of university.programs || []) {
      for (const programNotice of program.notices || []) {
        let updated = false;
        const changes = [];

        // 更新申请时间
        if (notice.applicationPeriod && (!programNotice.applicationPeriod || programNotice.applicationPeriod === '未注明')) {
          changes.push(`申请时间: ${notice.applicationPeriod}`);
          programNotice.applicationPeriod = notice.applicationPeriod;
          updated = true;
        }

        // 更新截止日期
        if (notice.deadline && (!programNotice.deadline || programNotice.deadline === '未注明')) {
          changes.push(`截止日期: ${notice.deadline}`);
          programNotice.deadline = notice.deadline;
          updated = true;
        }

        // 更新考核形式
        if (notice.examForm && (!programNotice.examForm || programNotice.examForm === '未注明')) {
          changes.push(`考核形式: ${notice.examForm}`);
          programNotice.examForm = notice.examForm;
          updated = true;
        }

        // 更新英语要求
        if (notice.englishRequirement && (!programNotice.englishRequirement || programNotice.englishRequirement === '未注明')) {
          changes.push(`英语要求: ${notice.englishRequirement}`);
          programNotice.englishRequirement = notice.englishRequirement;
          updated = true;
        }

        // 更新验证状态
        if (notice.hasContent) {
          programNotice.yearStatus = 'verified';
          programNotice.lastVerifiedAt = today;
          programNotice.dataVerified = true;
        }

        if (updated) {
          updates.push({
            id: university.id,
            name: university.name,
            program: program.programName,
            changes,
          });
        }
      }
    }
  }

  // 更新 lastUpdated
  data.lastUpdated = today;

  return { data, updates };
}

// 主函数
function main() {
  console.log('=== 开始复核通知信息 ===\n');

  // 读取所有通知
  const notices = readAllNotices();
  console.log(`读取了 ${Object.keys(notices).length} 个通知文件\n`);

  // 统计信息
  let hasApplicationPeriod = 0;
  let hasDeadline = 0;
  let hasExamForm = 0;
  let hasEnglishRequirement = 0;

  for (const [id, info] of Object.entries(notices)) {
    if (info.applicationPeriod) hasApplicationPeriod++;
    if (info.deadline) hasDeadline++;
    if (info.examForm) hasExamForm++;
    if (info.englishRequirement) hasEnglishRequirement++;
  }

  console.log('=== 提取统计 ===');
  console.log(`申请时间: ${hasApplicationPeriod}/${Object.keys(notices).length}`);
  console.log(`截止日期: ${hasDeadline}/${Object.keys(notices).length}`);
  console.log(`考核形式: ${hasExamForm}/${Object.keys(notices).length}`);
  console.log(`英语要求: ${hasEnglishRequirement}/${Object.keys(notices).length}`);
  console.log('');

  // 更新数据
  const { data, updates } = updateUniversities(notices);

  console.log('=== 更新记录 ===');
  for (const update of updates) {
    console.log(`[${update.id}] ${update.name} - ${update.program}:`);
    for (const change of update.changes) {
      console.log(`    - ${change}`);
    }
  }
  console.log(`\n共更新 ${updates.length} 条记录`);

  // 保存更新后的数据
  fs.writeFileSync(UNIVERSITIES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n已保存到: ${UNIVERSITIES_FILE}`);

  // 输出部分提取示例
  console.log('\n=== 提取示例 ===');
  const examples = [1, 2, 3, 11, 14, 15].filter(id => notices[id]);
  for (const id of examples) {
    const info = notices[id];
    console.log(`\n[${id}]:`);
    console.log(`  申请时间: ${info.applicationPeriod || '未提取到'}`);
    console.log(`  截止日期: ${info.deadline || '未提取到'}`);
    console.log(`  考核形式: ${info.examForm || '未提取到'}`);
    console.log(`  英语要求: ${info.englishRequirement || '未提取到'}`);
  }
}

main();
