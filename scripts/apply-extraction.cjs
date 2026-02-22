/**
 * 应用提取结果到 universities.json
 * 读取 extraction-report.json，更新数据文件中的"未注明"字段
 *
 * 使用方法：
 *   node scripts/apply-extraction.cjs [--dry-run]
 *
 * 选项：
 *   --dry-run  只预览更改，不实际修改文件
 */

const fs = require('fs');
const path = require('path');

// 文件路径
const DATA_FILE = path.join(__dirname, '../client/src/data/universities.json');
const REPORT_FILE = path.join(__dirname, '../extraction-report.json');
const BACKUP_FILE = path.join(__dirname, '../client/src/data/universities.backup.json');

// 字段映射：提取结果字段 -> 数据文件字段
const FIELD_MAPPING = {
  specialty: 'specialty',
  degreeType: 'degreeTypes',
  applicationPeriod: 'applicationPeriod',
  deadline: 'deadline',
  examForm: 'examForm',
  englishRequirement: 'englishRequirement',
  noticeType: 'noticeType',
};

// 判断是否为空值或占位符
function isEmpty(value) {
  if (!value) return true;
  const emptyValues = ['未注明', '待确认', '待补充', ''];
  return emptyValues.includes(value.trim());
}

// 主函数
function main() {
  const dryRun = process.argv.includes('--dry-run');

  if (dryRun) {
    console.log('=== 预览模式（不会修改文件）===\n');
  }

  // 检查报告文件
  if (!fs.existsSync(REPORT_FILE)) {
    console.error('错误: 未找到 extraction-report.json');
    console.error('请先运行 batch-extract.cjs 进行提取');
    process.exit(1);
  }

  // 读取文件
  console.log('读取数据文件...');
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8'));

  console.log(`提取报告: ${report.results.length} 条记录`);
  console.log(`成功提取: ${report.success} 条\n`);

  // 创建 ID -> 提取结果 的映射
  const extractedMap = new Map();
  for (const result of report.results) {
    if (result.success && result.extracted) {
      extractedMap.set(result.id, result);
    }
  }

  // 统计更新
  let totalUpdates = 0;
  const updateLog = [];

  // 遍历并更新
  for (const school of data.universities) {
    const extracted = extractedMap.get(school.id);
    if (!extracted) continue;

    const updates = [];

    // 更新 program 级别字段
    for (const program of school.programs || []) {
      // specialty
      if (isEmpty(program.specialty) && !isEmpty(extracted.extracted.specialty)) {
        updates.push(`specialty: "${program.specialty}" -> "${extracted.extracted.specialty}"`);
        if (!dryRun) program.specialty = extracted.extracted.specialty;
      }

      // degreeTypes
      if (extracted.extracted.degreeType && extracted.extracted.degreeType !== '未注明') {
        const newTypes = extracted.extracted.degreeType.split(/[\/、,]/).map(t => t.trim());
        if (newTypes.length > 0 && (!program.degreeTypes || program.degreeTypes.length === 0)) {
          updates.push(`degreeTypes: [] -> [${newTypes.join(', ')}]`);
          if (!dryRun) program.degreeTypes = newTypes;
        }
      }

      // 更新 notice 级别字段
      for (const notice of program.notices || []) {
        // applicationPeriod
        if (isEmpty(notice.applicationPeriod) && !isEmpty(extracted.extracted.applicationPeriod)) {
          updates.push(`applicationPeriod: "${notice.applicationPeriod}" -> "${extracted.extracted.applicationPeriod}"`);
          if (!dryRun) notice.applicationPeriod = extracted.extracted.applicationPeriod;
        }

        // deadline
        if (isEmpty(notice.deadline) && !isEmpty(extracted.extracted.deadline)) {
          updates.push(`deadline: "${notice.deadline}" -> "${extracted.extracted.deadline}"`);
          if (!dryRun) notice.deadline = extracted.extracted.deadline;
        }

        // examForm
        if (isEmpty(notice.examForm) && !isEmpty(extracted.extracted.examForm)) {
          updates.push(`examForm: "${notice.examForm}" -> "${extracted.extracted.examForm}"`);
          if (!dryRun) notice.examForm = extracted.extracted.examForm;
        }

        // englishRequirement
        if (isEmpty(notice.englishRequirement) && !isEmpty(extracted.extracted.englishRequirement)) {
          updates.push(`englishRequirement: "${notice.englishRequirement}" -> "${extracted.extracted.englishRequirement}"`);
          if (!dryRun) notice.englishRequirement = extracted.extracted.englishRequirement;
        }

        // noticeType
        if (!notice.noticeType && !isEmpty(extracted.extracted.noticeType)) {
          updates.push(`noticeType: null -> "${extracted.extracted.noticeType}"`);
          if (!dryRun) notice.noticeType = extracted.extracted.noticeType;
        }

        // 添加原文文件引用
        if (extracted.noticeFile && !notice.contentFile) {
          updates.push(`contentFile: null -> "${extracted.noticeFile}"`);
          if (!dryRun) notice.contentFile = extracted.noticeFile;
        }

        // 标记数据已验证
        if (!dryRun && updates.length > 0) {
          notice.dataVerified = true;
          notice.lastVerifiedAt = new Date().toISOString().split('T')[0];
        }
      }
    }

    if (updates.length > 0) {
      totalUpdates += updates.length;
      updateLog.push({
        school: school.name,
        updates: updates,
      });

      console.log(`[${school.name}]`);
      updates.forEach(u => console.log(`  - ${u}`));
      console.log('');
    }
  }

  console.log('---');
  console.log(`总计: ${updateLog.length} 所院校，${totalUpdates} 处更新`);

  if (dryRun) {
    console.log('\n这是预览模式，未实际修改文件。');
    console.log('确认无误后，运行以下命令应用更改：');
    console.log('  node scripts/apply-extraction.cjs');
  } else if (totalUpdates > 0) {
    // 备份原文件
    console.log('\n备份原文件...');
    fs.copyFileSync(DATA_FILE, BACKUP_FILE);
    console.log(`已备份到: ${BACKUP_FILE}`);

    // 保存更新
    console.log('保存更新...');
    data.lastUpdated = new Date().toISOString().split('T')[0];
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('更新完成！');
  } else {
    console.log('\n没有需要更新的字段。');
  }
}

main();
