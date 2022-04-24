import { Box, VStack } from '@chakra-ui/react';
import { ArticleBody } from 'components/ArticleBody';
import { ArticleHeading } from 'components/ArticleHeading';
import { getAllArticles, getArticleBySlug } from 'lib/getArticle';
import { NextPage } from 'next';
import Head from 'next/head';
import { Article } from 'types/Article';
import markdownToHtml from 'zenn-markdown-html';

type Props = {
  article: Article;
};

type Params = {
  params: {
    slug: string;
  };
};

const ArticleContent: NextPage<Props> = ({ article }) => {
  return (
    <Box as='article'>
      <Head>
        <title>{article.title}</title>
      </Head>

      <VStack spacing={10}>
        <ArticleHeading title={article.title} date={article.date} />
        <ArticleBody content={article.content} />
      </VStack>
    </Box>
  );
};

export const getStaticPaths = () => {
  const articles = getAllArticles();

  return {
    paths: articles.map(article => {
      return { params: { slug: article.slug } };
    }),
    fallback: false,
  };
};

export const getStaticProps = async ({ params }: Params) => {
  const article = getArticleBySlug(params.slug);
  const content = markdownToHtml(article.content);

  return {
    props: {
      article: {
        ...article,
        content: content,
      },
    },
  };
};

export default ArticleContent;
