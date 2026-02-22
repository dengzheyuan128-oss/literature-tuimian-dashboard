/**
 * 清理通知内容，只保留核心正文
 * - 删除导航栏、侧边栏、页脚等非正文内容
 * - 保留以标题开始、以日期/署名结束的正文
 * - 统一排版格式
 */

const fs = require('fs');
const path = require('path');

const NOTICES_DIR = path.join(__dirname, '../client/public/data/notices');

// 清理单个文件
function cleanNoticeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 提取frontmatter
  let frontmatter = '';
  let bodyStartIndex = 0;

  if (lines[0] === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '---') {
        frontmatter = lines.slice(0, i + 1).join('\n') + '\n\n';
        bodyStartIndex = i + 1;
        break;
      }
    }
  }

  // 处理正文
  const bodyLines = lines.slice(bodyStartIndex);
  let cleanedContent = bodyLines.join('\n');

  // 移除元数据行
  cleanedContent = cleanedContent.replace(/^Title:\s.*$/gm, '');
  cleanedContent = cleanedContent.replace(/^URL Source:\s.*$/gm, '');
  cleanedContent = cleanedContent.replace(/^Published Time:\s.*$/gm, '');
  cleanedContent = cleanedContent.replace(/^Markdown Content:\s*$/gm, '');

  // 移除重复的标题行（如 "xxx-xxx大学xxx学院" 格式的导航标题）
  cleanedContent = cleanedContent.replace(/^.*?[-—].*?大学.*?学院\s*$/gm, (match, offset) => {
    // 只移除文件开头的这种行
    if (offset < 500) return '';
    return match;
  });

  // 移除图片引用
  cleanedContent = cleanedContent.replace(/!\[Image \d+[^\]]*\]\([^)]+\)/g, '');
  cleanedContent = cleanedContent.replace(/\[!\[Image[^\]]*\]\([^)]+\)\]\([^)]+\)/g, '');
  cleanedContent = cleanedContent.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

  // 移除导航链接块（连续的 * [xxx](url) 行）
  cleanedContent = cleanedContent.replace(/^(\*\s+\[[^\]]*\]\([^)]+\)\s*\n){3,}/gm, '\n');
  cleanedContent = cleanedContent.replace(/^(\s+\*\s+\[[^\]]*\]\([^)]+\)\s*\n){2,}/gm, '\n');

  // 移除单独的导航链接（行首的 * [xxx](url)）
  cleanedContent = cleanedContent.replace(/^\*\s+\[[^\]]*\]\(https?:\/\/[^)]+\)\s*$/gm, '');
  cleanedContent = cleanedContent.replace(/^\s+\*\s+\[[^\]]*\]\(https?:\/\/[^)]+\)\s*$/gm, '');

  // 移除空链接 [](xxx)
  cleanedContent = cleanedContent.replace(/\[\]\([^)]+\)/g, '');

  // 转换链接为纯文本（保留文字）
  cleanedContent = cleanedContent.replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1');
  cleanedContent = cleanedContent.replace(/\[([^\]]+)\]\(javascript[^)]*\)/g, '$1');
  cleanedContent = cleanedContent.replace(/\[([^\]]+)\]\(#[^)]*\)/g, '$1');
  cleanedContent = cleanedContent.replace(/\[([^\]]+)\]\(mailto:[^)]*\)/g, '$1');

  // 移除面包屑导航
  cleanedContent = cleanedContent.replace(/^您现在的位置[：:].*/gm, '');
  cleanedContent = cleanedContent.replace(/^首页\s*[>_\/].*/gm, '');

  // 移除页脚内容
  const footerPatterns = [
    /^Copyright\s.*/gmi,
    /^版权所有.*/gm,
    /^技术支持[：:].*/gm,
    /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼]ICP备.*/gm,
    /^地\s*址[：:]\s*[\u4e00-\u9fa5]+省.*/gm,
    /^电\s*话[：:]\s*\d{3,4}[-\s]?\d{7,8}.*/gm,
    /^邮\s*编[：:]\s*\d{6}.*/gm,
    /^传\s*真[：:].*/gm,
    /^©\d{4}.*/gm,
    /^分享到[：:]?\s*$/gm,
    /^\*\s+QQ空间.*/gm,
    /^\*\s+新浪微博.*/gm,
    /^\*\s+微信.*/gm,
    /^打开微信.*/gm,
    /^使用"扫一扫".*/gm,
    /^分享到微信朋友圈/gm,
  ];

  for (const pattern of footerPatterns) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }

  // 移除分享按钮等
  cleanedContent = cleanedContent.replace(/^_分享到：_.*/gm, '');
  cleanedContent = cleanedContent.replace(/^\[上一篇：.*/gm, '');
  cleanedContent = cleanedContent.replace(/^\[下一篇：.*/gm, '');
  cleanedContent = cleanedContent.replace(/^\[返回列表\].*/gm, '');

  // 移除过长的分隔线
  cleanedContent = cleanedContent.replace(/^={10,}\s*$/gm, '');
  cleanedContent = cleanedContent.replace(/^-{10,}\s*$/gm, '');

  // 移除孤立的菜单项标题
  const menuPatterns = [
    /^学院动态\s*$/gm,
    /^新闻动态\s*$/gm,
    /^通知通告\s*$/gm,
    /^通知公告\s*$/gm,
    /^下载专区\s*$/gm,
    /^更多>\s*$/gm,
    /^联系我们\s*$/gm,
    /^首页新闻中心.*$/gm,
    /^新闻中心\s*$/gm,
    /^招生信息\s*$/gm,
  ];

  for (const pattern of menuPatterns) {
    cleanedContent = cleanedContent.replace(pattern, '');
  }

  // 移除导航菜单块（连续的 * 开头的导航行）
  cleanedContent = cleanedContent.replace(/^(\*\s+[^\n]{0,50}\n){3,}/gm, '\n');
  cleanedContent = cleanedContent.replace(/^(\s+\*\s+[^\n]{0,30}\n){2,}/gm, '\n');

  // 移除包含多个栏目关键词的行
  cleanedContent = cleanedContent.replace(/^.*(?:院系概况|师资队伍|新闻公告|教育教学|学术研究|学生发展|党团建设|合作交流|继续教育).*$/gm, '');
  cleanedContent = cleanedContent.replace(/^.*(?:就业指导中心|国际交流处|学生工作部|教务处|研究生院).*$/gm, '');

  // 移除链接列表（如北京师范大学文学院等）
  cleanedContent = cleanedContent.replace(/^.*(?:北京师范大学文学院|中国人民大学文学院|武汉大学文学院|南京大学文学院|复旦大学中文系|北京大学中文系).*$/gm, '');

  // 移除招生招聘相关导航
  cleanedContent = cleanedContent.replace(/^招生招聘常用下载.*$/gm, '');
  cleanedContent = cleanedContent.replace(/^校内邮箱.*$/gm, '');
  cleanedContent = cleanedContent.replace(/^校内链接.*$/gm, '');
  cleanedContent = cleanedContent.replace(/^校外链接.*$/gm, '');
  cleanedContent = cleanedContent.replace(/^公共数据库\s*$/gm, '');

  // 移除 × 符号行
  cleanedContent = cleanedContent.replace(/^\s*×\s*$/gm, '');
  cleanedContent = cleanedContent.replace(/^\*\s+×\s*$/gm, '');

  // 移除JavaScript代码片段
  cleanedContent = cleanedContent.replace(/^.*window\.open\([^)]+\).*$/gm, '');
  cleanedContent = cleanedContent.replace(/^.*encodeURIComponent.*$/gm, '');

  // 移除分享到社交媒体的列表
  cleanedContent = cleanedContent.replace(/^\*\s+(百度云收藏|腾讯微博|百度贴吧|豆瓣网|QQ好友|人民微博|新华微博|邮件分享|我的搜狐|复制网址|打印).*$/gm, '');

  // 移除底部地址信息块
  cleanedContent = cleanedContent.replace(/^地\s*址[：:]\s*.*$/gm, '');
  cleanedContent = cleanedContent.replace(/^邮\s*箱[：:]\s*.*$/gm, '');
  cleanedContent = cleanedContent.replace(/^电话[：:]\s*.*$/gm, '');
  cleanedContent = cleanedContent.replace(/^.*版权所有.*$/gm, '');

  // 移除扫一扫分享提示
  cleanedContent = cleanedContent.replace(/^.*扫一扫.*朋友圈.*$/gm, '');

  // 移除残留的符号和占位符
  cleanedContent = cleanedContent.replace(/^;\)\s*$/gm, '');
  cleanedContent = cleanedContent.replace(/^;\s*$/gm, '');
  cleanedContent = cleanedContent.replace(/^\)\s*$/gm, '');
  cleanedContent = cleanedContent.replace(/^EN\s*$/gm, '');

  // 移除孤立的地址行（没有完整地址信息的）
  cleanedContent = cleanedContent.replace(/^上海市[^省市]*区[^\n]*\d{6}[^校区]*\n/gm, '');
  cleanedContent = cleanedContent.replace(/^[^校区]*校区[^\n]*\d{3,4}[^。\n]*\n/gm, '');

  // 清理多余空行（保留最多2个连续空行）
  cleanedContent = cleanedContent.replace(/\n{4,}/g, '\n\n\n');

  // 清理行首行尾空白
  cleanedContent = cleanedContent.split('\n').map(line => line.trimEnd()).join('\n');

  // 移除开头的空行
  cleanedContent = cleanedContent.replace(/^\s*\n+/, '');

  // 确保文件末尾只有一个换行
  cleanedContent = cleanedContent.replace(/\n+$/, '\n');

  // 组合结果
  return frontmatter + cleanedContent;
}

