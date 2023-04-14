require("dotenv").config();
import { format } from "date-fns";
import { ja } from "date-fns/locale";
const { Client } = require("@notionhq/client");

const databaseId = "42c956833772402cb73d16ad546356c3";
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

(async () => {
  const date = format(new Date(), "yyyy-MM-dd", { locale: ja });
  await notion.pages.create({
    "parent": {
      "type": "database_id",
      "database_id": databaseId,
    },
    "properties": {
      "Name": {
        "title": [
          {
            "text": {
              "content": date,
            },
          },
        ],
      },
      "date": {
        "rich_text": [
          {
            "text": {
              "content": date,
            },
          },
        ],
      },
      "subject": {
        "rich_text": [
          {
            "text": {
              "content": "kami",
            },
            "plain_text": "kami",
          },
        ],
      },
    },
    "children": [
      {
        "object": "block",
        "heading_1": {
          "rich_text": [
            {
              "text": {
                "content": "やったこと",
              },
            },
          ],
        },
      },
      {
        "object": "block",
        "heading_1": {
          "rich_text": [
            {
              "text": {
                "content": "思ったこと",
              },
            },
          ],
        },
      },
    ],
  });
})();
