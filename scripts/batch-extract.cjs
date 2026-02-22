/**
 * 批量提取院校通知信息
 * 每次处理 10 个院校，使用 Jina Reader + GLM-4
 *
 * 使用方法：
 *   node scripts/batch-extract.cjs [startIndex] [count]
 *
 * 示例：
 *   node scripts/batch-extract.cjs 0 10    # 处理前10个
 *   node scripts/batch-extract.cjs 10 10   # 处理第11-20个
 *
 * 配置：
 *   在项目根目录的 .env.local 文件中设置 GLM_API_KEY
 */

const fs = require('fs');
const path = require('path');

// 加载 .env.local 文件
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
  console.log('已加载 .env.local 配置');
}

// 配置
const GLM_API_KEY = process.env.VITE_GLM_API_KEY || process.env.GLM_API_KEY || '';
const JINA_READER_BASE = 'https://r.jina.ai/';
const GLM_API_BASE = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 文件路径
const DATA_FILE = path.join(__dirname, '../client/src/data/universities.json');
const OUTPUT_DIR = path.join(__dirname, '../client/public/data/notices');
const REPORT_FILE = path.join(__dirname, '../extraction-report.json');

// GLM 提取 Prompt
const EXTRACTION_PROMPT = `你是一个高校推免通知信息提取助手。请从以下网页内容中提取推免/夏令营相关信息。

请提取以下字段（JSON 格式）：
{
  "name": "院校名称",
  "department": "院系名称",
  "specialty": "专业方向（如：中国语言文学、文艺学等）",
  "degreeType": "学硕 或 专硕 或 学硕/专硕",
  "applicationPeriod": "申请时间段",
  "deadline": "截止日期",
  "examForm": "考核形式（如：笔试+面试、材料审核+面试等）",
  "englishRequirement": "英语要求（如：六级425分、四级通过等）",
  "noticeType": "夏令营 或 预推免 或 九推",
  "contactInfo": "联系方式（电话、邮箱等）",
  "notes": "其他重要信息（名额、要求等）"
}

规则：
1. 未找到的字段填写 "未注明"
2. 日期格式尽量统一为 "YYYY年MM月DD日" 或 "MM月DD日"
3. 只输出 JSON，不要其他文字
4. 如果有多个专业方向，用顿号分隔

网页内容：
---
`;

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 使用 Jina Reader 获取网页内容
async function fetchUrlAsMarkdown(url) {
  try {
    console.log(`  [Jina] 正在获取: ${url.substring(0, 60)}...`);

    const response = await fetch(`${JINA_READER_BASE}${encodeURIComponent(url)}`, {
      headers: { 'Accept': 'text/plain' },
    });

    if (!response.ok) {
      return { success: false, content: '', error: `HTTP ${response.status}` };
    }

    const content = await response.text();
    console.log(`  [Jina] 获取成功，内容长度: ${content.length} 字符`);
    return { success: true, content };
  } catch (error) {
    return { success: false, content: '', error: error.message };
  }
}

// 调用 GLM-4 提取信息
async function extractNoticeInfo(markdownContent) {
  if (!GLM_API_KEY) {
    return { success: false, data: null, error: 'GLM_API_KEY 未设置' };
  }

  try {
    console.log(`  [GLM] 正在提取信息...`);

    const response = await fetch(GLM_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [{
          role: 'user',
          content: EXTRACTION_PROMPT + markdownContent.slice(0, 8000) + '\n---',
        }],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, data: null, error: `GLM API 错误: ${response.status}` };
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, data: null, error: '无法解析 JSON' };
    }

    const data = JSON.parse(jsonMatch[0]);
    console.log(`  [GLM] 提取成功`);
    return { success: true, data };
  } catch (error) {
    return { success: false, data: null, error: error.message };
  }
}

