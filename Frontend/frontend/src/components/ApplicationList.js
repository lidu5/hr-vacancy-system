import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationAPI } from '../api/applications';
import { AuthContext } from '../context/AuthContext';
import './ApplicationList.css';

function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('newest');
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, departmentFilter, dateFrom, dateTo, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredApplications]);

  const fetchApplications = async () => {
    try {
      const data = await applicationAPI.getAll();
      setApplications(data);
    } catch (err) {
      setError('Failed to load applications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.candidate_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.candidate_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.vacancy_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.reference_code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(app => app.vacancy_department === departmentFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(app => new Date(app.applied_at) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(app => new Date(app.applied_at) <= new Date(dateTo));
    }

    // Sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
        case 'newest':
          return new Date(b.applied_at) - new Date(a.applied_at);
        case 'oldest':
          return new Date(a.applied_at) - new Date(b.applied_at);
        case 'name-asc':
          return a.candidate_name.localeCompare(b.candidate_name);
        case 'name-desc':
          return b.candidate_name.localeCompare(a.candidate_name);
        default:
          return 0;
      }
    });

    setFilteredApplications(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Reference Code', 'Candidate Name', 'Email', 'Vacancy', 'Department', 'Status', 'Applied Date'];
    const csvData = filteredApplications.map(app => [
      app.reference_code,
      app.candidate_name,
      app.candidate_email,
      app.vacancy_title,
      app.vacancy_department,
      app.status,
      new Date(app.applied_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `applications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await applicationAPI.updateStatus(appId, newStatus);
      fetchApplications();
    } catch (err) {
      alert('Failed to update application status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      applied: '#ff9800',
      shortlisted: '#2196f3',
      interview: '#9c27b0',
      offer: '#4caf50',
      hired: '#388e3c',
      rejected: '#f44336'
    };
    return colors[status] || '#666';
  };

  const getStats = () => {
    return {
      total: applications.length,
      pending: applications.filter(a => a.status === 'applied').length,
      interview: applications.filter(a => a.status === 'interview').length,
      hired: applications.filter(a => a.status === 'hired').length
    };
  };

  const getDepartments = () => {
    const depts = [...new Set(applications.map(app => app.vacancy_department).filter(Boolean))];
    return depts.sort();
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDepartmentFilter('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('newest');
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const stats = getStats();
  const departments = getDepartments();

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="application-list-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Job Applications</h1>
          <p className="subtitle">Manage and review all candidate applications</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-back">
          ← Back to Dashboard
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Applications</span>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending Review</span>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon">💼</div>
          <div className="stat-info">
            <span className="stat-value">{stats.interview}</span>
            <span className="stat-label">In Interview</span>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-value">{stats.hired}</span>
            <span className="stat-label">Hired</span>
          </div>
        </div>
      </div>

      {applications.length > 0 && (
        <>
          {/* Filters Section */}
          <div className="filters-panel">
            <div className="filters-row">
              <input
                type="text"
                placeholder="🔍 Search by name, email, vacancy, or reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
              <select 
                value={departmentFilter} 
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div className="filters-row">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="date-input"
                placeholder="From Date"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="date-input"
                placeholder="To Date"
              />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
              </select>
              <button onClick={clearFilters} className="btn-clear">
                Clear Filters
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="view-toggle">
              <button 
                className={viewMode === 'table' ? 'active' : ''}
                onClick={() => setViewMode('table')}
              >
                📊 Table
              </button>
              <button 
                className={viewMode === 'cards' ? 'active' : ''}
                onClick={() => setViewMode('cards')}
              >
                🎴 Cards
              </button>
            </div>
            <span className="results-count">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredApplications.length)} of {filteredApplications.length}
            </span>
            <button onClick={exportToCSV} className="btn-export" disabled={filteredApplications.length === 0}>
              📥 Export CSV
            </button>
          </div>
        </>
      )}

      {applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No Applications Yet</h3>
          <p>Applications will appear here once candidates start applying to your job postings.</p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No Results Found</h3>
          <p>Try adjusting your filters or search terms.</p>
          <button onClick={clearFilters} className="btn-clear">Clear All Filters</button>
        </div>
      ) : (
        <>
          {/* Table View */}
          {viewMode === 'table' && (
            <div className="applications-table">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Email</th>
                    <th>Vacancy</th>
                    <th>Department</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className="candidate-cell">
                          <div className="avatar">{getInitials(app.candidate_name)}</div>
                          <span>{app.candidate_name}</span>
                        </div>
                      </td>
                      <td>{app.candidate_email}</td>
                      <td>{app.vacancy_title}</td>
                      <td>{app.vacancy_department}</td>
                      <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                      <td>
                        <span 
                          className="status-badge" 
                          style={{ backgroundColor: getStatusColor(app.status) }}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            onClick={() => navigate(`/applications/${app.id}`)}
                            className="btn-view"
                          >
                            View
                          </button>
                          {user?.role !== 'interviewer' && (
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value)}
                              className="status-select"
                            >
                              <option value="applied">Applied</option>
                              <option value="shortlisted">Shortlisted</option>
                              <option value="interview">Interview</option>
                              <option value="offer">Offer</option>
                              <option value="hired">Hired</option>
                              <option value="rejected">Rejected</option>
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Card View */}
          {viewMode === 'cards' && (
            <div className="applications-grid">
              {currentItems.map((app) => (
                <div key={app.id} className="application-card">
                  <div className="card-header">
                    <div className="avatar-large">{getInitials(app.candidate_name)}</div>
                    <div className="card-info">
                      <h3>{app.candidate_name}</h3>
                      <p>{app.candidate_email}</p>
                    </div>
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(app.status) }}
                    >
                      {app.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="card-detail">
                      <span className="label">Vacancy:</span>
                      <span>{app.vacancy_title}</span>
                    </div>
                    <div className="card-detail">
                      <span className="label">Department:</span>
                      <span>{app.vacancy_department}</span>
                    </div>
                    <div className="card-detail">
                      <span className="label">Applied:</span>
                      <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                    <div className="card-detail">
                      <span className="label">Reference:</span>
                      <span>{app.reference_code}</span>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button 
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className="btn-view-full"
                    >
                      View Details
                    </button>
                    {user?.role !== 'interviewer' && (
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className="status-select"
                      >
                        <option value="applied">Applied</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                <select 
                  value={itemsPerPage} 
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="items-per-page"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
              <div className="pagination-controls">
                <button 
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  ««
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  ‹
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  ›
                </button>
                <button 
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  »»
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ApplicationList;