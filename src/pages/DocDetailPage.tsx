import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, Navigate, useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

import { getDocBySlug } from "../docs/registry";
import useUserStore from "../stores/userStore";
import { userHasAccessOrBypass } from "../utils/access";

export default function DocDetailPage() {
  const params = useParams();
  const slug = params.slug ?? "";
  const { isLoading, userDoc } = useUserStore();

  const meta = useMemo(() => getDocBySlug(slug), [slug]);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (!meta) return;
    meta
      .load()
      .then((md) => {
        setContent(md);
      })
      .catch(() => {
        setContent("# Not found");
      });
  }, [meta, isLoading, userDoc, slug]);

  if (!meta) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-light">
        <main className="mx-auto max-w-3xl">
          <h1 className="text-xl font-semibold mb-4">Document not found</h1>
          <Link className="text-blue-400 hover:underline" to="/docs">
            Back to docs
          </Link>
        </main>
      </div>
    );
  }

  if (meta.locked && !isLoading && !userHasAccessOrBypass(userDoc)) {
    return <Navigate replace state={{ from: `/docs/${slug}` }} to="/pro" />;
  }

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light">
      <main className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{meta.title}</h1>
          {meta.locked && (
            <div className="mt-2 text-xs text-yellow-400">
              Subscriber-only document
            </div>
          )}
        </div>

        <article className="prose prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0">
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
                    language={match[1]}
                    PreTag="div"
                    style={oneDark}
                    {...rest}
                  >
                    {codeText.replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...rest}>
                    {codeText}
                  </code>
                );
              },
            }}
            remarkPlugins={[remarkGfm]}
          >
            {content}
          </ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
