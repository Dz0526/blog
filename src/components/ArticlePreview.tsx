import { Box, LinkBox, Text, VStack } from '@chakra-ui/react';
import React, { FC } from 'react';

export const ArticlePreview: FC = () => {
  return (
    <LinkBox>
      <Text fontSize='xl' _hover={{ color: 'accent.100' }}>
        PolyBarのテーマが更新されていてArchが使い物にならなくなった話
      </Text>
      <Text my={2} fontSize='xs'>
        April ~
      </Text>
    </LinkBox>
  );
};
