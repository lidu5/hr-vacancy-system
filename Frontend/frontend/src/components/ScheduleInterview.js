import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationAPI } from '../api/applications';
import { interviewAPI } from '../api/interviews';
import './ScheduleInterview.css';

function ScheduleInterview() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    scheduled_at: '',
    mode: 'in_person',
    location_or_link: '',
    round_number: 1
  });

  useEffect(() => {
    fetchApplication();
  }, [applicationId]);

  const fetchApplication = async () => {
    try {
      const data = await applicationAPI.getById(applicationId);
      setApplication(data);
    } catch (err) {
      setError('Failed to load application');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await interviewAPI.create({
        application: applicationId,
        ...formData
      });
      navigate(`/applications/${applicationId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to schedule interview');
    } finally {
      setLoading(false);
    }
  };

  if (!application) return <div className="loading">Loading...</div>;

  return (
    <div className="schedule-interview-container">
      <div className="schedule-header">
        <button onClick={() => navigate(`/applications/${applicationId}`)} className="btn-back">
          ← Back to Application
        </button>
        <h1>Schedule Interview</h1>
      </div>

      <div className="candidate-summary">
        <h3>Candidate: {application.candidate.full_name}</h3>
        <p>Position: {application.vacancy.title}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="schedule-form">
        <div className="form-row">
          <div className="form-group">
            <label>Interview Date & Time *</label>
            <input
              type="datetime-local"
              name="scheduled_at"
              value={formData.scheduled_at}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Round Number *</label>
            <input
              type="number"
              name="round_number"
              value={formData.round_number}
              onChange={handleChange}
              min="1"
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Interview Mode *</label>
          <select
            name="mode"
            value={formData.mode}
            onChange={handleChange}
            required
          >
            <option value="in_person">In Person</option>
            <option value="video_call">Video Call</option>
            <option value="phone_call">Phone Call</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            {formData.mode === 'in_person' ? 'Location' : 'Meeting Link'} *
          </label>
          <input
            type="text"
            name="location_or_link"
            value={formData.location_or_link}
            onChange={handleChange}
            placeholder={formData.mode === 'in_person' ? 'Office address' : 'https://...'}
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule Interview'}
          </button>
          <button 
            type="button" 
            onClick={() => navigate(`/applications/${applicationId}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ScheduleInterview;
