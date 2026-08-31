import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vacancyAPI } from '../api/vacancies';
import { candidateAPI, applicationAPI } from '../api/applications';
import './ApplyForm.css';

function ApplyForm() {
  const { vacancyId } = useParams();
  const navigate = useNavigate();
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    state: '',
    zone: '',
    woreda: '',
    kebele: '',
    house_number: '',
    is_available: true,
    reference_name: '',
    reference_phone: '',
    reference_address: '',
    resume: null,
    education_documents: null,
    other_documents: null
  });

  const [educationHistory, setEducationHistory] = useState([
    { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' }
  ]);
  const [trainingHistory, setTrainingHistory] = useState([
    { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' }
  ]);

  useEffect(() => {
    fetchVacancy();
  }, [vacancyId]);

  const fetchVacancy = async () => {
    try {
      const data = await vacancyAPI.getPublicById(vacancyId);
      
      // Check if deadline has passed
      const deadlineDate = new Date(data.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        setError('Application deadline has passed for this vacancy');
        setVacancy(data); // Still set vacancy to show details
        return;
      }
      
      setVacancy(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load job details or vacancy not available');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    setFormData(prev => ({ ...prev, [name]: e.target.files[0] }));
  };

  const handleEducationChange = (index, field, value) => {
    const updated = [...educationHistory];
    updated[index][field] = value;
    setEducationHistory(updated);
  };
  
  const handleTrainingChange = (index, field, value) => {
    const updated = [...trainingHistory];
    updated[index][field] = value;
    setTrainingHistory(updated);
  };

  const addEducationEntry = () => {
    setEducationHistory([...educationHistory, { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' }]);
  };
  
  const addTrainingEntry = () => {
    setTrainingHistory([...trainingHistory, { institution: '', degree: '', field_of_study: '', start_date: '', end_date: '', grade: '' }]);
  };

  const removeEducationEntry = (index) => {
    if (educationHistory.length > 1) {
      const updated = educationHistory.filter((_, i) => i !== index);
      setEducationHistory(updated);
    }
  };

  const removeTrainingEntry = (index) => {
    if (trainingHistory.length > 1) {
      const updated = trainingHistory.filter((_, i) => i !== index);
      setTrainingHistory(updated);
    }
  };

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
      if (!formData.email.trim()) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
      if (!formData.phone.trim()) errors.phone = 'Phone is required';
      if (!formData.state.trim()) errors.state = 'State/Region is required';
    }
    
    if (step === 2) {
      if (educationHistory.length === 0 || !educationHistory[0].institution) {
        errors.education = 'At least one education entry is required';
      }
    }
    
    if (step === 3) {
      if (!formData.resume) {
        errors.resume = 'Resume/CV is required';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Prepare application data with flat candidate fields
      const applicationFormData = new FormData();
      applicationFormData.append('vacancy', vacancyId);
      applicationFormData.append('full_name', formData.full_name);
      applicationFormData.append('email', formData.email);
      applicationFormData.append('phone', formData.phone);
      applicationFormData.append('state', formData.state);
      if (formData.zone) applicationFormData.append('zone', formData.zone);
      if (formData.woreda) applicationFormData.append('woreda', formData.woreda);
      if (formData.kebele) applicationFormData.append('kebele', formData.kebele);
      if (formData.house_number) applicationFormData.append('house_number', formData.house_number);
      applicationFormData.append('is_available', formData.is_available);
      if (!formData.is_available) {
        if (formData.reference_name) applicationFormData.append('reference_name', formData.reference_name);
        if (formData.reference_phone) applicationFormData.append('reference_phone', formData.reference_phone);
        if (formData.reference_address) applicationFormData.append('reference_address', formData.reference_address);
      }
      if (educationHistory.length > 0 && educationHistory[0].institution) {
        applicationFormData.append('education_history', JSON.stringify(educationHistory));
      }
      if (trainingHistory.length > 0 && trainingHistory[0].degree) {
        applicationFormData.append('training_history', JSON.stringify(trainingHistory));
      }
      if (formData.resume) {
        applicationFormData.append('resume', formData.resume);
      }
      if (formData.education_documents) {
        applicationFormData.append('education_documents', formData.education_documents);
      }
      if (formData.other_documents) {
        applicationFormData.append('other_documents', formData.other_documents);
      }

      await applicationAPI.create(applicationFormData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/jobs');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit application. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!vacancy) return <div className="loading">Loading...</div>;

  const getStepTitle = (step) => {
    const titles = {
      1: 'Personal Information',
      2: 'Education & Training',
      3: 'Documents',
      4: 'Review & Submit'
    };
    return titles[step];
  };

  if (success) {
    return (
      <div className="apply-form-container">
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h1>Application Submitted Successfully!</h1>
          <p>Thank you for applying for <strong>{vacancy.title}</strong></p>
          <p>We will review your application and contact you soon.</p>
          <p className="reference-info">Please check your email for confirmation and reference number.</p>
          <button onClick={() => navigate('/jobs')} className="btn-back-jobs">
            ← Back to Job Openings
          </button>
        </div>
      </div>
    );
  }

  // Check if deadline has passed
  const isDeadlinePassed = vacancy && new Date(vacancy.deadline) < new Date();

  return (
    <div className="apply-form-container">
      <div className="apply-form-content">
        <button onClick={() => navigate('/jobs')} className="btn-back">
          ← Back to Jobs
        </button>

        <div className="job-info">
          <h1>Apply for {vacancy.title}</h1>
          <div className="job-details">
            <span>📍 {vacancy.location}</span>
            <span>💼 {vacancy.employment_type.replace('_', ' ')}</span>
            <span>🏢 {vacancy.department}</span>
          </div>
          {vacancy.deadline && (
            <div className={`deadline-banner ${isDeadlinePassed ? 'expired' : ''}`}>
              {isDeadlinePassed ? (
                <>🚫 Application deadline passed on {new Date(vacancy.deadline).toLocaleDateString()}</>
              ) : (
                <>⏰ Application deadline: {new Date(vacancy.deadline).toLocaleDateString()}</>
              )}
            </div>
          )}
        </div>

        {isDeadlinePassed ? (
          <div className="deadline-passed-message">
            <h2>Application Deadline Has Passed</h2>
            <p>Unfortunately, the application deadline for this position was {new Date(vacancy.deadline).toLocaleDateString()}.</p>
            <p>Please check our other open positions that may match your qualifications.</p>
            <button onClick={() => navigate('/jobs')} className="btn-back-jobs">
              View Open Positions
            </button>
          </div>
        ) : (
          <>
        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 1 ? '✓' : '1'}</div>
            <span className="step-label">Personal Info</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 2 ? '✓' : '2'}</div>
            <span className="step-label">Education</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 3 ? '✓' : '3'}</div>
            <span className="step-label">Documents</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 4 ? '✓' : '4'}</div>
            <span className="step-label">Review</span>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="application-form">
          <h2 className="step-title">{getStepTitle(currentStep)}</h2>

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="form-step">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={fieldErrors.full_name ? 'error' : ''}
                />
                {fieldErrors.full_name && <span className="field-error">{fieldErrors.full_name}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={fieldErrors.email ? 'error' : ''}
                  />
                  {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label>Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={fieldErrors.phone ? 'error' : ''}
                  />
                  {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>State/Region *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g., Addis Ababa, Oromia, Amhara"
                  className={fieldErrors.state ? 'error' : ''}
                />
                {fieldErrors.state && <span className="field-error">{fieldErrors.state}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Zone</label>
                  <input
                    type="text"
                    name="zone"
                    value={formData.zone}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label>Woreda</label>
                  <input
                    type="text"
                    name="woreda"
                    value={formData.woreda}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kebele</label>
                  <input
                    type="text"
                    name="kebele"
                    value={formData.kebele}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>

                <div className="form-group">
                  <label>House Number</label>
                  <input
                    type="text"
                    name="house_number"
                    value={formData.house_number}
                    onChange={handleChange}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Are you available at the listed job location?</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="is_available"
                      value="true"
                      checked={formData.is_available === true}
                      onChange={() => setFormData(prev => ({ ...prev, is_available: true }))}
                    />
                    Yes
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="is_available"
                      value="false"
                      checked={formData.is_available === false}
                      onChange={() => setFormData(prev => ({ ...prev, is_available: false }))}
                    />
                    No
                  </label>
                </div>
              </div>

              {!formData.is_available && (
                <div className="reference-section">
                  <h3>Reference Information</h3>
                  <div className="form-group">
                    <label>Reference Name *</label>
                    <input
                      type="text"
                      name="reference_name"
                      value={formData.reference_name}
                      onChange={handleChange}
                      placeholder="Full name of your reference"
                    />
                  </div>

                  <div className="form-group">
                    <label>Reference Phone Number *</label>
                    <input
                      type="tel"
                      name="reference_phone"
                      value={formData.reference_phone}
                      onChange={handleChange}
                      placeholder="Reference contact number"
                    />
                  </div>

                  <div className="form-group">
                    <label>Reference Address *</label>
                    <textarea
                      name="reference_address"
                      value={formData.reference_address}
                      onChange={handleChange}
                      rows="3"
                      placeholder="Complete address of your reference"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Education & Training */}
          {currentStep === 2 && (
            <div className="form-step">
              {fieldErrors.education && <div className="step-error">{fieldErrors.education}</div>}

          <div className="form-group">
            <label>Education History (Most Recent First)</label>
            {educationHistory.map((edu, index) => (
              <div key={index} style={{border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '6px', backgroundColor: '#f9f9f9'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                  <strong>Education Entry {index + 1}</strong>
                  {educationHistory.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEducationEntry(index)}
                      style={{padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Institution/University</label>
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                    placeholder="e.g., Addis Ababa University"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Degree/Certificate</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                      placeholder="e.g., Bachelor's, Master's"
                    />
                  </div>

                  <div className="form-group">
                    <label>Field of Study</label>
                    <input
                      type="text"
                      value={edu.field_of_study}
                      onChange={(e) => handleEducationChange(index, 'field_of_study', e.target.value)}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="month"
                      value={edu.start_date}
                      onChange={(e) => handleEducationChange(index, 'start_date', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="month"
                      value={edu.end_date}
                      onChange={(e) => handleEducationChange(index, 'end_date', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Grade/GPA</label>
                  <input
                    type="text"
                    value={edu.grade}
                    onChange={(e) => handleEducationChange(index, 'grade', e.target.value)}
                    placeholder="e.g., 3.8/4.0, First Class"
                  />
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addEducationEntry}
              style={{padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px'}}
            >
              + Add Another Education
            </button>
          </div>
          <div className="form-group">
            <label>Training History (Most Recent First)</label>
            {trainingHistory.map((edu, index) => (
              <div key={index} style={{border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '6px', backgroundColor: '#f9f9f9'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                  <strong>Training Entry {index + 1}</strong>
                  {trainingHistory.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTrainingEntry(index)}
                      style={{padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                    >
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Training Name</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleTrainingChange(index, 'degree', e.target.value)}
                      placeholder="e.g., Project Management, AWS Certification"
                    />
                  </div>

                  <div className="form-group">
                    <label>Institution</label>
                    <input
                      type="text"
                      value={edu.field_of_study}
                      onChange={(e) => handleTrainingChange(index, 'field_of_study', e.target.value)}
                      placeholder="e.g., Training Institute Name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="month"
                      value={edu.start_date}
                      onChange={(e) => handleTrainingChange(index, 'start_date', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="month"
                      value={edu.end_date}
                      onChange={(e) => handleTrainingChange(index, 'end_date', e.target.value)}
                    />
                  </div>
                </div>

                {/* <div className="form-group">
                  <label>Grade/GPA</label>
                  <input
                    type="text"
                    value={edu.grade}
                    onChange={(e) => handleTrainingChange(index, 'grade', e.target.value)}
                    placeholder="e.g., 3.8/4.0, First Class"
                  />
                </div> */}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addTrainingEntry}
              style={{padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px'}}
            >
              + Add Another Training
            </button>
          </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {currentStep === 3 && (
            <div className="form-step">
              <div className="form-group">
                <label>Resume/CV * (PDF, DOC, DOCX)</label>
                <input
                  type="file"
                  name="resume"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                  className={fieldErrors.resume ? 'error' : ''}
                />
                {fieldErrors.resume && <span className="field-error">{fieldErrors.resume}</span>}
                {formData.resume && <div className="file-preview">📄 {formData.resume.name}</div>}
              </div>

              <div className="form-group">
                <label>Education Documents (PDF, DOC, DOCX)</label>
                <input
                  type="file"
                  name="education_documents"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
                <small className="field-hint">Optional: Transcripts, certificates, diplomas</small>
                {formData.education_documents && <div className="file-preview">📄 {formData.education_documents.name}</div>}
              </div>

              <div className="form-group">
                <label>Other Documents (PDF, DOC, DOCX)</label>
                <input
                  type="file"
                  name="other_documents"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx"
                />
                <small className="field-hint">Optional: References, portfolio, certificates</small>
                {formData.other_documents && <div className="file-preview">📄 {formData.other_documents.name}</div>}
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="form-step review-step">
              <div className="review-section">
                <h3>Personal Information</h3>
                <div className="review-grid">
                  <div><strong>Name:</strong> {formData.full_name}</div>
                  <div><strong>Email:</strong> {formData.email}</div>
                  <div><strong>Phone:</strong> {formData.phone}</div>
                  <div><strong>State:</strong> {formData.state}</div>
                  {formData.zone && <div><strong>Zone:</strong> {formData.zone}</div>}
                  {formData.woreda && <div><strong>Woreda:</strong> {formData.woreda}</div>}
                </div>
              </div>

              <div className="review-section">
                <h3>Education</h3>
                {educationHistory.filter(edu => edu.institution).map((edu, index) => (
                  <div key={index} className="review-item">
                    <strong>{edu.degree || 'Degree'}</strong> - {edu.institution}
                    {edu.field_of_study && <div>Field: {edu.field_of_study}</div>}
                  </div>
                ))}
              </div>

              {trainingHistory.filter(t => t.degree).length > 0 && (
                <div className="review-section">
                  <h3>Training</h3>
                  {trainingHistory.filter(t => t.degree).map((train, index) => (
                    <div key={index} className="review-item">
                      <strong>{train.degree}</strong>
                      {train.field_of_study && <div>{train.field_of_study}</div>}
                    </div>
                  ))}
                </div>
              )}

              <div className="review-section">
                <h3>Documents</h3>
                <div className="review-item">
                  {formData.resume && <div>✅ Resume: {formData.resume.name}</div>}
                  {formData.education_documents && <div>✅ Education Documents: {formData.education_documents.name}</div>}
                  {formData.other_documents && <div>✅ Other Documents: {formData.other_documents.name}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-navigation">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="btn-prev">
                ← Previous
              </button>
            )}
            {currentStep < 4 ? (
              <button type="button" onClick={nextStep} className="btn-next">
                Next →
              </button>
            ) : (
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Submitting...' : '✓ Submit Application'}
              </button>
            )}
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  );
}

export default ApplyForm;