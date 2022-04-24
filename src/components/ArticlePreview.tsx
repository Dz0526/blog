import { Box, Text, Link } from '@chakra-ui/react';
import React, { FC } from 'react';
import { Article } from 'types/Article';

type Props = {
  article: Article;
};

export const ArticlePreview: FC<Props> = ({ article }) => {
  return (
    <Link href={`/article/${article.slug}`} _hover={{ color: 'accent.100' }}>
      <Box>
        <Text fontSize='xl'>{article.title}</Text>
        <Text my={2} fontSize='xs'>
          {article.date}
        </Text>
      </Box>
    </Link>
  );
};
