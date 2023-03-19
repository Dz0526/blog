import { Nippo } from 'types/Article';
import {
  Stack,
  Box,
  StackDivider,
  Text,
  Icon,
  useDisclosure,
  Slide,
  Input,
  Grid,
} from '@chakra-ui/react';
import Head from 'next/head';
import { NippoPreview } from 'components/nippo/NippoPreview';
import { getAllNippos } from 'lib/getNippo';
import { FcKey } from 'react-icons/fc';
import { useRef } from 'react';

const DailyIndex = ({ nippos }: { nippos: Nippo[] }) => {
  const { isOpen, onToggle } = useDisclosure();
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Box>
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
        <Stack
          spacing={20}
          divider={<StackDivider borderColor='gray.200' />}
          position={'relative'}
        >
          {nippos &&
            nippos.map((nippo, i) => <NippoPreview key={i} nippo={nippo} />)}
          <Box
            backdropFilter={'auto'}
            backdropBlur={'2px'}
            border={'3'}
            borderColor={'gray.100'}
            borderBottomWidth={1}
            borderTopWidth={1}
            borderRightWidth={1}
            borderLeftWidth={1}
            borderRadius={3}
            position={'fixed'}
            bottom={5}
            cursor={'pointer'}
            onClick={() => {
              onToggle();
              setTimeout(() => ref.current?.focus(), 100);
            }}
          >
            <Box
              padding={3}
              _hover={{ transform: 'rotate(90deg)' }}
              transform={isOpen ? 'rotate(90deg)' : ''}
            >
              <Icon as={FcKey} fontSize={'3xl'}></Icon>
            </Box>
          </Box>
        </Stack>
      </Box>
      <Slide
        direction='bottom'
        in={isOpen}
        style={{ zIndex: 10, height: '100%', backdropFilter: 'auto' }}
      >
        <Grid
          backdropFilter={'auto'}
          backdropBlur={'2px'}
          top={0}
          height={'100%'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Input
            placeholder='キーワードを入力してください'
            width={'100%'}
            gridColumn={2}
            size={'lg'}
            _hover={{ borderColor: 'accent.100' }}
            borderWidth={3}
            onBlur={onToggle}
            ref={ref}
          />
        </Grid>
      </Slide>
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
