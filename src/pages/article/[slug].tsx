import { Box, VStack } from '@chakra-ui/react';
import { ContentBody } from 'components/ContentBody';
import { ArticleHeading } from 'components/ArticleHeading';
import { getAllArticles, getArticleBySlug } from 'lib/getArticle';
import { NextPage } from 'next';
import { Article } from 'types/Article';
import markdownToHtml from 'zenn-markdown-html';
import Head from 'next/head';

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
    <>
      <Head>
        <title>{`Dz99 Blog | ${article.date}`}</title>
        <meta
          name='description'
          content={`This is Dz99 blog ${article.title}`}
        />
        <meta
          property='og:image'
          content={`https://dz99.me/api/static?title=${article.title}&date=${article.date}`}
        />
        <meta property='og:title' content={article.title} />
        <meta property='og:description' content={article.date} />
        <meta
          property='og:url'
          content={'https://dz99.me/article/' + article.slug}
        />
        <meta property='og:site_name' content='Dz99 Blog ' />
      </Head>

      <Box as='article'>
        <VStack spacing={10}>
          <ArticleHeading title={article.title} date={article.date} />
          <ContentBody content={article.content} />
        </VStack>
      </Box>
    </>
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
