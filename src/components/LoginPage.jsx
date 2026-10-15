import React, { useState } from 'react';
import {
  Leaf, Lock, Mail, ShieldCheck, Eye, EyeOff, CheckCircle2,
  AlertCircle, Building2, Zap, ArrowRight, UserCheck, Key
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('director@carbontwin.edu');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const demoPersonas = [
    {
      name: 'Dr. Elena Vance',
      role: 'Chief Sustainability Officer',
      badge: 'CSO',
      email: 'director@carbontwin.edu',
      pass: 'admin123',
      dept: 'Campus Sustainability Office'
    },
    {
      name: 'Marcus Chen',
      role: 'Facility Operations Engineer',
      badge: 'Operations',
      email: 'facilities@carbontwin.edu',
      pass: 'energy2024',
      dept: 'Physical Plant & Hardware Relay'
    },
    {
      name: 'Sarah Jenkins',
      role: 'Campus Energy Auditor',
      badge: 'ESG Audit',
      email: 'auditor@carbontwin.edu',
      pass: 'audit2024',
      dept: 'Environmental Compliance'
    }
  ];

  const handleSelectPersona = (p) => {
    setEmail(p.email);
    setPassword(p.pass);
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Successful login
      if (rememberMe) {
        localStorage.setItem('carbontwin_user', JSON.stringify(data.user));
        localStorage.setItem('carbontwin_token', data.token);
      } else {
        sessionStorage.setItem('carbontwin_user', JSON.stringify(data.user));
      }

      onLoginSuccess(data.user);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials. Please verify your email and password.');
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
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ffffff' }}>St. Jude Campus Edge Stream</div>
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

      {/* RIGHT COLUMN: Interactive Login Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {/* Header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
              Sign in to Carbon Twin
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Enter your institutional credentials or select a verified demo persona below.
            </p>
          </div>

          {/* QUICK DEMO PERSONA SELECTOR */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <UserCheck size={14} color="#059669" />
              Quick Select Demo Persona:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {demoPersonas.map((p) => {
                const isSelected = email === p.email;
                return (
                  <button
                    key={p.email}
                    type="button"
                    onClick={() => handleSelectPersona(p)}
                    style={{
                      background: isSelected ? '#ecfdf5' : '#ffffff',
                      border: `1px solid ${isSelected ? '#059669' : '#e2e8f0'}`,
                      borderRadius: '8px',
                      padding: '0.6rem 0.5rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? '#065f46' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name.split(' ')[1] || p.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: isSelected ? '#047857' : '#64748b' }}>
                      {p.badge}
                    </div>
                  </button>
                );
              })}
            </div>
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

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Work Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Enterprise Email
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
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Demo passwords:\n- director@carbontwin.edu: admin123\n- facilities@carbontwin.edu: energy2024\n- auditor@carbontwin.edu: audit2024')}
                  style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
                marginBottom: '1.25rem'
              }}
            >
              {loading ? (
                'Verifying credentials...'
              ) : (
                <>
                  Sign In to Dashboard <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

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
