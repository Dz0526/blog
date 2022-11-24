import { Box, Text } from '@chakra-ui/react';
import React, { FC } from 'react';

export const Footer: FC = () => {
  return (
    <Box my={5} as='footer'>
      <Text fontSize='xs' textAlign={'center'}>
        &copy; 2022, dz99
      </Text>
    </Box>
  );
};
