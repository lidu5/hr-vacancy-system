import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../asset/logo.png';
import './Header.css';

function Header() {
  return (
    <header className="site-header">
      <div className="header-content">
        <Link to="/" className="logo-link">
          <img src={logo} alt="logo" className="logo-img" />
          <span className="logo-text">Job Portal</span>
        </Link>
        <nav>
          <Link to="/jobs">Jobs</Link>
          <Link to="/login">Login</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;