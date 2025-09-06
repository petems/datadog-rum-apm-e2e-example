import { useState } from 'react'
import { login } from '../api'
import { setRumUser, trackLoginEvent } from '../utils/rum'

function LoginModal({ show, onHide, onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await login(formData.email, formData.password)
      const data = await response.json()

      if (response.ok) {
        setSuccess('Login successful!')
        localStorage.setItem('token', data.accessToken)
        
        // Set RUM user context and track login event
        setRumUser(data.user)
        trackLoginEvent(data.user)
        
        setTimeout(() => {
          onLoginSuccess(data)
          onHide()
          setFormData({ email: '', password: '' })
        }, 1000)
      } else {
        setError(data.message || 'Login failed')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className={`modal fade ${show ? 'show' : ''}`} 
         id="loginModal" 
         tabIndex="-1" 
         aria-labelledby="loginModalLabel" 
         aria-hidden={!show}
         style={{ display: show ? 'block' : 'none' }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="loginModalLabel">🔐 Login to Datablog</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onHide}
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <form id="loginForm" onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              {error && (
                <div id="loginError" className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              {success && (
                <div id="loginSuccess" className="alert alert-success" role="alert">
                  {success}
                </div>
              )}
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Cancel
            </button>
            <button 
              type="submit" 
              form="loginForm" 
              className="btn btn-primary" 
              id="loginSubmit"
              disabled={loading}
            >
              {loading && (
                <span id="loginSpinner" className="spinner-border spinner-border-sm me-2" role="status"></span>
              )}
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal