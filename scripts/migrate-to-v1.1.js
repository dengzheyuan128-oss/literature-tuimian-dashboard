#!/usr/bin/env node

/**
 * 数据迁移脚本：v1 -> v1.1
 * 将扁平结构转换为三层嵌套结构（School / Program / Notice）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../client/src/data/universities.json');
const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
const oldUniversities = rawData.universities;

console.log('🔄 开始数据迁移: v1 -> v1.1\n');
console.log(`原始数据: ${oldUniversities.length}所院校\n`);

// 创建新的数据结构
const newUniversities = oldUniversities.map(oldUni => {
  // School层
  const school = {
    id: oldUni.id,
    name: oldUni.name,
    tier: oldUni.tier,
    location: oldUni.location,
    is985: oldUni.is985,
    is211: oldUni.is211,
    disciplineGrade: oldUni.disciplineGrade,
    
    // Programs数组（当前每个学校只有一个项目）
    programs: [
      {
        id: `${oldUni.id}-1`,
        schoolId: oldUni.id,
        programName: "中国语言文学",
        department: "文学院/中文系",
        specialty: oldUni.specialty,
        degreeTypes: oldUni.degreeType.split('、').map(t => t.trim()),
        
        // Notices数组（当前每个项目只有一个通知）
        notices: [
          {
            id: `${oldUni.id}-1-1`,
            programId: `${oldUni.id}-1`,
            year: oldUni.year,
            title: `${oldUni.year}年推免硕士研究生招生通知`,
            url: oldUni.url,
            sourceType: oldUni.sourceType,
            publisher: oldUni.publisher,
            linkGrade: oldUni.linkGrade,
            applicationPeriod: oldUni.applicationPeriod,
            deadline: oldUni.deadline,
            examForm: oldUni.examForm,
            englishRequirement: oldUni.englishRequirement,
            duration: oldUni.duration,
            publishedAt: oldUni.deadline, // 使用deadline作为发布时间
            lastVerifiedAt: oldUni.lastVerifiedAt,
          }
        ]
      }
    ]
  };
  
  return school;
});

// 创建新的数据文件
const newData = {
  schemaVersion: "v1.1",
  lastUpdated: rawData.lastUpdated,
  description: "三层嵌套结构：School / Program / Notice",
  universities: newUniversities
};

// 备份原始文件
const backupPath = path.join(__dirname, '../client/src/data/universities.v1.json');
fs.writeFileSync(backupPath, JSON.stringify(rawData, null, 2), 'utf-8');
console.log(`✅ 原始数据已备份到: universities.v1.json\n`);

// 写入新文件
fs.writeFileSync(dataPath, JSON.stringify(newData, null, 2), 'utf-8');
console.log(`✅ 新数据已写入: universities.json\n`);

// 统计
console.log('迁移统计:');
console.log(`- Schema版本: v1 -> v1.1`);
console.log(`- 院校数量: ${newUniversities.length}所`);
console.log(`- 项目总数: ${newUniversities.length}个`);
console.log(`- 通知总数: ${newUniversities.length}条`);
console.log(`\n✅ 数据迁移完成！`);
