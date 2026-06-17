import { marked } from 'marked';
import prisma from '../lib/prisma';

// ─── Token 缓存 ─────────────────────────────────────

const tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

async function getWechatAccessToken(appId: string, appSecret: string): Promise<string> {
  const cacheKey = `${appId}:${appSecret}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt - 300000) {
    return cached.token;
  }

  const res = await fetch('https://api.weixin.qq.com/cgi-bin/stable_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'client_credential', appid: appId, secret: appSecret }),
  });

  const data = (await res.json()) as { access_token: string; expires_in: number; errcode?: number; errmsg?: string };
  if (data.errcode || !data.access_token) {
    let hint = '';
    if (data.errcode === 40164) {
      hint = ' | 请将服务器公网IP加入微信公众号IP白名单（公众平台 → 开发 → 基本配置 → IP白名单）';
    } else if (data.errcode === 40125 || data.errcode === 40013) {
      hint = ' | AppID或AppSecret无效，请检查配置';
    }
    throw new Error(`微信 access_token 获取失败: ${data.errmsg || '未知错误'}${hint}`);
  }

  tokenCache.set(cacheKey, { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 });
  return data.access_token;
}

// ─── 上传文章内图片 ──────────────────────────────────

async function uploadArticleImage(token: string, imageUrl: string): Promise<string> {
  // 下载图片
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`下载图片失败: ${imageUrl}`);
  const buffer = await imageRes.arrayBuffer();
  const blob = new Blob([buffer]);

  // 上传到微信
  const form = new FormData();
  form.append('media', blob, 'image.jpg');

  const res = await fetch(`https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`, {
    method: 'POST',
    body: form,
  });

  const data = (await res.json()) as { url?: string; errcode?: number; errmsg?: string };
  if (data.errcode || !data.url) {
    throw new Error(`上传微信图片失败: ${data.errmsg || '未知错误'}`);
  }

  return data.url;
}

// ─── 上传封面图为永久素材 ────────────────────────────

async function uploadThumbMedia(token: string, imageUrl: string): Promise<string> {
  const imageRes = await fetch(imageUrl);
  if (!imageRes.ok) throw new Error(`下载封面图失败: ${imageUrl}`);
  const buffer = await imageRes.arrayBuffer();
  const blob = new Blob([buffer]);

  const form = new FormData();
  form.append('media', blob, 'thumb.jpg');

  const res = await fetch(`https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`, {
    method: 'POST',
    body: form,
  });

  const data = (await res.json()) as { media_id?: string; errcode?: number; errmsg?: string };
  if (data.errcode || !data.media_id) {
    throw new Error(`上传微信封面图失败: ${data.errmsg || '未知错误'}`);
  }

  return data.media_id;
}

// ─── Markdown → 微信 HTML ────────────────────────────

async function markdownToWechatHtml(markdown: string, token: string, baseUploadUrl: string): Promise<string> {
  // 查找所有 Markdown 图片: ![alt](url)
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: { full: string; alt: string; url: string }[] = [];
  let match;
  while ((match = imgRegex.exec(markdown)) !== null) {
    images.push({ full: match[0], alt: match[1], url: match[2] });
  }

  // 上传图片到微信，构建替换映射
  const replacements: Map<string, string> = new Map();
  for (const img of images) {
    try {
      // 处理相对路径
      let fullUrl = img.url;
      if (fullUrl.startsWith('/')) {
        fullUrl = baseUploadUrl + fullUrl;
      }
      const wechatUrl = await uploadArticleImage(token, fullUrl);
      replacements.set(img.url, wechatUrl);
    } catch (err) {
      console.error(`[WeChat] 上传图片失败: ${img.url}`, err);
      // 图片上传失败时保留原文
    }
  }

  // 替换 Markdown 中的图片 URL
  let processedMd = markdown;
  for (const [orig, wechat] of replacements) {
    processedMd = processedMd.replace(new RegExp(orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), wechat);
  }

  // Markdown → HTML
  let html = await marked(processedMd);

  // 替换图片标签：将生成的 <img src="微信URL"> 中的 src 替换为微信 URL（双重保险）
  for (const [orig, wechat] of replacements) {
    html = html.replace(new RegExp(orig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), wechat);
  }

  // 微信限制：去除 JS、确保 HTML 规范
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/\s+on\w+\s*=\s*"[^"]*"/gi, '');

  return html;
}

// ─── 创建草稿 ──────────────────────────────────────

async function createWechatDraft(
  token: string,
  params: {
    title: string;
    content: string;  // HTML
    digest?: string;
    thumbMediaId?: string;
    author?: string;
    contentSourceUrl?: string;
  },
): Promise<string> {
  const res = await fetch(`https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      articles: [{
        article_type: 'news',
        title: params.title.slice(0, 64),
        author: params.author?.slice(0, 16) || undefined,
        digest: params.digest?.slice(0, 128) || undefined,
        content: params.content,
        content_source_url: params.contentSourceUrl || undefined,
        thumb_media_id: params.thumbMediaId || undefined,
        need_open_comment: 0,
        only_fans_can_comment: 0,
      }],
    }),
  });

  const data = (await res.json()) as { media_id?: string; errcode?: number; errmsg?: string };
  if (data.errcode || !data.media_id) {
    throw new Error(`创建微信草稿失败: ${data.errmsg || '未知错误'} (errcode=${data.errcode})`);
  }

  return data.media_id;
}

// ─── 发布草稿 ──────────────────────────────────────

async function publishWechatDraft(token: string, mediaId: string): Promise<string> {
  const res = await fetch(`https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_id: mediaId }),
  });

  const data = (await res.json()) as { publish_id?: string; errcode?: number; errmsg?: string };
  if (data.errcode || !data.publish_id) {
    throw new Error(`发布微信草稿失败: ${data.errmsg || '未知错误'} (errcode=${data.errcode})`);
  }

  return data.publish_id;
}

// ─── 完整发布流程 ───────────────────────────────────

export async function publishPostToWechat(postId: number, platformId: number): Promise<{ publishId: string }> {
  // 1. 获取文章和平台配置
  const [post, platform] = await Promise.all([
    prisma.post.findUnique({ where: { id: postId } }),
    prisma.publishPlatform.findUnique({ where: { id: platformId } }),
  ]);

  if (!post) throw new Error('文章不存在');
  if (!platform || platform.platform !== 'wechat') throw new Error('平台配置无效');
  if (!platform.isActive) throw new Error('该平台已停用');

  // 2. 获取 access_token
  const token = await getWechatAccessToken(platform.appId, platform.appSecret);

  // 3. 处理封面图（可选）
  let thumbMediaId: string | undefined;
  if (post.coverImage) {
    try {
      let coverUrl = post.coverImage;
      if (coverUrl.startsWith('/')) {
        coverUrl = `http://localhost:${process.env.API_PORT || 11003}${coverUrl}`;
      }
      thumbMediaId = await uploadThumbMedia(token, coverUrl);
    } catch (err) {
      console.error('[WeChat] 上传封面图失败，跳过:', err);
    }
  }

  // 4. Markdown → 微信 HTML（含图片上传替换）
  const baseUploadUrl = `http://localhost:${process.env.API_PORT || 11003}`;
  const htmlContent = await markdownToWechatHtml(post.content, token, baseUploadUrl);

  // 5. 创建草稿
  const mediaId = await createWechatDraft(token, {
    title: post.title,
    content: htmlContent,
    digest: post.excerpt || undefined,
    thumbMediaId,
    author: undefined,
  });

  // 6. 发布草稿
  const publishId = await publishWechatDraft(token, mediaId);

  return { publishId };
}
