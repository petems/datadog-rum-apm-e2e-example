import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getPage, deletePage } from '../api'

function PageDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadPage()
  }, [id])

  const loadPage = async () => {
    try {
      const data = await getPage(id)
      if (data && data.length > 0) {
        setPage(data[0]) // API returns an array, get the first item
      } else {
        setError('Failed to load page')
      }
    } catch (error) {
      console.error('Failed to load page:', error)
      setError('Failed to load page')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await deletePage(id)
      if (response.ok) {
        setShowDeleteModal(false)
        // Show success message briefly
        setTimeout(() => {
          navigate('/')
        }, 1500)
      } else {
        setError('Failed to delete page')
      }
    } catch (error) {
      console.error('Failed to delete page:', error)
      setError('Failed to delete page')
    } finally {
      setDeleting(false)
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

  if (error || !page) {
    return (
      <div className="container">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Page Not Found</h4>
          <p>{error || 'The page you\'re looking for doesn\'t exist or you don\'t have permission to view it.'}</p>
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
            <div className="d-flex align-items-center mb-2">
              <span className="badge bg-primary me-3 fs-6">Page #{id}</span>
              <span className="text-muted">Created: {formatDate(page.createdDate || page.createdAt)}</span>
            </div>
            <h1 className="display-5">{page.title || 'Untitled Page'}</h1>
          </div>
          <div className="col-md-4 text-md-end">
            <div className="action-buttons">
              <Link to={`/pages/${id}/edit`} className="btn btn-success">
                ✏️ Edit Page
              </Link>
              <button 
                className="btn btn-danger ms-2" 
                onClick={() => setShowDeleteModal(true)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="page-content">
        <div className="page-body-content" style={{ whiteSpace: 'pre-wrap' }}>
          {page.body || 'This page has no content yet.'}
        </div>
      </div>

      {/* Page Info */}
      <div className="mt-4">
        <div className="row">
          <div className="col-md-6">
            <small className="text-muted">
              Created: {formatDate(page.createdDate || page.createdAt)}
              {page.author && ` by ${page.author.email}`}
            </small>
          </div>
          <div className="col-md-6 text-md-end">
            <small className="text-muted">
              Last updated: {formatDate(page.updatedAt || page.createdDate || page.createdAt)}
            </small>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="d-flex justify-content-between mt-4">
        <Link to="/" className="btn btn-outline-secondary">
          ← Back to Home
        </Link>
        <Link to={`/pages/${id}/edit`} className="btn btn-primary">
          Edit this Page →
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">🗑️ Delete Page</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDeleteModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete this page?</p>
                <div className="alert alert-warning" role="alert">
                  <strong>Warning:</strong> This action cannot be undone!
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Page'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {showDeleteModal && <div className="modal-backdrop fade show"></div>}
    </div>
  )
}

export default PageDetail