// 主函数
function main() {
  console.log('=== 清理通知内容 ===\n');

  const files = fs.readdirSync(NOTICES_DIR)
    .filter(f => f.endsWith('.md') && f !== 'undefined.md');

  let processedCount = 0;
  let totalReduction = 0;

  for (const file of files) {
    const filePath = path.join(NOTICES_DIR, file);

    try {
      const originalContent = fs.readFileSync(filePath, 'utf-8');
      const cleanedContent = cleanNoticeFile(filePath);

      // 计算清理效果
      const originalLength = originalContent.length;
      const cleanedLength = cleanedContent.length;
      const reduction = originalLength > 0 ? ((originalLength - cleanedLength) / originalLength * 100) : 0;

      // 只有当清理后内容合理时才保存（至少保留20%或500字符）
      if (cleanedLength >= Math.min(originalLength * 0.2, 500) || cleanedLength >= 200) {
        fs.writeFileSync(filePath, cleanedContent, 'utf-8');
        console.log(`[${file}] ${originalLength} → ${cleanedLength} 字符 (-${reduction.toFixed(1)}%)`);
        totalReduction += reduction;
      } else {
        console.log(`[${file}] 跳过 (清理后内容过少: ${cleanedLength}字符)`);
      }

      processedCount++;
    } catch (err) {
      console.error(`[${file}] 错误: ${err.message}`);
    }
  }

  console.log(`\n处理完成: ${processedCount} 个文件`);
  console.log(`平均清理率: ${(totalReduction / processedCount).toFixed(1)}%`);
}

main();
