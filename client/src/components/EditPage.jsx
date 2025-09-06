import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPage, updatePage } from '../api'

function EditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [pageData, setPageData] = useState(null)

  useEffect(() => {
    loadPage()
  }, [id])

  const loadPage = async () => {
    try {
      const data = await getPage(id)
      if (data && data.length > 0) {
        const page = data[0] // API returns an array, get the first item
        setPageData(page)
        setTitle(page.title || '')
        setContent(page.body || '')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    // Validate form
    if (!title.trim() || !content.trim()) {
      setError('Please provide both title and content')
      setSaving(false)
      return
    }

    try {
      const response = await updatePage(id, title.trim(), content.trim())
      if (response.ok) {
        setSuccess('Page updated successfully!')
        setTimeout(() => {
          navigate(`/pages/${id}`)
        }, 1000)
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to update page')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    setShowPreview(!showPreview)
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

  if (!pageData) {
    return (
      <div className="container">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Page Not Found</h4>
          <p>The page you're trying to edit doesn't exist or you don't have permission to edit it.</p>
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
              <span className="badge bg-warning text-dark me-3 fs-6">Editing Page #{id}</span>
              <span className="text-muted">Created: {formatDate(pageData.createdDate || pageData.createdAt)}</span>
            </div>
            <h1 className="display-5">✏️ Edit Page</h1>
          </div>
          <div className="col-md-4 text-md-end">
            <Link to={`/pages/${id}`} className="btn btn-outline-secondary">
              ← Cancel & View Page
            </Link>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <strong>Success!</strong> {success}
        </div>
      )}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <strong>Error!</strong> {error}
        </div>
      )}

      {/* Form Section */}
      <div className="page-content">
        <form onSubmit={handleSubmit} noValidate>
          <div className="row">
            <div className="col-lg-8">
              {/* Title Input */}
              <div className="mb-4">
                <label htmlFor="title" className="form-label">📝 Page Title</label>
                <input 
                  type="text" 
                  className="form-control form-control-lg" 
                  id="title" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter an engaging title for your page..."
                  required
                />
                <div className="invalid-feedback">
                  Please provide a title for your page.
                </div>
              </div>

              {/* Body Textarea */}
              <div className="mb-4">
                <label htmlFor="content" className="form-label">📄 Page Content</label>
                <textarea 
                  className="form-control" 
                  id="content" 
                  rows="12"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your page content here... You can use line breaks and formatting."
                  required
                />
                <div className="invalid-feedback">
                  Please add some content to your page.
                </div>
                <div className="form-text">
                  💡 Tip: Use line breaks to format your content nicely!
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button type="submit" className="btn btn-success btn-lg" disabled={saving}>
                  {saving && <span className="spinner-border spinner-border-sm me-2" role="status"></span>}
                  💾 {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-outline-secondary btn-lg ms-2" onClick={handlePreview}>
                  👁️ {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
                <Link to={`/pages/${id}`} className="btn btn-outline-danger btn-lg ms-2">
                  ❌ Cancel
                </Link>
              </div>
            </div>

            <div className="col-lg-4">
              {/* Preview Section */}
              {showPreview && (
                <div className="card">
                  <div className="card-header">
                    <h6 className="mb-0">👁️ Preview</h6>
                  </div>
                  <div className="card-body">
                    <h5 className="card-title">{title || 'Untitled'}</h5>
                    <div className="page-body-content" style={{ whiteSpace: 'pre-wrap' }}>
                      {content || 'No content yet...'}
                    </div>
                  </div>
                </div>
              )}

              {/* Page Info Card */}
              <div className="card mt-4">
                <div className="card-header">
                  <h6 className="mb-0">📋 Page Info</h6>
                </div>
                <div className="card-body">
                  <ul className="list-unstyled mb-0">
                    <li><strong>ID:</strong> #{id}</li>
                    <li><strong>Created:</strong> {formatDate(pageData.createdDate || pageData.createdAt)}</li>
                    <li><strong>Status:</strong> <span className="badge bg-info">Editing</span></li>
                    {pageData.author && (
                      <li><strong>Author:</strong> {pageData.author.email}</li>
                    )}
                  </ul>
                  <hr />
                  <div className="d-grid gap-2">
                    <Link to={`/pages/${id}`} className="btn btn-sm btn-outline-primary">View Live Page</Link>
                    <Link to="/" className="btn btn-sm btn-outline-secondary">Back to Home</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPage