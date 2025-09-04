import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navigation from './components/Navigation'
import Home from './components/Home'
import PageList from './components/PageList'
import PageDetail from './components/PageDetail'
import EditPage from './components/EditPage'
import NewPage from './components/NewPage'

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pages" element={<PageList />} />
          <Route path="/pages/:id" element={<PageDetail />} />
          <Route path="/pages/:id/edit" element={<EditPage />} />
          <Route path="/pages/new" element={<NewPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
