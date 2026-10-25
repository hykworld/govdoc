import React, { useState } from 'react';
import { Copy, Check, Download, Printer, FileText } from 'lucide-react';
import { marked } from 'marked';

interface MarkdownViewerProps {
  markdown: string;
  title: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ markdown, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[\/\\?%*:|"<>]/g, '_')}_분석보고서.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const htmlContent = marked.parse(markdown, { async: false }) as string;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Action Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>수석 분석가 공식 마크다운 보고서</span>
          <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
            (군더더기 인사말 생략 및 핵심 수치 강조 규격)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="마크다운 전문 복사"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">복사됨!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>마크다운 복사</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title=".md 파일 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>.md 저장</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="보고서 인쇄"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>인쇄</span>
          </button>
        </div>
      </div>

      {/* Rendered Markdown Body */}
      <div className="p-6 sm:p-8">
        <div
          className="prose prose-slate max-w-none 
            prose-headings:text-slate-900 prose-headings:font-bold
            prose-h1:text-xl prose-h1:border-b prose-h1:border-slate-200 prose-h1:pb-2 prose-h1:mb-4
            prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-blue-900
            prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2
            prose-p:text-slate-700 prose-p:leading-relaxed prose-p:my-2
            prose-strong:text-slate-900 prose-strong:font-bold prose-strong:bg-yellow-50 prose-strong:px-1 prose-strong:rounded
            prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5
            prose-li:text-slate-700 prose-li:my-1
            prose-table:w-full prose-table:border-collapse prose-table:my-4
            prose-th:bg-slate-100 prose-th:p-2.5 prose-th:text-xs prose-th:font-semibold prose-th:border prose-th:border-slate-300 prose-th:text-slate-800
            prose-td:p-2.5 prose-td:text-xs prose-td:border prose-td:border-slate-200 prose-td:text-slate-700
            prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r
          "
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};
