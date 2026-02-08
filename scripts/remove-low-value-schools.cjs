/**
 * 移除四非C级及以下的院校
 * 保留：985、211、或学科评级B-及以上
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../client/src/data/universities.json');
const data = require(dataPath);
const schools = data.universities;

// 学科评级顺序
const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];

// 判断是否C级及以下（C+, C, C-, 无评级）
function isBelowBMinus(grade) {
  if (!grade) return true;
  const idx = gradeOrder.indexOf(grade);
  const bMinusIdx = gradeOrder.indexOf('B-');
  return idx < 0 || idx > bMinusIdx;
}

// 分类统计
const toRemove = [];
const toKeep = [];

schools.forEach(s => {
  const is985 = s.is985 === true;
  const is211 = s.is211 === true;

  // 保留条件：985 或 211 或 B-及以上
  if (is985 || is211 || !isBelowBMinus(s.disciplineGrade)) {
    toKeep.push(s);
  } else {
    toRemove.push(s);
  }
});

console.log('=== 移除统计 ===\n');
console.log('原院校数:', schools.length);
console.log('将移除:', toRemove.length);
console.log('将保留:', toKeep.length);
console.log('');

console.log('=== 将移除的院校（四非C级及以下）===\n');
toRemove.forEach(s => {
  console.log(`- ${s.name} | 学科评级: ${s.disciplineGrade || '无'}`);
});

console.log('');
console.log('=== 确认移除? ===');
console.log('如确认，请添加 --execute 参数运行');

// 执行移除
if (process.argv.includes('--execute')) {
  console.log('\n执行移除...');

  const newData = {
    ...data,
    lastUpdated: new Date().toISOString().split('T')[0],
    universities: toKeep
  };

  fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2), 'utf-8');
  console.log('完成！新数据已写入。');
  console.log('保留院校数:', toKeep.length);
}
