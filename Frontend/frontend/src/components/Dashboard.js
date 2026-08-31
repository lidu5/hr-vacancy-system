import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { vacancyAPI } from '../api/vacancies';
import { applicationAPI } from '../api/applications';
import './Dashboard.css';

function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVacancies: 0,
    openVacancies: 0,
    totalApplications: 0,
    pendingApplications: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [vacancies, applications] = await Promise.all([
        vacancyAPI.getAll(),
        applicationAPI.getAll()
      ]);

      setStats({
        totalVacancies: vacancies.length,
        openVacancies: vacancies.filter(v => v.status === 'open').length,
        totalApplications: applications.length,
        pendingApplications: applications.filter(a => a.status === 'applied').length
      });

      setRecentApplications(applications.slice(0, 5));
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      applied: '#ff9800',
      shortlisted: '#2196f3',
      interview: '#9c27b0',
      offer: '#4caf50',
      hired: '#4caf50',
      rejected: '#f44336'
    };
    return colors[status] || '#666';
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p className="welcome-text">Welcome back, <strong>{user?.username}</strong></p>
        </div>
        <div className="header-right">
          <div className="user-badge">
            <span className="user-role">{user?.role}</span>
            {user?.department && <span className="user-dept">{user?.department}</span>}
          </div>
          <button onClick={logout} className="logout-btn">
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="stats-section">
        <div className="stat-card stat-blue">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '...' : stats.totalVacancies}</span>
            <span className="stat-label">Total Vacancies</span>
          </div>
        </div>
        
        <div className="stat-card stat-green">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '...' : stats.openVacancies}</span>
            <span className="stat-label">Open Positions</span>
          </div>
        </div>
        
        <div className="stat-card stat-orange">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '...' : stats.totalApplications}</span>
            <span className="stat-label">Total Applications</span>
          </div>
        </div>
        
        <div className="stat-card stat-purple">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{loading ? '...' : stats.pendingApplications}</span>
            <span className="stat-label">Pending Review</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Quick Actions */}
        <section className="dashboard-card">
          <h2 className="card-title">Quick Actions</h2>
          <div className="quick-actions">
            <button onClick={() => navigate('/vacancies/new')} className="action-btn primary">
              <span className="action-icon">➕</span>
              <span>Create New Vacancy</span>
            </button>
            <button onClick={() => navigate('/vacancies')} className="action-btn">
              <span className="action-icon">📋</span>
              <span>Manage Vacancies</span>
            </button>
            <button onClick={() => navigate('/applications')} className="action-btn">
              <span className="action-icon">📝</span>
              <span>View Applications</span>
            </button>
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/users')} className="action-btn">
                <span className="action-icon">👥</span>
                <span>User Management</span>
              </button>
            )}
          </div>
        </section>

        {/* Recent Applications */}
        <section className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Recent Applications</h2>
            <button onClick={() => navigate('/applications')} className="view-all-btn">
              View All →
            </button>
          </div>
          
          {loading ? (
            <div className="loading-state">Loading...</div>
          ) : recentApplications.length === 0 ? (
            <div className="empty-state">
              <p>No applications yet</p>
            </div>
          ) : (
            <div className="applications-list">
              {recentApplications.map(app => (
                <div 
                  key={app.id} 
                  className="application-item"
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <div className="app-info">
                    <span className="app-name">{app.candidate_name}</span>
                    <span className="app-position">{app.vacancy_title}</span>
                  </div>
                  <div className="app-meta">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(app.status) }}
                    >
                      {app.status}
                    </span>
                    <span className="app-date">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;