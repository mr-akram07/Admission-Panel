import React, { useContext } from 'react';
import upLogo from '../assets/up-logo.png';
import { ThemeContext } from '../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

const CollegeHeader = () => {
  const { themeMode, changeThemeMode } = useContext(ThemeContext);

  return (
    <div className="college-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div className="college-header-brand">
        <img 
          src={upLogo} 
          alt="UTTAR PRADESH GOVERNMENT" 
          className="college-header-logo" 
          style={{ flexShrink: 0 }}
        />
        <div className="college-header-text">
          <h1 className="college-header-title">
            MAHAMAYA POLYTECHNIC OF INFORMATION TECHNOLOGY BANSI SIDDHARTHNAGAR
          </h1>
          <p className="college-header-subtitle">
            AFFILIATED TO : UTTAR PRADESH BOARD OF TECHNICAL EDUCATION
          </p>
        </div>
      </div>
      
      {/* Theme Switcher */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid var(--border-color)',
        padding: '6px 12px',
        borderRadius: '8px',
        backdropFilter: 'blur(4px)',
        alignSelf: 'center'
      }}>
        {themeMode === 'light' && <Sun size={16} style={{ color: 'var(--accent)' }} />}
        {themeMode === 'dark' && <Moon size={16} style={{ color: 'var(--accent)' }} />}
        {themeMode === 'system' && <Monitor size={16} style={{ color: 'var(--accent)' }} />}
        
        <select 
          value={themeMode} 
          onChange={(e) => changeThemeMode(e.target.value)}
          style={{
            background: 'transparent',
            color: 'var(--text-main)',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-primary)'
          }}
        >
          <option value="dark" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Dark</option>
          <option value="light" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>Light</option>
          <option value="system" style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>System</option>
        </select>
      </div>
    </div>
  );
};

export default CollegeHeader;
