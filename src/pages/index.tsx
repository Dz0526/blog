import { Stack, Box } from '@chakra-ui/react';
import { ArticlePreview } from 'components/ArticlePreview';
import { getAllArticles } from 'lib/getArticle';
import type { NextPage } from 'next';
import Head from 'next/head';
import { Article } from 'types/Article';

type Props = {
  articles: Article[];
};

const Index: NextPage<Props> = ({ articles }) => {
  return (
    <Box>
      <Head>
        <title>Dz99 blog</title>
        <meta name='description' content='This is the blog site of Dz99' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Stack spacing={20}>
        {articles &&
          articles.map((article, i) => (
            <ArticlePreview key={i} article={article} />
          ))}
      </Stack>
    </Box>
  );
};

export default Index;

export const getStaticProps = async () => {
  const articles = getAllArticles();

  return {
    props: { articles },
  };
};
