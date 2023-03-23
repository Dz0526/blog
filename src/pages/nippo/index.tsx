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
  FormControl,
  Button,
} from '@chakra-ui/react';
import Head from 'next/head';
import { NippoPreview } from 'components/nippo/NippoPreview';
import { getAllNippos } from 'lib/getNippo';
import { FcKey } from 'react-icons/fc';
import { BiSearchAlt } from 'react-icons/bi';
import { ReactNode, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const SlideContent = ({
  children,
  isOpen,
}: {
  children: ReactNode;
  isOpen: boolean;
}) => {
  return (
    <Slide
      direction='bottom'
      in={isOpen}
      style={{ zIndex: 10, height: '100%', backdropFilter: 'auto' }}
    >
      <Grid
        backdropFilter={'auto'}
        backdropBlur={'2px'}
        height={'100%'}
        justifyContent={'center'}
        alignItems={'center'}
      >
        {children}
      </Grid>
    </Slide>
  );
};

const DailyIndex = ({ nippos }: { nippos: Nippo[] }) => {
  const { isOpen, onToggle } = useDisclosure();
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const keyword = router.query.keyword;

  const [inputKeyword, setInputKeyword] = useState('');

  if (keyword) {
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
          <Text fontSize={'xs'} color='gray.500'>
            {keyword} で検索した結果です
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
          <SlideContent isOpen={isOpen}>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (inputKeyword) {
                  router.push({
                    pathname: '/nippo',
                    query: { keyword: inputKeyword },
                  });
                  onToggle();
                  setInputKeyword('');
                }
              }}
            >
              <FormControl zIndex={10}>
                <Input
                  placeholder='キーワードを入力してください'
                  width={'100%'}
                  gridColumn={2}
                  size={'lg'}
                  _hover={{ borderColor: 'accent.100' }}
                  focusBorderColor={'accent.100'}
                  borderWidth={3}
                  pl={8}
                  zIndex={10}
                  ref={ref}
                  value={inputKeyword}
                  onChange={e => setInputKeyword(e.target.value)}
                />
                <Button
                  colorScheme={'whiteAlpha'}
                  position={'absolute'}
                  top={1}
                  left={0}
                  size={'md'}
                  pl={0}
                  pr={0}
                  zIndex={20}
                  background={'transparent'}
                  _hover={{ background: 'transparent' }}
                  _focus={{ borderWidth: 0, background: 'transparent' }}
                  _active={{ background: 'transparent' }}
                  type='submit'
                >
                  <Icon
                    as={BiSearchAlt}
                    fontSize={'2xl'}
                    color={'accent.100'}
                    _active={{ fontSize: '3xl' }}
                  />
                </Button>
              </FormControl>
            </form>
            <Box
              position={'absolute'}
              top={0}
              left={0}
              height={'100%'}
              width={'100%'}
              background={'transparent'}
              zIndex={5}
              onClick={onToggle}
            />
          </SlideContent>
        </Box>
      </Box>
    );
  }
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
        <SlideContent isOpen={isOpen}>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (inputKeyword) {
                router.push({
                  pathname: '/nippo',
                  query: { keyword: inputKeyword },
                });
                onToggle();
                setInputKeyword('');
              }
            }}
          >
            <FormControl zIndex={10}>
              <Input
                placeholder='キーワードを入力してください'
                width={'100%'}
                gridColumn={2}
                size={'lg'}
                _hover={{ borderColor: 'accent.100' }}
                focusBorderColor={'accent.100'}
                borderWidth={3}
                pl={8}
                zIndex={10}
                ref={ref}
                value={inputKeyword}
                onChange={e => setInputKeyword(e.target.value)}
              />
              <Button
                colorScheme={'whiteAlpha'}
                position={'absolute'}
                top={1}
                left={0}
                size={'md'}
                pl={0}
                pr={0}
                zIndex={20}
                background={'transparent'}
                _hover={{ background: 'transparent' }}
                _focus={{ borderWidth: 0, background: 'transparent' }}
                _active={{ background: 'transparent' }}
                type='submit'
              >
                <Icon
                  as={BiSearchAlt}
                  fontSize={'2xl'}
                  color={'accent.100'}
                  _active={{ fontSize: '3xl' }}
                />
              </Button>
            </FormControl>
          </form>
          <Box
            position={'absolute'}
            top={0}
            left={0}
            height={'100%'}
            width={'100%'}
            background={'transparent'}
            zIndex={5}
            onClick={onToggle}
          />
        </SlideContent>
      </Box>
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
