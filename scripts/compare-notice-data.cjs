/**
 * 对比通知内容与现有数据的差异
 * 找出所有不一致的地方，不仅是"未注明"
 */

const fs = require('fs');
const path = require('path');

const NOTICES_DIR = path.join(__dirname, '../client/public/data/notices');
const UNIVERSITIES_FILE = path.join(__dirname, '../client/src/data/universities.json');

// 从通知内容提取详细信息
function extractFromNotice(content, schoolId) {
  if (!content || content.length < 100) {
    return null;
  }

  const info = {
    schoolId,
    applicationPeriod: null,
    deadline: null,
    examForm: null,
    englishRequirement: null,
  };

  // ===== 申请时间 =====
  let match = content.match(/(?:预)?报名(?:时间|期间)[：:\s]*[（(]?(\d{1,2}月\d{1,2}日[^）)\n]*(?:至|到|—|-|–)\s*\d{1,2}月\d{1,2}日[^）)\n]*)/);
  if (match) info.applicationPeriod = match[1].trim();

  if (!info.applicationPeriod) {
    match = content.match(/(\d{4}年)?(\d{1,2}月\d{1,2}日)[^\n]*?(?:开始|起)[^\n]*?(?:至|到|—|-|–)[^\n]*?(\d{1,2}月\d{1,2}日)/);
    if (match) info.applicationPeriod = `${match[2]}至${match[3]}`;
  }

  if (!info.applicationPeriod) {
    match = content.match(/网上(?:申请|报名)[：:\s]*(\d{4}年)?(\d{1,2}月\d{1,2}日)[^\n]*/);
    if (match) info.applicationPeriod = match[0].replace(/网上(?:申请|报名)[：:\s]*/, '').trim().substring(0, 50);
  }

  // ===== 截止日期 =====
  match = content.match(/(?:材料)?(?:接收|提交)?截止[：:\s]*(\d{4}年)?(\d{1,2}月\d{1,2}日\d{0,2}[：:]*\d{0,2})/);
  if (match) info.deadline = `${match[1] || ''}${match[2]}`.trim();

  if (!info.deadline) {
    match = content.match(/(\d{1,2}月\d{1,2}日\s*\d{1,2}[：:]\d{2})[前止截]/);
    if (match) info.deadline = match[1];
  }

  if (!info.deadline) {
    match = content.match(/(?:报名|申请).*?(?:截止|截至)[：:\s]*(\d{4}年)?(\d{1,2}月\d{1,2}日[^\n]*)/);
    if (match) info.deadline = `${match[1] || ''}${match[2]}`.trim().substring(0, 30);
  }

  // ===== 考核形式 =====
  const examKeywords = ['线上面试', '线下面试', '现场面试', '远程面试', '笔试+面试', '面试+笔试',
    '专业笔试', '专业面试', '综合面试', '综合笔试', '材料审核', '资格审查'];

  for (const keyword of examKeywords) {
    if (content.includes(keyword)) {
      info.examForm = keyword;
      break;
    }
  }

  if (!info.examForm) {
    match = content.match(/复试[^\n]*?(?:采[用取])?[^\n]*?(线[上下]|现场)?[^\n]*?(面试|笔试)/);
    if (match) {
      const fullMatch = match[0];
      if (fullMatch.includes('线上')) info.examForm = '线上面试';
      else if (fullMatch.includes('线下') || fullMatch.includes('现场')) info.examForm = '线下面试';
      else if (fullMatch.includes('面试') && fullMatch.includes('笔试')) info.examForm = '笔试+面试';
      else if (fullMatch.includes('面试')) info.examForm = '面试';
      else if (fullMatch.includes('笔试')) info.examForm = '笔试';
    }
  }

  if (info.examForm) {
    const validKeywords = ['面试', '笔试', '审核', '考核', '审查'];
    const isValid = validKeywords.some(kw => info.examForm.includes(kw));
    if (!isValid || info.examForm.length < 2 || info.examForm.startsWith('，')) {
      info.examForm = null;
    }
  }

  // ===== 英语要求 =====
  match = content.match(/(?:CET-?4|四级)[^\n]*?(\d{3,})分/);
  let cet4 = match ? `CET-4≥${match[1]}分` : null;

  match = content.match(/(?:CET-?6|六级)[^\n]*?(\d{3,})分/);
  let cet6 = match ? `CET-6≥${match[1]}分` : null;

  match = content.match(/(?:TOEFL|托福)[^\n]*?(\d{2,3})分?/i);
  let toefl = match ? `TOEFL≥${match[1]}分` : null;

  match = content.match(/(?:IELTS|雅思)[^\n]*?(\d\.?\d?)分?/i);
  let ielts = match ? `IELTS≥${match[1]}分` : null;

  const engReqs = [cet4, cet6, toefl, ielts].filter(Boolean);
  if (engReqs.length > 0) {
    info.englishRequirement = engReqs.join('或');
  }

  return info;
}

