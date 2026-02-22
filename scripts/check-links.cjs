/**
 * 检查所有院校通知链接的有效性
 * 输出无效链接列表供人工核实
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const UNIVERSITIES_FILE = path.join(__dirname, '../client/src/data/universities.json');

// 检查单个URL
function checkUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    if (!url || url === '') {
      resolve({ valid: false, status: 'empty', message: '空链接' });
      return;
    }

    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      const req = protocol.request(
        url,
        {
          method: 'HEAD',
          timeout,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        },
        (res) => {
          const status = res.statusCode;
          if (status >= 200 && status < 400) {
            resolve({ valid: true, status, message: 'OK' });
          } else if (status >= 400 && status < 500) {
            resolve({ valid: false, status, message: `客户端错误 ${status}` });
          } else if (status >= 500) {
            resolve({ valid: false, status, message: `服务器错误 ${status}` });
          } else {
            resolve({ valid: true, status, message: `重定向 ${status}` });
          }
        }
      );

      req.on('error', (err) => {
        resolve({ valid: false, status: 'error', message: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ valid: false, status: 'timeout', message: '连接超时' });
      });

      req.end();
    } catch (err) {
      resolve({ valid: false, status: 'invalid', message: `无效URL: ${err.message}` });
    }
  });
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  console.log('=== 链接有效性检查 ===\n');
  console.log('正在检查所有院校通知链接...\n');

  const data = JSON.parse(fs.readFileSync(UNIVERSITIES_FILE, 'utf-8'));
  const results = {
    valid: [],
    invalid: [],
    timeout: [],
    error: [],
  };

  let checked = 0;
  const total = data.universities.reduce((sum, u) => {
    return sum + (u.programs || []).reduce((pSum, p) => {
      return pSum + (p.notices || []).length;
    }, 0);
  }, 0);

  for (const university of data.universities) {
    for (const program of university.programs || []) {
      for (const notice of program.notices || []) {
        checked++;
        const url = notice.url;

        process.stdout.write(`\r检查进度: ${checked}/${total} - ${university.name}...`);

        const result = await checkUrl(url);
        const info = {
          id: university.id,
          name: university.name,
          program: program.programName,
          url,
          ...result,
        };

        if (result.valid) {
          results.valid.push(info);
        } else if (result.status === 'timeout') {
          results.timeout.push(info);
        } else if (result.status === 'error') {
          results.error.push(info);
        } else {
          results.invalid.push(info);
        }

        // 避免请求过快
        await delay(500);
      }
    }
  }

  console.log('\n\n=== 检查结果 ===\n');
  console.log(`有效链接: ${results.valid.length}`);
  console.log(`无效链接: ${results.invalid.length}`);
  console.log(`超时链接: ${results.timeout.length}`);
  console.log(`错误链接: ${results.error.length}`);

  if (results.invalid.length > 0) {
    console.log('\n=== 无效链接详情 ===\n');
    for (const item of results.invalid) {
      console.log(`[${item.id}] ${item.name}`);
      console.log(`    URL: ${item.url}`);
      console.log(`    状态: ${item.message}`);
      console.log('');
    }
  }

  if (results.timeout.length > 0) {
    console.log('\n=== 超时链接（需人工核实） ===\n');
    for (const item of results.timeout) {
      console.log(`[${item.id}] ${item.name}`);
      console.log(`    URL: ${item.url}`);
      console.log('');
    }
  }

  if (results.error.length > 0) {
    console.log('\n=== 错误链接详情 ===\n');
    for (const item of results.error) {
      console.log(`[${item.id}] ${item.name}`);
      console.log(`    URL: ${item.url}`);
      console.log(`    错误: ${item.message}`);
      console.log('');
    }
  }

  // 保存报告
  const report = {
    checkedAt: new Date().toISOString(),
    summary: {
      total: checked,
      valid: results.valid.length,
      invalid: results.invalid.length,
      timeout: results.timeout.length,
      error: results.error.length,
    },
    invalid: results.invalid,
    timeout: results.timeout,
    error: results.error,
  };

  const reportPath = path.join(__dirname, '../docs/link-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n报告已保存至: ${reportPath}`);
}

main().catch(console.error);
