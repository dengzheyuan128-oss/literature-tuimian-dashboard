#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../client/src/data/universities.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`🔍 数据质量检查 (Schema: ${rawData.schemaVersion})\n`);

const linkGrades = { A: [], B: [], C: [], D: [], missing: [] };
let totalNotices = 0;

function gradeLink(url) {
  if (!url) return null;
  if (url.includes('lianpp.com')) return 'D';
  if (url.match(/^https?:\/\/[^\/]+\/?$/) || url.includes('/index')) return 'C';
  if (url.includes('tuimian') || url.includes('baoy') || url.match(/20\d{2}/)) return 'A';
  return 'B';
}

rawData.universities.forEach((school, idx) => {
  console.log(`[${idx+1}/${rawData.universities.length}] ${school.name}`);
  
  if (!school.programs || school.programs.length === 0) {
    console.log(`  ❌ 缺少programs`);
    return;
  }
  
  school.programs.forEach(prog => {
    if (!prog.notices || prog.notices.length === 0) {
      console.log(`  ❌ ${prog.programName}: 缺少notices`);
      return;
    }
    
    prog.notices.forEach(notice => {
      totalNotices++;
      const grade = gradeLink(notice.url);
      if (!grade) {
        linkGrades.missing.push(school.name);
        console.log(`  ❌ 缺少链接`);
      } else {
        linkGrades[grade].push({ school: school.name, url: notice.url });
        const icon = grade === 'A' ? '✅' : grade === 'B' ? 'ℹ️' : grade === 'C' ? '⚠️' : '❌';
        console.log(`  ${icon} ${grade}级链接`);
      }
    });
  });
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 统计 (${rawData.universities.length}校, ${totalNotices}通知)\n`);
console.log(`A级: ${linkGrades.A.length} (${(linkGrades.A.length/rawData.universities.length*100).toFixed(1)}%)`);
console.log(`B级: ${linkGrades.B.length} (${(linkGrades.B.length/rawData.universities.length*100).toFixed(1)}%)`);
console.log(`C级: ${linkGrades.C.length} (${(linkGrades.C.length/rawData.universities.length*100).toFixed(1)}%)`);
console.log(`D级: ${linkGrades.D.length} (${(linkGrades.D.length/rawData.universities.length*100).toFixed(1)}%)`);
console.log(`缺失: ${linkGrades.missing.length} (${(linkGrades.missing.length/rawData.universities.length*100).toFixed(1)}%)`);

const healthy = linkGrades.A.length + linkGrades.B.length;
console.log(`\n健康度: ${(healthy/rawData.universities.length*100).toFixed(1)}% (${healthy}/${rawData.universities.length})\n`);

if (linkGrades.D.length > 0) {
  console.log('❌ D级（第三方）:');
  linkGrades.D.forEach(i => console.log(`  - ${i.school}`));
}
if (linkGrades.C.length > 0) {
  console.log('\n⚠️ C级（首页）:');
  linkGrades.C.forEach(i => console.log(`  - ${i.school}`));
}

process.exit(healthy/rawData.universities.length >= 0.9 ? 0 : 1);
