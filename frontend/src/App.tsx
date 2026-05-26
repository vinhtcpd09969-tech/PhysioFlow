import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import ScrollToAnchor from './components/ScrollToAnchor';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#0B1222',
            color: '#fff',
            border: '1px solid rgba(46, 196, 182, 0.25)',
            padding: '14px 18px',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.3), 0 10px 20px -10px rgba(0, 0, 0, 0.2)',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '13px',
            fontWeight: '700',
          },
          success: {
            iconTheme: {
              primary: '#2EC4B6',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToAnchor />
        <AppRoutes />
      </Router>
    </>
  );
}

export default App;
