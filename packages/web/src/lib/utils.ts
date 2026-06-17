/**
 * 估算中文/混合内容的阅读时间
 * 中文阅读速度约 400 字/分钟，英文约 200 词/分钟
 */
export function estimateReadingTime(content: string): number {
  if (!content) return 1;

  // 去除 Markdown 语法
  const plainText = content
    .replace(/[#*`~\[\]()>!\-_|]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (!plainText) return 1;

  // 统计中文字符数
  const chineseChars = (plainText.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;

  // 统计英文单词数（去除中文后的文本）
  const textWithoutChinese = plainText.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ');
  const englishWords = textWithoutChinese
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  // 中文 400 字/分钟，英文 200 词/分钟
  const minutes = chineseChars / 400 + englishWords / 200;

  return Math.max(1, Math.ceil(minutes));
}

/**
 * 统计字数（中文字符 + 英文单词）
 */
export function countWords(content: string): number {
  if (!content) return 0;
  const plainText = content
    .replace(/[#*`~\[\]()>!\-_|]/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  const chineseChars = (plainText.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const textWithoutChinese = plainText.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ');
  const englishWords = textWithoutChinese
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return chineseChars + englishWords;
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 365) return `${Math.floor(diffDay / 365)} 年前`;
  if (diffDay > 30) return `${Math.floor(diffDay / 30)} 个月前`;
  if (diffDay > 0) return `${diffDay} 天前`;
  if (diffHour > 0) return `${diffHour} 小时前`;
  if (diffMin > 0) return `${diffMin} 分钟前`;
  return '刚刚';
}
