import { Container } from '@chakra-ui/react';
import { Footer } from 'components/Footer';
import { Header } from 'components/Header';
import React, { FC } from 'react';

type Props = {
  children: React.ReactNode;
};

export const Layout: FC<Props> = ({ children }) => {
  return (
    <Container my={5}>
      <Header />
      {children}
      <Footer />
    </Container>
  );
};
