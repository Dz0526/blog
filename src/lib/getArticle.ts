import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

export const getArticleBySlug = (slug: string) => {
  const articlesPath = join(process.cwd(), '_posts');
  const articleMdFile = fs.readFileSync(join(articlesPath, slug));
  const imperfectArticle = matter(articleMdFile);

  return {
    content: imperfectArticle['content'],
    title: imperfectArticle['data']['title'],
    slug: slug,
    date: imperfectArticle['data']['date'],
  };
};

export const getAllArticles = () => {
  const articlesPath = join(process.cwd(), '_posts');
  const slugs = fs.readdirSync(articlesPath);

  return slugs
    .map(slug => getArticleBySlug(slug))
    .sort((f, s) => {
      return f.date > s.date ? -1 : 1;
    });
};
