import React from 'react';
import { StoreProvider } from './contexts/StoreContext';
import TransactionWidget from './components/transactions/TransactionWidget';
import ReportingDashboard from './components/reports/ReportingDashboard';
import styled from 'styled-components';

const AppContainer = styled.div`
  min-height: 100vh;
  background: #f4f6f8;
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
`;

const Header = styled.header`
  background: white;
  padding: 16px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #5C6AC4;
  font-size: 24px;
  font-weight: bold;
`;

function App() {
  return (
    <StoreProvider>
      <AppContainer>
        <Header>
          <Logo>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.2468 3.95638C21.2468 3.95638 20.2423 3.84106 18.9212 3.84106C16.1646 3.84106 15.1601 5.27341 15.1601 7.1969C15.1601 10.3 18.6879 11.0459 18.6879 13.4541C18.6879 14.8864 17.8 15.5169 16.3634 15.5169C14.6934 15.5169 13.3723 14.7709 13.3723 14.7709L12.7179 17.9894C12.7179 17.9894 14.2701 18.85 16.4789 18.85C19.4689 18.85 21.4779 17.1878 21.4779 14.0828C21.4779 10.7613 17.9156 10.1309 17.9156 7.95372C17.9156 6.86372 18.6879 6.23319 19.9312 6.23319C21.2468 6.23319 22.2512 6.86372 22.2512 6.86372L22.9056 3.95638H21.2468Z" fill="#5C6AC4"/>
              <path d="M29.1201 3.72574C28.4657 3.72574 27.9268 4.12617 27.6935 4.75669L23.8312 17.7588H26.6201L27.2745 15.4015H31.3712L31.7201 17.7588H34.2757L31.9401 3.72574H29.1201ZM28.0423 12.6082L29.4779 7.08159L30.4823 12.6082H28.0423Z" fill="#5C6AC4"/>
              <path d="M11.4023 3.72574L9.16232 13.1082L7.03788 3.72574H4.36454L2.12454 13.1082L0 3.72574H-2.90478L0.697887 17.7588H3.59343L5.71788 8.86425L7.84232 17.7588H10.7379L14.3379 3.72574H11.4023Z" fill="#5C6AC4"/>
            </svg>
            POS Buy/Sell/Trade
          </Logo>
        </Header>
        
        <MainContent>
          <TransactionWidget />
          <ReportingDashboard />
        </MainContent>
      </AppContainer>
    </StoreProvider>
  );
}

export default App; 