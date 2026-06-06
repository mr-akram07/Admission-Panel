import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API_URL } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CollegeHeader from '../components/CollegeHeader';
import { 
  LogOut, Users, FileCheck, ClipboardList, AlertCircle, 
  Download, Eye, EyeOff, Edit3, X, UserCheck, Shield, BookOpen, Calendar, Trash2, Menu
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, setUser, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview, applications, students, export
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data States
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Item Modal States
  const [selectedApp, setSelectedApp] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Action Forms States
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [studentUsername, setStudentUsername] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Change Username States
  const [newUsername, setNewUsername] = useState(() => user?.username || '');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');

  useEffect(() => {
    if (user && !newUsername) {
      setNewUsername(user.username);
    }
  }, [user]);

  // Change Password States (For Admin's own password)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  // Edit fields state
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    dob: '',
    gender: 'Male',
    phone: '',
    address: '',
    branch: 'Computer Science & Engineering',
    fathersName: '',
    jeecupAppNo: ''
  });

  // Export States
  const [exportMonth, setExportMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}`;
  });
  const [exportLoading, setExportLoading] = useState(false);

  // Stats Counters
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const fetchData = async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/applications/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('A server error occurred. Please try again later.');
      }
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch data from database');
      }
      setApplications(data);
      
      // Calculate Stats
      const statsObj = data.reduce((acc, app) => {
        acc.total += 1;
        if (app.status === 'pending') acc.pending += 1;
        if (app.status === 'approved') acc.approved += 1;
        if (app.status === 'rejected') acc.rejected += 1;
        return acc;
      }, { total: 0, pending: 0, approved: 0, rejected: 0 });
      setStats(statsObj);

      // Separate Students
      const approvedList = data.filter(app => app.status === 'approved');
      setStudents(approvedList);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch student database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Handle Log out
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Open Details Modal
  const handleReviewApp = (app) => {
    setSelectedApp(app);
    setStudentUsername(app.name.toLowerCase().replace(/\s+/g, '') + Math.floor(100 + Math.random() * 900));
    setStudentPassword('Student@' + Math.floor(1000 + Math.random() * 9000));
    setRejectionReason('');
    setShowApproveForm(false);
    setShowRejectForm(false);
    setIsDetailModalOpen(true);
  };

  // Open Edit Modal
  const handleEditApp = (app) => {
    setSelectedApp(app);
    setEditFormData({
      name: app.name,
      email: app.email,
      dob: app.dob ? app.dob.split('T')[0] : '',
      gender: app.gender,
      phone: app.phone,
      address: app.address,
      branch: app.branch,
      fathersName: app.fathersName,
      jeecupAppNo: app.jeecupAppNo
    });
    setIsEditModalOpen(true);
  };

  // Handle Approve Action Submit
  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!studentUsername || !studentPassword) return;

    if (!/^[a-zA-Z0-9]+$/.test(studentUsername)) {
      alert('Student username cannot contain spaces or special characters.');
      return;
    }

    if (studentPassword.length < 8 || studentPassword.length > 16) {
      alert('Student password must be between 8 and 16 characters long.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(studentPassword);
    const hasNumber = /[0-9]/.test(studentPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]{};':"\\|#`~]/.test(studentPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      alert('Student password must contain a mix of letters, numbers, and special symbols.');
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/applications/${selectedApp._id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentUsername, studentPassword })
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('A server error occurred. Please try again later.');
      }
      if (!res.ok) {
        throw new Error(data.message || 'Approval failed');
      }

      setSuccessMsg(`Approved student: ${selectedApp.name}. Credentials created.`);
      setIsDetailModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Admin Change Username Form Submit
  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');

    if (!newUsername) {
      setUsernameError('New username is required.');
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(newUsername)) {
      setUsernameError('Username cannot contain spaces or special characters.');
      return;
    }

    setUsernameSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/change-username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newUsername })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update username');
      }
      
      setUser(prev => ({ ...prev, username: newUsername }));
      setUsernameSuccess('Admin username updated successfully.');
    } catch (err) {
      setUsernameError(err.message || 'An error occurred.');
    } finally {
      setUsernameSaving(false);
    }
  };

  // Handle Admin Change Password Form Submit
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword.length < 8 || newPassword.length > 16) {
      setPwdError('New password must be between 8 and 16 characters long.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]{};':"\\|#`~]/.test(newPassword);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      setPwdError('New password must contain a mix of letters, numbers, and special symbols.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setPwdSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }
      setPwdSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPwdError(err.message || 'An error occurred.');
    } finally {
      setPwdSaving(false);
    }
  };

  // Handle Reject Action Submit
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason) return;

    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/applications/${selectedApp._id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rejectionReason })
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('A server error occurred. Please try again later.');
      }
      if (!res.ok) {
        throw new Error(data.message || 'Rejection failed');
      }

      setSuccessMsg(`Rejected application for: ${selectedApp.name}.`);
      setIsDetailModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Edit Action Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editFormData.phone.length !== 13) {
      alert('Phone number must contain exactly 10 digits after +91.');
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/applications/${selectedApp._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('A server error occurred. Please try again later.');
      }
      if (!res.ok) {
        throw new Error(data.message || 'Edit details failed');
      }

      setSuccessMsg(`Updated details for student: ${editFormData.name}.`);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Delete Application & Accounts
  const handleDeleteApp = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the application and associated user accounts for ${name}? This action cannot be undone.`)) {
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`${API_URL}/api/applications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('A server error occurred. Please try again later.');
      }
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete application');
      }

      setSuccessMsg(`Successfully deleted applicant: ${name}`);
      setIsDetailModalOpen(false);
      fetchData(); // Refresh lists
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Excel Export
  const handleExcelExport = async () => {
    if (!exportMonth) return;
    setExportLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/export/students?month=${exportMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const text = await res.text();
        let errData;
        try {
          errData = JSON.parse(text);
        } catch (e) {
          throw new Error('A server error occurred. Please try again later.');
        }
        throw new Error(errData.message || 'Failed to generate Excel download file');
      }

      // Download spreadsheet
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `Students_Report_${exportMonth}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSuccessMsg(`Successfully exported student spreadsheet for ${exportMonth}`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'No approved student records found in selected month.');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-main)' }}>
        <h2>Loading admin control panel...</h2>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CollegeHeader />
      
      {/* Mobile Top Navigation Header */}
      <div className="admin-mobile-header">
        <button 
          onClick={() => setIsSidebarOpen(true)} 
          className="hamburger-btn"
          aria-label="Open Sidebar"
        >
          <Menu size={24} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Admin Portal</span>
        <div style={{ width: 40 }}></div>
      </div>
      
      <div className="dashboard-layout" style={{ flex: 1, minHeight: 'auto' }}>
        <div className="bg-gradient-mesh"></div>

      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isSidebarOpen ? 'mobile-open' : ''}`}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <div className="sidebar-brand" style={{ marginBottom: 0 }}>
              <Shield size={24} /> Admin Workspace
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="hamburger-btn sidebar-mobile-close-btn"
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>
          </div>
          
          <nav className="sidebar-nav">
            <button 
              onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <ClipboardList size={18} /> Overview
            </button>
            <button 
              onClick={() => { setActiveTab('applications'); setIsSidebarOpen(false); }}
              className={`sidebar-link ${activeTab === 'applications' ? 'active' : ''}`}
            >
              <Users size={18} /> Applications
            </button>
            <button 
              onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
              className={`sidebar-link ${activeTab === 'students' ? 'active' : ''}`}
            >
              <UserCheck size={18} /> Admitted Students
            </button>
            <button 
              onClick={() => { setActiveTab('export'); setIsSidebarOpen(false); }}
              className={`sidebar-link ${activeTab === 'export' ? 'active' : ''}`}
            >
              <Download size={18} /> Excel Sheet Export
            </button>
            <button 
              onClick={() => { setActiveTab('change-password'); setIsSidebarOpen(false); }}
              className={`sidebar-link ${activeTab === 'change-password' ? 'active' : ''}`}
            >
              <Shield size={18} /> Admin Settings
            </button>
          </nav>
        </div>

        <button onClick={handleLogout} className="sidebar-link" style={{ color: 'var(--danger)', marginTop: '40px' }}>
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Workspace Area */}
      <main className="main-content">
        <header className="page-header-container">
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Management Panel
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '2px' }}>
              {activeTab === 'overview' && 'College Admin Dashboard'}
              {activeTab === 'applications' && 'Review Registrations'}
              {activeTab === 'students' && 'Student Database Registry'}
              {activeTab === 'export' && 'Export Data Reports'}
              {activeTab === 'change-password' && 'Admin Settings'}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Logged in:</span>
            <span className="badge badge-approved" style={{ fontSize: '0.85rem' }}>{user?.username} ({user?.role})</span>
          </div>
        </header>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '14px 20px',
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            padding: '14px 20px',
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            {successMsg}
          </div>
        )}

        {/* Tab content: Overview */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-hover)' }}>
                  <ClipboardList size={24} />
                </div>
                <div className="stat-info">
                  <h3>Total Registered</h3>
                  <p>{stats.total}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
                  <Calendar size={24} />
                </div>
                <div className="stat-info">
                  <h3>Pending Review</h3>
                  <p>{stats.pending}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
                  <FileCheck size={24} />
                </div>
                <div className="stat-info">
                  <h3>Approved Students</h3>
                  <p>{stats.approved}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
                  <AlertCircle size={24} />
                </div>
                <div className="stat-info">
                  <h3>Rejected Forms</h3>
                  <p>{stats.rejected}</p>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '15px' }}>Recent Applications Activity</h2>
              {applications.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No applicant registrations filed yet.</p>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Branch</th>
                        <th>Status</th>
                        <th>Submission Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.slice(0, 5).map((app) => (
                        <tr key={app._id}>
                          <td>{app.name}</td>
                          <td>{app.branch}</td>
                          <td>
                            <span className={`badge badge-${app.status}`}>
                              {app.status}
                            </span>
                          </td>
                          <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                          <td>
                            <button onClick={() => handleReviewApp(app)} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                              <Eye size={12} /> View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab content: Applications */}
        {activeTab === 'applications' && (
          <div className="glass-card animate-fade-in" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Submitted Admission Applications</h2>
            {applications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No applications submitted yet.</p>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Branch</th>
                      <th>Status</th>
                      <th>Submitted On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app._id}>
                        <td>{app.name}</td>
                        <td>{app.email}</td>
                        <td>{app.branch}</td>
                        <td>
                          <span className={`badge badge-${app.status}`}>
                            {app.status}
                          </span>
                        </td>
                        <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                        <td style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleReviewApp(app)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            <Eye size={14} /> Review
                          </button>
                          <button onClick={() => handleEditApp(app)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            <Edit3 size={14} /> Edit
                          </button>
                          <button onClick={() => handleDeleteApp(app._id, app.name)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'linear-gradient(135deg, var(--danger), #dc2626)' }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab content: Students */}
        {activeTab === 'students' && (
          <div className="glass-card animate-fade-in" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>Active Student Registry</h2>
            {students.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No students have been approved yet.</p>
            ) : (
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Name</th>
                      <th>Student ID / Username</th>
                      <th>Branch</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>
                          {student.photo ? (
                            <img 
                              src={`${API_URL}/${student.photo}`} 
                              alt="Student avatar" 
                              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              N/A
                            </div>
                          )}
                        </td>
                        <td>{student.name}</td>
                        <td>{student.studentUsername}</td>
                        <td>{student.branch}</td>
                        <td>{student.phone}</td>
                        <td style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleReviewApp(student)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            <Eye size={14} /> Details
                          </button>
                          <button onClick={() => handleEditApp(student)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            <Edit3 size={14} /> Edit Data
                          </button>
                          <button onClick={() => handleDeleteApp(student._id, student.name)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'linear-gradient(135deg, var(--danger), #dc2626)' }}>
                            <Trash2 size={14} /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab content: Export */}
        {activeTab === 'export' && (
          <div className="glass-card animate-fade-in" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div className="stat-icon" style={{ display: 'inline-flex', background: 'var(--primary-light)', color: 'var(--accent)', width: '60px', height: '60px', borderRadius: '50%', marginBottom: '15px' }}>
                <Download size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Generate Excel Spreadsheet Report</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Filter approved students by calendar month and download the Microsoft Excel sheet template.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Select Target Admission Month</label>
              <input 
                type="month" 
                className="form-input" 
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                disabled={exportLoading}
              />
            </div>

            <button 
              onClick={handleExcelExport}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', gap: '10px' }}
              disabled={exportLoading || !exportMonth}
            >
              {exportLoading ? 'Processing Spreadsheet...' : (
              <>
                <Download size={18} /> Export Admitted Students to Excel
              </>
            )}
          </button>
        </div>
      )}

      {/* Tab content: Settings */}
      {activeTab === 'change-password' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Card 1: Change Username */}
          <div className="glass-card" style={{ padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div className="stat-icon" style={{ display: 'inline-flex', background: 'var(--primary-light)', color: 'var(--accent)', width: '60px', height: '60px', borderRadius: '50%', marginBottom: '15px' }}>
                <Edit3 size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Change Admin Username</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Update your admin portal username. Use letters and numbers only.
              </p>
            </div>

            {usernameError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '0.9rem'
              }}>
                {usernameError}
              </div>
            )}

            {usernameSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '0.9rem'
              }}>
                {usernameSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateUsername}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">New Username</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)} 
                  placeholder="Enter new username"
                  required
                  disabled={usernameSaving}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', gap: '10px' }}
                disabled={usernameSaving}
              >
                {usernameSaving ? 'Updating Username...' : 'Update Username'}
              </button>
            </form>
          </div>

          {/* Card 2: Change Password */}
          <div className="glass-card" style={{ padding: '40px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div className="stat-icon" style={{ display: 'inline-flex', background: 'var(--primary-light)', color: 'var(--accent)', width: '60px', height: '60px', borderRadius: '50%', marginBottom: '15px' }}>
                <Shield size={28} />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Update Admin Security Credentials</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Change your account password. Make sure to choose a strong password.
              </p>
            </div>

            {pwdError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '0.9rem'
              }}>
                {pwdError}
              </div>
            )}

            {pwdSuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '0.9rem'
              }}>
                {pwdSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showCurrentPassword ? 'text' : 'password'} 
                    className="form-input" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    placeholder="Enter current password"
                    required
                    disabled={pwdSaving}
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                    disabled={pwdSaving}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    className="form-input" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    placeholder="Enter new password (8-16 chars)"
                    required
                    disabled={pwdSaving}
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                    disabled={pwdSaving}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showConfirmNewPassword ? 'text' : 'password'} 
                    className="form-input" 
                    value={confirmNewPassword} 
                    onChange={(e) => setConfirmNewPassword(e.target.value)} 
                    placeholder="Verify new password"
                    required
                    disabled={pwdSaving}
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(prev => !prev)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                    disabled={pwdSaving}
                  >
                    {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', gap: '10px' }}
                disabled={pwdSaving}
              >
                {pwdSaving ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </div>

        </div>
      )}
    </main>

      {/* DETAIL VIEW MODAL */}
      {isDetailModalOpen && selectedApp && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 className="modal-title">Application File Review</h3>
              <button className="modal-close" onClick={() => setIsDetailModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Profile Details Block */}
              <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                {selectedApp.photo ? (
                  <img 
                    src={`${API_URL}/${selectedApp.photo}`} 
                    alt="Applicant Photo" 
                    style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                ) : (
                  <div style={{ width: '100px', height: '100px', borderRadius: '8px', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                    No Photo
                  </div>
                )}
                <div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedApp.name}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedApp.email}</p>
                  <div style={{ marginTop: '8px' }}>
                    <span className={`badge badge-${selectedApp.status}`}>
                      {selectedApp.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 30px', fontSize: '0.95rem', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>FATHER'S NAME</strong>
                  {selectedApp.fathersName}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>JEECUP APPLICATION NO</strong>
                  {selectedApp.jeecupAppNo}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>DATE OF BIRTH</strong>
                  {new Date(selectedApp.dob).toLocaleDateString()}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>GENDER</strong>
                  {selectedApp.gender}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>PHONE</strong>
                  {selectedApp.phone}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>BRANCH SELECTION</strong>
                  {selectedApp.branch}
                </div>
                    <div className="grid-col-span-2">
                      <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>ADDRESS</strong>
                      {selectedApp.address}
                    </div>
    
                    <div className="grid-col-span-2">
                  <strong style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>UPLOADED CERTIFICATES</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-inset)', padding: '12px', borderRadius: '8px' }}>
                    {selectedApp.marksheet10 && (
                      <a href={`${API_URL}/${selectedApp.marksheet10}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} /> 10th Marksheet (Compulsory)
                      </a>
                    )}
                    {selectedApp.marksheet12 ? (
                      <a href={`${API_URL}/${selectedApp.marksheet12}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} /> 12th Marksheet (Optional)
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-disabled)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        ✗ 12th Marksheet: Not Uploaded
                      </span>
                    )}
                    {selectedApp.incomeCert && (
                      <a href={`${API_URL}/${selectedApp.incomeCert}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} /> Income Certificate (Compulsory)
                      </a>
                    )}
                    {selectedApp.domicileCert && (
                      <a href={`${API_URL}/${selectedApp.domicileCert}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} /> Domicile Certificate (Compulsory)
                      </a>
                    )}
                    {selectedApp.casteCert ? (
                      <a href={`${API_URL}/${selectedApp.casteCert}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} /> Caste Certificate (Optional)
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-disabled)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        ✗ Caste Certificate: Not Uploaded
                      </span>
                    )}
                    {selectedApp.documents && selectedApp.documents.map((doc, idx) => (
                      <a key={idx} href={`${API_URL}/${doc.path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={14} /> {doc.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Specific details */}
              {selectedApp.status === 'approved' && (
                <div className="glass-card" style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
                  <h4 style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>APPROVED ACCOUNT CREATED</h4>
                  <p style={{ fontSize: '0.85rem' }}>Username: <strong>{selectedApp.studentUsername}</strong></p>
                  <p style={{ fontSize: '0.85rem' }}>Password (Text): <strong>{selectedApp.studentPasswordText}</strong></p>
                </div>
              )}

              {selectedApp.status === 'rejected' && (
                <div className="glass-card" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
                  <h4 style={{ color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '6px' }}>REJECTION STATED REASON</h4>
                  <p style={{ fontSize: '0.9rem' }}>{selectedApp.rejectionReason}</p>
                </div>
              )}

              {/* Action Panels */}
              {selectedApp.status === 'pending' && (
                <div style={{ marginTop: '25px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  {!showApproveForm && !showRejectForm && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setShowApproveForm(true)} className="btn btn-success" style={{ flexGrow: 1 }}>
                        Approve Admission
                      </button>
                      <button onClick={() => setShowRejectForm(true)} className="btn btn-danger" style={{ flexGrow: 1 }}>
                        Reject Application
                      </button>
                    </div>
                  )}

                  {showApproveForm && (
                    <form onSubmit={handleApproveSubmit} className="animate-fade-in">
                      <h4 style={{ fontWeight: 700, marginBottom: '12px' }}>Generate Student Account Credentials</h4>
                      <div className="form-group">
                        <label className="form-label">Suggested Username</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={studentUsername} 
                          onChange={(e) => setStudentUsername(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Suggested Password</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={studentPassword} 
                          onChange={(e) => setStudentPassword(e.target.value)} 
                          required 
                        />
                        {studentPassword && (
                          <div style={{ marginTop: '6px', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ color: studentPassword.length >= 8 ? 'var(--success)' : 'var(--danger)' }}>
                              {studentPassword.length >= 8 ? '✓' : '✗'} Minimum 8 characters
                            </div>
                            <div style={{ color: /[!@#$%^&*(),.?":{}|<>_+\-=\[\]{};':"\\|#`~]/.test(studentPassword) ? 'var(--success)' : 'var(--danger)' }}>
                              {/[!@#$%^&*(),.?":{}|<>_+\-=\[\]{};':"\\|#`~]/.test(studentPassword) ? '✓' : '✗'} Contains a special symbol
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-success" style={{ flexGrow: 1 }}>
                          Confirm Approve & Create Account
                        </button>
                        <button type="button" onClick={() => setShowApproveForm(false)} className="btn btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {showRejectForm && (
                    <form onSubmit={handleRejectSubmit} className="animate-fade-in">
                      <h4 style={{ fontWeight: 700, marginBottom: '12px' }}>Reject Application Form</h4>
                      <div className="form-group">
                        <label className="form-label">Reason for rejection</label>
                        <textarea 
                          className="form-input" 
                          rows="3" 
                          placeholder="State the reason (e.g. Incomplete transcripts, mismatch in DOB)" 
                          value={rejectionReason} 
                          onChange={(e) => setRejectionReason(e.target.value)} 
                          required 
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-danger" style={{ flexGrow: 1 }}>
                          Confirm Reject Application
                        </button>
                        <button type="button" onClick={() => setShowRejectForm(false)} className="btn btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedApp && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 className="modal-title">Edit Details: {selectedApp.name}</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body modal-body-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editFormData.name} 
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Father's Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editFormData.fathersName} 
                    onChange={(e) => setEditFormData({ ...editFormData, fathersName: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">JEECUP Application Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editFormData.jeecupAppNo} 
                    onChange={(e) => setEditFormData({ ...editFormData, jeecupAppNo: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={editFormData.email} 
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={editFormData.dob} 
                    onChange={(e) => setEditFormData({ ...editFormData, dob: e.target.value })} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    className="form-select" 
                    value={editFormData.gender} 
                    onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    value={editFormData.phone} 
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('+91')) {
                        val = '+91';
                      }
                      const suffix = val.substring(3).replace(/\D/g, '').slice(0, 10);
                      setEditFormData({ ...editFormData, phone: '+91' + suffix });
                    }} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Selection</label>
                  <select 
                    className="form-select" 
                    value={editFormData.branch} 
                    onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Food Technology">Food Technology</option>
                    <option value="Computer Science & Engineering(Lateral)">Computer Science & Engineering(Lateral)</option>
                    <option value="Electrical Engineering(Lateral)">Electrical Engineering(Lateral)</option>
                  </select>
                </div>
                    <div className="form-group grid-col-span-2">
                      <label className="form-label">Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editFormData.address} 
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default AdminDashboard;
