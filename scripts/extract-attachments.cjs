/**
 * 提取通知文件中的附件链接
 * 生成附件索引文件
 */

const fs = require('fs');
const path = require('path');

const NOTICES_DIR = path.join(__dirname, '../client/public/data/notices');
const OUTPUT_FILE = path.join(__dirname, '../client/public/data/attachments.json');

// 附件链接匹配模式
const patterns = [
  // Markdown链接格式: [文件名](url)
  /\[([^\]]*(?:附件|\.pdf|\.doc|\.docx|\.xls|\.xlsx|表|通知|办法|目录|说明|要求)[^\]]*)\]\(([^)]+)\)/gi,
  // 直接URL格式
  /(https?:\/\/[^\s\)]+\.(?:pdf|doc|docx|xls|xlsx))/gi,
];

// 提取schoolId从frontmatter
function extractSchoolId(content) {
  const match = content.match(/schoolId:\s*(\d+)/);
  return match ? parseInt(match[1]) : null;
}

// 提取附件链接
function extractAttachments(content, schoolId) {
  const attachments = [];

  // 匹配 Markdown 链接格式
  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let match;

  while ((match = mdLinkRegex.exec(content)) !== null) {
    const title = match[1];
    const url = match[2];

    // 严格过滤：只保留真正的文件下载链接
    const isRealFile =
      url.match(/\.(pdf|doc|docx|xls|xlsx|zip|rar)$/i) ||
      url.includes('download.jsp') ||
      url.includes('DownloadAttach') ||
      url.includes('_content/download') ||
      url.includes('/upload/') ||
      url.includes('/docs/') ||
      url.includes('/files/') ||
      url.includes('_upload/');

    // 标题包含"附件"且URL看起来是文件
    const hasAttachmentTitle = title.includes('附件') && (
      url.includes('download') ||
      url.includes('upload') ||
      url.includes('docs') ||
      url.match(/\.(pdf|doc|docx|xls|xlsx)$/i)
    );

    // 排除条件
    const isImage = url.match(/\.(png|jpg|jpeg|gif|svg|ico)$/i) || title.startsWith('Image');
    const isNavLink =
      url.includes('/list.htm') ||
      url.includes('/index.htm') ||
      url.includes('/index/') ||
      url.includes('/cat/') ||
      url.includes('/taxonomy/') ||
      url.includes('/basic/') ||
      url.includes('/info/') && !url.includes('download') ||
      title === '通知公告' ||
      title === '工会通知' ||
      title === '通知通告' ||
      title === '通知动态' ||
      title === '招生简章' ||
      title === '本科生通知' ||
      title.match(/^按.*列表$/) ||
      title.length < 4;

    if ((isRealFile || hasAttachmentTitle) && !isImage && !isNavLink) {
      attachments.push({
        title: title.trim(),
        url: url,
        type: getFileType(url, title)
      });
    }
  }

  // 去重
  const unique = [];
  const seen = new Set();
  for (const att of attachments) {
    if (!seen.has(att.url)) {
      seen.add(att.url);
      unique.push(att);
    }
  }

  return unique;
}

// 判断文件类型
function getFileType(url, title) {
  if (url.match(/\.pdf$/i)) return 'pdf';
  if (url.match(/\.docx?$/i)) return 'word';
  if (url.match(/\.xlsx?$/i)) return 'excel';
  if (url.match(/\.zip$/i) || url.match(/\.rar$/i)) return 'archive';
  if (title.includes('.pdf')) return 'pdf';
  if (title.includes('.doc')) return 'word';
  if (title.includes('.xls')) return 'excel';
  return 'document';
}

// 主函数
function main() {
  const files = fs.readdirSync(NOTICES_DIR).filter(f => f.endsWith('.md') && f !== 'undefined.md');

  const allAttachments = {};
  let totalCount = 0;

  for (const file of files) {
    const filepath = path.join(NOTICES_DIR, file);
    const content = fs.readFileSync(filepath, 'utf-8');
    const schoolId = extractSchoolId(content);

    if (!schoolId) continue;

    const attachments = extractAttachments(content, schoolId);

    if (attachments.length > 0) {
      allAttachments[schoolId] = attachments;
      totalCount += attachments.length;
      console.log(`[${schoolId}] ${file}: ${attachments.length} 个附件`);
      attachments.forEach(a => console.log(`    - ${a.title} (${a.type})`));
    }
  }

  // 保存结果
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allAttachments, null, 2), 'utf-8');

  console.log('\n---');
  console.log(`共发现 ${Object.keys(allAttachments).length} 所院校有附件`);
  console.log(`附件总数: ${totalCount}`);
  console.log(`已保存到: ${OUTPUT_FILE}`);
}

main();
