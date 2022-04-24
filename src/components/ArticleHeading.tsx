import { Heading, Text, VStack } from '@chakra-ui/react';
import React, { FC } from 'react';

type Props = {
  title: string;
  date: string;
};

export const ArticleHeading: FC<Props> = ({ title, date }) => {
  return (
    <VStack spacing={5}>
      <Heading as='h2'>{title}</Heading>
      <Text fontSize='xs'>{date}</Text>
    </VStack>
  );
};
