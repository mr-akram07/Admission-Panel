import React, { useState, useEffect, useContext } from 'react';
import { AuthContext, API_URL } from '../context/AuthContext';
import { LogOut, Save, Camera, GraduationCap, Phone, MapPin, User, Mail, Calendar, BookOpen, Upload, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CollegeHeader from '../components/CollegeHeader';

const StudentDashboard = () => {
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable Form fields
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // Change Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/students/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to load profile');
      }
      const data = await res.json();
      setProfile(data);
      let fetchedPhone = data.phone || '';
      if (fetchedPhone && !fetchedPhone.startsWith('+91')) {
        fetchedPhone = '+91' + fetchedPhone.replace(/\D/g, '').slice(0, 10);
      } else if (!fetchedPhone) {
        fetchedPhone = '+91';
      }
      setPhone(fetchedPhone);
      setAddress(data.address || '');
      if (data.photo) {
        setPhotoPreview(`${API_URL}/${data.photo}`);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('+91')) {
      val = '+91';
    }
    const suffix = val.substring(3).replace(/\D/g, '').slice(0, 10);
    setPhone('+91' + suffix);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (phone.length !== 13) {
      setError('Phone number must contain exactly 10 digits after +91.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');

    const submissionData = new FormData();
    submissionData.append('phone', phone);
    submissionData.append('address', address);
    if (photoFile) {
      submissionData.append('photo', photoFile);
    }

    try {
      const res = await fetch(`${API_URL}/api/students/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submissionData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save updates');
      }

      setProfile(data.student);
      setSuccess('Your profile contact information updated successfully.');
      if (data.student.photo) {
        setPhotoPreview(`${API_URL}/${data.student.photo}`);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // Optional documents upload states
  const [selectedOptionalDocType, setSelectedOptionalDocType] = useState('');
  const [customDocName, setCustomDocName] = useState('');
  const [optionalDocFile, setOptionalDocFile] = useState(null);
  const [uploadingOptional, setUploadingOptional] = useState(false);

  const handleUploadOptionalDoc = async (e) => {
    e.preventDefault();
    if (!optionalDocFile) {
      alert('Please select a file to upload.');
      return;
    }
    if (!selectedOptionalDocType) {
      alert('Please select a document type.');
      return;
    }

    setUploadingOptional(true);
    setError('');
    setSuccess('');

    const isOther = selectedOptionalDocType === 'other';
    const uploadData = new FormData();
    if (isOther) {
      uploadData.append('documentName', customDocName);
      uploadData.append('document', optionalDocFile);
    } else {
      uploadData.append('docType', selectedOptionalDocType);
      uploadData.append('file', optionalDocFile);
    }

    const endpoint = isOther 
      ? `${API_URL}/api/students/upload-document` 
      : `${API_URL}/api/students/upload-optional`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setSuccess(
        isOther 
          ? `Document "${customDocName}" uploaded successfully.` 
          : `${selectedOptionalDocType === 'marksheet12' ? '12th Marksheet' : 'Caste Certificate'} uploaded successfully.`
      );
      setProfile(data.student);
      setSelectedOptionalDocType('');
      setCustomDocName('');
      setOptionalDocFile(null);
      e.target.reset(); // Clear file input
    } catch (err) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploadingOptional(false);
    }
  };

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
      const res = await fetch(`${API_URL}/api/students/change-password`, {
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-main)' }}>
        <h2>Loading student portal...</h2>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '8px', color: 'var(--accent)' }}>
            <GraduationCap size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Student Portal</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>View and update your academic identity</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid var(--success)',
            color: 'var(--success)',
            padding: '14px 20px',
            borderRadius: '10px',
            marginBottom: '24px'
          }}>
            {success}
          </div>
        )}

        <div className="responsive-grid-2">
          {/* Left panel: Profile preview card & Uploads */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="glass-card animate-fade-in" style={{ padding: '30px', textAlign: 'center', height: 'fit-content' }}>
            <div className="photo-uploader">
              {photoPreview ? (
                <img 
                  src={photoPreview} 
                  alt="Student Avatar" 
                  className="photo-preview-circle" 
                />
              ) : (
                <div className="photo-preview-circle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={60} color="var(--text-muted)" />
                </div>
              )}
              
              <label className="btn btn-secondary photo-upload-btn" style={{ padding: '6px 14px', fontSize: '0.8rem', gap: '6px' }}>
                <Camera size={14} /> Update Photo
                <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={saving} />
              </label>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{profile?.name}</h2>
            <span className="badge badge-approved" style={{ marginTop: '8px', fontSize: '0.8rem', padding: '4px 12px' }}>
              Student ID: {profile?.studentUsername}
            </span>

            <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '24px', paddingTop: '20px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen size={18} style={{ color: 'var(--primary-hover)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ENROLLED BRANCH</span>
                  <strong style={{ fontSize: '0.9rem' }}>{profile?.branch}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={18} style={{ color: 'var(--primary-hover)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>EMAIL ADDRESS</span>
                  <strong style={{ fontSize: '0.9rem' }}>{profile?.email}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={18} style={{ color: 'var(--primary-hover)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>DATE OF BIRTH</span>
                  <strong style={{ fontSize: '0.9rem' }}>
                    {profile?.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <User size={18} style={{ color: 'var(--primary-hover)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>FATHER'S NAME</span>
                  <strong style={{ fontSize: '0.9rem' }}>{profile?.fathersName}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GraduationCap size={18} style={{ color: 'var(--primary-hover)', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>JEECUP APPLICATION NO</span>
                  <strong style={{ fontSize: '0.9rem' }}>{profile?.jeecupAppNo}</strong>
                </div>
              </div>
            </div>
          </div>

            {/* Upload Documents Card */}
            <div className="glass-card animate-fade-in" style={{ padding: '24px', marginTop: '24px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} style={{ color: 'var(--accent)' }} /> Upload Documents
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Select a document type to upload files to your academic profile:
              </p>
              <form onSubmit={handleUploadOptionalDoc}>
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Document Type</label>
                  <select
                    className="form-select"
                    style={{ padding: '8px 12px', fontSize: '0.85rem', background: 'var(--bg-surface-elevated)', color: 'var(--text)', border: '1px solid var(--border-color)', borderRadius: '6px', width: '100%' }}
                    value={selectedOptionalDocType}
                    onChange={(e) => setSelectedOptionalDocType(e.target.value)}
                    required
                    disabled={uploadingOptional}
                  >
                    <option value="">-- Choose Document --</option>
                    {profile && !profile.marksheet12 && (
                      <option value="marksheet12">12th Marksheet</option>
                    )}
                    {profile && !profile.casteCert && (
                      <option value="casteCert">Caste Certificate</option>
                    )}
                    <option value="other">Other Document</option>
                  </select>
                </div>

                {selectedOptionalDocType === 'other' && (
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Document Label / Name</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      placeholder="E.g., Sem 1 Marksheet, TC, Migration"
                      value={customDocName}
                      onChange={(e) => setCustomDocName(e.target.value)}
                      required
                      disabled={uploadingOptional}
                    />
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Select File (PDF/Image)</label>
                  <input 
                    type="file" 
                    className="form-input" 
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    accept="image/*,application/pdf"
                    onChange={(e) => setOptionalDocFile(e.target.files[0])}
                    required
                    disabled={uploadingOptional}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', padding: '10px', fontSize: '0.85rem' }}
                  disabled={uploadingOptional}
                >
                  {uploadingOptional ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            </div>
          </div>

          {/* Right panel: Edit Profile / Complete details form & Change Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-card animate-fade-in" style={{ padding: '40px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                Personal Profile File
              </h2>

              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={profile?.name || ''} 
                    disabled 
                    style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                  />
                </div>

                <div className="responsive-grid-equal-2">
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={profile?.gender || ''} 
                      disabled 
                      style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={14} /> Phone Number
                      </span>
                    </label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      value={phone} 
                      onChange={handlePhoneChange} 
                      placeholder="Enter phone number"
                      required
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> Residential Address
                    </span>
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder="Enter address"
                    required
                    disabled={saving}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Admitted Document Attachments</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px' }}>
                    {profile?.marksheet10 && (
                      <a href={`${API_URL}/${profile.marksheet10}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                        ✓ 10th Marksheet (Compulsory)
                      </a>
                    )}
                    {profile?.marksheet12 ? (
                      <a href={`${API_URL}/${profile.marksheet12}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                        ✓ 12th Marksheet (Optional)
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-disabled)' }}>✗ 12th Marksheet: Not Uploaded</span>
                    )}
                    {profile?.incomeCert && (
                      <a href={`${API_URL}/${profile.incomeCert}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                        ✓ Income Certificate (Compulsory)
                      </a>
                    )}
                    {profile?.domicileCert && (
                      <a href={`${API_URL}/${profile.domicileCert}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                        ✓ Domicile Certificate (Compulsory)
                      </a>
                    )}
                    {profile?.casteCert ? (
                      <a href={`${API_URL}/${profile.casteCert}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                        ✓ Caste Certificate (Optional)
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-disabled)' }}>✗ Caste Certificate: Not Uploaded</span>
                    )}
                    {profile?.documents && profile.documents.map((doc, idx) => (
                      <a key={idx} href={`${API_URL}/${doc.path}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                        ✓ {doc.name}
                      </a>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ padding: '12px 30px', gap: '8px' }}
                    disabled={saving}
                  >
                    {saving ? 'Saving changes...' : (
                      <>
                        <Save size={16} /> Save Contact Profile
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-card animate-fade-in" style={{ padding: '40px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                Change Login Password
              </h2>

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
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type={showCurrentPassword ? 'text' : 'password'} 
                      className="form-input" 
                      value={currentPassword} 
                      onChange={(e) => setCurrentPassword(e.target.value)} 
                      placeholder="Enter current login password"
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

                <div className="form-group">
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

                <div className="form-group">
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

                <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ padding: '12px 30px' }}
                    disabled={pwdSaving}
                  >
                    {pwdSaving ? 'Updating Password...' : 'Change Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default StudentDashboard;
