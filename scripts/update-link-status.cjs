/**
 * 根据链接检查结果更新院校数据
 * 将无效链接标记为需要核实
 */

const fs = require('fs');
const path = require('path');

const UNIVERSITIES_FILE = path.join(__dirname, '../client/src/data/universities.json');
const REPORT_FILE = path.join(__dirname, '../docs/link-check-report.json');

// 需要更新链接的院校（404错误，页面已删除）
const LINK_UPDATES = {
  // ID: { url: '新链接', note: '备注' }
  // 暂时先标记，后续人工查找新链接
};

// 403/412 错误的链接（可能浏览器正常，标记为B级）
const POSSIBLE_VALID = [8, 31, 35, 38]; // 浙江大学、安徽大学、东南大学、南京师范大学

// 404 错误的链接（确定失效，标记为D级需更新）
const CONFIRMED_INVALID = [12, 17, 30, 44, 45]; // 西南大学、山东大学、暨南大学、内蒙古大学、延边大学

function main() {
  console.log('=== 更新链接状态 ===\n');

  const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8'));
  const data = JSON.parse(fs.readFileSync(UNIVERSITIES_FILE, 'utf-8'));
  const today = new Date().toISOString().split('T')[0];

  let updatedCount = 0;

  // 创建问题链接的ID集合
  const invalidIds = new Set(report.invalid.map(i => i.id).filter(Boolean));
  const errorIds = new Set(report.error.map(i => i.id).filter(Boolean));

  // 处理没有ID的院校（通过名称匹配）
  const invalidNames = report.invalid.filter(i => !i.id).map(i => i.name);
  const errorNames = report.error.filter(i => !i.id).map(i => i.name);

  for (const university of data.universities) {
    const id = university.id;
    const name = university.name;

    for (const program of university.programs || []) {
      for (const notice of program.notices || []) {
        let needsUpdate = false;
        let newGrade = notice.linkGrade;
        let notes = [];

        // 检查是否是无效链接
        if (invalidIds.has(id) || invalidNames.includes(name)) {
          if (CONFIRMED_INVALID.includes(id)) {
            // 确定失效的链接
            newGrade = 'D';
            notes.push('链接404失效');
            notice.linkStatus = 'broken';
          } else if (POSSIBLE_VALID.includes(id)) {
            // 可能只是反爬虫
            newGrade = 'B';
            notes.push('链接需人工核实(403/412)');
            notice.linkStatus = 'needs_verification';
          } else {
            // 其他404链接
            newGrade = 'C';
            notes.push('链接可能失效');
            notice.linkStatus = 'needs_verification';
          }
          needsUpdate = true;
        }

        // 检查是否是SSL错误链接（通常浏览器正常）
        if (errorIds.has(id) || errorNames.includes(name)) {
          newGrade = 'B';
          notes.push('SSL连接问题，需人工核实');
          notice.linkStatus = 'needs_verification';
          needsUpdate = true;
        }

        if (needsUpdate && newGrade !== notice.linkGrade) {
          console.log(`[${id || '?'}] ${name}: ${notice.linkGrade} → ${newGrade}`);
          if (notes.length > 0) {
            console.log(`    备注: ${notes.join(', ')}`);
          }
          notice.linkGrade = newGrade;
          notice.lastVerifiedAt = today;
          updatedCount++;
        }
      }
    }
  }

  data.lastUpdated = today;
  fs.writeFileSync(UNIVERSITIES_FILE, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`\n共更新 ${updatedCount} 条链接状态`);

  // 生成需要人工核实的列表
  console.log('\n=== 需要人工查找新链接的院校 ===\n');

  const needsNewLink = [...report.invalid, ...report.error].filter(item => {
    // 404 错误需要找新链接
    return item.status === 404;
  });

  for (const item of needsNewLink) {
    console.log(`[${item.id || '?'}] ${item.name}`);
    console.log(`    旧链接: ${item.url}`);
    console.log(`    建议搜索: "${item.name} 2026 推免 研究生"`);
    console.log('');
  }

  console.log(`\n共 ${needsNewLink.length} 所院校需要查找新链接`);
}

main();
