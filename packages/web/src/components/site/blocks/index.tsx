import { HeroBlock } from './hero-block';
import { FeaturesBlock } from './features-block';
import { PostListBlock } from './post-list-block';
import { FAQBlock } from './faq-block';
import { CTABlock } from './cta-block';
import { MarkdownBlock } from './markdown-block';
import { CategoryListBlock } from './category-list-block';
import type { PageBlock } from '@zqcms/shared/types';
import { BlockType } from '@zqcms/shared/types';

export function PageBlockRenderer({ block }: { block: PageBlock }) {
  switch (block.blockType) {
    case BlockType.HERO:
      return <HeroBlock config={block.config as { title?: string; subtitle?: string }} />;
    case BlockType.FEATURES:
      return <FeaturesBlock config={block.config as { columns?: number; items?: Array<{ icon: string; title: string; desc: string }> }} />;
    case BlockType.POST_LIST:
      return <PostListBlock config={block.config as { categoryId?: number; limit?: number; layout?: string; columns?: number }} />;
    case BlockType.FAQ:
      return <FAQBlock config={block.config as { items?: Array<{ question: string; answer: string }> }} />;
    case BlockType.CTA:
      return <CTABlock config={block.config as { title?: string; desc?: string; btnText?: string; btnLink?: string }} />;
    case BlockType.MARKDOWN:
      return <MarkdownBlock config={block.config as { content?: string }} />;
    case BlockType.CATEGORY_LIST:
      return <CategoryListBlock config={block.config as { columns?: number; showCount?: boolean }} />;
    default:
      return null;
  }
}
