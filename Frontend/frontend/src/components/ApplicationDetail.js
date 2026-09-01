import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { applicationAPI } from '../api/applications';
import { interviewAPI } from '../api/interviews';
import { AuthContext } from '../context/AuthContext';
import './ApplicationDetail.css';

function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [application, setApplication] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchApplicationDetail();
  }, [id]);

  const fetchApplicationDetail = async () => {
    try {
      const data = await applicationAPI.getById(id);
      setApplication(data);
      
      // Fetch interviews for this application
      const interviewData = await interviewAPI.getAll({ application: id });
      setInterviews(interviewData);
    } catch (err) {
      setError('Failed to load application details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await applicationAPI.updateStatus(id, newStatus);
      fetchApplicationDetail();
    } catch (err) {
      alert('Failed to update status');
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

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusProgress = (status) => {
    const steps = ['applied', 'shortlisted', 'interview', 'offer', 'hired'];
    const currentIndex = steps.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('PDF download feature - integrate with PDF library');
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!application) return <div className="error">Application not found</div>;

  return (
    <div className="application-detail-container">
      {/* Header with Actions */}
      <div className="detail-header">
        <button onClick={() => navigate('/applications')} className="btn-back">
          ← Back to Applications
        </button>
        <div className="header-actions">
          <button onClick={handlePrint} className="btn-action">
            🖨️ Print
          </button>
          <button onClick={handleDownloadPDF} className="btn-action">
            📥 Download PDF
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-left">
          <div className="avatar-hero">{getInitials(application.candidate.full_name)}</div>
          <div className="hero-info">
            <h1>{application.candidate.full_name}</h1>
            <p className="hero-subtitle">Applying for {application.vacancy.title}</p>
            <div className="hero-meta">
              <span>📧 {application.candidate.email}</span>
              <span>📱 {application.candidate.phone}</span>
              <span>📅 Applied {new Date(application.applied_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="status-card">
            <span className="status-label">Current Status</span>
            <span 
              className="status-badge-hero" 
              style={{ backgroundColor: getStatusColor(application.status) }}
            >
              {application.status.toUpperCase()}
            </span>
            {user?.role !== 'interviewer' && (
              <select
                value={application.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="status-select-hero"
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
          <div className="reference-card">
            <span className="ref-label">Reference Code</span>
            <span className="ref-code">{application.reference_code}</span>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="timeline-section">
        <div className="timeline">
          <div className="timeline-step" data-active={['applied', 'shortlisted', 'interview', 'offer', 'hired'].includes(application.status)}>
            <div className="step-circle">1</div>
            <span>Applied</span>
          </div>
          <div className="timeline-line" data-active={['shortlisted', 'interview', 'offer', 'hired'].includes(application.status)}></div>
          <div className="timeline-step" data-active={['shortlisted', 'interview', 'offer', 'hired'].includes(application.status)}>
            <div className="step-circle">2</div>
            <span>Shortlisted</span>
          </div>
          <div className="timeline-line" data-active={['interview', 'offer', 'hired'].includes(application.status)}></div>
          <div className="timeline-step" data-active={['interview', 'offer', 'hired'].includes(application.status)}>
            <div className="step-circle">3</div>
            <span>Interview</span>
          </div>
          <div className="timeline-line" data-active={['offer', 'hired'].includes(application.status)}></div>
          <div className="timeline-step" data-active={['offer', 'hired'].includes(application.status)}>
            <div className="step-circle">4</div>
            <span>Offer</span>
          </div>
          <div className="timeline-line" data-active={application.status === 'hired'}></div>
          <div className="timeline-step" data-active={application.status === 'hired'}>
            <div className="step-circle">5</div>
            <span>Hired</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={activeTab === 'overview' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('overview')}
          >
            📋 Overview
          </button>
          <button 
            className={activeTab === 'education' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('education')}
          >
            🎓 Education & Training
          </button>
          <button 
            className={activeTab === 'documents' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('documents')}
          >
            📄 Documents
          </button>
          <button 
            className={activeTab === 'interviews' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('interviews')}
          >
            💼 Interviews ({interviews.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="content-grid">
            <div className="content-card">
              <h2>Candidate Information</h2>
              <div className="info-list">
                <div className="info-row">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{application.candidate.full_name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{application.candidate.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{application.candidate.phone}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Address</span>
                  <span className="info-value">{application.candidate.address || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date of Birth</span>
                  <span className="info-value">{application.candidate.date_of_birth ? new Date(application.candidate.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Nationality</span>
                  <span className="info-value">{application.candidate.nationality || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="content-card">
              <h2>Vacancy Information</h2>
              <div className="info-list">
                <div className="info-row">
                  <span className="info-label">Position</span>
                  <span className="info-value">{application.vacancy.title}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Department</span>
                  <span className="info-value">{application.vacancy.department}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Location</span>
                  <span className="info-value">{application.vacancy.location}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Employment Type</span>
                  <span className="info-value">{application.vacancy.employment_type?.replace('_', ' ')}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Workplace Type</span>
                  <span className="info-value">{application.vacancy.workplace_type?.replace('_', ' ') || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Experience Level</span>
                  <span className="info-value">{application.vacancy.experience_level?.replace('_', ' ') || 'N/A'}</span>
                </div>
              </div>
            </div>

            {application.candidate.cover_letter && (
              <div className="content-card full-width">
                <h2>Cover Letter</h2>
                <div className="cover-letter-box">
                  {application.candidate.cover_letter}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Education & Training Tab */}
        {activeTab === 'education' && (
          <div className="content-grid">
            <div className="content-card full-width">
              <h2>Education</h2>
              {application.candidate.education_history && application.candidate.education_history.length > 0 ? (
                <div className="education-list">
                  {application.candidate.education_history.map((edu, index) => (
                    <div key={index} className="education-item">
                      <div className="edu-header">
                        <h3>{edu.degree || edu.institution}</h3>
                        <span className="edu-year">{edu.year_of_graduation || edu.end_date}</span>
                      </div>
                      <p className="edu-institution">{edu.institution}</p>
                      {edu.field_of_study && <p className="edu-field">Field: {edu.field_of_study}</p>}
                      {edu.grade && <p className="edu-grade">Grade: {edu.grade}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">No education information provided</p>
              )}
            </div>

            <div className="content-card full-width">
              <h2>Training & Certifications</h2>
              {application.candidate.training_history && application.candidate.training_history.length > 0 ? (
                <div className="training-list">
                  {application.candidate.training_history.map((train, index) => (
                    <div key={index} className="training-item">
                      <div className="train-header">
                        <h3>{train.course_name || train.title}</h3>
                        <span className="train-year">{train.year || train.completion_date}</span>
                      </div>
                      <p className="train-institution">{train.institution || train.provider}</p>
                      {train.duration && <p className="train-duration">Duration: {train.duration}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">No training information provided</p>
              )}
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="content-grid">
            <div className="content-card full-width">
              <h2>Uploaded Documents</h2>
              <div className="documents-list">
                {application.candidate.resume && (
                  <div className="document-item">
                    <div className="doc-icon">📄</div>
                    <div className="doc-info">
                      <h3>Resume/CV</h3>
                      <p>Uploaded on {new Date(application.applied_at).toLocaleDateString()}</p>
                    </div>
                    <a href={application.candidate.resume} target="_blank" rel="noopener noreferrer" className="btn-download">
                      Download
                    </a>
                  </div>
                )}
                {application.candidate.cover_letter_file && (
                  <div className="document-item">
                    <div className="doc-icon">📝</div>
                    <div className="doc-info">
                      <h3>Cover Letter</h3>
                      <p>Uploaded on {new Date(application.applied_at).toLocaleDateString()}</p>
                    </div>
                    <a href={application.candidate.cover_letter_file} target="_blank" rel="noopener noreferrer" className="btn-download">
                      Download
                    </a>
                  </div>
                )}
                {(!application.candidate.resume && !application.candidate.cover_letter_file) && (
                  <p className="empty-message">No documents uploaded</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'interviews' && (
          <div className="content-grid">
            <div className="content-card full-width">
              <div className="card-header-with-action">
                <h2>Interview Schedule</h2>
                {user?.role !== 'interviewer' && (
                  <button 
                    onClick={() => navigate(`/applications/${id}/schedule-interview`)}
                    className="btn-primary"
                  >
                    + Schedule Interview
                  </button>
                )}
              </div>
              {interviews.length === 0 ? (
                <div className="empty-state-small">
                  <p>No interviews scheduled yet</p>
                </div>
              ) : (
                <div className="interviews-grid">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="interview-card-modern">
                      <div className="interview-card-header">
                        <div>
                          <h3>Round {interview.round_number}</h3>
                          <p className="interview-date">{new Date(interview.scheduled_at).toLocaleString()}</p>
                        </div>
                        <span className={`result-badge ${interview.result || 'pending'}`}>
                          {interview.result || 'Pending'}
                        </span>
                      </div>
                      <div className="interview-card-body">
                        <div className="interview-info-row">
                          <span className="info-icon">👤</span>
                          <span>{interview.interviewer_name}</span>
                        </div>
                        <div className="interview-info-row">
                          <span className="info-icon">💻</span>
                          <span>{interview.mode}</span>
                        </div>
                        {interview.location_or_link && (
                          <div className="interview-info-row">
                            <span className="info-icon">📍</span>
                            <span>{interview.location_or_link}</span>
                          </div>
                        )}
                        {interview.score !== null && (
                          <div className="interview-info-row">
                            <span className="info-icon">⭐</span>
                            <span>Score: {interview.score}/10</span>
                          </div>
                        )}
                      </div>
                      {interview.feedback && (
                        <div className="interview-feedback-box">
                          <strong>Feedback:</strong>
                          <p>{interview.feedback}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApplicationDetail;
