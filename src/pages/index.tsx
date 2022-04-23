import { VStack, Stack, Box } from '@chakra-ui/react';
import { ArticlePreview } from 'components/ArticlePreview';
import type { NextPage } from 'next';
import Head from 'next/head';
import { Article } from 'types/Article';

type Props = {
  articles: Article[];
};

const Home: NextPage = () => {
  return (
    <Box>
      <Head>
        <title>Dz99 blog</title>
        <meta name='description' content='This is the blog site of Dz99' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <VStack spacing={10}>
        <Stack spacing={20}>
          <ArticlePreview />
          <ArticlePreview />
          <ArticlePreview />
        </Stack>
      </VStack>
    </Box>
  );
};

export default Home;
