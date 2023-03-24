import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import { join } from 'path';

type Content = {
  slug: string;
  content: string;
  title: string;
};

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method == 'GET' && typeof req.query.keyword == 'string') {
    const keyword = req.query.keyword;
    const keywordPath = join(process.cwd(), '_keyword');
    const contents: Content[] = JSON.parse(
      fs.readFileSync(join(keywordPath, 'keyword.json'), 'utf-8'),
    );

    const slugsSearchByKeyword = contents
      .filter(content => content.content.includes(keyword))
      .map(filteredContent => filteredContent.slug);
    res.status(200).json(slugsSearchByKeyword);
  }
};

export default handler;
