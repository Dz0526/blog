import { Box, VStack } from '@chakra-ui/react';
import { ContentBody } from 'components/ContentBody';
import { ArticleHeading } from 'components/ArticleHeading';
import { getAllArticles, getArticleBySlug } from 'lib/getArticle';
import { NextPage } from 'next';
import { NextSeo } from 'next-seo';
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
    <>
      <NextSeo
        title={`Dz99 Blog | ${article.title}`}
        openGraph={{
          title: article.title,
          siteName: 'Dz99 Blog',
          url: 'https://dz99.me/article/' + article.slug,
          images: [
            {
              url: '/ito.jpg',
              alt: 'Og Image',
              type: 'image/jpeg',
            },
          ],
        }}
      />

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
