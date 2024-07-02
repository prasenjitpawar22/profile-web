import { getArticleData } from "@/lib/article";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";

export default async function Page({ params }: { params: { id: string } }) {
  const article = await getArticleData(params.id);

  return (
    <section className="flex flex-col items-center justify-center">
      <article className="prose prose-stone prose-sm md:prose-base lg:prose-lg">
        <p className="w-full inline-flex items-center transition-all duration-300 relative">
          <Link
            href={"/blog"}
            className="md:absolute -left-20 text-stone-400 hover:text-stone-800 cursor-pointer"
          >
            <ArrowLeft />
          </Link>
          {article.date} | <BookOpen className="mx-2 opacity-40" size={20} />
          {article.read}
        </p>
        <MDXRemote
          source={article.markdown}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={dracula}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code>{children}</code>
              );
            },
            pre: (props) => <pre {...props} className="bg-muted" />,
          }}
        />
      </article>
    </section>
  );
}
