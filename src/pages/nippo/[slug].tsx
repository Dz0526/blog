import { Box, VStack } from '@chakra-ui/react';
import { ContentBody } from 'components/ContentBody';
import { NippoHeading } from 'components/nippo/NippoHeading';
import { getAllNippos, getNippoBySlug } from 'lib/getNippo';
import Head from 'next/head';
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
      <Head>
        <title>{`Dz99 Nippo | ${nippo.date}`}</title>
        <meta
          name='description'
          content={`This is Dz99 Nippo in ${nippo.date}`}
        />
        <meta
          property='og:image'
          content={`https://dz99.me/api/og?title=${nippo.title}&date=${nippo.date}`}
        />
        <meta property='og:title' content={nippo.date} />
        <meta property='og:description' content={nippo.title} />
        <meta
          property='og:url'
          content={'https://dz99.me/nippo/' + nippo.slug}
        />
        <meta property='og:site_name' content='Dz99 NIPPO ' />
      </Head>

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
