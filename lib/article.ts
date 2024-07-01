import fs from "fs";
import { remark } from "remark";
import html from "remark-html";
import matter from "gray-matter";
import momemet from "moment";
import path from "path";
import type { ArticleItem } from "@/types/index";

const articleDir = path.join(process.cwd(), "articles");

export const getSortedArticles = async (): Promise<ArticleItem[]> => {
  const fileNames = fs.readdirSync(articleDir);
  const allArticlesData: ArticleItem[] = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, "");

    const fullPath = path.join(articleDir, fileName);
    const fileContents = fs.readFileSync(fullPath, "utf-8");

    const matterResult = matter(fileContents);

    return {
      id,
      title: matterResult.data.title,
      date: momemet(matterResult.data.date).format("MMM DD, YY"),
      description: matterResult.data.description,
      category: matterResult.data.category,
    };
  });

  return allArticlesData.sort((a, b) => {
    const format = "MMM DD, YY";
    const dateOne = momemet(a.date, format);
    const dateTwo = momemet(b.date, format);

    if (dateOne.isBefore(dateTwo)) {
      return -1;
    }
    if (dateTwo.isAfter(dateOne)) {
      return 1;
    } else {
      return 0;
    }
  });
};

export const getArticleData = async (id: string) => {
  const fileName = path.join(articleDir, `${id}.md`);
  const fileContents = fs.readFileSync(fileName, "utf-8");

  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);

  const contentHtml = processedContent.toString();

  return {
    id,
    markdown: matterResult.content,
    contentHtml,
    title: matterResult.data.title,
    description: matterResult.data.description,
    category: matterResult.data.category,
    date: momemet(matterResult.data.date).format("MMM DD, YY"),
    read: matterResult.data.read,
  };
};