// 标准化字符串以便比较
function normalize(str) {
  if (!str) return '';
  return str
    .replace(/\s+/g, '')
    .replace(/[：:]/g, ':')
    .replace(/[—–-]/g, '-')
    .replace(/未注明/g, '')
    .trim();
}

// 检查两个值是否本质相同
function isSimilar(a, b) {
  if (!a || !b) return false;
  const na = normalize(a);
  const nb = normalize(b);
  // 如果一个包含另一个，认为是相似的
  return na.includes(nb) || nb.includes(na) || na === nb;
}

// 读取所有通知并提取信息
function processAllNotices() {
  const results = {};
  const files = fs.readdirSync(NOTICES_DIR).filter(f => f.endsWith('.md') && f !== 'undefined.md');

  for (const file of files) {
    const schoolId = parseInt(file.replace('.md', ''));
    if (isNaN(schoolId)) continue;

    const content = fs.readFileSync(path.join(NOTICES_DIR, file), 'utf-8');
    const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n*/, '');

    const info = extractFromNotice(contentWithoutFrontmatter, schoolId);
    if (info) {
      results[schoolId] = info;
    }
  }

  return results;
}

// 比较并生成差异报告
function compareData(extractedData) {
  const data = JSON.parse(fs.readFileSync(UNIVERSITIES_FILE, 'utf-8'));
  const differences = [];
  const fields = ['applicationPeriod', 'deadline', 'examForm', 'englishRequirement'];
  const fieldNames = {
    applicationPeriod: '申请时间',
    deadline: '截止日期',
    examForm: '考核形式',
    englishRequirement: '英语要求',
  };

  for (const university of data.universities) {
    const extracted = extractedData[university.id];
    if (!extracted) continue;

    for (const program of university.programs || []) {
      for (const notice of program.notices || []) {
        const diffs = [];

        for (const field of fields) {
          const currentValue = notice[field] || '';
          const extractedValue = extracted[field] || '';

          // 跳过两边都没数据的情况
          if (!currentValue && !extractedValue) continue;
          if (currentValue === '未注明' && !extractedValue) continue;

          // 检查是否有差异
          if (extractedValue && !isSimilar(currentValue, extractedValue)) {
            diffs.push({
              field: fieldNames[field],
              fieldKey: field,
              current: currentValue || '(空)',
              extracted: extractedValue,
            });
          }
        }

        if (diffs.length > 0) {
          differences.push({
            id: university.id,
            name: university.name,
            program: program.programName,
            diffs,
          });
        }
      }
    }
  }

  return differences;
}

// 主函数
function main() {
  console.log('=== 通知内容与现有数据对比报告 ===\n');

  const extractedData = processAllNotices();
  console.log(`已提取 ${Object.keys(extractedData).length} 所院校的通知信息\n`);

  const differences = compareData(extractedData);

  if (differences.length === 0) {
    console.log('✓ 所有数据与通知内容一致，无需修正。');
    return;
  }

  console.log(`发现 ${differences.length} 条记录与通知内容不一致：\n`);
  console.log('=' .repeat(80));

  for (const diff of differences) {
    console.log(`\n[${diff.id}] ${diff.name} - ${diff.program}`);
    console.log('-'.repeat(60));
    for (const d of diff.diffs) {
      console.log(`  ${d.field}:`);
      console.log(`    现有数据: ${d.current}`);
      console.log(`    通知内容: ${d.extracted}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n总计 ${differences.length} 条记录需要核实`);

  // 生成修正建议文件
  const report = {
    generatedAt: new Date().toISOString(),
    totalDifferences: differences.length,
    differences: differences,
  };

  const reportPath = path.join(__dirname, '../docs/data-diff-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n详细报告已保存至: ${reportPath}`);
}

main();
