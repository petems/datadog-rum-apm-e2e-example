import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const EditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data } = await api.get(`/api/page/${id}`);
        setTitle(data[0].title);
        setBody(data[0].body);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch page');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.put(`/api/page/${id}`, { title, body });
      navigate(`/page/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update page');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !title) { // only show loading on initial fetch
    return <div>Loading...</div>;
  }

  if (error && !title) { // only show initial fetch error
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <h1>Edit Page</h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="title" className="form-label">Title</label>
          <input
            type="text"
            className="form-control"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="body" className="form-label">Body</label>
          <textarea
            className="form-control"
            id="body"
            rows="10"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          ></textarea>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditPage;
