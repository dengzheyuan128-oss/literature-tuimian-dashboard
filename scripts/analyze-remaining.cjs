/**
 * 分析保留院校的数据状态
 */

const data = require('../client/src/data/universities.json');
const schools = data.universities;

console.log('=== 保留院校数据分析 ===\n');
console.log('总数:', schools.length);

// 按985/211/其他分类
const schools985 = schools.filter(s => s.is985);
const schools211 = schools.filter(s => s.is211 && !s.is985);
const schoolsOther = schools.filter(s => !s.is985 && !s.is211);

console.log('');
console.log('985院校:', schools985.length);
console.log('211院校(非985):', schools211.length);
console.log('其他(B-及以上):', schoolsOther.length);

// 统计待核实数据
let verified = 0;
let unverified = 0;

schools.forEach(s => {
  const programs = s.programs || [];
  const notices = programs[0]?.notices || [];
  const notice = notices[0];
  if (notice?.dataVerified) {
    verified++;
  } else {
    unverified++;
  }
});

console.log('');
console.log('=== 数据核实状态 ===');
console.log('已核实:', verified);
console.log('待核实:', unverified);

// 列出待核实的985院校（优先处理）
console.log('');
console.log('=== 待核实的985院校（优先处理）===');
schools985.forEach(s => {
  const programs = s.programs || [];
  const notices = programs[0]?.notices || [];
  const notice = notices[0];
  if (!notice?.dataVerified) {
    console.log(`- ${s.name} | URL: ${notice?.url ? '有' : '无'}`);
  }
});

// 列出待核实的211院校
console.log('');
console.log('=== 待核实的211院校 ===');
schools211.forEach(s => {
  const programs = s.programs || [];
  const notices = programs[0]?.notices || [];
  const notice = notices[0];
  if (!notice?.dataVerified) {
    console.log(`- ${s.name} | URL: ${notice?.url ? '有' : '无'}`);
  }
});

// 列出有URL的待核实院校数量
let withUrl = 0;
let withoutUrl = 0;
schools.forEach(s => {
  const programs = s.programs || [];
  const notices = programs[0]?.notices || [];
  const notice = notices[0];
  if (!notice?.dataVerified) {
    if (notice?.url) {
      withUrl++;
    } else {
      withoutUrl++;
    }
  }
});

console.log('');
console.log('=== 待核实院校URL状态 ===');
console.log('有URL可核实:', withUrl);
console.log('无URL需补链接:', withoutUrl);
