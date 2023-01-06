import { Nippo } from 'types/Article';
import { Stack, Box, StackDivider, Text } from '@chakra-ui/react';
import Head from 'next/head';
import { NippoPreview } from 'components/nippo/NippoPreview';
import { getAllNippos } from 'lib/getNippo';

const DailyIndex = ({ nippos }: { nippos: Nippo[] }) => {
  return (
    <Box>
      <Head>
        <title>Dz99 NIPPO</title>
        <meta
          name='description'
          content='This is the nippo in blog site of Dz99'
        />
      </Head>

      <Text fontWeight={'bold'} fontSize={'2xl'}>
        Nippo
      </Text>
      <Stack spacing={20} divider={<StackDivider borderColor='gray.200' />}>
        {nippos &&
          nippos.map((nippo, i) => <NippoPreview key={i} nippo={nippo} />)}
      </Stack>
    </Box>
  );
};

export default DailyIndex;

export const getStaticProps = async () => {
  const nippos = getAllNippos();

  return {
    props: { nippos },
  };
};
