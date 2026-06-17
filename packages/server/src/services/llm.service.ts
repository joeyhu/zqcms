import prisma from '../lib/prisma';
import type { LlmAssistAction } from '@zqcms/shared/types';

// ─── LLM 配置 CRUD ────────────────────────────────────

export const llmConfigService = {
  async list() {
    return prisma.llmConfig.findMany({ orderBy: { updatedAt: 'desc' } });
  },

  async getById(id: number) {
    return prisma.llmConfig.findUnique({ where: { id } });
  },

  async getActive() {
    return prisma.llmConfig.findFirst({ where: { isActive: true } });
  },

  async create(data: {
    name: string;
    provider: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    isActive?: boolean;
  }) {
    return prisma.llmConfig.create({ data });
  },

  async update(id: number, data: {
    name?: string;
    provider?: string;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    isActive?: boolean;
  }) {
    return prisma.llmConfig.update({ where: { id }, data });
  },

  async delete(id: number) {
    return prisma.llmConfig.delete({ where: { id } });
  },
};

// ─── OpenAI 兼容 Chat Completions ─────────────────────

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chatCompletion(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
): Promise<string> {
  const endpoint = normalizeBaseUrl(baseUrl) + '/chat/completions';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM API error (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM 返回内容为空');
  return content;
}

// ─── 获取模型列表 ────────────────────────────────────

function normalizeBaseUrl(baseUrl: string): string {
  let endpoint = baseUrl.replace(/\/+$/, '');
  if (!endpoint.endsWith('/v1')) {
    endpoint += '/v1';
  }
  return endpoint;
}

export async function fetchModels(baseUrl: string, apiKey: string): Promise<string[]> {
  const endpoint = normalizeBaseUrl(baseUrl) + '/models';

  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    // 有些 API（如 DeepSeek）不支持 /v1/models，给出友好提示
    if (res.status === 404 || res.status === 405) {
      throw new Error('该 API 端点不支持获取模型列表（404/405），请手动输入模型名称');
    }
    throw new Error(`获取模型列表失败 (${res.status}): ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { data?: { id: string }[] };

  if (!json.data || !Array.isArray(json.data)) {
    throw new Error('返回数据格式异常，未找到模型列表');
  }

  // 过滤掉非 chat 模型（如 embedding、moderation、dall-e 等），只保留对话模型
  const models = json.data
    .map((m) => m.id)
    .filter((id) => {
      const lower = id.toLowerCase();
      // 排除明显非对话模型
      if (lower.includes('embedding')) return false;
      if (lower.includes('moderation')) return false;
      if (lower.includes('dall-e')) return false;
      if (lower.includes('tts-')) return false;
      if (lower.includes('whisper-')) return false;
      if (lower.includes('text-')) return false; // text-embedding, text-moderation 等
      return true;
    })
    .sort();

  return models;
}

async function getActiveConfig() {
  const config = await llmConfigService.getActive();
  if (!config) throw new Error('请先在 LLM 设置中配置并启用一个 AI 模型');
  return config;
}

export const llmAssistService = {
  /** 根据 action 执行 AI 辅助操作 */
  async assist(params: {
    action: LlmAssistAction;
    content: string;
    title?: string;
    categories?: string[];
    existingTags?: string[];
  }): Promise<{ success: boolean; result?: string; tags?: string[]; category?: string; seoTitle?: string; seoDesc?: string; error?: string }> {
    try {
      const cfg = await getActiveConfig();
      const { action, content, title, categories, existingTags } = params;

      switch (action) {
        case 'generate':
          return { success: true, result: await generateContent(cfg.baseUrl, cfg.apiKey, cfg.model, title || '', content) };
        case 'summarize':
          return { success: true, result: await summarizeContent(cfg.baseUrl, cfg.apiKey, cfg.model, content) };
        case 'extractTags':
          return { success: true, tags: await extractTags(cfg.baseUrl, cfg.apiKey, cfg.model, content, existingTags || []) };
        case 'classify':
          return { success: true, category: await classifyContent(cfg.baseUrl, cfg.apiKey, cfg.model, title || '', content, categories || []) };
        case 'generateTitle':
          return { success: true, result: await generateTitle(cfg.baseUrl, cfg.apiKey, cfg.model, content) };
        case 'format':
          return { success: true, result: await formatContent(cfg.baseUrl, cfg.apiKey, cfg.model, content) };
        case 'generateSeo': {
          const seo = await generateSeo(cfg.baseUrl, cfg.apiKey, cfg.model, title || '', content);
          return { success: true, ...seo };
        }
        default:
          return { success: false, error: `未知的 action: ${action}` };
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'AI 服务调用失败' };
    }
  },
};

// ─── 具体 AI 功能实现 ────────────────────────────────

/** 续写/改写：基于标题和已有内容，续写或润色 */
async function generateContent(baseUrl: string, apiKey: string, model: string, title: string, content: string): Promise<string> {
  const systemPrompt = `你是一位专业的内容编辑。请根据文章的标题和已有内容，帮助续写或润色文章。要求：
- 保持原文风格和语气一致
- 如果内容较少则续写补充，如果内容较多则优化润色
- 直接返回续写/优化后的完整内容，不要加额外解释`;
  
  const userPrompt = title
    ? `文章标题：${title}\n\n当前内容：${content}\n\n请根据标题和当前内容，续写或润色这篇文章。`
    : `当前内容：${content}\n\n请续写或润色这段内容。`;

  return chatCompletion(baseUrl, apiKey, model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);
}

/** 生成摘要：从文章中提取摘要 */
async function summarizeContent(baseUrl: string, apiKey: string, model: string, content: string): Promise<string> {
  const systemPrompt = '你是一位专业的内容摘要编辑。请根据文章内容生成一段简洁的摘要，100-200字以内，只返回摘要文本，不要加额外解释。';
  return chatCompletion(baseUrl, apiKey, model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `请为以下文章生成摘要：\n\n${content}` },
  ]);
}

/** 提取标签：从文章内容中提取 3-5 个标签 */
async function extractTags(baseUrl: string, apiKey: string, model: string, content: string, existingTags: string[]): Promise<string[]> {
  const existingStr = existingTags.length > 0 ? `\n现有标签供参考：${existingTags.join('、')}` : '';
  const systemPrompt = `你是一位专业的内容标签分析员。请从文章内容中提取 3-5 个最相关的标签关键词。
要求：
- 每个标签 2-4 个字
- 用逗号分隔，如：人工智能,机器学习,深度学习
- 只返回标签，不要加序号或其他文字`;
  
  const raw = await chatCompletion(baseUrl, apiKey, model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `请为以下文章提取标签：\n\n${content}${existingStr}` },
  ]);
  
  return raw.split(/[,，、\n]/).map((t: string) => t.trim()).filter((t: string) => t.length > 0).slice(0, 5);
}

/** 自动分类：根据标题和内容，从已有分类中推荐最合适的 */
async function classifyContent(baseUrl: string, apiKey: string, model: string, title: string, content: string, categories: string[]): Promise<string> {
  const catList = categories.join('、');
  const systemPrompt = `你是一位专业的内容分类员。请根据文章标题和内容，从给定的分类列表中推荐最合适的分类。
要求：只返回分类名称，不要加任何其他文字。如果没有合适的分类，返回"无"。`;

  const raw = await chatCompletion(baseUrl, apiKey, model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `文章标题：${title}\n文章内容：${content.slice(0, 2000)}\n\n可选分类：${catList}\n\n请推荐最合适的分类：` },
  ]);
  
  return raw.trim();
}

/** 优化排版与格式：对 Markdown 内容进行排版优化 */
async function formatContent(baseUrl: string, apiKey: string, model: string, content: string): Promise<string> {
  const systemPrompt = `你是一位专业的内容排版编辑。请对以下 Markdown 格式的文章进行排版和格式优化。要求：
- 优化标题层级结构（# ## ### 合理使用），确保层级递进
- 长段落适当拆分，每段不超过 5-6 行
- 列表内容使用有序/无序列表（- 或 1.）呈现
- 重要内容使用 **加粗** 强调
- 如有代码片段使用正确的代码块格式
- 段落之间增加空行分隔
- 直接返回优化后的完整 Markdown 内容，不要添加任何解释说明`;

  return chatCompletion(baseUrl, apiKey, model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `请优化以下文章的排版与格式：\n\n${content}` },
  ]);
}
/** 生成标题：根据文章内容生成标题 */
async function generateTitle(baseUrl: string, apiKey: string, model: string, content: string): Promise<string> {
  const systemPrompt = `你是一位专业的内容编辑。请根据文章内容生成一个简洁有力的标题。要求：
- 标题长度 10-30 字
- 准确概括文章核心内容
- 吸引读者但又不过分夸张
- 只返回标题文本，不要加书名号、引号或其他额外文字`;

  return chatCompletion(baseUrl, apiKey, model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `请为以下文章生成标题：\n\n${content.slice(0, 3000)}` },
  ]);
}

/** 生成 SEO 标题与描述 */
async function generateSeo(baseUrl: string, apiKey: string, model: string, title: string, content: string): Promise<{ seoTitle: string; seoDesc: string }> {
  const systemPrompt = `你是一位专业的 SEO 优化专家。请根据文章标题和内容，生成 SEO 友好的标题和描述。要求：
- SEO 标题：20-40 字，包含核心关键词，吸引点击
- SEO 描述：80-150 字，概括文章核心价值，引导用户点击
- 严格按以下 JSON 格式返回，不要加任何其他内容：
{"seoTitle":"SEO标题","seoDesc":"SEO描述"}`;

  const raw = await chatCompletion(baseUrl, apiKey, model, [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `文章标题：${title}\n\n文章内容：${content.slice(0, 3000)}\n\n请生成 SEO 标题和描述。` },
  ]);

  try {
    // 尝试从返回内容中提取 JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        seoTitle: parsed.seoTitle || '',
        seoDesc: parsed.seoDesc || '',
      };
    }
  } catch { /* fallback */ }
  
  // fallback: 按行解析
  const lines = raw.split('\n').filter(Boolean);
  return {
    seoTitle: lines[0]?.replace(/^SEO标题[：:]?\s*/i, '').trim() || title,
    seoDesc: lines[1]?.replace(/^SEO描述[：:]?\s*/i, '').trim() || content.slice(0, 150),
  };
}
