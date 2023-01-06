import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

export const getNippoBySlug = (slug: string) => {
  const nipposPath = join(process.cwd(), '_nippo');
  const nippoMdFile = fs.readFileSync(join(nipposPath, slug + '.md'));
  const imperfectNippo = matter(nippoMdFile);

  return {
    content: imperfectNippo['content'],
    title: imperfectNippo['data']['title'],
    slug: slug,
    date: imperfectNippo['data']['date'],
  };
};

export const getNippoByFile = (slug: string) => {
  const nipposPath = join(process.cwd(), '_nippo');
  const nippoMdFile = fs.readFileSync(join(nipposPath, slug));
  const imperfectNippo = matter(nippoMdFile);

  return {
    content: imperfectNippo['content'],
    title: imperfectNippo['data']['title'],
    slug: slug.slice(0, slug.length - 3),
    date: imperfectNippo['data']['date'],
  };
};

export const getAllNippos = () => {
  const nipposPath = join(process.cwd(), '_nippo');
  const slugs = fs.readdirSync(nipposPath);

  return slugs
    .map(slug => getNippoByFile(slug))
    .sort((f, s) => {
      return f.date > s.date ? -1 : 1;
    });
};
