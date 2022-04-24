import React, { FC } from 'react';
import { HStack, Heading, Link, Icon } from '@chakra-ui/react';
import { FaGithub } from 'react-icons/fa';

export const Header: FC = () => {
  return (
    <HStack spacing={10} my={10}>
      <Link href='/' _hover={{ color: 'accent.100' }}>
        <Heading as='h2'>Dz99 Blog</Heading>
      </Link>
      <Link href='https://github.com/Dz0526'>
        <Icon as={FaGithub} color='accent.100' />
      </Link>
    </HStack>
  );
};
