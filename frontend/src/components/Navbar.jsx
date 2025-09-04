import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm mb-4">
      <div className="container">
        <Link className="navbar-brand text-gradient" to="/">
          📝 Datablog
        </Link>
        <div className="navbar-nav ms-auto">
          <div id="auth-nav">
            {user ? (
              <div className="dropdown">
                <button className="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  <span>{user.email}</span>
                </button>
                <ul className="dropdown-menu">
                  <li><a className="dropdown-item" href="#" onClick={logout}>Logout</a></li>
                </ul>
              </div>
            ) : (
              <button className="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#loginModal">
                🔐 Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
