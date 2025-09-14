import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/students', label: 'Students', icon: '👥' },
    { path: '/progress', label: 'Progress', icon: '📈' },
    { path: '/reports', label: 'Reports', icon: '📊' },
    { path: '/test', label: 'Test', icon: '🧠' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <h1>📖 Hifz Hub</h1>
          <p className="navbar-subtitle">Track your students' memorization journey</p>
        </div>
        <ul className="navbar-nav">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link 
                to={item.path} 
                className={`nav-link ${(item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)) ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;