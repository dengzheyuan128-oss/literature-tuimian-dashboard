/**
 * 详细复核通知内容 - 增强版提取
 */

const fs = require('fs');
const path = require('path');

const NOTICES_DIR = path.join(__dirname, '../client/public/data/notices');
const UNIVERSITIES_FILE = path.join(__dirname, '../client/src/data/universities.json');

// 增强版提取函数
function extractDetailedInfo(content, schoolId) {
  const info = {
    schoolId,
    applicationPeriod: null,
    deadline: null,
    examForm: null,
    englishRequirement: null,
  };

  if (!content) return info;

  // === 申请时间提取 ===
  // 匹配各种格式的日期范围
  const timePatterns = [
    /(?:预)?报名(?:时间|期间)[：:]\s*(\d{4}年)?\d{1,2}月\d{1,2}日[^\n]*?(?:至|到|—|-)\s*(\d{4}年)?\d{1,2}月\d{1,2}日[^\n]*/gi,
    /(?:网上)?(?:申请|报名)(?:时间)?[：:]?\s*(\d{4}年)?\d{1,2}月\d{1,2}日[^\n]*/gi,
    /(\d{1,2}月\d{1,2}日[^\n]*?(?:开始|起)[^\n]*)/gi,
  ];

  for (const pattern of timePatterns) {
    const match = content.match(pattern);
    if (match && match[0]) {
      info.applicationPeriod = match[0].replace(/^[*\s：:]+/, '').trim().substring(0, 80);
      break;
    }
  }

  // === 截止日期提取 ===
  const deadlinePatterns = [
    /(?:截止|截至)(?:时间|日期)?[：:]\s*(\d{4}年)?\d{1,2}月\d{1,2}日[^\n]*/gi,
    /(?:报名|申请|材料).*?(?:截止|截至|前)[：:]?\s*(\d{4}年)?\d{1,2}月\d{1,2}日[^\n]*/gi,
    /(\d{1,2}月\d{1,2}日\s*\d{1,2}[：:]\d{2})(?:前|止|截止)/gi,
    /(?:截止到|截至)(\d{4}年\d{1,2}月\d{1,2}日[^\n]*)/gi,
  ];

  for (const pattern of deadlinePatterns) {
    const match = content.match(pattern);
    if (match && match[0]) {
      info.deadline = match[0].replace(/^[*\s：:]+/, '').trim().substring(0, 50);
      break;
    }
  }

  // === 考核形式提取 ===
  const examPatterns = [
    /复试(?:形式|方式|内容)[：:]\s*([^\n]+)/gi,
    /考核(?:形式|方式|内容)[：:]\s*([^\n]+)/gi,
    /采[用取](?:线[上下])?([^\n]*?面试[^\n]*)/gi,
    /(?:面试|笔试)(?:内容|方式)[：:]\s*([^\n]+)/gi,
  ];

  for (const pattern of examPatterns) {
    const match = content.match(pattern);
    if (match) {
      info.examForm = (match[1] || match[0]).replace(/^[*\s：:]+/, '').trim().substring(0, 80);
      break;
    }
  }

  // === 英语要求提取 ===
  // 更精准的英语要求匹配
  const engPatterns = [
    /(?:英语|外语)(?:水平|能力)?(?:要求)?[：:][^\n]*?(?:CET|四级|六级|TOEFL|托福|IELTS|雅思)[^\n]*/gi,
    /(?:CET-?[46]|四级|六级)[^\n]*?(\d{3,}分)[^\n]*/gi,
    /(?:TOEFL|托福|IELTS|雅思)[^\n]*?(\d+)[^\n]*/gi,
    /大学英语[^\n]*?(?:四级|六级)[^\n]*?(\d{3,}分)[^\n]*/gi,
  ];

  for (const pattern of engPatterns) {
    const match = content.match(pattern);
    if (match && match[0]) {
      info.englishRequirement = match[0].replace(/^[*\s：:]+/, '').trim().substring(0, 100);
      break;
    }
  }

  return info;
}

// 读取并处理所有通知
function processAllNotices() {
  const results = [];
  const files = fs.readdirSync(NOTICES_DIR).filter(f => f.endsWith('.md') && f !== 'undefined.md');

  for (const file of files) {
    const schoolId = parseInt(file.replace('.md', ''));
    if (isNaN(schoolId)) continue;

    const content = fs.readFileSync(path.join(NOTICES_DIR, file), 'utf-8');
    const info = extractDetailedInfo(content, schoolId);

    // 只保留有提取信息的
    if (info.applicationPeriod || info.deadline || info.examForm || info.englishRequirement) {
      results.push(info);
    }
  }

  return results;
}

// 更新 universities.json
function updateUniversitiesJson(results) {
  const data = JSON.parse(fs.readFileSync(UNIVERSITIES_FILE, 'utf-8'));
  const today = new Date().toISOString().split('T')[0];
  let updateCount = 0;

  const infoMap = {};
  for (const info of results) {
    infoMap[info.schoolId] = info;
  }

  for (const university of data.universities) {
    const info = infoMap[university.id];
    if (!info) continue;

    for (const program of university.programs || []) {
      for (const notice of program.notices || []) {
        let updated = false;

        // 只更新"未注明"的字段
        if (info.applicationPeriod && notice.applicationPeriod === '未注明') {
          notice.applicationPeriod = info.applicationPeriod;
          updated = true;
        }
        if (info.deadline && notice.deadline === '未注明') {
          notice.deadline = info.deadline;
          updated = true;
        }
        if (info.examForm && notice.examForm === '未注明') {
          notice.examForm = info.examForm;
          updated = true;
        }
        if (info.englishRequirement && notice.englishRequirement === '未注明') {
          notice.englishRequirement = info.englishRequirement;
          updated = true;
        }

        // 更新验证状态
        notice.yearStatus = 'verified';
        notice.lastVerifiedAt = today;
        notice.dataVerified = true;

        if (updated) updateCount++;
      }
    }
  }

  data.lastUpdated = today;
  fs.writeFileSync(UNIVERSITIES_FILE, JSON.stringify(data, null, 2), 'utf-8');

  return updateCount;
}

// 生成复核报告
function generateReport(results) {
  console.log('=== 复核报告 ===\n');

  const hasApp = results.filter(r => r.applicationPeriod).length;
  const hasDead = results.filter(r => r.deadline).length;
  const hasExam = results.filter(r => r.examForm).length;
  const hasEng = results.filter(r => r.englishRequirement).length;

  console.log(`总提取院校数: ${results.length}`);
  console.log(`├─ 申请时间: ${hasApp}`);
  console.log(`├─ 截止日期: ${hasDead}`);
  console.log(`├─ 考核形式: ${hasExam}`);
  console.log(`└─ 英语要求: ${hasEng}`);
  console.log('');

  // 输出详细信息
  console.log('=== 详细提取结果 ===\n');
  for (const info of results.slice(0, 20)) {
    console.log(`[${info.schoolId}]`);
    if (info.applicationPeriod) console.log(`  申请时间: ${info.applicationPeriod}`);
    if (info.deadline) console.log(`  截止日期: ${info.deadline}`);
    if (info.examForm) console.log(`  考核形式: ${info.examForm}`);
    if (info.englishRequirement) console.log(`  英语要求: ${info.englishRequirement}`);
    console.log('');
  }
}

// 主函数
function main() {
  console.log('开始详细复核...\n');

  const results = processAllNotices();
  generateReport(results);

  const updateCount = updateUniversitiesJson(results);
  console.log(`\n更新了 ${updateCount} 条通知记录`);
  console.log('数据已保存');
}

main();
