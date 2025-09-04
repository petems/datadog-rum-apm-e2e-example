import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './bootstrap.min.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { initRum } from './rum';

initRum();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
