import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import HomePage from './pages/HomePage';
import ViewPage from './pages/ViewPage';
import NewPage from './pages/NewPage';
import EditPage from './pages/EditPage';

function App() {
  return (
    <Router>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/page/new" element={<NewPage />} />
          <Route path="/page/:id" element={<ViewPage />} />
          <Route path="/page/:id/edit" element={<EditPage />} />
        </Routes>
      </main>
      <Footer />
      <LoginModal />
    </Router>
  );
}

export default App;
