import type { CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { cn } from "@/utils/cn";

interface DocMarkdownArticleProps {
  content: string;
}

const syntaxPanelStyle: CSSProperties = {
  background: "#1a1a22",
  border: "1px solid rgba(167, 139, 250, 0.14)",
  borderRadius: "0.75rem",
  fontFamily:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  fontSize: "0.8125rem",
  marginTop: "0.75rem",
  marginBottom: "0.75rem",
};

export default function DocMarkdownArticle({ content }: DocMarkdownArticleProps) {
  return (
    <article
      className="prose prose-invert max-w-none rounded-xl border border-zk-border bg-zk-elevated/30 p-5 font-zk-sans prose-headings:font-zk-sans prose-headings:tracking-[-0.02em] prose-headings:text-zk-text prose-p:text-zk-muted prose-p:leading-relaxed prose-li:text-zk-muted prose-strong:text-zk-text prose-a:text-zk-indigo prose-a:no-underline hover:prose-a:text-zk-indigo-hover prose-blockquote:border-zk-border prose-blockquote:text-zk-muted prose-code:rounded-md prose-code:border prose-code:border-zk-border prose-code:bg-zk-base/70 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-zk-mono prose-code:text-zk-cyan prose-code:before:content-none prose-code:after:content-none prose-pre:bg-transparent prose-pre:p-0 prose-pre:font-zk-mono prose-hr:border-zk-border prose-th:text-zk-text prose-td:text-zk-muted sm:p-6"
    >
      <ReactMarkdown
        components={{
          code(props) {
            const { children, className, ...rest } = props as unknown as {
              children: (number | string)[] | number | string;
              className?: string;
            };
            const match = /language-(\w+)/.exec(className ?? "");
            const codeText = Array.isArray(children)
              ? children
                  .map((v) =>
                    typeof v === "string"
                      ? v
                      : typeof v === "number"
                        ? String(v)
                        : ""
                  )
                  .join("")
              : typeof children === "string"
                ? children
                : typeof children === "number"
                  ? String(children)
                  : "";
            return match ? (
              <SyntaxHighlighter
                customStyle={syntaxPanelStyle}
                language={match[1]}
                PreTag="div"
                style={atomDark}
                {...rest}
              >
                {codeText.replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code
                className={cn(
                  "rounded-md border border-zk-border bg-zk-base/70 px-1.5 py-0.5 font-zk-mono text-sm text-zk-cyan",
                  className
                )}
                {...rest}
              >
                {codeText}
              </code>
            );
          },
        }}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ]}
        remarkPlugins={[remarkGfm]}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
}
