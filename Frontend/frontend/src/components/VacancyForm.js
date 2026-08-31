import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vacancyAPI } from '../api/vacancies';
import './VacancyForm.css';

function VacancyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    department: '',
    location: '',
    employment_type: 'full_time',
    workplace_type: 'on_site',
    experience_level: 'entry',
    category: 'other',
    salary_min: '',
    salary_max: '',
    positions_available: 1,
    deadline: '',
    status: 'draft'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchVacancy();
    }
  }, [id]);

  const fetchVacancy = async () => {
    try {
      const data = await vacancyAPI.getById(id);
      setFormData({
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        department: data.department,
        location: data.location,
        employment_type: data.employment_type,
        workplace_type: data.workplace_type || 'on_site',
        experience_level: data.experience_level || 'entry',
        category: data.category || 'other',
        salary_min: data.salary_min || '',
        salary_max: data.salary_max || '',
        positions_available: data.positions_available,
        deadline: data.deadline,
        status: data.status
      });
    } catch (err) {
      setError('Failed to load vacancy');
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        await vacancyAPI.update(id, formData);
      } else {
        await vacancyAPI.create(formData);
      }
      navigate('/vacancies');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save vacancy');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vacancy-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit Vacancy' : 'Create New Vacancy'}</h1>
        <button onClick={() => navigate('/vacancies')} className="btn-back">
          ← Back to List
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="vacancy-form">
        <div className="form-row">
          <div className="form-group">
            <label>Job Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Department *</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Location *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Employment Type *</label>
            <select
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
              required
            >
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Workplace Type *</label>
            <select
              name="workplace_type"
              value={formData.workplace_type}
              onChange={handleChange}
              required
            >
              <option value="on_site">On-site</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          <div className="form-group">
            <label>Experience Level *</label>
            <select
              name="experience_level"
              value={formData.experience_level}
              onChange={handleChange}
              required
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior</option>
              <option value="lead">Lead/Manager</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="software">Software Development</option>
            <option value="project_management">Project Management</option>
            <option value="data">Data & Analytics</option>
            <option value="design">Design & UX</option>
            <option value="marketing">Marketing</option>
            <option value="sales">Sales</option>
            <option value="hr">Human Resources</option>
            <option value="finance">Finance & Accounting</option>
            <option value="operations">Operations</option>
            <option value="customer_service">Customer Service</option>
            <option value="engineering">Engineering</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label>Requirements *</label>
          <textarea
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-group">
          <label>Responsibilities *</label>
          <textarea
            name="responsibilities"
            value={formData.responsibilities}
            onChange={handleChange}
            rows="4"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Minimum Salary</label>
            <input
              type="number"
              name="salary_min"
              value={formData.salary_min}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Maximum Salary</label>
            <input
              type="number"
              name="salary_max"
              value={formData.salary_max}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Positions Available *</label>
            <input
              type="number"
              name="positions_available"
              value={formData.positions_available}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Application Deadline *</label>
            <input
              type="date"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Status *</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
          >
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="on_hold">On Hold</option>
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEditMode ? 'Update Vacancy' : 'Create Vacancy')}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/vacancies')} 
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default VacancyForm;