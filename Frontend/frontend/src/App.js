import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Login';
import DashboardEnhanced from './components/DashboardEnhanced';
import PrivateRoute from './components/PrivateRoute';
import VacancyList from './components/VacancyList';
import VacancyForm from './components/VacancyForm';
import ApplicationList from './components/ApplicationList';
import PublicJobs from './components/PublicJobs';
import ApplyForm from './components/ApplyForm';
import ApplicationDetail from './components/ApplicationDetail';
import ScheduleInterview from './components/ScheduleInterview';
import Register from './components/Register';
import UserList from './components/UserList';
import UserForm from './components/UserForm';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/jobs" element={<PublicJobs />} />
          <Route path="/apply/:vacancyId" element={<ApplyForm />} />
          
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardEnhanced />
              </PrivateRoute>
            }
          />
          <Route
            path="/vacancies"
            element={
              <PrivateRoute allowedRoles={['admin', 'recruiter']}>
                <VacancyList />
              </PrivateRoute>
            }
          />
          <Route
            path="/vacancies/new"
            element={
              <PrivateRoute allowedRoles={['admin', 'recruiter']}>
                <VacancyForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/vacancies/:id/edit"
            element={
              <PrivateRoute allowedRoles={['admin', 'recruiter']}>
                <VacancyForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <PrivateRoute allowedRoles={['admin', 'recruiter', 'interviewer']}>
                <ApplicationList />
              </PrivateRoute>
            }
          />
          <Route
            path="/applications/:id"
            element={
              <PrivateRoute allowedRoles={['admin', 'recruiter', 'interviewer']}>
                <ApplicationDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/applications/:applicationId/schedule-interview"
            element={
              <PrivateRoute allowedRoles={['admin', 'recruiter']}>
                <ScheduleInterview />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <UserList />
              </PrivateRoute>
            }
          />
          <Route
            path="/users/new"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <UserForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/users/:id"
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <UserForm />
              </PrivateRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route path="*" element={<Navigate to="/jobs" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;