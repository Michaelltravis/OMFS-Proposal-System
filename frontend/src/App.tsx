import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RepositoryPage } from './pages/repository/RepositoryPage';
import { ProposalPage } from './pages/proposal/ProposalPage';
import { GoogleDriveCallback } from './pages/GoogleDriveCallback';
import { Layout } from './components/common/Layout';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* OAuth callback route (standalone, no layout) */}
          <Route path="/google-drive/callback" element={<GoogleDriveCallback />} />

          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/repository" replace />} />
            <Route path="repository" element={<RepositoryPage />} />
            <Route path="proposals" element={<ProposalPage />} />
            <Route path="proposals/:proposalId" element={<ProposalPage />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
