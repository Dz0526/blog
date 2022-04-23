import { Box, Text } from '@chakra-ui/react';
import React, { FC } from 'react';

export const Footer: FC = () => {
  return (
    <Box my={5}>
      <footer>
        <Text fontSize='xs'>&copy; 2022, dz99</Text>
      </footer>
    </Box>
  );
};
