import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, ShieldAlert, GraduationCap, FileText, Eye, EyeOff } from 'lucide-react';
import CollegeHeader from '../components/CollegeHeader';
import Swal from 'sweetalert2';

const Login = () => {
  const [role, setRole] = useState('applicant'); // applicant, student, admin, teacher
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all fields.'
      });
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(usernameOrEmail, password, role);
      // Redirect based on role
      if (loggedUser.role === 'admin' || loggedUser.role === 'teacher') {
        navigate('/admin');
      } else if (loggedUser.role === 'student') {
        navigate('/student');
      } else {
        navigate('/applicant');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.message || 'Login failed. Please check credentials.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <CollegeHeader />
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        padding: '40px 20px',
        position: 'relative'
      }}>
        <div className="bg-gradient-mesh"></div>
        
        <div className="glass-card animate-fade-in auth-card">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
            Portal Login
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Admission & Student Management System
          </p>
        </div>

        {/* Role Selectors */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          background: 'var(--bg-inset)',
          padding: '6px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '1px solid var(--border-color)'
        }}>
          <button 
            type="button"
            onClick={() => handleRoleChange('applicant')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 4px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.75rem',
              transition: 'all 0.2s ease',
              background: role === 'applicant' ? 'var(--primary)' : 'transparent',
              color: role === 'applicant' ? '#fff' : 'var(--text-muted)'
            }}
          >
            <FileText size={18} />
            Applicant
          </button>
          <button 
            type="button"
            onClick={() => handleRoleChange('student')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 4px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.75rem',
              transition: 'all 0.2s ease',
              background: role === 'student' ? 'var(--primary)' : 'transparent',
              color: role === 'student' ? '#fff' : 'var(--text-muted)'
            }}
          >
            <GraduationCap size={18} />
            Student
          </button>
          <button 
            type="button"
            onClick={() => handleRoleChange('admin')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 4px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.75rem',
              transition: 'all 0.2s ease',
              background: role === 'admin' ? 'var(--primary)' : 'transparent',
              color: role === 'admin' ? '#fff' : 'var(--text-muted)'
            }}
          >
            <ShieldAlert size={18} />
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {role === 'applicant' ? 'Email / Username' : 'Username'}
            </label>
            <input 
              type="text" 
              className="form-input" 
              placeholder={role === 'applicant' ? 'Enter email or username' : 'Enter username'}
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
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
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', borderRadius: '10px' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : (
              <>
                <LogIn size={18} /> Login as {role.charAt(0).toUpperCase() + role.slice(1)}
              </>
            )}
          </button>
        </form>

        {role === 'applicant' && (
          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            New Applicant?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              Create an Account
            </Link>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default Login;
