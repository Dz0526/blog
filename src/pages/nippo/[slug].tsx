import { Box, VStack } from '@chakra-ui/react';
import { ContentBody } from 'components/ContentBody';
import { NippoHeading } from 'components/nippo/NippoHeading';
import { getAllNippos, getNippoBySlug } from 'lib/getNippo';
import { NextSeo } from 'next-seo';
import { Nippo } from 'types/Article';
import markdownToHtml from 'zenn-markdown-html';

type Params = {
  params: {
    slug: string;
  };
};

const NippoContent = ({ nippo }: { nippo: Nippo }) => {
  return (
    <>
      <NextSeo
        title={`Dz99 Nippo | ${nippo.date}`}
        openGraph={{
          title: nippo.date,
          description: nippo.title,
          siteName: 'Dz99 Blog',
          url: 'https://dz99.me/nippo/' + nippo.slug,
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
          <NippoHeading title={nippo.title} date={nippo.date} />
          <ContentBody content={nippo.content} />
        </VStack>
      </Box>
    </>
  );
};

export const getStaticPaths = () => {
  const nippos = getAllNippos();

  return {
    paths: nippos.map(nippo => {
      console.log(nippo);
      return { params: { slug: nippo.slug } };
    }),
    fallback: false,
  };
};

export const getStaticProps = async ({ params }: Params) => {
  const nippo = getNippoBySlug(params.slug);
  const content = markdownToHtml(nippo.content);

  return {
    props: {
      nippo: {
        ...nippo,
        content: content,
      },
    },
  };
};

export default NippoContent;
