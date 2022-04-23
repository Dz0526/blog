import { Box, Text } from '@chakra-ui/react';
import React, { FC } from 'react';
import { Article } from 'types/Article';

type Props = {
  article: Article;
};

export const ArticlePreview: FC<Props> = ({ article }) => {
  return (
    <Box>
      <Text fontSize='xl' _hover={{ color: 'accent.100' }}>
        {article.title}
      </Text>
      <Text my={2} fontSize='xs'>
        {article.date}
      </Text>
    </Box>
  );
};
