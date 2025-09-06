import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUser } from '../api'
import LoginModal from './LoginModal'
import { setRumUser, clearRumUser } from '../utils/rum'

function Navigation() {
  const [user, setUser] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const response = await getCurrentUser()
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
        // Set RUM user context if user is already logged in
        setRumUser(userData.user)
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    }
  }

  const handleLogout = () => {
    // Clear RUM user context before local cleanup
    clearRumUser()
    
    // Clear tokens and redirect
    localStorage.removeItem('token')
    setUser(null)
    navigate('/')
    window.location.reload()
  }

  const handleLoginSuccess = (userData) => {
    setUser(userData.user)
    setShowLoginModal(false)
    window.location.reload()
  }

  return (
    <>
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
        <div className="container">
          <Link className="navbar-brand text-gradient" to="/">
            📝 Datablog
          </Link>
          <div className="navbar-nav ms-auto">
            <div id="auth-nav">
              {!user ? (
                <button 
                  className="btn btn-outline-primary" 
                  onClick={() => setShowLoginModal(true)}
                  id="loginBtn"
                >
                  🔐 Login
                </button>
              ) : (
                <div id="userMenu">
                  <div className="dropdown">
                    <button 
                      className="btn btn-primary dropdown-toggle" 
                      type="button" 
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <span id="userEmail">{user.email}</span>
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button className="dropdown-item" onClick={handleLogout}>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <LoginModal 
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  )
}

export default Navigation