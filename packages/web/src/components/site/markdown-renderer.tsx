import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components: Components = {
    h1: ({ children, ...props }) => (
      <h1 className="mt-8 mb-4 text-3xl font-bold text-gray-900" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="mt-6 mb-3 text-2xl font-semibold text-gray-900 border-b pb-2" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="mt-5 mb-2 text-xl font-semibold text-gray-900" {...props}>{children}</h3>
    ),
    p: ({ children, ...props }) => (
      <p className="my-3 leading-relaxed text-gray-700" {...props}>{children}</p>
    ),
    a: ({ children, href, ...props }) => (
      <a href={href} className="text-blue-600 hover:text-blue-800 underline" {...props}>{children}</a>
    ),
    ul: ({ children, ...props }) => (
      <ul className="my-3 list-disc pl-6 space-y-1 text-gray-700" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="my-3 list-decimal pl-6 space-y-1 text-gray-700" {...props}>{children}</ol>
    ),
    code: ({ className, children, ...props }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-pink-600" {...props}>
            {children}
          </code>
        );
      }
      return (
        <code className={`block rounded-lg bg-gray-900 p-4 text-sm text-gray-100 overflow-x-auto ${className || ''}`} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre className="my-4 overflow-x-auto rounded-lg bg-gray-900 p-4" {...props}>{children}</pre>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="my-4 border-l-4 border-blue-400 bg-blue-50 px-4 py-2 text-gray-700" {...props}>{children}</blockquote>
    ),
    table: ({ children, ...props }) => (
      <div className="my-4 overflow-x-auto">
        <table className="min-w-full border-collapse border" {...props}>{children}</table>
      </div>
    ),
    th: ({ children, ...props }) => (
      <th className="border bg-gray-50 px-4 py-2 text-left font-semibold" {...props}>{children}</th>
    ),
    td: ({ children, ...props }) => (
      <td className="border px-4 py-2" {...props}>{children}</td>
    ),
    hr: (props) => <hr className="my-8 border-gray-200" {...props} />,
  };

  return (
    <div className="prose-custom max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
