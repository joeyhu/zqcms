import MDEditor, { commands } from '@uiw/react-md-editor';
import type { ICommand } from '@uiw/react-md-editor';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        height={500}
        preview="edit"
        visibleDragbar={false}
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
