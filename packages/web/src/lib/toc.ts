import type { TocItem } from '@/components/site/table-of-contents';

/**
 * Generate a URL-friendly slug from heading text.
 * Matches rehype-slug (github-slugger) behavior:
 * - Lowercase
 * - Remove punctuation / special characters (keep letters, numbers, spaces, hyphens)
 * - Replace spaces with hyphens, collapse multiple hyphens
 * - Track duplicates and append -1, -2 etc.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    // Keep Unicode letters (\p{L}), numbers (\p{N}), spaces, and hyphens
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class Slugger {
  private occurrences: Record<string, number>;

  constructor() {
    this.occurrences = Object.create(null);
  }

  slug(value: string): string {
    let result = slugify(value);
    const original = result;

    while (Object.prototype.hasOwnProperty.call(this.occurrences, result)) {
      this.occurrences[original]++;
      result = original + '-' + this.occurrences[original];
    }

    this.occurrences[result] = 0;
    return result;
  }

  reset(): void {
    this.occurrences = Object.create(null);
  }
}

/**
 * Parse markdown headings (h1-h6) and generate TOC items
 * with slug IDs matching rehype-slug's output.
 */
export function parseTocFromMarkdown(content: string): TocItem[] {
  const slugger = new Slugger();
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = slugger.slug(text);
    items.push({ id, text, level });
  }

  return items;
}
