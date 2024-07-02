import { getArticleData } from "@/lib/article";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";

export default async function Page({ params }: { params: { id: string } }) {
  const article = await getArticleData(params.id);

  return (
    <article className="prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl 2xl:prose-2xl mx-auto">
      <p className="w-full flex-col md:flex-row inline-flex gap-2 md:items-center items-start  justify-start transition-all duration-300 relative">
        <Link
          href={"/blog"}
          className="md:absolute -left-16 text-stone-600 hover:text-stone-800 cursor-pointer"
        >
          <ArrowLeft />
        </Link>
        <span className="flex gap-2 items-center">
          {article.date} | <BookOpen className="opacity-40" size={20} />
          {article.read}
        </span>
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
  );
}
