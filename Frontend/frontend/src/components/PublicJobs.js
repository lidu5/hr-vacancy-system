import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vacancyAPI } from '../api/vacancies';
import Header from './Header';
import './PublicJobs.css';

function PublicJobs() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [workplaceFilter, setWorkplaceFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [filteredVacancies, setFilteredVacancies] = useState([]);

  useEffect(() => {
    fetchPublicVacancies();
  }, []);

  const fetchPublicVacancies = async () => {
    try {
      const data = await vacancyAPI.getPublic();
      setVacancies(data);
      setFilteredVacancies(data);
    } catch (err) {
      setError('Failed to load job openings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = vacancies;
    if (searchTerm) {
      result = result.filter(vacancy =>
        vacancy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vacancy.description && vacancy.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (locationFilter) {
      result = result.filter(vacancy => vacancy.location === locationFilter);
    }
    if (typeFilter) {
      result = result.filter(vacancy => vacancy.employment_type === typeFilter);
    }
    if (workplaceFilter) {
      result = result.filter(vacancy => vacancy.workplace_type === workplaceFilter);
    }
    if (experienceFilter) {
      result = result.filter(vacancy => vacancy.experience_level === experienceFilter);
    }
    if (categoryFilter) {
      result = result.filter(vacancy => vacancy.category === categoryFilter);
    }
    setFilteredVacancies(result);
  }, [searchTerm, locationFilter, typeFilter, workplaceFilter, experienceFilter, categoryFilter, vacancies]);

  const locations = [...new Set(vacancies.map(v => v.location))];
  const employmentTypes = [...new Set(vacancies.map(v => v.employment_type))];
  const workplaceTypes = [...new Set(vacancies.map(v => v.workplace_type).filter(Boolean))];
  const experienceLevels = [...new Set(vacancies.map(v => v.experience_level).filter(Boolean))];
  const categories = [...new Set(vacancies.map(v => v.category).filter(Boolean))];

  const formatLabel = (value) => {
    if (!value) return '';
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const resetFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setTypeFilter('');
    setWorkplaceFilter('');
    setExperienceFilter('');
    setCategoryFilter('');
  };

  if (loading) return <div className="loading">Loading job openings...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="public-jobs-container">
      <Header />
      <div className="jobs-layout">
        {/* Left Sidebar Filter */}
        <aside className="filters-sidebar">
          <div className="filters-header">
            <h3>🔍 Filters</h3>
            <button onClick={resetFilters} className="reset-btn">
              Reset All
            </button>
          </div>

          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Job title or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>Location</label>
            <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="">All Locations</option>
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Employment Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {employmentTypes.map(type => <option key={type} value={type}>{formatLabel(type)}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Workplace Type</label>
            <select value={workplaceFilter} onChange={(e) => setWorkplaceFilter(e.target.value)}>
              <option value="">All Workplaces</option>
              {workplaceTypes.map(type => <option key={type} value={type}>{formatLabel(type)}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Experience Level</label>
            <select value={experienceFilter} onChange={(e) => setExperienceFilter(e.target.value)}>
              <option value="">All Levels</option>
              {experienceLevels.map(level => <option key={level} value={level}>{formatLabel(level)}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{formatLabel(cat)}</option>)}
            </select>
          </div>
        </aside>

        {/* Main Content */}
        <main className="jobs-content">
          <div className="jobs-header-bar">
            <h2>Available Positions</h2>
            <span className="job-count">{filteredVacancies.length} job{filteredVacancies.length !== 1 ? 's' : ''} found</span>
          </div>

          {filteredVacancies.length === 0 ? (
          <div className="no-jobs">
            <p>No job openings match your criteria.</p>
            <p>Please adjust your filters or check back later!</p>
          </div>
        ) : (
          <div className="jobs-grid">
            {filteredVacancies.map((vacancy) => {
              const isDeadlinePassed = new Date(vacancy.deadline) < new Date();
              const daysRemaining = Math.ceil((new Date(vacancy.deadline) - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
              <div key={vacancy.id} className={`job-card ${isDeadlinePassed ? 'expired' : ''}`}>
                <h2>{vacancy.title}</h2>
                <div className="job-meta">
                  <span>📍 {vacancy.location}</span>
                  <span>💼 {formatLabel(vacancy.employment_type)}</span>
                  <span>🏢 {vacancy.department}</span>
                </div>
                <div className="job-tags">
                  {vacancy.workplace_type && <span className="tag tag-workplace">{formatLabel(vacancy.workplace_type)}</span>}
                  {vacancy.experience_level && <span className="tag tag-experience">{formatLabel(vacancy.experience_level)}</span>}
                  {vacancy.category && <span className="tag tag-category">{formatLabel(vacancy.category)}</span>}
                </div>
                <p className="job-description">
                  {vacancy.description ? vacancy.description.substring(0, 150) + '...' : 'No description available'}
                </p>
                <div className="job-footer">
                  <span className="positions">
                    {vacancy.positions_available} position{vacancy.positions_available > 1 ? 's' : ''} available
                  </span>
                  {isDeadlinePassed ? (
                    <button className="apply-btn disabled" disabled>
                      Deadline Passed
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate(`/apply/${vacancy.id}`)}
                      className="apply-btn"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
                <div className={`deadline ${isDeadlinePassed ? 'expired' : daysRemaining <= 3 ? 'urgent' : ''}`}>
                  {isDeadlinePassed ? (
                    <>🚫 Deadline passed: {new Date(vacancy.deadline).toLocaleDateString()}</>
                  ) : daysRemaining <= 3 ? (
                    <>⚠️ Closing soon: {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left</>
                  ) : (
                    <>⏰ Apply by: {new Date(vacancy.deadline).toLocaleDateString()}</>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

export default PublicJobs;