/**
 * 生成需人工核实的院校清单
 */

const data = require('../client/src/data/universities.json');

// 已更新的院校列表
const updated = [
  '北京大学','武汉大学','四川大学','中山大学','北京师范大学',
  '兰州大学','湖南师范大学','厦门大学','山东大学','上海交通大学',
  '重庆大学','中国海洋大学','华中师范大学','吉林大学','湖南大学',
  '中央民族大学','天津大学','东南大学','东北师范大学','陕西师范大学',
  '苏州大学','郑州大学','西北大学','广西大学','新疆大学',
  '中央财经大学','江南大学','北京语言大学','河南大学','河北师范大学',
  '黑龙江大学','山西大学','西南交通大学','中国矿业大学'
];

const needManual = data.universities.filter(s => !updated.includes(s.name));

// 按985/211/其他分组
const schools985 = needManual.filter(s => s.is985);
const schools211 = needManual.filter(s => s.is211 && !s.is985);
const schoolsOther = needManual.filter(s => !s.is985 && !s.is211);

function printSchool(s, i) {
  const p = s.programs?.[0];
  const n = p?.notices?.[0];

  console.log(`### ${i}. ${s.name}`);
  console.log('');
  console.log(`**链接**: ${n?.url || '无'}`);
  console.log('');
  console.log('| 字段 | 当前值 |');
  console.log('|------|--------|');
  console.log(`| 专业方向 | ${p?.specialty || '待补充'} |`);
  console.log(`| 考核形式 | ${n?.examForm || '待补充'} |`);
  console.log(`| 英语要求 | ${n?.englishRequirement || '待补充'} |`);
  console.log(`| 申请时间 | ${n?.applicationPeriod || '待补充'} |`);
  console.log(`| 截止时间 | ${n?.deadline || '待补充'} |`);
  console.log('');
}

console.log('# 需人工核实的院校清单\n');
console.log(`> 共 ${needManual.length} 所\n`);
console.log(`> 985: ${schools985.length}所 | 211: ${schools211.length}所 | 其他: ${schoolsOther.length}所\n`);

console.log('---\n');
console.log('## 一、985院校（优先）\n');
let idx = 1;
schools985.forEach(s => printSchool(s, idx++));

console.log('---\n');
console.log('## 二、211院校\n');
schools211.forEach(s => printSchool(s, idx++));

console.log('---\n');
console.log('## 三、其他院校（B-及以上）\n');
schoolsOther.forEach(s => printSchool(s, idx++));
