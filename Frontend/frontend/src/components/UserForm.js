import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { userAPI } from '../api/users';
import './UserForm.css';

function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    role: 'recruiter',
    department: '',
    is_active: true
  });

  useEffect(() => {
    if (isEditMode) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    try {
      const data = await userAPI.getById(id);
      setFormData({
        username: data.username,
        email: data.email,
        password: '', // Don't populate password
        password2: '',
        first_name: data.first_name,
        last_name: data.last_name,
        role: data.role,
        department: data.department || '',
        is_active: data.is_active
      });
    } catch (err) {
      setError('Failed to load user');
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = { ...formData };
      
      // Validate passwords match (only for create or if password is being changed)
      if (!isEditMode || submitData.password) {
        if (submitData.password !== submitData.password2) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
      }
      
      // Remove password fields if empty in edit mode
      if (isEditMode && !submitData.password) {
        delete submitData.password;
        delete submitData.password2;
      }

      if (isEditMode) {
        await userAPI.update(id, submitData);
      } else {
        await userAPI.create(submitData);
      }
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.password?.[0] || 'Failed to save user');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-form-container">
      <div className="form-header">
        <h1>{isEditMode ? 'Edit User' : 'Create New User'}</h1>
        <button onClick={() => navigate('/users')} className="btn-back">
          ← Back to Users
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="user-form">
        <div className="form-row">
          <div className="form-group">
            <label>First Name *</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name *</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Username *</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={isEditMode}
          />
          {isEditMode && <small>Username cannot be changed</small>}
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Password {!isEditMode && '*'}</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required={!isEditMode}
              minLength="8"
              placeholder={isEditMode ? 'Leave blank to keep current password' : ''}
            />
            {isEditMode && <small>Leave blank to keep current password</small>}
          </div>

          <div className="form-group">
            <label>Confirm Password {!isEditMode && '*'}</label>
            <input
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              required={!isEditMode}
              minLength="8"
              placeholder={isEditMode ? 'Leave blank to keep current password' : ''}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Role *</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="recruiter">Recruiter</option>
              <option value="interviewer">Interviewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., Human Resources"
            />
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
            />
            <span>Active User</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
          </button>
          <button 
            type="button" 
            onClick={() => navigate('/users')}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserForm;
