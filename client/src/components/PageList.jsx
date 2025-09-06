import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPages, getCurrentUser } from '../api'

function PageList() {
  const [pages, setPages] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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
        } else {
          setError('Failed to load pages')
        }
      } else {
        setError('Please log in to view pages')
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to load data')
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

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <hr />
          <Link to="/" className="btn btn-outline-primary">← Back to Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      {/* Page Header */}
      <div className="page-header">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h1 className="display-5">📚 All Pages</h1>
            <p className="lead text-muted">Manage your blog pages</p>
          </div>
          <div className="col-md-4 text-md-end">
            <Link to="/pages/new" className="btn btn-primary">
              ✨ Create New Page
            </Link>
          </div>
        </div>
      </div>

      {/* Pages Section */}
      <div className="page-content">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Your Pages</h2>
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
                      <br />
                      <small className="text-muted">
                        {page.body?.substring(0, 100)}...
                      </small>
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

      {/* Navigation */}
      <div className="d-flex justify-content-between mt-4">
        <Link to="/" className="btn btn-outline-secondary">
          ← Back to Home
        </Link>
        <Link to="/pages/new" className="btn btn-primary">
          Create New Page →
        </Link>
      </div>
    </div>
  )
}

export default PageList