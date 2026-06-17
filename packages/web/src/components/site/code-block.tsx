'use client';

import { useCallback, useState, Children, isValidElement } from 'react';
import { Copy, Download, Check } from 'lucide-react';

// Map language identifiers to file extensions
const LANGUAGE_EXTENSIONS: Record<string, string> = {
  javascript: 'js',
  js: 'js',
  jsx: 'jsx',
  typescript: 'ts',
  ts: 'ts',
  tsx: 'tsx',
  python: 'py',
  py: 'py',
  ruby: 'rb',
  rb: 'rb',
  go: 'go',
  golang: 'go',
  rust: 'rs',
  rs: 'rs',
  java: 'java',
  kotlin: 'kt',
  kt: 'kt',
  swift: 'swift',
  c: 'c',
  cpp: 'cpp',
  'c++': 'cpp',
  csharp: 'cs',
  cs: 'cs',
  php: 'php',
  html: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  sql: 'sql',
  shell: 'sh',
  sh: 'sh',
  bash: 'sh',
  zsh: 'sh',
  powershell: 'ps1',
  ps1: 'ps1',
  json: 'json',
  xml: 'xml',
  yaml: 'yml',
  yml: 'yml',
  toml: 'toml',
  markdown: 'md',
  md: 'md',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile',
  makefile: 'Makefile',
  graphql: 'graphql',
  gql: 'graphql',
  lua: 'lua',
  r: 'r',
  dart: 'dart',
  scala: 'scala',
  elixir: 'ex',
  ex: 'ex',
  elm: 'elm',
  haskell: 'hs',
  hs: 'hs',
  clojure: 'clj',
  clj: 'clj',
  erlang: 'erl',
  erl: 'erl',
  perl: 'pl',
  pl: 'pl',
  groovy: 'groovy',
  objectivec: 'm',
  objc: 'm',
  vbnet: 'vb',
  vb: 'vb',
  plaintext: 'txt',
  text: 'txt',
  txt: 'txt',
  diff: 'diff',
};

// Human-readable language names
const LANGUAGE_NAMES: Record<string, string> = {
  javascript: 'JavaScript',
  js: 'JavaScript',
  jsx: 'JSX',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  tsx: 'TSX',
  python: 'Python',
  py: 'Python',
  ruby: 'Ruby',
  rb: 'Ruby',
  go: 'Go',
  golang: 'Go',
  rust: 'Rust',
  rs: 'Rust',
  java: 'Java',
  kotlin: 'Kotlin',
  kt: 'Kotlin',
  swift: 'Swift',
  c: 'C',
  cpp: 'C++',
  'c++': 'C++',
  csharp: 'C#',
  cs: 'C#',
  php: 'PHP',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass',
  less: 'Less',
  sql: 'SQL',
  shell: 'Shell',
  sh: 'Shell',
  bash: 'Bash',
  zsh: 'Zsh',
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  json: 'JSON',
  xml: 'XML',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  markdown: 'Markdown',
  md: 'Markdown',
  dockerfile: 'Dockerfile',
  docker: 'Dockerfile',
  makefile: 'Makefile',
  graphql: 'GraphQL',
  gql: 'GraphQL',
  lua: 'Lua',
  r: 'R',
  dart: 'Dart',
  scala: 'Scala',
  elixir: 'Elixir',
  ex: 'Elixir',
  elm: 'Elm',
  haskell: 'Haskell',
  hs: 'Haskell',
  clojure: 'Clojure',
  clj: 'Clojure',
  erlang: 'Erlang',
  erl: 'Erlang',
  perl: 'Perl',
  pl: 'Perl',
  groovy: 'Groovy',
  objectivec: 'Objective-C',
  objc: 'Objective-C',
  vbnet: 'VB.NET',
  vb: 'VB.NET',
  plaintext: 'Plain Text',
  text: 'Plain Text',
  txt: 'Plain Text',
  diff: 'Diff',
};

function getExtension(lang: string): string {
  return LANGUAGE_EXTENSIONS[lang.toLowerCase()] || lang.toLowerCase() || 'txt';
}

function getDisplayName(lang: string): string | null {
  return LANGUAGE_NAMES[lang.toLowerCase()] || null;
}

/**
 * Extract language identifier from rehype-highlight className.
 * e.g. "hljs language-javascript" → "javascript"
 */
function extractLanguage(className: string): string | null {
  const match = className.match(/language-(\S+)/);
  return match ? match[1] : null;
}

/**
 * Extract plain text content from React children recursively.
 */
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (!children) return '';

  if (Array.isArray(children)) {
    return children.map(extractText).join('');
  }

  if (isValidElement(children)) {
    return extractText((children.props as { children?: React.ReactNode }).children);
  }

  return '';
}

export function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  // Extract the <code> element from children
  let codeClassName = '';
  let codeContent = '';

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === 'code') {
      const props = child.props as { className?: string; children?: React.ReactNode };
      codeClassName = props.className || '';
      codeContent = extractText(props.children);
    }
  });

  const language = extractLanguage(codeClassName);
  const displayLang = language ? getDisplayName(language) || language : null;
  const rawCode = codeContent;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = rawCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // ignore
      }
      document.body.removeChild(textarea);
    }
  }, [rawCode]);

  const handleDownload = useCallback(() => {
    const ext = language ? getExtension(language) : 'txt';
    const filename = `code.${ext}`;
    const blob = new Blob([rawCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [rawCode, language]);

  return (
    <div className="my-5 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2.5">
        <span className="text-xs font-medium text-gray-300 tracking-wide uppercase">
          {displayLang || 'Code'}
        </span>
        <div className="flex items-center gap-1">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            title="复制代码"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">已复制</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>复制</span>
              </>
            )}
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            title="下载代码"
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>下载</span>
          </button>
        </div>
      </div>

      {/* Code content */}
      <pre className="overflow-x-auto bg-gray-900 p-5 text-sm leading-relaxed">
        {children}
      </pre>
    </div>
  );
}
