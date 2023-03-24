require('dotenv').config();
import fs from 'fs';

type KeywordContent = {
  slug: string;
  content: string;
  title: string;
};

(async () => {
  const keywordContents: KeywordContent[] = [];

  // block を引っ張ってきて、textを取るのが結構面倒(blockのtypeごとに条件分岐する必要がある)なので、n2mを流用する

  // ファイル処理を逐次出させた方が速い。（Promiseで処理を整えるよりも）
  const promise = Promise.resolve();
  const fileNames = fs.readdirSync('_nippo');
  fileNames.forEach(fileName => {
    promise.then(() => {
      const file = fs.readFileSync(`_nippo/${fileName}`, {
        encoding: 'utf-8',
        flag: 'r',
      });
      const titleMatch = file.match(/title: '(.*)'/);
      const dateMatch = file.match(/date: '(.*)'/);
      const contentMatch = file.match(/---.*---(.*)$/s);

      if (!(titleMatch && dateMatch && contentMatch))
        throw new Error('title or date or content not found');
      const date = dateMatch[1];
      const title = titleMatch[1];
      const content = contentMatch[1];
      const keywordContent = {
        slug: date,
        title: title,
        content: content,
      };
      keywordContents.push(keywordContent);
    });
  });
  promise.then(() => {
    fs.writeFile(
      `_keyword/keyword.json`,
      JSON.stringify(keywordContents),
      err => {
        if (err) throw err;
        console.log('Success');
      },
    );
  });
})();
