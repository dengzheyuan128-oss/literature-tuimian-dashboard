/**
 * GLM-4 API 封装
 * 智谱 AI 大模型接口
 */

const GLM_API_BASE = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const GLM_API_KEY = import.meta.env.VITE_GLM_API_KEY || '';

export interface ExtractedNotice {
  name: string;
  specialty: string;
  degreeType: string;
  applicationPeriod: string;
  deadline: string;
  examForm: string;
  englishRequirement: string;
  noticeType: string;
}

const EXTRACTION_PROMPT = `你是一个高校推免通知信息提取助手。请从以下网页内容中提取推免/夏令营相关信息。

请提取以下字段（JSON 格式）：
{
  "name": "院校名称",
  "specialty": "专业方向（如：中国语言文学）",
  "degreeType": "学硕 或 专硕",
  "applicationPeriod": "申请时间段",
  "deadline": "截止日期",
  "examForm": "考核形式（如：笔试+面试）",
  "englishRequirement": "英语要求（如：六级425分）",
  "noticeType": "夏令营 或 预推免"
}

规则：
1. 未找到的字段填写 "未注明"
2. 日期格式统一为 "YYYY年MM月DD日"
3. 只输出 JSON，不要其他文字

网页内容：
---
`;

export interface GlmResult {
  success: boolean;
  data: ExtractedNotice | null;
  error?: string;
}

/**
 * 调用 GLM-4 提取通知信息
 */
export async function extractNoticeInfo(markdownContent: string): Promise<GlmResult> {
  if (!GLM_API_KEY) {
    return {
      success: false,
      data: null,
      error: 'GLM API Key 未配置',
    };
  }

  try {
    const response = await fetch(GLM_API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4',
        messages: [
          {
            role: 'user',
            content: EXTRACTION_PROMPT + markdownContent.slice(0, 8000) + '\n---',
          },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        data: null,
        error: `GLM API 错误: ${response.status} - ${errorText}`,
      };
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

    // 尝试解析 JSON
    try {
      // 提取 JSON 部分（可能包含 markdown 代码块）
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false,
          data: null,
          error: '无法从响应中提取 JSON',
        };
      }

      const data = JSON.parse(jsonMatch[0]) as ExtractedNotice;
      return {
        success: true,
        data,
      };
    } catch (parseError) {
      return {
        success: false,
        data: null,
        error: `JSON 解析失败: ${content.slice(0, 200)}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}

/**
 * 检查 GLM API 是否已配置
 */
export function isGlmConfigured(): boolean {
  return Boolean(GLM_API_KEY);
}
