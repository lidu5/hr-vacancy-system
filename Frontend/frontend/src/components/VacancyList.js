import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vacancyAPI } from '../api/vacancies';
import './VacancyList.css';

function VacancyList() {
  const [vacancies, setVacancies] = useState([]);
  const [filteredVacancies, setFilteredVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchVacancies();
  }, []);

  useEffect(() => {
    filterVacancies();
  }, [vacancies, searchTerm, statusFilter, departmentFilter]);

  const fetchVacancies = async () => {
    try {
      const data = await vacancyAPI.getAll();
      setVacancies(data);
    } catch (err) {
      setError('Failed to load vacancies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterVacancies = () => {
    let filtered = vacancies;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(v => v.department === departmentFilter);
    }

    setFilteredVacancies(filtered);
  };

  const getDepartments = () => {
    const departments = [...new Set(vacancies.map(v => v.department))];
    return departments.filter(d => d);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vacancy?')) {
      try {
        await vacancyAPI.delete(id);
        fetchVacancies();
      } catch (err) {
        alert('Failed to delete vacancy');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="vacancy-list-container">
      <div className="header">
        <h1>Job Vacancies</h1>
        <button onClick={() => navigate('/vacancies/new')} className="btn-primary">
          Create New Vacancy
        </button>
      </div>

      {vacancies.length > 0 && (
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Search by title, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-controls">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="open">Open</option>
              <option value="filled">Filled</option>
              <option value="closed">Closed</option>
            </select>
            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Departments</option>
              {getDepartments().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <span className="results-count">
              {filteredVacancies.length} of {vacancies.length} vacancies
            </span>
          </div>
        </div>
      )}

      {vacancies.length === 0 ? (
        <p>No vacancies found. Create one to get started!</p>
      ) : (
        <div className="vacancy-grid">
          {filteredVacancies.map((vacancy) => (
            <div key={vacancy.id} className="vacancy-card">
              <div className="vacancy-header">
                <h3>{vacancy.title}</h3>
                <span className={`status-badge ${vacancy.status}`}>
                  {vacancy.status}
                </span>
              </div>
              <p><strong>Department:</strong> {vacancy.department}</p>
              <p><strong>Location:</strong> {vacancy.location}</p>
              <p><strong>Type:</strong> {vacancy.employment_type}</p>
              <p><strong>Positions:</strong> {vacancy.positions_available}</p>
              <p><strong>Deadline:</strong> {new Date(vacancy.deadline).toLocaleDateString()}</p>
              
              <div className="card-actions">
                <button 
                  onClick={() => navigate(`/vacancies/${vacancy.id}`)}
                  className="btn-secondary"
                >
                  View
                </button>
                <button 
                  onClick={() => navigate(`/vacancies/${vacancy.id}/edit`)}
                  className="btn-secondary"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(vacancy.id)}
                  className="btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VacancyList;