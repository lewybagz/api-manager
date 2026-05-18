import type { CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

type FilePreviewRichBlocksProps =
  | { content: string; variant: "json" }
  | { content: string; language: string; variant: "syntax" }
  | { content: string; variant: "markdown" };

/** Panel behind Prism blocks — matches zk-elevated / zk-border */
const syntaxPanelStyle: CSSProperties = {
  background: "#1a1a22",
  border: "1px solid rgba(167, 139, 250, 0.14)",
  borderRadius: "0.75rem",
  fontFamily:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  fontSize: "0.8125rem",
};

export default function FilePreviewRichBlocks(
  props: FilePreviewRichBlocksProps
) {
  if (props.variant === "markdown") {
    return (
      <div
        className="prose prose-invert max-w-none rounded-lg border border-zk-border bg-zk-elevated/45 p-4 font-zk-sans prose-headings:font-zk-sans prose-headings:tracking-[-0.02em] prose-headings:text-zk-text prose-p:text-zk-muted prose-p:leading-relaxed prose-li:text-zk-muted prose-strong:text-zk-text prose-a:text-zk-indigo prose-a:no-underline hover:prose-a:text-zk-indigo-hover prose-blockquote:border-zk-border prose-blockquote:text-zk-muted prose-code:rounded-md prose-code:border prose-code:border-zk-border prose-code:bg-zk-base/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-zk-mono prose-code:text-zk-cyan prose-code:before:content-none prose-code:after:content-none prose-pre:rounded-lg prose-pre:border prose-pre:border-zk-border prose-pre:bg-zk-base prose-pre:text-zk-text prose-pre:font-zk-mono prose-hr:border-zk-border prose-th:text-zk-text prose-td:text-zk-muted"
      >
        <ReactMarkdown>{props.content}</ReactMarkdown>
      </div>
    );
  }

  if (props.variant === "json") {
    return (
      <div className="p-4">
        <SyntaxHighlighter
          customStyle={syntaxPanelStyle}
          language="json"
          style={atomDark}
        >
          {JSON.stringify(JSON.parse(props.content), null, 2)}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <div className="p-4">
      <SyntaxHighlighter
        customStyle={syntaxPanelStyle}
        language={props.language}
        style={atomDark}
      >
        {props.content}
      </SyntaxHighlighter>
    </div>
  );
}
