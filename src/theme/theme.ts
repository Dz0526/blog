import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'white',
      },
    },
  },
  colors: {
    accent: {
      100: '#66cdaa',
      500: '#7fffd4',
    },
  },
  fonts: {
    heading: `cursive,"Hachi Maru Pop"`,
    body: `cursive,"Hachi Maru Pop"`,
  },
});

export default theme;
