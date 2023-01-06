import { Heading, Text, VStack } from '@chakra-ui/react';
import React, { FC } from 'react';

type Props = {
  title: string;
  date: string;
};

export const NippoHeading: FC<Props> = ({ title, date }) => {
  return (
    <VStack spacing={5}>
      <Heading as='h2'>{date}</Heading>
      <Text fontSize='xs'>{title}</Text>
    </VStack>
  );
};
