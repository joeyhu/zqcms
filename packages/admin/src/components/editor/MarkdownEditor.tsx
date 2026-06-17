import MDEditor, { commands } from '@uiw/react-md-editor';
import { useRef, useEffect, useCallback } from 'react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 监听内容变化，自动调整 textarea 高度
  const autoGrow = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const editor = container.querySelector('.w-md-editor') as HTMLElement | null;
    const textArea = container.querySelector('.w-md-editor-text') as HTMLElement | null;
    const textarea = container.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement | null;
    if (textArea) {
      textArea.style.overflow = 'visible';
      textArea.style.height = 'auto';
    }
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(300, textarea.scrollHeight) + 'px';
    }
    if (editor && textarea) {
      // 工具栏约 32px，加一些 padding
      editor.style.height = (textarea.scrollHeight + 44) + 'px';
    }
  }, []);

  useEffect(() => {
    autoGrow();
    // 延迟再执行一次，确保渲染完成
    const timer = setTimeout(autoGrow, 50);
    return () => clearTimeout(timer);
  }, [value, autoGrow]);

  return (
    <div data-color-mode="light" ref={containerRef} className="md-editor-auto-grow">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={2000}
        preview="edit"
        visibleDragbar={false}
        textareaProps={{
          style: {
            minHeight: '300px',
            resize: 'none',
            overflow: 'hidden',
          },
        }}
        commands={[
          commands.group([], {
            name: 'basic',
            groupName: 'basic',
            buttonProps: { 'aria-label': 'Basic' },
          }),
          commands.bold,
          commands.italic,
          commands.strikethrough,
          commands.divider,
          commands.title,
          commands.divider,
          commands.link,
          commands.quote,
          commands.code,
          commands.codeBlock,
          commands.divider,
          commands.unorderedListCommand,
          commands.orderedListCommand,
          commands.checkedListCommand,
          commands.divider,
          commands.image,
          commands.table,
        ]}
      />
    </div>
  );
}
