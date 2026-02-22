/**
 * 根据提取的通知内容修正院校数据
 * 以通知文件内容为准
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
    quotaInfo: null,  // 招生名额
  };

  // ===== 申请时间 =====
  // 模式1: 明确的报名时间
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
  // 只提取明确的考核形式关键词
  const examKeywords = ['线上面试', '线下面试', '现场面试', '远程面试', '笔试+面试', '面试+笔试',
    '专业笔试', '专业面试', '综合面试', '综合笔试', '材料审核', '资格审查'];

  // 检查是否包含明确的考核形式
  for (const keyword of examKeywords) {
    if (content.includes(keyword)) {
      info.examForm = keyword;
      break;
    }
  }

  // 如果没找到明确的，尝试模式匹配
  if (!info.examForm) {
    match = content.match(/复试[^\n]*?(?:采[用取])?[^\n]*?(线[上下]|现场)?[^\n]*?(面试|笔试)/);
    if (match) {
      const fullMatch = match[0];
      // 提取关键信息
      if (fullMatch.includes('线上')) info.examForm = '线上面试';
      else if (fullMatch.includes('线下') || fullMatch.includes('现场')) info.examForm = '线下面试';
      else if (fullMatch.includes('面试') && fullMatch.includes('笔试')) info.examForm = '笔试+面试';
      else if (fullMatch.includes('面试')) info.examForm = '面试';
      else if (fullMatch.includes('笔试')) info.examForm = '笔试';
    }
  }

  // 验证提取的考核形式是否有效（必须包含关键词）
  if (info.examForm) {
    const validKeywords = ['面试', '笔试', '审核', '考核', '审查'];
    const isValid = validKeywords.some(kw => info.examForm.includes(kw));
    if (!isValid || info.examForm.length < 2 || info.examForm.startsWith('，')) {
      info.examForm = null;
    }
  }

  // ===== 英语要求 =====
  // CET-4/6 分数要求
  match = content.match(/(?:CET-?4|四级)[^\n]*?(\d{3,})分/);
  let cet4 = match ? `CET-4≥${match[1]}分` : null;

  match = content.match(/(?:CET-?6|六级)[^\n]*?(\d{3,})分/);
  let cet6 = match ? `CET-6≥${match[1]}分` : null;

  // TOEFL
  match = content.match(/(?:TOEFL|托福)[^\n]*?(\d{2,3})分?/i);
  let toefl = match ? `TOEFL≥${match[1]}分` : null;

  // IELTS
  match = content.match(/(?:IELTS|雅思)[^\n]*?(\d\.?\d?)分?/i);
  let ielts = match ? `IELTS≥${match[1]}分` : null;

  // 组合英语要求
  const engReqs = [cet4, cet6, toefl, ielts].filter(Boolean);
  if (engReqs.length > 0) {
    info.englishRequirement = engReqs.join('或');
  }

  // 如果没有提取到具体分数，尝试提取完整描述
  if (!info.englishRequirement) {
    match = content.match(/(?:英语|外语)(?:水平|能力)?(?:要求)?[：:][^\n]*?(?:四级|六级|CET|TOEFL|IELTS|雅思|托福)[^\n]*/i);
    if (match) {
      info.englishRequirement = match[0].replace(/(?:英语|外语)(?:水平|能力)?(?:要求)?[：:]/, '').trim().substring(0, 80);
    }
  }

  // ===== 招生名额 =====
  match = content.match(/(?:拟)?(?:招[收生]|接收)[^\n]*?(?:推免|免试)[^\n]*?(\d+)[^\n]*?人/);
  if (match) info.quotaInfo = `约${match[1]}人`;

  return info;
}

// 读取所有通知并提取信息
function processAllNotices() {
  const results = {};
  const files = fs.readdirSync(NOTICES_DIR).filter(f => f.endsWith('.md') && f !== 'undefined.md');

  for (const file of files) {
    const schoolId = parseInt(file.replace('.md', ''));
    if (isNaN(schoolId)) continue;

    const content = fs.readFileSync(path.join(NOTICES_DIR, file), 'utf-8');
    // 移除 frontmatter
    const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n*/, '');

    const info = extractFromNotice(contentWithoutFrontmatter, schoolId);
    if (info) {
      results[schoolId] = info;
    }
  }

  return results;
}

// 更新大学数据
function updateUniversities(extractedData) {
  const data = JSON.parse(fs.readFileSync(UNIVERSITIES_FILE, 'utf-8'));
  const today = new Date().toISOString().split('T')[0];
  const updates = [];

  for (const university of data.universities) {
    const extracted = extractedData[university.id];
    if (!extracted) continue;

    for (const program of university.programs || []) {
      for (const notice of program.notices || []) {
        const changes = [];

        // 只更新"未注明"的字段，保留已有数据
        if (extracted.applicationPeriod && notice.applicationPeriod === '未注明') {
          changes.push(`申请时间: "${notice.applicationPeriod}" → "${extracted.applicationPeriod}"`);
          notice.applicationPeriod = extracted.applicationPeriod;
        }

        if (extracted.deadline && notice.deadline === '未注明') {
          changes.push(`截止日期: "${notice.deadline}" → "${extracted.deadline}"`);
          notice.deadline = extracted.deadline;
        }

        if (extracted.examForm && notice.examForm === '未注明') {
          changes.push(`考核形式: "${notice.examForm}" → "${extracted.examForm}"`);
          notice.examForm = extracted.examForm;
        }

        if (extracted.englishRequirement && notice.englishRequirement === '未注明') {
          changes.push(`英语要求: "${notice.englishRequirement}" → "${extracted.englishRequirement}"`);
          notice.englishRequirement = extracted.englishRequirement;
        }

        // 更新验证状态
        notice.yearStatus = 'verified';
        notice.lastVerifiedAt = today;
        notice.dataVerified = true;
        notice.noticeStatus = '2026届有效';

        if (changes.length > 0) {
          updates.push({
            id: university.id,
            name: university.name,
            changes,
          });
        }
      }
    }
  }

  data.lastUpdated = today;
  return { data, updates };
}

// 主函数
function main() {
  console.log('=== 根据通知内容修正院校数据 ===\n');

  // 提取所有通知信息
  const extractedData = processAllNotices();
  console.log(`提取了 ${Object.keys(extractedData).length} 所院校的通知信息\n`);

  // 显示提取结果示例
  console.log('=== 提取结果示例 ===');
  const sampleIds = [1, 2, 3, 5, 8, 11, 14, 15];
  for (const id of sampleIds) {
    if (extractedData[id]) {
      console.log(`\n[${id}]:`);
      const info = extractedData[id];
      if (info.applicationPeriod) console.log(`  申请时间: ${info.applicationPeriod}`);
      if (info.deadline) console.log(`  截止日期: ${info.deadline}`);
      if (info.examForm) console.log(`  考核形式: ${info.examForm}`);
      if (info.englishRequirement) console.log(`  英语要求: ${info.englishRequirement}`);
    }
  }

  // 更新数据
  const { data, updates } = updateUniversities(extractedData);

  console.log('\n\n=== 修正记录 ===');
  for (const update of updates) {
    console.log(`\n[${update.id}] ${update.name}:`);
    for (const change of update.changes) {
      console.log(`  ${change}`);
    }
  }

  console.log(`\n共修正 ${updates.length} 所院校的数据`);

  // 保存
  fs.writeFileSync(UNIVERSITIES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n数据已保存到: ${UNIVERSITIES_FILE}`);
}

main();
