import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

const HomePage = () => {
  const { user } = useContext(AuthContext);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      if (user) {
        try {
          const { data } = await api.get('/api/pages');
          setPages(data);
        } catch (error) {
          console.error('Failed to fetch pages:', error);
        }
      }
      setLoading(false);
    };
    fetchPages();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="page-header text-center">
        <h1 className="display-4 text-gradient mb-3">Welcome to Datablog!</h1>
        <p className="lead text-muted">Your personal blog powered by Datadog monitoring</p>
        {user && (
          <div className="mt-4">
            <Link to="/page/new" className="btn btn-primary btn-lg">
              ✨ Create New Page
            </Link>
          </div>
        )}
      </div>

      <div className="page-content">
        {user ? (
          <div>
            {pages.length === 0 ? (
              <div className="text-center py-5">
                <h4 className="text-muted mb-3">No pages yet</h4>
                <p className="text-muted">Get started by creating your first blog page!</p>
                <Link to="/page/new" className="btn btn-outline-primary">Create First Page</Link>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th scope="col" className="text-center">#</th>
                      <th scope="col">Title</th>
                      {user.role === 'admin' && <th scope="col">Author</th>}
                      <th scope="col">Created</th>
                      <th scope="col" className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((page) => (
                      <tr key={page.id}>
                        <td className="text-center">
                          <span className="badge bg-light text-dark">#{page.id}</span>
                        </td>
                        <td>
                          <Link to={`/page/${page.id}`} className="fw-semibold">
                            {page.title || 'Untitled'}
                          </Link>
                        </td>
                        {user.role === 'admin' && (
                          <td className="text-muted">
                            <small>{page.author?.email || 'Unknown'}</small>
                          </td>
                        )}
                        <td className="text-muted">
                          <small>{new Date(page.createdDate).toDateString()}</small>
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm" role="group">
                            <Link to={`/page/${page.id}`} className="btn btn-outline-primary">
                              👁️ View
                            </Link>
                            <Link to={`/page/${page.id}/edit`} className="btn btn-outline-secondary">
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
          <div className="text-center py-5">
            <h4 className="text-muted mb-3">🔐 Please log in to view your pages</h4>
            <p className="text-muted mb-4">Sign in to access your personal blog pages and create new content.</p>
            <button className="btn btn-primary btn-lg" data-bs-toggle="modal" data-bs-target="#loginModal">
              🔑 Login to Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
