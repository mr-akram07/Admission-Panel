import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API_URL, getFileUrl } from '../context/AuthContext';
import { LogOut, CheckCircle2, Clock, XCircle, FilePlus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CollegeHeader from '../components/CollegeHeader';

const ApplicantDashboard = () => {
  const { user, token, logout } = useContext(AuthContext);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    gender: 'Male',
    phone: '+91',
    address: '',
    branch: 'Computer Science & Engineering',
    fathersName: '',
    jeecupAppNo: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [marksheet10File, setMarksheet10File] = useState(null);
  const [marksheet12File, setMarksheet12File] = useState(null);
  const [incomeCertFile, setIncomeCertFile] = useState(null);
  const [domicileCertFile, setDomicileCertFile] = useState(null);
  const [casteCertFile, setCasteCertFile] = useState(null);

  const fetchMyApplication = async () => {
    try {
      const res = await fetch(`${API_URL}/api/applications/my-application`, {
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

      if (res.ok) {
        setApplication(data);
        // Pre-fill form in case they want to review or resubmit (if rejected)
        setFormData({
          name: data.name,
          email: data.email,
          dob: data.dob ? data.dob.split('T')[0] : '',
          gender: data.gender,
          phone: data.phone,
          address: data.address,
          branch: data.branch,
          fathersName: data.fathersName,
          jeecupAppNo: data.jeecupAppNo
        });
      } else {
        setApplication(null);
        // Pre-fill email from registered user
        if (user) {
          setFormData(prev => ({ ...prev, name: user.username, email: user.email, phone: '+91' }));
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch application status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyApplication();
    }
  }, [token, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      let val = value;
      if (!val.startsWith('+91')) {
        val = '+91';
      }
      const suffix = val.substring(3).replace(/\D/g, '').slice(0, 10); // Limit to exactly 10 digits
      setFormData(prev => ({ ...prev, phone: '+91' + suffix }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (setter, label) => (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`File size error: ${label} must be less than 10MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
        e.target.value = null; // reset file input
        setter(null);
      } else {
        setError('');
        setter(file);
      }
    }
  };

  const handlePhotoChange = handleFileChange(setPhotoFile, 'Applicant Photo');
  const handleMarksheet10Change = handleFileChange(setMarksheet10File, '10th Marksheet');
  const handleMarksheet12Change = handleFileChange(setMarksheet12File, '12th Marksheet');
  const handleIncomeCertChange = handleFileChange(setIncomeCertFile, 'Income Certificate');
  const handleDomicileCertChange = handleFileChange(setDomicileCertFile, 'Domicile Certificate');
  const handleCasteCertChange = handleFileChange(setCasteCertFile, 'Caste Certificate');

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Phone validation (+91 followed by exactly 10 digits)
    if (formData.phone.length !== 13) {
      setError('Phone number must contain exactly 10 digits after +91.');
      return;
    }

    // File validation
    if (!photoFile) {
      setError('Applicant photo is compulsory.');
      return;
    }
    if (photoFile.size > 10 * 1024 * 1024) {
      setError('Applicant photo must be less than 10MB.');
      return;
    }
    if (!marksheet10File) {
      setError('10th Marksheet is compulsory.');
      return;
    }
    if (marksheet10File.size > 10 * 1024 * 1024) {
      setError('10th Marksheet must be less than 10MB.');
      return;
    }
    if (marksheet12File && marksheet12File.size > 10 * 1024 * 1024) {
      setError('12th Marksheet must be less than 10MB.');
      return;
    }
    if (!incomeCertFile) {
      setError('Income Certificate is compulsory.');
      return;
    }
    if (incomeCertFile.size > 10 * 1024 * 1024) {
      setError('Income Certificate must be less than 10MB.');
      return;
    }
    if (!domicileCertFile) {
      setError('Domicile Certificate is compulsory.');
      return;
    }
    if (domicileCertFile.size > 10 * 1024 * 1024) {
      setError('Domicile Certificate must be less than 10MB.');
      return;
    }
    if (casteCertFile && casteCertFile.size > 10 * 1024 * 1024) {
      setError('Caste Certificate must be less than 10MB.');
      return;
    }

    setFormLoading(true);

    const submissionData = new FormData();
    Object.keys(formData).forEach(key => {
      submissionData.append(key, formData[key]);
    });

    submissionData.append('photo', photoFile);
    submissionData.append('marksheet10', marksheet10File);
    if (marksheet12File) submissionData.append('marksheet12', marksheet12File);
    submissionData.append('incomeCert', incomeCertFile);
    submissionData.append('domicileCert', domicileCertFile);
    if (casteCertFile) submissionData.append('casteCert', casteCertFile);

    try {
      const res = await fetch(`${API_URL}/api/applications/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submissionData
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error('A server error occurred. Please try again later.');
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit application');
      }

      setSuccessMsg('Your admission application has been submitted successfully.');
      setApplication(data.application);
      fetchMyApplication();
    } catch (err) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResubmitClick = () => {
    setApplication(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-main)' }}>
        <h2>Loading applicant portal...</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CollegeHeader />
      <div style={{ padding: '30px 20px', flex: 1, position: 'relative' }}>
        <div className="bg-gradient-mesh"></div>
        
        {/* Header bar */}
      <div className="glass-card dashboard-header-container">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Applicant Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Welcome, {user?.username} ({user?.email})</p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '30px'
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            padding: '16px',
            borderRadius: '10px',
            marginBottom: '30px'
          }}>
            {successMsg}
          </div>
        )}

        {/* Display Status Panel if Application exists */}
        {application ? (
          <div className="glass-card animate-fade-in" style={{ padding: '35px', borderRadius: '16px', marginBottom: '30px' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              {application.status === 'pending' && (
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)', width: '80px', height: '80px', borderRadius: '50%', marginBottom: '15px' }}>
                    <Clock size={40} />
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px' }}>Application Under Review</h2>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '500px' }}>
                    Your application is currently pending verification. The admissions department will review your details and documents soon.
                  </p>
                  <div className="badge badge-pending" style={{ marginTop: '15px', padding: '6px 16px', fontSize: '0.9rem' }}>
                    Status: Pending
                  </div>
                </div>
              )}

              {application.status === 'approved' && (
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', width: '80px', height: '80px', borderRadius: '50%', marginBottom: '15px' }}>
                    <CheckCircle2 size={40} />
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px', color: 'var(--success)' }}>
                    Admission Approved!
                  </h2>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '20px' }}>
                    Congratulations! Your application has been approved by the college authority. A student account is successfully registered.
                  </p>
                  
                  {/* Student Credentials Box */}
                  <div className="glass-card" style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '24px',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '450px',
                    textAlign: 'left',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', color: 'var(--success)', borderBottom: '1px solid rgba(16, 185, 129, 0.2)', paddingBottom: '8px' }}>
                      Your Student Login Credentials
                    </h3>
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', textTransform: 'uppercase' }}>Username</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{application.studentUsername}</strong>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'block', textTransform: 'uppercase' }}>Password</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{application.studentPasswordText}</strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Note: Write down or remember these credentials. Use them to log in by selecting the "Student" role on the login page.
                    </p>
                  </div>

                  <button 
                    onClick={handleLogout} 
                    className="btn btn-primary"
                    style={{ padding: '12px 30px' }}
                  >
                    Go to Login Screen <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {application.status === 'rejected' && (
                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', width: '80px', height: '80px', borderRadius: '50%', marginBottom: '15px' }}>
                    <XCircle size={40} />
                  </div>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '8px', color: 'var(--danger)' }}>
                    Application Rejected
                  </h2>
                  
                  {/* Rejection Details Box */}
                  <div className="glass-card" style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '20px',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '500px',
                    margin: '15px 0 20px 0',
                    textAlign: 'left'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--danger)' }}>Reason for rejection:</strong>
                    <p style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>{application.rejectionReason}</p>
                  </div>

                  <button 
                    onClick={handleResubmitClick} 
                    className="btn btn-secondary"
                  >
                    <FilePlus size={16} /> Re-apply / Submit New Form
                  </button>
                </div>
              )}
            </div>

            {/* Read-Only Details */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '30px', marginTop: '30px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 600 }}>Submitted Details</h3>
              <div className="responsive-grid-equal-2">
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>FULL NAME</span>
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{application.name}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>FATHER'S NAME</span>
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{application.fathersName}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>JEECUP APPLICATION NUMBER</span>
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{application.jeecupAppNo}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>EMAIL</span>
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{application.email}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>DATE OF BIRTH</span>
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{new Date(application.dob).toLocaleDateString()}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>GENDER</span>
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{application.gender}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>PHONE NUMBER</span>
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{application.phone}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>BRANCH APPLIED FOR</span>
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{application.branch}</span>
                </div>
                <div className="grid-col-span-2">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>ADDRESS</span>
                  <span style={{ fontSize: '1rem', fontWeight: 500 }}>{application.address}</span>
                </div>
                {application.photo && (
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>PHOTO</span>
                    <img 
                      src={getFileUrl(application.photo)} 
                      alt="Student Photo" 
                      style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                    />
                  </div>
                )}
                <div className="grid-col-span-2">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>UPLOADED CERTIFICATES</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                    {application.marksheet10 && (
                      <a href={getFileUrl(application.marksheet10)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                        ✓ 10th Marksheet (Compulsory)
                      </a>
                    )}
                    {application.marksheet12 ? (
                      <a href={getFileUrl(application.marksheet12)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                        ✓ 12th Marksheet (Optional)
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>✗ 12th Marksheet: Not Uploaded</span>
                    )}
                    {application.incomeCert && (
                      <a href={getFileUrl(application.incomeCert)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                        ✓ Income Certificate (Compulsory)
                      </a>
                    )}
                    {application.domicileCert && (
                      <a href={getFileUrl(application.domicileCert)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                        ✓ Domicile Certificate (Compulsory)
                      </a>
                    )}
                    {application.casteCert ? (
                      <a href={getFileUrl(application.casteCert)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
                        ✓ Caste Certificate (Optional)
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>✗ Caste Certificate: Not Uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Render Admission Form */
          <div className="glass-card animate-fade-in" style={{ padding: '40px', borderRadius: '16px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              Admission Registration Form
            </h2>

            <form onSubmit={handleFormSubmit}>
              <div className="responsive-grid-form">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    className="form-input" 
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Father's Name</label>
                  <input 
                    type="text" 
                    name="fathersName"
                    className="form-input" 
                    value={formData.fathersName}
                    onChange={handleInputChange}
                    placeholder="Enter father's name"
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">JEECUP Application Number</label>
                  <input 
                    type="text" 
                    name="jeecupAppNo"
                    className="form-input" 
                    value={formData.jeecupAppNo}
                    onChange={handleInputChange}
                    placeholder="Enter JEECUP application number"
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    className="form-input" 
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input 
                    type="date" 
                    name="dob"
                    className="form-input" 
                    value={formData.dob}
                    onChange={handleInputChange}
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select 
                    name="gender"
                    className="form-select"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={formLoading}
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
                    name="phone"
                    className="form-input" 
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+91..."
                    required
                    disabled={formLoading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Branch Selecting</label>
                  <select 
                    name="branch"
                    className="form-select"
                    value={formData.branch}
                    onChange={handleInputChange}
                    disabled={formLoading}
                  >
                    <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Food Technology">Food Technology</option>
                    <option value="Computer Science & Engineering(Lateral)">Computer Science & Engineering(Lateral)</option>
                    <option value="Electrical Engineering(Lateral)">Electrical Engineering(Lateral)</option>
                  </select>
                </div>

                <div className="form-group grid-col-span-2">
                  <label className="form-label">Residential Address</label>
                  <input 
                    type="text" 
                    name="address"
                    className="form-input" 
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter permanent address"
                    required
                    disabled={formLoading}
                  />
                </div>

                {/* Documents & Certificates Section */}
                <div className="grid-col-span-2" style={{ marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '25px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FilePlus size={20} style={{ color: 'var(--accent)' }} /> Documents
                  </h3>
                  
                  <div className="responsive-grid-equal-2" style={{ 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px solid var(--border-color)',
                    padding: '24px', 
                    borderRadius: '12px' 
                  }}>
                    {/* Profile Photo Upload */}
                    <div className="form-group">
                      <label className="form-label">Applicant Photo <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>(Max 10MB)</span></label>
                      <input 
                        type="file" 
                        className="form-input" 
                        accept="image/*"
                        onChange={handlePhotoChange}
                        required
                        disabled={formLoading}
                      />
                      <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Accepts JPEG, JPG, PNG, GIF, WEBP, BMP, SVG. Max size: 10MB.</small>
                    </div>

                    {/* 10th Marksheet */}
                    <div className="form-group">
                      <label className="form-label">10th Marksheet <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>(Max 10MB)</span></label>
                      <input 
                        type="file" 
                        className="form-input" 
                        accept="image/*,application/pdf"
                        onChange={handleMarksheet10Change}
                        required
                        disabled={formLoading}
                      />
                      <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Upload 10th Marksheet (PDF or Image). Max size: 10MB.</small>
                    </div>

                    {/* 12th Marksheet */}
                    <div className="form-group">
                      <label className="form-label">12th Marksheet (Optional) <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>(Max 10MB)</span></label>
                      <input 
                        type="file" 
                        className="form-input" 
                        accept="image/*,application/pdf"
                        onChange={handleMarksheet12Change}
                        disabled={formLoading}
                      />
                      <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Upload 12th Marksheet if available. Max size: 10MB.</small>
                    </div>

                    {/* Income Cert */}
                    <div className="form-group">
                      <label className="form-label">Income Certificate <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>(Max 10MB)</span></label>
                      <input 
                        type="file" 
                        className="form-input" 
                        accept="image/*,application/pdf"
                        onChange={handleIncomeCertChange}
                        required
                        disabled={formLoading}
                      />
                      <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Upload Income Certificate. Max size: 10MB.</small>
                    </div>

                    {/* Domicile Cert */}
                    <div className="form-group">
                      <label className="form-label">Domicile Certificate <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>(Max 10MB)</span></label>
                      <input 
                        type="file" 
                        className="form-input" 
                        accept="image/*,application/pdf"
                        onChange={handleDomicileCertChange}
                        required
                        disabled={formLoading}
                      />
                      <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Upload Domicile Certificate. Max size: 10MB.</small>
                    </div>

                    {/* Caste Cert */}
                    <div className="form-group">
                      <label className="form-label">Caste Certificate (Optional) <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>(Max 10MB)</span></label>
                      <input 
                        type="file" 
                        className="form-input" 
                        accept="image/*,application/pdf"
                        onChange={handleCasteCertChange}
                        disabled={formLoading}
                      />
                      <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Upload Caste Certificate if applicable. Max size: 10MB.</small>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ padding: '14px 40px', borderRadius: '10px' }}
                  disabled={formLoading}
                >
                  {formLoading ? 'Submitting Form...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default ApplicantDashboard;
