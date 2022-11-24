import { Box, Container, Divider } from '@chakra-ui/react';
import { Footer } from 'components/Footer';
import { Header } from 'components/Header';
import React, { FC } from 'react';

type Props = {
  children: React.ReactNode;
};

export const Layout: FC<Props> = ({ children }) => {
  return (
    <Box>
      <Header />
      <Divider />
      <Container my={10}>
        {children}
        <Footer />
      </Container>
    </Box>
  );
};
