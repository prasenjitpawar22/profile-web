import { getSortedArticles } from "@/lib/article";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog",
  description: "Prasenjit pawar blog",
};

export default async function Page() {
  const articles = await getSortedArticles();

  return (
    <>
      <div className="gap-4 flex flex-col lg:max-w-[700px]">
        <h1 className="text-4xl font-bold text-stone-800">
          My curated thoughts on software development
        </h1>
        <p className="text-base text-stone-700 tracking-wide">
          Writing down all my thoughts on software development and design
          trends.
        </p>
      </div>
      <div className="mt-12 flex flex-col lg:max-w-[700px]">
        <div className="py-3 px-2 border-l">
          {articles.map((article) => (
            <Link
              href={`/blog/${article.id}`}
              key={article.id}
              className="w-full flex flex-col gap-2 transition-all duration-400 hover:bg-stone-100 p-4 rounded-md"
            >
              <h2 className="text-base font-bold text-stone-800 inline-flex justify-between">
                {article.title}
                <span className="text-sm font-normal">{article.date}</span>
              </h2>
              <p className="text-sm text-stone-800 tracking-tight">
                {article.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
