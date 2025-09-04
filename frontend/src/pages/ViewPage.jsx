import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

const ViewPage = () => {
  const { id } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const { data } = await api.get(`/api/page/${id}`);
        setPage(data[0]);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch page');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!page) {
    return <div>Page not found.</div>;
  }

  return (
    <div>
      <h1>{page.title}</h1>
      <p className="text-muted">
        By {page.author?.email || 'Unknown'} on {new Date(page.createdDate).toDateString()}
      </p>
      <div dangerouslySetInnerHTML={{ __html: page.body }} />
    </div>
  );
};

export default ViewPage;
