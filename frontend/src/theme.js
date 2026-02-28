import { createTheme } from '@mui/material/styles';

/**
 * Application-wide MUI theme.
 *
 * Primary   #0052CC — Trello brand blue
 * Secondary #0065FF — Slightly brighter accent blue
 * Background default #F4F5F7 — Light grey canvas (Trello dashboard)
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0052CC',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0065FF',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F4F5F7',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  shape: {
    borderRadius: 4,
  },
});

export default theme;
