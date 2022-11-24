import React, { FC } from 'react';
import { HStack, Heading, Link, Icon, Box } from '@chakra-ui/react';
import { FaGithub } from 'react-icons/fa';

export const Header: FC = () => {
  return (
    <Box
      position={'fixed'}
      width={'100%'}
      borderColor={'gray.100'}
      borderBottomWidth={1}
      backdropFilter={'auto'}
      backdropBlur={'2px'}
    >
      <HStack p={1} justifyContent={'space-between'} width={'100%'}>
        <Link href='/' _hover={{ color: 'accent.100' }}>
          <Heading as='h1' fontWeight={'normal'} fontSize={20}>
            Dz99 Blog
          </Heading>
        </Link>
        <Link href='https://github.com/Dz0526' isExternal>
          <Icon as={FaGithub} color='accent.100' fontSize={20} />
        </Link>
      </HStack>
    </Box>
  );
};
