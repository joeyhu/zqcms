import { BlockType } from '@zqcms/shared/types';
import type { PageBlock } from '@zqcms/shared/types';
import { BLOCK_TYPE_LABELS } from '@zqcms/shared/constants';
import { Layout, Grid3X3, FileText, FolderTree, MessageCircleQuestion, FileCode, Megaphone, Minus } from 'lucide-react';

interface BlockPreviewProps {
  block: PageBlock;
  isSelected: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}

function PlaceholderIcon({ blockType }: { blockType: BlockType }) {
  const cls = 'h-8 w-8 text-gray-300';
  switch (blockType) {
    case BlockType.HERO: return <Layout className={cls} />;
    case BlockType.FEATURES: return <Grid3X3 className={cls} />;
    case BlockType.POST_LIST: return <FileText className={cls} />;
    case BlockType.CATEGORY_LIST: return <FolderTree className={cls} />;
    case BlockType.FAQ: return <MessageCircleQuestion className={cls} />;
    case BlockType.MARKDOWN: return <FileCode className={cls} />;
    case BlockType.CTA: return <Megaphone className={cls} />;
    default: return <Minus className={cls} />;
  }
}

function renderHero(config: Record<string, unknown>) {
  return (
    <div className="min-h-[200px] rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-center">
      {(config.title as string) && <h2 className="text-2xl font-bold text-white">{config.title as string}</h2>}
      {(config.subtitle as string) && <p className="mt-3 text-blue-100">{config.subtitle as string}</p>}
      {(config.ctaText as string) && (
        <span className="mt-4 inline-block rounded-lg bg-white px-5 py-2 text-sm font-semibold text-blue-600 shadow">
          {config.ctaText as string}
        </span>
      )}
    </div>
  );
}

function renderFeatures(config: Record<string, unknown>) {
  const cols = Number(config.columns) || 3;
  const items = (config.items as Array<{ icon: string; title: string; desc: string }>) || [];
  const displayItems = items.length > 0
    ? items
    : Array.from({ length: cols }, (_, i) => ({ icon: '✨', title: `特性 ${i + 1}`, desc: '特性描述文字' }));
  const gridClass = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3';
  return (
    <div className="px-6 py-10 bg-gray-50">
      <div className={`grid gap-4 ${gridClass}`}>
        {displayItems.map((item, i) => (
          <div key={i} className="rounded-xl border bg-white p-5 text-center shadow-sm">
            <div className="text-2xl mb-2">{item.icon || '✨'}</div>
            <h4 className="font-semibold text-gray-800">{item.title}</h4>
            <p className="mt-1 text-xs text-gray-400 line-clamp-2">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderPostList(config: Record<string, unknown>) {
  const limit = Number(config.limit) || 6;
  const layout = (config.layout as string) || 'grid';
  const cols = Number(config.columns) || 3;
  const count = Math.min(limit, 6);
  return (
    <div className="px-6 py-10">
      <h3 className="text-sm font-medium text-gray-400 mb-4">📰 文章列表 · {layout === 'grid' ? '网格' : '列表'} · {limit} 篇</h3>
      <div className={layout === 'grid' ? `grid gap-4 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}` : 'space-y-3'}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="h-3 w-3/4 rounded bg-gray-200 mb-2" />
            <div className="h-2 w-full rounded bg-gray-100 mb-1" />
            <div className="h-2 w-2/3 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function renderCategoryList(config: Record<string, unknown>) {
  const cols = Number(config.columns) || 3;
  const showCount = config.showCount !== false;
  const gridClass = cols === 2 ? 'grid-cols-2' : cols === 4 ? 'grid-cols-4' : 'grid-cols-3';
  return (
    <div className="px-6 py-10 bg-gray-50">
      <h3 className="text-sm font-medium text-gray-400 mb-4">📁 分类列表</h3>
      <div className={`grid gap-4 ${gridClass}`}>
        {Array.from({ length: cols * 2 }, (_, i) => (
          <div key={i} className="rounded-xl border bg-white p-5 shadow-sm">
            <h4 className="font-semibold text-gray-700">分类 {i + 1}</h4>
            <p className="mt-1 text-xs text-gray-400 line-clamp-2">分类描述文字</p>
            {showCount && <p className="mt-2 text-xs text-gray-300">12 篇文章</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderFaq(config: Record<string, unknown>) {
  const items = (config.items as Array<{ question: string; answer: string }>) || [];
  const displayItems = items.length > 0
    ? items
    : [{ question: '示例问题 1', answer: '示例回答内容...' }, { question: '示例问题 2', answer: '示例回答内容...' }];
  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <h3 className="text-sm font-medium text-gray-400 mb-4">❓ 常见问答</h3>
      <div className="space-y-3">
        {displayItems.map((item, i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800">{item.question}</span>
              <span className="text-gray-300 text-lg">+</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function renderCta(config: Record<string, unknown>) {
  return (
    <div className="px-6 py-12 text-center bg-gradient-to-r from-blue-50 to-indigo-50">
      {(config.title as string) && <h2 className="text-2xl font-bold text-gray-800">{config.title as string}</h2>}
      {(config.desc as string) && <p className="mt-2 text-gray-500">{config.desc as string}</p>}
      {(config.btnText as string) && (
        <span className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white font-semibold">
          {config.btnText as string}
        </span>
      )}
    </div>
  );
}

function renderMarkdown(config: Record<string, unknown>) {
  const content = (config.content as string) || '';
  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <h3 className="text-sm font-medium text-gray-400 mb-4">📝 自由内容 (Markdown)</h3>
      {content ? (
        <div className="prose prose-sm max-w-none rounded-lg border bg-white p-6">
          <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{content.slice(0, 300)}{content.length > 300 ? '...' : ''}</pre>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-white p-12 text-center text-gray-300">
          <FileCode className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">暂无 Markdown 内容</p>
        </div>
      )}
    </div>
  );
}

function renderDivider() {
  return (
    <div className="px-6 py-6">
      <div className="border-t border-gray-200" />
    </div>
  );
}

export function BlockPreview({ block, isSelected, onClick, onDoubleClick }: BlockPreviewProps) {
  const config = block.config || {};
  const typeLabel = BLOCK_TYPE_LABELS[block.blockType] || block.blockType;
  const borderColor = isSelected
    ? 'border-blue-400 ring-2 ring-blue-200'
    : 'border-transparent hover:border-gray-300';

  const renderContent = () => {
    switch (block.blockType) {
      case BlockType.HERO:
        return renderHero(config);
      case BlockType.FEATURES:
        return renderFeatures(config);
      case BlockType.POST_LIST:
        return renderPostList(config);
      case BlockType.CATEGORY_LIST:
        return renderCategoryList(config);
      case BlockType.FAQ:
        return renderFaq(config);
      case BlockType.CTA:
        return renderCta(config);
      case BlockType.MARKDOWN:
        return renderMarkdown(config);
      case BlockType.DIVIDER:
        return renderDivider();
      default:
        return (
          <div className="flex items-center justify-center gap-3 px-6 py-20 text-gray-300">
            <PlaceholderIcon blockType={block.blockType as BlockType} />
            <div>
              <p className="text-sm font-medium">{typeLabel}</p>
              <p className="text-xs">区块类型暂不支持预览</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(); }}
      className={`relative cursor-pointer rounded-lg border-2 transition-all duration-150 ${borderColor} ${!block.isVisible ? 'opacity-40' : ''}`}
    >
      {isSelected && (
        <div className="absolute -left-0.5 top-0 bottom-0 w-1 rounded-l-md bg-blue-500" />
      )}
      <div className={`absolute top-2 right-2 z-10 rounded px-2 py-0.5 text-[10px] font-medium ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
        {typeLabel}
      </div>
      {!block.isVisible && (
        <div className="absolute top-2 left-2 z-10 rounded bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
          已隐藏
        </div>
      )}
      <div className="overflow-hidden rounded-lg">
        {renderContent()}
      </div>
    </div>
  );
}
