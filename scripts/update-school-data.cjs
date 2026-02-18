/**
 * 院校数据更新脚本
 * 根据用户提供的核实信息更新数据
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../client/src/data/universities.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// 需要删除的院校（不招中文硕士或没有信息来源）
const toRemove = [
  '西安交通大学',  // 不招中文硕士
  '合肥工业大学',  // 不招中文硕士
  '太原理工大学',  // 不招中文硕士
  '西藏大学',      // 学院官网没有，也没搜到研究生招生信息网
  '石河子大学',    // 文学院研招网都没有
  '江苏师范大学',  // 文学院研招网都没有
  '上海财经大学',  // 研招网显示招了中文硕士但人文学院通知里没有，可能不对外招
];

// 需要标注"不分专业通知"的院校
const generalNoticeSchools = [
  '华中科技大学',
  '中国传媒大学',
  '暨南大学',
  '上海大学',
  '内蒙古大学',
  '延边大学',
  '北京外国语大学',
  '上海外国语大学',
  '福州大学',
  '首都师范大学',
  '上海师范大学',
  '福建师范大学',
  '天津师范大学',
  '哈尔滨师范大学',
  '广西师范大学',
  '四川师范大学',
  '扬州大学',
];

// 网站维护中的院校
const maintenanceSchools = [
  '南京师范大学',  // 网站正在维护进不去
];

console.log('=== 院校数据更新 ===\n');

// 1. 删除不符合条件的院校
console.log('【删除院校】');
const originalCount = data.universities.length;
data.universities = data.universities.filter(school => {
  if (toRemove.includes(school.name)) {
    console.log(`  - 删除: ${school.name}`);
    return false;
  }
  return true;
});
console.log(`  共删除 ${originalCount - data.universities.length} 所院校\n`);

// 2. 为"不分专业通知"院校添加标注
console.log('【标注不分专业通知】');
data.universities.forEach(school => {
  if (generalNoticeSchools.includes(school.name)) {
    // 添加标注到 school 级别
    school.noticeScope = 'general';
    school.noticeNote = '研招网不分专业的通知';

    // 同时更新 programs 中的 notices
    if (school.programs) {
      school.programs.forEach(program => {
        if (program.notices) {
          program.notices.forEach(notice => {
            notice.noticeScope = 'general';
            notice.noticeNote = '研招网不分专业的通知，具体专业信息请查阅原文';
          });
        }
      });
    }
    console.log(`  - 标注: ${school.name}`);
  }
});

// 3. 标注网站维护中的院校
console.log('\n【标注网站维护中】');
data.universities.forEach(school => {
  if (maintenanceSchools.includes(school.name)) {
    school.websiteStatus = 'maintenance';
    school.websiteNote = '网站正在维护，暂时无法访问';

    if (school.programs) {
      school.programs.forEach(program => {
        if (program.notices) {
          program.notices.forEach(notice => {
            notice.websiteStatus = 'maintenance';
            notice.verificationNote = '网站维护中，信息待核实';
          });
        }
      });
    }
    console.log(`  - 标注: ${school.name}`);
  }
});

// 4. 清理所有院校中的臆造数据，将未确认的字段标为空
console.log('\n【清理待确认数据】');
const fieldsToCheck = ['examForm', 'englishRequirement', 'applicationPeriod', 'deadline', 'specialty'];
const genericValues = [
  '待确认', '待补充', '综合面试', '材料审核、复试', '面试、笔试',
  'CET-6或同等', 'CET-4或同等', '无硬性要求',
  '汉语言文学、语言学等', '中国语言文学'
];

let cleanedCount = 0;
data.universities.forEach(school => {
  if (school.programs) {
    school.programs.forEach(program => {
      if (program.notices) {
        program.notices.forEach(notice => {
          fieldsToCheck.forEach(field => {
            if (notice[field] && genericValues.some(v => notice[field] === v)) {
              // 将通用值改为明确的"未注明"
              notice[field] = '未注明';
              cleanedCount++;
            }
          });
        });
      }
    });
  }
});
console.log(`  清理了 ${cleanedCount} 个通用/待确认字段\n`);

// 5. 更新元数据
data.lastUpdated = new Date().toISOString().split('T')[0];

// 保存更新后的数据
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');

console.log('=== 更新完成 ===');
console.log(`当前院校数量: ${data.universities.length}`);
console.log(`数据更新日期: ${data.lastUpdated}`);
