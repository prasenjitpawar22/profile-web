import type { ArticleItem } from '@/types/index'
import fs from 'fs'
import matter from 'gray-matter'
import moment from 'moment'
import path from 'path'
import { remark } from 'remark'
import html from 'remark-html'

const articleDir = path.join(process.cwd(), 'articles')

// Front matter dates are written as MM-DD-YY
const parseDate = (date: string) => moment(date, 'MM-DD-YY')
const formatDate = (date: string) => parseDate(date).format('MMM D, YYYY')

export const getSortedArticles = async (): Promise<ArticleItem[]> => {
  const fileNames = fs.readdirSync(articleDir)
  const allArticlesData: ArticleItem[] = fileNames.map((fileName) => {
    const id = fileName.replace(/\.md$/, '')

    const fullPath = path.join(articleDir, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf-8')

    const matterResult = matter(fileContents)

    return {
      id,
      title: matterResult.data.title,
      date: formatDate(matterResult.data.date),
      description: matterResult.data.description,
      category: matterResult.data.category,
    }
  })

  return allArticlesData.sort((a, b) => {
    return moment(b.date, 'MMM D, YYYY').diff(moment(a.date, 'MMM D, YYYY'))
  })
}

export const getArticleData = async (id: string) => {
  const fileName = path.join(articleDir, `${id}.md`)
  const fileContents = fs.readFileSync(fileName, 'utf-8')

  const matterResult = matter(fileContents)

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content)

  const contentHtml = processedContent.toString()

  return {
    id,
    markdown: matterResult.content,
    contentHtml,
    title: matterResult.data.title,
    description: matterResult.data.description,
    category: matterResult.data.category,
    date: formatDate(matterResult.data.date),
    read: matterResult.data.read,
  }
}
