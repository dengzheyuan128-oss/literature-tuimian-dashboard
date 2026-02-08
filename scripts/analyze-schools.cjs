/**
 * 分析院校数据，找出四非B学科以下的院校
 */

const data = require('../client/src/data/universities.json');
const schools = data.universities;

// 学科评级顺序
const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];

// 判断是否B学科以下
function isBelowB(grade) {
  if (!grade) return true;
  const idx = gradeOrder.indexOf(grade);
  const bIdx = gradeOrder.indexOf('B');
  return idx < 0 || idx > bIdx;
}

// 统计四非B学科以下的院校
const lowValueSchools = schools.filter(s => {
  const is985 = s.is985 === true;
  const is211 = s.is211 === true;
  return !is985 && !is211 && isBelowB(s.disciplineGrade);
});

// 统计保留的院校
const keepSchools = schools.filter(s => {
  const is985 = s.is985 === true;
  const is211 = s.is211 === true;
  return is985 || is211 || !isBelowB(s.disciplineGrade);
});

console.log('=== 院校数据分析 ===\n');
console.log('总院校数:', schools.length);
console.log('');

console.log('=== 将移除的院校（四非B学科以下）===');
console.log('数量:', lowValueSchools.length);
console.log('');
lowValueSchools.forEach(s => {
  console.log(`- ${s.name} | 学科评级: ${s.disciplineGrade || '无'}`);
});

console.log('');
console.log('=== 将保留的院校 ===');
console.log('数量:', keepSchools.length);
console.log('');

// 按类型分组
const schools985 = keepSchools.filter(s => s.is985);
const schools211 = keepSchools.filter(s => s.is211 && !s.is985);
const schoolsBPlus = keepSchools.filter(s => !s.is985 && !s.is211);

console.log('985院校:', schools985.length);
console.log('211院校(非985):', schools211.length);
console.log('四非但B及以上:', schoolsBPlus.length);
