import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPages, getCurrentUser } from '../api'

function Home() {
  const [pages, setPages] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      // First get current user
      const userResponse = await getCurrentUser()
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData.user)
        
        // If user is authenticated, get their pages
        const pagesResponse = await getPages()
        if (pagesResponse.ok) {
          const pagesData = await pagesResponse.json()
          setPages(pagesData || [])
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'Unknown date'
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {user?.role === 'admin' && (
        <div id="adminBanner" className="alert alert-success d-flex align-items-center my-3" role="alert">
          ✅ <strong className="ms-2">Admin Mode:</strong> You can view all users' pages.
        </div>
      )}

      {/* Welcome Header */}
      <div className="page-header text-center">
        <h1 className="display-4 text-gradient mb-3">Welcome to Datablog!</h1>
        <p className="lead text-muted">Your personal blog powered by Datadog monitoring</p>
        {user && (
          <div className="mt-4">
            <Link to="/pages/new" className="btn btn-primary btn-lg">
              ✨ Create New Page
            </Link>
          </div>
        )}
      </div>

      {/* Pages Section */}
      {user ? (
        /* Authenticated User - Show Pages Section */
        <div className="page-content">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">📚 Your Pages</h2>
            <span className="badge bg-primary fs-6">{pages.length} pages</span>
          </div>

          {pages.length === 0 ? (
            /* Empty State */
            <div className="text-center py-5">
              <div className="mb-4">
                <svg width="64" height="64" className="text-muted" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd"/>
                  <path d="M8 6h4v1H8V6zM8 8h4v1H8V8zM8 10h2v1H8v-1z"/>
                </svg>
              </div>
              <h4 className="text-muted mb-3">No pages yet</h4>
              <p className="text-muted">Get started by creating your first blog page!</p>
              <Link to="/pages/new" className="btn btn-outline-primary">Create First Page</Link>
            </div>
          ) : (
            /* Pages Table */
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th scope="col" className="text-center">#</th>
                    <th scope="col">Title</th>
                    {user?.role === 'admin' && <th scope="col">Author</th>}
                    <th scope="col">Created</th>
                    <th scope="col" className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id || page._id}>
                      <td className="text-center">
                        <span className="badge bg-light text-dark">#{page.id || page._id}</span>
                      </td>
                      <td>
                        <Link to={`/pages/${page.id || page._id}`} className="fw-semibold">
                          {page.title || 'Untitled'}
                        </Link>
                      </td>
                      {user?.role === 'admin' && (
                        <td className="text-muted">
                          <small>
                            <i className="bi bi-person-circle"></i>
                            {page.author?.email || 'Unknown'}
                          </small>
                        </td>
                      )}
                      <td className="text-muted">
                        <small>{formatDate(page.createdDate || page.createdAt)}</small>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm" role="group">
                          <Link to={`/pages/${page.id || page._id}`} className="btn btn-outline-primary">
                            👁️ View
                          </Link>
                          <Link to={`/pages/${page.id || page._id}/edit`} className="btn btn-outline-secondary">
                            ✏️ Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Non-Authenticated User - Show Login Prompt */
        <div className="page-content">
          <div className="text-center py-5">
            <div className="mb-4">
              <svg width="64" height="64" className="text-muted" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <h4 className="text-muted mb-3">🔐 Please log in to view your pages</h4>
            <p className="text-muted mb-4">Sign in to access your personal blog pages and create new content.</p>
            <button className="btn btn-primary btn-lg" onClick={() => document.getElementById('loginBtn')?.click()}>
              🔑 Login to Continue
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-muted">
        <small>Powered by Datadog monitoring • Built with ❤️</small>
      </footer>
    </div>
  )
}

export default Home