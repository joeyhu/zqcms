import { MarkdownRenderer } from '@/components/site/markdown-renderer';

interface MarkdownBlockProps {
  config: {
    content?: string;
  };
}

export function MarkdownBlock({ config }: MarkdownBlockProps) {
  if (!config.content) return null;

  return (
    <section className="py-8">
      <div className="mx-auto max-w-4xl px-4">
        <MarkdownRenderer content={config.content} />
      </div>
    </section>
  );
}
