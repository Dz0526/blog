import { isFullPage } from "@notionhq/client";
import {
  PageObjectResponse,
  QueryDatabaseResponse,
} from "@notionhq/client/build/src/api-endpoints";
require("dotenv").config();
const { NotionToMarkdown } = require("notion-to-md");
const { Client } = require("@notionhq/client");
import fs from "fs";

const databaseId = "42c956833772402cb73d16ad546356c3";
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});
const n2m = new NotionToMarkdown({ notionClient: notion });

const fetchAllPages = async (
  databaseId: string,
  pages: PageObjectResponse[],
  cursor: string | undefined = undefined,
): Promise<PageObjectResponse[]> => {
  const { results, has_more, next_cursor }: QueryDatabaseResponse = await notion
    .databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });

  const completedPages = results.filter((result) =>
    isFullPage(result)
  ) as PageObjectResponse[];
  const integratedPages = pages.concat(completedPages);
  if (has_more) {
    const morePages = fetchAllPages(
      databaseId,
      integratedPages,
      next_cursor ?? undefined,
    );
    return morePages;
  } else {
    return integratedPages;
  }
};

(async () => {
  const pages = await fetchAllPages(databaseId, []);

  pages.forEach((page) => {
    n2m
      .pageToMarkdown(page.id)
      .then((blocks: string) => n2m.toMarkdownString(blocks))
      .then((mdString: string) => {
        const title = page.properties.subject.type == "rich_text" &&
          page.properties.subject.rich_text[0].plain_text;
        const date = page.properties.date.type == "rich_text" &&
          page.properties.date.rich_text[0].plain_text;
        const subject = `---
title: '${title}'
date: '${date}'
---
`;
        fs.writeFile(`_nippo/${date}.md`, subject.concat(mdString), (err) => {
          if (err) throw err;
          console.log("Success");
        });
      });
  });
})();
