import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from 'styled-components';
import { theme } from '@constants/theme';
import { GlobalStyle } from '@constants/globalStyles';
import { ErrorBoundary } from '@components/common/ErrorBoundary';
import { StoreProvider } from '@contexts/StoreContext';
import { AuthProvider } from '@contexts/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <StoreProvider>
        <AuthProvider>
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <GlobalStyle />
              <App />
              <ToastContainer position="top-right" />
            </ThemeProvider>
          </BrowserRouter>
        </AuthProvider>
      </StoreProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