// 处理单个院校
async function processUniversity(school, programIndex = 0) {
  const program = school.programs?.[programIndex];
  const notice = program?.notices?.[0];

  if (!notice?.url) {
    return { success: false, error: '无有效链接' };
  }

  const url = notice.url;

  // Step 1: 获取网页内容
  const jinaResult = await fetchUrlAsMarkdown(url);
  if (!jinaResult.success) {
    return { success: false, error: `获取网页失败: ${jinaResult.error}` };
  }

  // Step 2: 提取信息
  const glmResult = await extractNoticeInfo(jinaResult.content);
  if (!glmResult.success) {
    return { success: false, error: `提取失败: ${glmResult.error}`, rawContent: jinaResult.content };
  }

  return {
    success: true,
    extracted: glmResult.data,
    rawContent: jinaResult.content,
    url: url,
  };
}

// 保存原文内容到文件
function saveNoticeContent(schoolId, content, url) {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const filename = `${schoolId}.md`;
  const filepath = path.join(OUTPUT_DIR, filename);

  const header = `---
schoolId: ${schoolId}
url: ${url}
extractedAt: ${new Date().toISOString()}
---

`;

  fs.writeFileSync(filepath, header + content, 'utf-8');
  return filename;
}

// 主函数
async function main() {
  // 解析命令行参数
  const startIndex = parseInt(process.argv[2]) || 0;
  const count = parseInt(process.argv[3]) || 10;

  // 检查 API Key
  if (!GLM_API_KEY) {
    console.error('错误: 未找到 GLM API Key');
    console.error('');
    console.error('请在项目根目录的 .env.local 文件中添加：');
    console.error('  VITE_GLM_API_KEY=your-api-key');
    console.error('');
    console.error('或通过环境变量设置：');
    console.error('  Windows: set GLM_API_KEY=your-api-key');
    console.error('  Linux/Mac: export GLM_API_KEY=your-api-key');
    process.exit(1);
  }

  // 读取数据
  console.log('读取院校数据...');
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  const universities = data.universities;

  console.log(`总共 ${universities.length} 所院校`);
  console.log(`处理范围: ${startIndex} - ${startIndex + count - 1}`);
  console.log('---');

  // 处理结果
  const results = [];
  const endIndex = Math.min(startIndex + count, universities.length);

  for (let i = startIndex; i < endIndex; i++) {
    const school = universities[i];
    console.log(`\n[${i + 1}/${universities.length}] ${school.name}`);

    const result = await processUniversity(school);

    if (result.success) {
      // 保存原文
      const filename = saveNoticeContent(school.id, result.rawContent, result.url);

      results.push({
        id: school.id,
        name: school.name,
        success: true,
        extracted: result.extracted,
        noticeFile: filename,
        url: result.url,
      });

      console.log(`  ✓ 成功提取`);
      console.log(`    - 专业: ${result.extracted.specialty}`);
      console.log(`    - 截止: ${result.extracted.deadline}`);
      console.log(`    - 考核: ${result.extracted.examForm}`);
    } else {
      results.push({
        id: school.id,
        name: school.name,
        success: false,
        error: result.error,
      });
      console.log(`  ✗ 失败: ${result.error}`);

      // 如果有原文但提取失败，也保存
      if (result.rawContent) {
        saveNoticeContent(school.id, result.rawContent, school.programs?.[0]?.notices?.[0]?.url || '');
      }
    }

    // 延迟避免速率限制
    if (i < endIndex - 1) {
      console.log('  等待 2 秒...');
      await delay(2000);
    }
  }

  // 保存报告
  const report = {
    extractedAt: new Date().toISOString(),
    range: { start: startIndex, end: endIndex - 1 },
    total: results.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results: results,
  };

  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf-8');

  console.log('\n---');
  console.log(`处理完成！`);
  console.log(`成功: ${report.success} / ${report.total}`);
  console.log(`失败: ${report.failed} / ${report.total}`);
  console.log(`报告已保存到: ${REPORT_FILE}`);
  console.log(`原文已保存到: ${OUTPUT_DIR}/`);

  // 输出下一步命令
  if (endIndex < universities.length) {
    console.log(`\n继续处理下一批：`);
    console.log(`  node scripts/batch-extract.cjs ${endIndex} ${count}`);
  }
}

main().catch(console.error);
