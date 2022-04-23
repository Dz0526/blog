import React, { FC } from 'react';
import { HStack, Heading, Link, Icon } from '@chakra-ui/react';
import { FaGithub } from 'react-icons/fa';

export const Header = () => {
  return (
    <HStack spacing={10} my={10}>
      <Heading as='h2' _hover={{ color: 'accent.100' }}>
        Dz99 Blog
      </Heading>
      <Link href='https://github.com/Dz0526'>
        <Icon as={FaGithub} color='accent.100' />
      </Link>
    </HStack>
  );
};
