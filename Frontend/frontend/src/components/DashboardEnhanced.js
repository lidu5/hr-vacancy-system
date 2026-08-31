import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { vacancyAPI } from '../api/vacancies';
import { applicationAPI } from '../api/applications';
import { userAPI } from '../api/users';
import './DashboardEnhanced.css';

function DashboardEnhanced() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    vacancies: { total: 0, open: 0, filled: 0, closed: 0, draft: 0, on_hold: 0 },
    applications: { total: 0, pending: 0, reviewing: 0, shortlisted: 0, rejected: 0, accepted: 0 },
    users: { total: 0, admins: 0, recruiters: 0, interviewers: 0 },
    recentApplications: [],
    urgentVacancies: [],
    topVacancies: [],
    trends: { applicationsThisWeek: 0, applicationsLastWeek: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [vacancies, applications, users] = await Promise.all([
        vacancyAPI.getAll(),
        applicationAPI.getAll(),
        user?.role === 'admin' ? userAPI.getAll() : Promise.resolve([])
      ]);

      // Calculate vacancy stats
      const vacancyStats = {
        total: vacancies.length,
        open: vacancies.filter(v => v.status === 'open').length,
        filled: vacancies.filter(v => v.status === 'filled').length,
        closed: vacancies.filter(v => v.status === 'closed').length,
        draft: vacancies.filter(v => v.status === 'draft').length,
        on_hold: vacancies.filter(v => v.status === 'on_hold').length
      };

      // Calculate application stats
      const applicationStats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending').length,
        reviewing: applications.filter(a => a.status === 'reviewing').length,
        shortlisted: applications.filter(a => a.status === 'shortlisted').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
        accepted: applications.filter(a => a.status === 'accepted').length
      };

      // Calculate user stats (admin only)
      const userStats = user?.role === 'admin' ? {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        recruiters: users.filter(u => u.role === 'recruiter').length,
        interviewers: users.filter(u => u.role === 'interviewer').length
      } : { total: 0, admins: 0, recruiters: 0, interviewers: 0 };

      // Get recent applications (last 8)
      const recentApplications = applications
        .sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at))
        .slice(0, 8);

      // Get urgent vacancies (deadline within 7 days)
      const today = new Date();
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const urgentVacancies = vacancies
        .filter(v => v.status === 'open' && new Date(v.deadline) <= sevenDaysFromNow && new Date(v.deadline) >= today)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
        .slice(0, 5);

      // Get top vacancies by application count
      const vacancyApplicationCounts = vacancies.map(v => ({
        ...v,
        applicationCount: applications.filter(a => a.vacancy === v.id).length
      }));
      const topVacancies = vacancyApplicationCounts
        .sort((a, b) => b.applicationCount - a.applicationCount)
        .slice(0, 5);

      // Calculate trends
      const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const applicationsThisWeek = applications.filter(a => new Date(a.applied_at) >= oneWeekAgo).length;
      const applicationsLastWeek = applications.filter(a => 
        new Date(a.applied_at) >= twoWeeksAgo && new Date(a.applied_at) < oneWeekAgo
      ).length;

      setStats({
        vacancies: vacancyStats,
        applications: applicationStats,
        users: userStats,
        recentApplications,
        urgentVacancies,
        topVacancies,
        trends: { applicationsThisWeek, applicationsLastWeek }
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate percentage
  const calculatePercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  // Helper function to calculate trend
  const calculateTrend = () => {
    const { applicationsThisWeek, applicationsLastWeek } = stats.trends;
    if (applicationsLastWeek === 0) return { direction: 'up', percentage: 100 };
    const change = ((applicationsThisWeek - applicationsLastWeek) / applicationsLastWeek) * 100;
    return {
      direction: change >= 0 ? 'up' : 'down',
      percentage: Math.abs(Math.round(change))
    };
  };

  // Helper function to get days remaining
  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const trend = calculateTrend();

  return (
    <div className="dashboard-enhanced">
      {/* Header with User Info */}
      <div className="dashboard-header">
        <div className="header-left">
          <div className="user-avatar-large">{user?.username?.charAt(0).toUpperCase()}</div>
          <div className="header-info">
            <h1>Welcome back, {user?.username}!</h1>
            <p className="header-subtitle">
              <span className="role-badge-header">{user?.role}</span>
              {user?.department && <span className="department-badge">{user?.department}</span>}
            </p>
            {user?.role === 'recruiter' && user?.department && (
              <p className="department-notice">
                📌 Viewing {user.department} department data only
              </p>
            )}
          </div>
        </div>
        <div className="header-right">
          <button className="btn-refresh" onClick={fetchDashboardStats} title="Refresh Data">
            🔄
          </button>
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
        <button 
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          🕐 Activity
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Key Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card primary">
              <div className="metric-header">
                <span className="metric-icon">📋</span>
                <span className="metric-label">Total Vacancies</span>
              </div>
              <div className="metric-value">{stats.vacancies.total}</div>
              <div className="metric-details">
                <div className="detail-item success">
                  <span className="dot"></span>
                  {stats.vacancies.open} Open
                </div>
                <div className="detail-item info">
                  <span className="dot"></span>
                  {stats.vacancies.filled} Filled
                </div>
              </div>
            </div>

            <div className="metric-card secondary">
              <div className="metric-header">
                <span className="metric-icon">📝</span>
                <span className="metric-label">Applications</span>
              </div>
              <div className="metric-value">{stats.applications.total}</div>
              <div className="metric-trend">
                <span className={`trend-indicator ${trend.direction}`}>
                  {trend.direction === 'up' ? '↑' : '↓'} {trend.percentage}%
                </span>
                <span className="trend-label">vs last week</span>
              </div>
            </div>

            <div className="metric-card warning">
              <div className="metric-header">
                <span className="metric-icon">⏰</span>
                <span className="metric-label">Urgent Vacancies</span>
              </div>
              <div className="metric-value">{stats.urgentVacancies.length}</div>
              <div className="metric-details">
                <span className="detail-text">Closing within 7 days</span>
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className="metric-card accent">
                <div className="metric-header">
                  <span className="metric-icon">👥</span>
                  <span className="metric-label">Team Members</span>
                </div>
                <div className="metric-value">{stats.users.total}</div>
                <div className="metric-details">
                  <div className="detail-item">
                    <span className="dot"></span>
                    {stats.users.recruiters} Recruiters
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="dashboard-grid">
            {/* Left Column */}
            <div className="dashboard-left">
              {/* Quick Actions */}
              <div className="section-card">
                <h2 className="section-title">Quick Actions</h2>
                <div className="quick-actions">
                  <button className="action-btn primary" onClick={() => navigate('/vacancies/create')}>
                    <span className="action-btn-icon">➕</span>
                    <span>Create Vacancy</span>
                  </button>
                  <button className="action-btn secondary" onClick={() => navigate('/vacancies')}>
                    <span className="action-btn-icon">📋</span>
                    <span>Manage Vacancies</span>
                  </button>
                  <button className="action-btn tertiary" onClick={() => navigate('/applications')}>
                    <span className="action-btn-icon">📝</span>
                    <span>View Applications</span>
                  </button>
                  {user?.role === 'admin' && (
                    <button className="action-btn accent" onClick={() => navigate('/users')}>
                      <span className="action-btn-icon">👥</span>
                      <span>User Management</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Application Status Breakdown */}
              <div className="section-card">
                <h2 className="section-title">Application Pipeline</h2>
                <div className="pipeline-chart">
                  <div className="pipeline-item">
                    <div className="pipeline-bar pending" style={{width: `${calculatePercentage(stats.applications.pending, stats.applications.total)}%`}}></div>
                    <div className="pipeline-label">
                      <span>Pending</span>
                      <strong>{stats.applications.pending}</strong>
                    </div>
                  </div>
                  <div className="pipeline-item">
                    <div className="pipeline-bar reviewing" style={{width: `${calculatePercentage(stats.applications.reviewing, stats.applications.total)}%`}}></div>
                    <div className="pipeline-label">
                      <span>Reviewing</span>
                      <strong>{stats.applications.reviewing}</strong>
                    </div>
                  </div>
                  <div className="pipeline-item">
                    <div className="pipeline-bar shortlisted" style={{width: `${calculatePercentage(stats.applications.shortlisted, stats.applications.total)}%`}}></div>
                    <div className="pipeline-label">
                      <span>Shortlisted</span>
                      <strong>{stats.applications.shortlisted}</strong>
                    </div>
                  </div>
                  <div className="pipeline-item">
                    <div className="pipeline-bar accepted" style={{width: `${calculatePercentage(stats.applications.accepted, stats.applications.total)}%`}}></div>
                    <div className="pipeline-label">
                      <span>Accepted</span>
                      <strong>{stats.applications.accepted}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="dashboard-right">
              {/* Urgent Vacancies */}
              <div className="section-card urgent-section">
                <h2 className="section-title">
                  ⚠️ Urgent Vacancies
                  {stats.urgentVacancies.length > 0 && (
                    <span className="badge-count">{stats.urgentVacancies.length}</span>
                  )}
                </h2>
                {stats.urgentVacancies.length === 0 ? (
                  <p className="no-data">No urgent vacancies</p>
                ) : (
                  <div className="urgent-list">
                    {stats.urgentVacancies.map((vacancy) => (
                      <div 
                        key={vacancy.id} 
                        className="urgent-item"
                        onClick={() => navigate(`/vacancies/${vacancy.id}`)}
                      >
                        <div className="urgent-info">
                          <h4>{vacancy.title}</h4>
                          <p>{vacancy.department}</p>
                        </div>
                        <div className="urgent-deadline">
                          <span className="days-badge">
                            {getDaysRemaining(vacancy.deadline)} days
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Vacancies */}
              <div className="section-card">
                <h2 className="section-title">🔥 Top Vacancies</h2>
                {stats.topVacancies.length === 0 ? (
                  <p className="no-data">No vacancies yet</p>
                ) : (
                  <div className="top-list">
                    {stats.topVacancies.map((vacancy, index) => (
                      <div 
                        key={vacancy.id} 
                        className="top-item"
                        onClick={() => navigate(`/vacancies/${vacancy.id}`)}
                      >
                        <span className="rank">#{index + 1}</span>
                        <div className="top-info">
                          <h4>{vacancy.title}</h4>
                          <p>{vacancy.department}</p>
                        </div>
                        <div className="top-count">
                          <span className="count-badge">{vacancy.applicationCount}</span>
                          <span className="count-label">apps</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-container">
          <div className="analytics-grid">
            {/* Vacancy Status Chart */}
            <div className="chart-card">
              <h2 className="section-title">Vacancy Status Distribution</h2>
              <div className="donut-chart">
                <div className="chart-legend">
                  <div className="legend-item">
                    <span className="legend-color open"></span>
                    <span>Open ({stats.vacancies.open})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color filled"></span>
                    <span>Filled ({stats.vacancies.filled})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color closed"></span>
                    <span>Closed ({stats.vacancies.closed})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-color draft"></span>
                    <span>Draft ({stats.vacancies.draft})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Funnel */}
            <div className="chart-card">
              <h2 className="section-title">Application Funnel</h2>
              <div className="funnel-chart">
                <div className="funnel-stage" style={{width: '100%'}}>
                  <span>Total Applications</span>
                  <strong>{stats.applications.total}</strong>
                </div>
                <div className="funnel-stage" style={{width: `${calculatePercentage(stats.applications.reviewing + stats.applications.shortlisted + stats.applications.accepted, stats.applications.total)}%`}}>
                  <span>Under Review</span>
                  <strong>{stats.applications.reviewing + stats.applications.shortlisted}</strong>
                </div>
                <div className="funnel-stage" style={{width: `${calculatePercentage(stats.applications.shortlisted + stats.applications.accepted, stats.applications.total)}%`}}>
                  <span>Shortlisted</span>
                  <strong>{stats.applications.shortlisted}</strong>
                </div>
                <div className="funnel-stage" style={{width: `${calculatePercentage(stats.applications.accepted, stats.applications.total)}%`}}>
                  <span>Accepted</span>
                  <strong>{stats.applications.accepted}</strong>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="chart-card full-width">
              <h2 className="section-title">Performance Metrics</h2>
              <div className="metrics-row">
                <div className="performance-metric">
                  <div className="perf-label">Acceptance Rate</div>
                  <div className="perf-value">
                    {calculatePercentage(stats.applications.accepted, stats.applications.total)}%
                  </div>
                  <div className="perf-bar">
                    <div className="perf-fill" style={{width: `${calculatePercentage(stats.applications.accepted, stats.applications.total)}%`}}></div>
                  </div>
                </div>
                <div className="performance-metric">
                  <div className="perf-label">Rejection Rate</div>
                  <div className="perf-value">
                    {calculatePercentage(stats.applications.rejected, stats.applications.total)}%
                  </div>
                  <div className="perf-bar">
                    <div className="perf-fill rejected" style={{width: `${calculatePercentage(stats.applications.rejected, stats.applications.total)}%`}}></div>
                  </div>
                </div>
                <div className="performance-metric">
                  <div className="perf-label">Pending Review</div>
                  <div className="perf-value">
                    {calculatePercentage(stats.applications.pending, stats.applications.total)}%
                  </div>
                  <div className="perf-bar">
                    <div className="perf-fill pending" style={{width: `${calculatePercentage(stats.applications.pending, stats.applications.total)}%`}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="activity-container">
          <div className="activity-header">
            <h2 className="section-title">Recent Activity</h2>
            <div className="activity-filters">
              <button className={dateRange === 'today' ? 'active' : ''} onClick={() => setDateRange('today')}>Today</button>
              <button className={dateRange === 'week' ? 'active' : ''} onClick={() => setDateRange('week')}>This Week</button>
              <button className={dateRange === 'month' ? 'active' : ''} onClick={() => setDateRange('month')}>This Month</button>
            </div>
          </div>

          {stats.recentApplications.length === 0 ? (
            <div className="no-data-large">
              <div className="no-data-icon">📭</div>
              <h3>No Recent Activity</h3>
              <p>Applications will appear here as they come in</p>
            </div>
          ) : (
            <div className="activity-timeline">
              {stats.recentApplications.map((app, index) => (
                <div 
                  key={app.id} 
                  className="timeline-item"
                  onClick={() => navigate(`/applications/${app.id}`)}
                >
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4>{app.candidate_name}</h4>
                      <span className="timeline-time">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="timeline-description">
                      Applied for <strong>{app.vacancy_title}</strong>
                    </p>
                    <div className="timeline-footer">
                      <span className={`status-badge ${app.status}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardEnhanced;
