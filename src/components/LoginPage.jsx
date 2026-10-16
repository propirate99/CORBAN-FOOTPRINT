import React, { useState } from 'react';
import {
  Leaf, Lock, Mail, ShieldCheck, Eye, EyeOff, CheckCircle2,
  AlertCircle, Building2, Zap, ArrowRight, User, Briefcase, Activity
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess, onExploreTwin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('Chief Sustainability Officer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!email.trim()) {
          throw new Error('Please enter your institutional email address.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please re-enter.');
        }

        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName.trim(),
            email: email.trim(),
            password,
            role,
            department: department.trim() || 'Campus Facilities & Sustainability'
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Account registration failed.');
        }

        // Store user and token
        if (rememberMe) {
          localStorage.setItem('carbontwin_user', JSON.stringify(data.user));
          localStorage.setItem('carbontwin_token', data.token);
        } else {
          sessionStorage.setItem('carbontwin_user', JSON.stringify(data.user));
        }

        onLoginSuccess(data.user);
      } else {
        if (!email.trim() || !password) {
          throw new Error('Please provide both your institutional email and password.');
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Authentication failed. Please verify credentials.');
        }

        // Store user and token
        if (rememberMe) {
          localStorage.setItem('carbontwin_user', JSON.stringify(data.user));
          localStorage.setItem('carbontwin_token', data.token);
        } else {
          sessionStorage.setItem('carbontwin_user', JSON.stringify(data.user));
        }

        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication error. Please check your network and credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = async (provider = 'Campus SAML / Okta') => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sso_provider: provider })
      });
      const data = await res.json();
      if (data.user) {
        localStorage.setItem('carbontwin_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMessage('SSO provider communication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, -apple-system, sans-serif'
    }}>
      {/* LEFT COLUMN: Brand Experience & Environmental Credentials */}
      <div style={{
        flex: 1.1,
        backgroundColor: '#061814',
        color: '#ffffff',
        padding: '3.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid #13382f'
      }}>
        {/* Subtle Ambient Radial Lighting */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          left: '-15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(6, 24, 20, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(5, 150, 105, 0.15) 0%, rgba(6, 24, 20, 0) 70%)',
          pointerEvents: 'none'
        }} />

        {/* Top Header & Logo */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}>
              <Leaf size={24} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                CARBON TWIN
                <span style={{ fontSize: '0.65rem', fontWeight: 700, background: '#13382f', color: '#10b981', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Enterprise
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 500 }}>
                Campus Energy & Decarbonization Intelligence
              </div>
            </div>
          </div>

          {/* Hero Value Statement */}
          <div style={{ maxWidth: '520px' }}>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem',
              color: '#ffffff'
            }}>
              Accelerating campus decarbonization with live facility intelligence.
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#94a3b8',
              lineHeight: 1.6,
              marginBottom: '2rem'
            }}>
              Continuous digital twin monitoring connecting spatial occupancy telemetry with rated equipment power to eliminate idle energy waste and achieve Net-Zero mandates.
            </p>

            {/* Feature Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: '#0f382c', padding: '0.4rem', borderRadius: '6px', marginTop: '2px' }}>
                  <Zap size={16} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>Real-time Spatial Energy Correlation</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Instantly flags non-essential loads running in unoccupied research suites.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: '#0f382c', padding: '0.4rem', borderRadius: '6px', marginTop: '2px' }}>
                  <ShieldCheck size={16} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>Zero-PII Privacy-Preserving Vision</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Strictly anonymous aggregate headcounts. Zero facial embeddings or student tracking.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ background: '#0f382c', padding: '0.4rem', borderRadius: '6px', marginTop: '2px' }}>
                  <Lock size={16} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9' }}>Snapshot Freeze Audit Protection</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Immutable scenario records guaranteeing equipment and grid factor historical audit integrity.</div>
                </div>
              </div>
            </div>

            {/* Mini Telemetry Live Ticker Card */}
            <div style={{
              background: 'rgba(11, 35, 29, 0.7)',
              border: '1px solid #1a5646',
              borderRadius: '10px',
              padding: '1rem',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 700 }}>Telemetry Status</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>Live Institutional Edge Stream</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Active Trajectory</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10b981' }}>-42.4% Net Zero</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ position: 'relative', zIndex: 1, paddingTop: '2rem', borderTop: '1px solid #13382f', fontSize: '0.75rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
          <span>© 2026 Carbon Twin Enterprise</span>
          <span>FERPA & EPA eGRID Certified</span>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Login / Signup Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem',
        overflowY: 'auto'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Top Auth Mode Tabs */}
          <div style={{
            display: 'flex',
            background: '#e2e8f0',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '1.75rem'
          }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMessage(''); setInfoMessage(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: !isSignUp ? 700 : 500,
                background: !isSignUp ? '#ffffff' : 'transparent',
                color: !isSignUp ? '#065f46' : '#64748b',
                boxShadow: !isSignUp ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMessage(''); setInfoMessage(''); }}
              style={{
                flex: 1,
                padding: '0.55rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: isSignUp ? 700 : 500,
                background: isSignUp ? '#ffffff' : 'transparent',
                color: isSignUp ? '#065f46' : '#64748b',
                boxShadow: isSignUp ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Create Account
            </button>
          </div>

          {/* Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
              {isSignUp ? 'Register Campus Account' : 'Sign in to Carbon Twin'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {isSignUp
                ? 'Create your institutional credentials to monitor facility energy and carbon footprints.'
                : 'Enter your institutional credentials to access live facility intelligence.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#b91c1c',
              fontSize: '0.825rem'
            }}>
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Info Banner */}
          {infoMessage && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#166534',
              fontSize: '0.825rem'
            }}>
              <CheckCircle2 size={16} />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                {/* Full Name */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Elena Vance"
                      required
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.15s ease'
                      }}
                    />
                  </div>
                </div>

                {/* Role / Position */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Institutional Role
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Briefcase size={16} />
                    </div>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        background: '#ffffff',
                        color: '#1e293b'
                      }}
                    >
                      <option value="Chief Sustainability Officer">Chief Sustainability Officer (CSO)</option>
                      <option value="Facility Operations Engineer">Facility Operations Engineer</option>
                      <option value="Campus Energy Auditor">Campus Energy Auditor</option>
                      <option value="Physical Plant Manager">Physical Plant Manager</option>
                      <option value="Sustainability Coordinator">Sustainability Coordinator</option>
                      <option value="Department Administrator">Department Administrator</option>
                    </select>
                  </div>
                </div>

                {/* Department */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                    Department / Division
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                      <Building2 size={16} />
                    </div>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Facilities Management & Climate Office"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        outline: 'none',
                        transition: 'border-color 0.15s ease'
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Institutional Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Institutional Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@carbontwin.edu"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: isSignUp ? '1rem' : '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setInfoMessage('For credential resets or SSO assistance, please contact your institutional IT administrator.')}
                    style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? 'Minimum 6 characters' : '••••••••'}
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 2.5rem 0.65rem 2.5rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Only in Signup) */}
            {isSignUp && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem 0.65rem 2.5rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      outline: 'none',
                      transition: 'border-color 0.15s ease'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#475569', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#059669' }}
                />
                Remember this session for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                isSignUp ? 'Creating account...' : 'Verifying credentials...'
              ) : isSignUp ? (
                <>
                  Register & Sign In <ArrowRight size={16} />
                </>
              ) : (
                <>
                  Sign In to Dashboard <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage('');
                setInfoMessage('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isSignUp
                ? 'Already have an institutional account? Sign In'
                : "Don't have an account yet? Register your institution"}
            </button>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1rem 0',
            color: '#94a3b8',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ padding: '0 0.75rem' }}>Or Institutional Access</span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Digital Twin Direct Access Callout */}
          <div style={{
            background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.725rem', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
              ⚡ Live Hackathon Feature
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#064e3b', marginBottom: '0.5rem' }}>
              Campus Energy Digital Twin & CCTV Vision
            </div>
            <button
              id="btn-goto-twin-login"
              type="button"
              onClick={onExploreTwin}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontSize: '0.825rem',
                background: '#059669',
                border: 'none',
                borderRadius: '6px',
                color: '#ffffff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Activity size={16} />
              Launch Campus Digital Twin (/twin)
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Single Sign-On Button */}
          <button
            type="button"
            onClick={() => handleSSOLogin('SAML / Okta')}
            className="btn-secondary"
            style={{
              width: '100%',
              padding: '0.7rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}
          >
            <Building2 size={16} color="#059669" />
            Sign in with Campus SSO (SAML / Okta)
          </button>

          {/* Privacy Footnote */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '0.65rem 0.85rem',
            fontSize: '0.725rem',
            color: '#64748b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.45rem',
            lineHeight: 1.4
          }}>
            <ShieldCheck size={14} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Privacy Charter:</strong> In strict compliance with FERPA and institutional governance, this platform never collects student identities, biometric embeddings, or continuous location histories.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
