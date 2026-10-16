import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Lock, Mail, ShieldCheck, Eye, EyeOff, CheckCircle2,
  AlertCircle, Building2, Zap, ArrowRight, User, Briefcase, Sparkles,
  RefreshCw, Activity, Shield, Award, Check
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
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

        if (rememberMe) {
          localStorage.setItem('carbontwin_user', JSON.stringify(data.user));
          localStorage.setItem('carbontwin_token', data.token);
        } else {
          sessionStorage.setItem('carbontwin_user', JSON.stringify(data.user));
        }

        onLoginSuccess(data.user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication error. Please check your credentials.');
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
      backgroundColor: 'var(--color-bg-app, #f8fafc)',
      fontFamily: 'var(--font-sans, "Inter", -apple-system, sans-serif)',
      overflowX: 'hidden'
    }}>
      {/* =========================================================================
          LEFT COLUMN: Premium Brand Experience & Live Telemetry Intelligence
         ========================================================================= */}
      <div style={{
        flex: 1.15,
        backgroundColor: '#020d0a',
        backgroundImage: `
          radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.18) 0%, transparent 45%),
          radial-gradient(circle at 85% 85%, rgba(6, 182, 212, 0.12) 0%, transparent 45%),
          radial-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 28px 28px',
        color: '#ffffff',
        padding: '3.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        borderRight: '1px solid rgba(16, 185, 129, 0.15)'
      }}>
        {/* Glowing Animated Ambient Light Spheres */}
        <motion.div
          animate={{
            scale: [1, 1.28, 1],
            opacity: [0.22, 0.42, 0.22],
            x: [0, 30, 0],
            y: [0, -25, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            top: '-15%',
            left: '-15%',
            width: '580px',
            height: '580px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(2, 13, 10, 0) 70%)',
            filter: 'blur(30px)',
            pointerEvents: 'none'
          }}
        />

        <motion.div
          animate={{
            scale: [1, 1.22, 1],
            opacity: [0.15, 0.32, 0.15],
            x: [0, -35, 0],
            y: [0, 30, 0]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            bottom: '-12%',
            right: '-10%',
            width: '520px',
            height: '520px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.28) 0%, rgba(2, 13, 10, 0) 70%)',
            filter: 'blur(35px)',
            pointerEvents: 'none'
          }}
        />

        {/* Brand Top Header */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2.5rem' }}
          >
            <motion.div
              whileHover={{ rotate: 12, scale: 1.08 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Leaf size={24} color="#ffffff" />
            </motion.div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <span>CARBON TWIN</span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '20px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <motion.span
                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }}
                  />
                  Enterprise v2.4
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6ee7b7', fontWeight: 500, letterSpacing: '0.01em' }}>
                Campus Energy & Decarbonization Digital Twin
              </div>
            </div>
          </motion.div>

          {/* Hero Statement */}
          <div style={{ maxWidth: '520px' }}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15, ease: 'easeOut' }}
              style={{
                fontSize: '2.35rem',
                fontWeight: 800,
                lineHeight: 1.18,
                letterSpacing: '-0.035em',
                marginBottom: '1.25rem',
                color: '#ffffff'
              }}
            >
              Accelerating campus decarbonization with{' '}
              <span style={{
                background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline'
              }}>
                live digital twin intelligence
              </span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.25, ease: 'easeOut' }}
              style={{
                fontSize: '0.98rem',
                color: '#cbd5e1',
                lineHeight: 1.62,
                marginBottom: '2rem'
              }}
            >
              Continuous digital twin orchestrator correlating spatial occupancy with rated facility loads to eliminate unoccupied waste, automate HVAC schedules, and achieve Net-Zero mandates.
            </motion.p>

            {/* Interactive Feature Glass Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '2.25rem' }}>
              {[
                {
                  icon: Zap,
                  tag: 'Live Telemetry',
                  title: 'Real-time Spatial Energy Correlation',
                  desc: 'Instantly correlates research suite occupancy with lighting and HVAC loads to eliminate idle waste.',
                  accent: '#10b981'
                },
                {
                  icon: ShieldCheck,
                  tag: 'Privacy Shield',
                  title: 'Zero-PII Privacy-Preserving Vision',
                  desc: 'Strictly anonymous aggregate headcounts. Zero facial embeddings or student identification.',
                  accent: '#06b6d4'
                },
                {
                  icon: Lock,
                  tag: 'Compliance',
                  title: 'Snapshot Freeze Audit Protection',
                  desc: 'Immutable scenario records guaranteeing equipment and grid factor historical audit integrity.',
                  accent: '#f59e0b'
                }
              ].map((item, idx) => {
                const IconC = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -25 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.35 + idx * 0.12 }}
                    whileHover={{ x: 6, backgroundColor: 'rgba(16, 185, 129, 0.08)' }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.85rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '12px',
                      padding: '0.85rem 1rem',
                      backdropFilter: 'blur(8px)',
                      cursor: 'default',
                      transition: 'border-color 0.2s, background-color 0.2s'
                    }}
                  >
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: `1px solid ${item.accent}33`,
                      padding: '0.5rem',
                      borderRadius: '9px',
                      marginTop: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      flexShrink: 0
                    }}>
                      <IconC size={17} color={item.accent} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>{item.title}</div>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: item.accent, background: `${item.accent}15`, padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                          {item.tag}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.45 }}>{item.desc}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Animated Live Telemetry Ticker Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              whileHover={{ scale: 1.015, transition: { duration: 0.2 } }}
              style={{
                background: 'linear-gradient(135deg, rgba(8, 32, 25, 0.85) 0%, rgba(4, 20, 16, 0.85) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '14px',
                padding: '1.1rem 1.25rem',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ position: 'relative', width: '10px', height: '10px' }}>
                    <motion.div
                      animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                      style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981' }}
                    />
                    <div style={{ position: 'absolute', inset: '1px', borderRadius: '50%', background: '#34d399' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                      Live Institutional Twin
                    </div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ffffff' }}>
                      Edge Vision Telemetry Active
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Target Trajectory</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399' }}>-42.4% Net-Zero</div>
                </div>
              </div>

              {/* Progress trajectory bar */}
              <div style={{ height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '999px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '74%' }}
                  transition={{ duration: 1.2, delay: 0.9, ease: 'easeOut' }}
                  style={{ height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)', borderRadius: '999px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.45rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                <span>Baseline: 342.5 MWh/yr</span>
                <span style={{ color: '#6ee7b7' }}>Saved: 145.2 MWh/yr</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer info & Compliance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{
            position: 'relative',
            zIndex: 2,
            paddingTop: '2rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.78rem',
            color: '#64748b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>© 2026 Carbon Twin Enterprise OS</span>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8' }}>
              <Shield size={12} color="#10b981" /> FERPA Zero-PII
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8' }}>
              <Award size={12} color="#06b6d4" /> EPA eGRID Certified
            </span>
          </div>
        </motion.div>
      </div>

      {/* =========================================================================
          RIGHT COLUMN: Elevated Interactive Login & Authentication Form Card
         ========================================================================= */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Subtle background glow circle */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: '350px',
          height: '350px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
          borderRadius: '50%'
        }} />

        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="watershed-card"
          style={{
            width: '100%',
            maxWidth: '470px',
            padding: '2.75rem',
            borderRadius: '20px',
            backgroundColor: 'var(--color-surface-white, #ffffff)',
            border: '1px solid var(--color-border-subtle, #e2e8f0)',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(16, 185, 129, 0.06)',
            position: 'relative',
            zIndex: 1
          }}
        >
          {/* Top Auth Mode Segment Control with Spring-Animated Sliding Pill */}
          <div style={{
            display: 'flex',
            background: 'var(--color-surface-subtle, #f1f5f9)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '1.75rem',
            position: 'relative',
            border: '1px solid var(--color-border-subtle, #e2e8f0)'
          }}>
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMessage(''); setInfoMessage(''); }}
              style={{
                flex: 1,
                padding: '0.65rem',
                border: 'none',
                borderRadius: '9px',
                fontSize: '0.875rem',
                fontWeight: !isSignUp ? 700 : 500,
                background: 'transparent',
                color: !isSignUp ? '#059669' : 'var(--color-text-muted, #64748b)',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                transition: 'color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              Sign In
              {!isSignUp && (
                <motion.div
                  layoutId="activeAuthTabPill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'var(--color-surface-white, #ffffff)',
                    borderRadius: '9px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08), 0 0 0 1px rgba(16, 185, 129, 0.1)',
                    zIndex: -1
                  }}
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMessage(''); setInfoMessage(''); }}
              style={{
                flex: 1,
                padding: '0.65rem',
                border: 'none',
                borderRadius: '9px',
                fontSize: '0.875rem',
                fontWeight: isSignUp ? 700 : 500,
                background: 'transparent',
                color: isSignUp ? '#059669' : 'var(--color-text-muted, #64748b)',
                cursor: 'pointer',
                position: 'relative',
                zIndex: 2,
                transition: 'color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem'
              }}
            >
              Create Account
              {isSignUp && (
                <motion.div
                  layoutId="activeAuthTabPill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'var(--color-surface-white, #ffffff)',
                    borderRadius: '9px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08), 0 0 0 1px rgba(16, 185, 129, 0.1)',
                    zIndex: -1
                  }}
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
            </button>
          </div>

          {/* Form Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <motion.h2
              key={isSignUp ? 'signup-title' : 'login-title'}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                fontSize: '1.85rem',
                fontWeight: 800,
                color: 'var(--color-text-main, #0f172a)',
                letterSpacing: '-0.025em',
                marginBottom: '0.4rem'
              }}
            >
              {isSignUp ? 'Register Campus Account' : 'Sign In'}
            </motion.h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted, #64748b)', lineHeight: 1.5 }}>
              {isSignUp
                ? 'Create your institutional credentials to monitor facility energy and carbon footprints.'
                : 'Welcome back. Access live institutional decarbonization and facility twin intelligence.'}
            </p>
          </div>

          {/* Animated Error Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.25 }}
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '0.8rem 0.9rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  color: '#b91c1c',
                  fontSize: '0.835rem',
                  boxShadow: '0 2px 6px rgba(185, 28, 28, 0.08)'
                }}
              >
                <AlertCircle size={17} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Info Banner */}
          <AnimatePresence>
            {infoMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -8 }}
                transition={{ duration: 0.25 }}
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '0.8rem 0.9rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  color: '#166534',
                  fontSize: '0.835rem',
                  boxShadow: '0 2px 6px rgba(22, 101, 52, 0.08)'
                }}
              >
                <CheckCircle2 size={17} style={{ flexShrink: 0 }} />
                <span>{infoMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                >
                  {/* Full Name */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>
                      Full Name
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle, #94a3b8)' }}>
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Dr. Elena Vance"
                        required
                        className="form-input"
                        style={{ paddingLeft: '2.6rem', borderRadius: '9px' }}
                      />
                    </div>
                  </div>

                  {/* Role / Position */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>
                      Institutional Role
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle, #94a3b8)' }}>
                        <Briefcase size={16} />
                      </div>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="form-select"
                        style={{ paddingLeft: '2.6rem', borderRadius: '9px' }}
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
                    <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>
                      Department / Division
                    </label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle, #94a3b8)' }}>
                        <Building2 size={16} />
                      </div>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Facilities Management & Climate Office"
                        className="form-input"
                        style={{ paddingLeft: '2.6rem', borderRadius: '9px' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Institutional Email */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main, #1e293b)', marginBottom: '0.35rem' }}>
                Institutional Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle, #94a3b8)' }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@carbontwin.edu"
                  required
                  className="form-input"
                  style={{
                    paddingLeft: '2.6rem',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    border: '1px solid var(--color-border-strong, #cbd5e1)',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: isSignUp ? '1rem' : '1.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => setInfoMessage('For password assistance or campus SSO recovery, please contact your institutional IT administrator.')}
                    style={{ background: 'transparent', border: 'none', color: '#059669', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle, #94a3b8)' }}>
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? 'Minimum 6 characters' : '••••••••'}
                  required
                  className="form-input"
                  style={{
                    paddingLeft: '2.6rem',
                    paddingRight: '2.6rem',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    border: '1px solid var(--color-border-strong, #cbd5e1)',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-subtle, #94a3b8)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Only in Signup) */}
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: '1.25rem' }}
                >
                  <label className="form-label" style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text-main, #1e293b)' }}>
                    Confirm Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-subtle, #94a3b8)' }}>
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      required
                      className="form-input"
                      style={{ paddingLeft: '2.6rem', borderRadius: '10px' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.835rem', color: 'var(--color-text-muted, #475569)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#059669', width: '15px', height: '15px', borderRadius: '4px' }}
                />
                Remember this session for 30 days
              </label>
            </div>

            {/* ===================================================================
                SUBMIT BUTTON: Changed text to "Sign In" with sleek hover micro-animation
               =================================================================== */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.015, y: loading ? 0 : -1 }}
              whileTap={{ scale: loading ? 1 : 0.985 }}
              style={{
                width: '100%',
                padding: '0.82rem',
                fontSize: '0.96rem',
                fontWeight: 700,
                borderRadius: '10px',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                border: 'none',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                color: '#ffffff',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                transition: 'box-shadow 0.2s ease',
                letterSpacing: '-0.01em'
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block' }}
                  >
                    <RefreshCw size={17} />
                  </motion.span>
                  {isSignUp ? 'Creating account...' : 'Authenticating...'}
                </span>
              ) : isSignUp ? (
                <>
                  <span>Create Account</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight size={17} />
                  </motion.span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ArrowRight size={17} />
                  </motion.span>
                </>
              )}
            </motion.button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMessage('');
                setInfoMessage('');
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#059669',
                fontSize: '0.835rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {isSignUp
                ? 'Already registered? Return to Sign In'
                : "Need institutional credentials? Register an account"}
            </motion.button>
          </div>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.1rem 0',
            color: 'var(--color-text-subtle, #94a3b8)',
            fontSize: '0.74rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border-subtle, #e2e8f0)' }} />
            <span style={{ padding: '0 0.85rem' }}>Institutional Federation</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border-subtle, #e2e8f0)' }} />
          </div>

          {/* Single Sign-On Button with Hover Animation */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => handleSSOLogin('SAML / Okta / Azure AD')}
            style={{
              width: '100%',
              padding: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.55rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              marginBottom: '1.5rem',
              borderRadius: '10px',
              border: '1px solid var(--color-border-strong, #cbd5e1)',
              background: 'var(--color-surface-subtle, #f8fafc)',
              color: 'var(--color-text-main, #334155)',
              cursor: 'pointer',
              transition: 'background-color 0.2s, border-color 0.2s'
            }}
          >
            <Building2 size={16} color="#059669" />
            Sign in with Campus SSO (SAML / Okta)
          </motion.button>

          {/* Privacy & Governance Footnote */}
          <div style={{
            background: 'var(--color-surface-subtle, #f8fafc)',
            border: '1px solid var(--color-border-subtle, #e2e8f0)',
            borderRadius: '10px',
            padding: '0.75rem 0.9rem',
            fontSize: '0.74rem',
            color: 'var(--color-text-muted, #64748b)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.55rem',
            lineHeight: 1.45
          }}>
            <ShieldCheck size={16} color="#059669" style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              <strong>Zero-PII Privacy Charter:</strong> Fully compliant with FERPA & institutional governance. Telemetry streams are processed in-memory for aggregate counts only; zero facial recognition or student tracking is stored.
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
