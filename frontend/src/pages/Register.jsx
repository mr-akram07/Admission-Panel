import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, Check, X, Eye, EyeOff } from 'lucide-react';
import CollegeHeader from '../components/CollegeHeader';
import Swal from 'sweetalert2';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const hasValidLength = password.length >= 8 && password.length <= 16;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialSymbol = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]{};':"\\|#`~]/.test(password);

  let score = 0;
  if (hasValidLength) score++;
  if (hasLetter) score++;
  if (hasNumber) score++;
  if (hasSpecialSymbol) score++;

  let strengthLabel = '';
  let strengthColor = 'var(--text-disabled)';
  let strengthPercentage = '0%';

  if (password) {
    if (score === 4) {
      strengthLabel = 'Strong Password';
      strengthColor = 'var(--success)';
      strengthPercentage = '100%';
    } else if (score >= 2) {
      strengthLabel = 'Medium Password';
      strengthColor = 'var(--warning)';
      strengthPercentage = '66%';
    } else {
      strengthLabel = 'Weak Password';
      strengthColor = 'var(--danger)';
      strengthPercentage = '33%';
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^[a-zA-Z0-9]+$/.test(username)) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Username cannot contain spaces or special characters.'
      });
      return;
    }

    if (password.length < 8 || password.length > 16) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Password must be between 8 and 16 characters long.'
      });
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*(),.?":{}|<>_+\-=\[\]{};':"\\|#`~]/.test(password)) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Password must contain a mix of letters, numbers, and special symbols.'
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Passwords do not match.'
      });
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Account created successfully!'
      });
      navigate('/applicant');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.message || 'Registration failed.'
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
            Applicant Sign Up
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Register to start your admission process
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative', marginBottom: password ? '8px' : '0px' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-input" 
                placeholder="Create a password"
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
            {password && (
              <div style={{ marginTop: '8px', animation: 'fadeIn 0.2s ease' }}>
                <div style={{ display: 'flex', gap: '4px', height: '4px', width: '100%', marginBottom: '8px' }}>
                  <div style={{ 
                    flex: 1, 
                    borderRadius: '2px', 
                    background: password ? (strengthPercentage === '33%' ? 'var(--danger)' : strengthPercentage === '66%' ? 'var(--warning)' : 'var(--success)') : 'rgba(255,255,255,0.1)'
                  }}></div>
                  <div style={{ 
                    flex: 1, 
                    borderRadius: '2px', 
                    background: password && (strengthPercentage === '66%' ? 'var(--warning)' : strengthPercentage === '100%' ? 'var(--success)' : 'rgba(255,255,255,0.1)') 
                  }}></div>
                  <div style={{ 
                    flex: 1, 
                    borderRadius: '2px', 
                    background: password && (strengthPercentage === '100%' ? 'var(--success)' : 'rgba(255,255,255,0.1)') 
                  }}></div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '10px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                  <span style={{ color: strengthColor, fontWeight: 700 }}>{strengthLabel}</span>
                </div>

                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px', 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-color)', 
                  padding: '10px 12px', 
                  borderRadius: '8px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    {hasValidLength ? (
                      <Check size={14} style={{ color: 'var(--success)' }} />
                    ) : (
                      <X size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <span style={{ color: hasValidLength ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      Between 8 and 16 characters
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    {hasLetter ? (
                      <Check size={14} style={{ color: 'var(--success)' }} />
                    ) : (
                      <X size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <span style={{ color: hasLetter ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      At least one letter (a-z, A-Z)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    {hasNumber ? (
                      <Check size={14} style={{ color: 'var(--success)' }} />
                    ) : (
                      <X size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <span style={{ color: hasNumber ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      At least one number (0-9)
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    {hasSpecialSymbol ? (
                      <Check size={14} style={{ color: 'var(--success)' }} />
                    ) : (
                      <X size={14} style={{ color: 'var(--text-muted)' }} />
                    )}
                    <span style={{ color: hasSpecialSymbol ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      At least one special symbol (e.g. @, #, $, %)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPassword ? 'text' : 'password'} 
                className="form-input" 
                placeholder="Verify your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
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
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', borderRadius: '10px' }}
            disabled={loading}
          >
            {loading ? 'Registering...' : (
              <>
                <UserPlus size={18} /> Register Account
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  </div>
);
};

export default Register;
