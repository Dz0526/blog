import { Box, Text, Link } from '@chakra-ui/react';
import React from 'react';
import { Nippo } from 'types/Article';

export const NippoPreview = ({ nippo }: { nippo: Nippo }) => {
  return (
    <Link href={`/nippo/${nippo.slug}`} _hover={{ color: 'accent.100' }}>
      <Box>
        <Text fontSize='xl'>{nippo.date}</Text>
        <Text my={2} fontSize='xs'>
          {nippo.title}
        </Text>
      </Box>
    </Link>
  );
};
