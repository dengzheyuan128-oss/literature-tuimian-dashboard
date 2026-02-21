/**
 * Jina Reader API 封装
 * 将 URL 转换为 Markdown 格式
 */

const JINA_READER_BASE = 'https://r.jina.ai/';

export interface JinaReaderResult {
  success: boolean;
  content: string;
  error?: string;
}

/**
 * 使用 Jina Reader 获取 URL 的 Markdown 内容
 */
export async function fetchUrlAsMarkdown(url: string): Promise<JinaReaderResult> {
  try {
    const response = await fetch(`${JINA_READER_BASE}${encodeURIComponent(url)}`, {
      headers: {
        'Accept': 'text/plain',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        content: '',
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const content = await response.text();
    return {
      success: true,
      content,
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : '网络请求失败',
    };
  }
}
