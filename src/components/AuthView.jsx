import React, { useState } from 'react';
import emailjs from '@emailjs/browser';

const AuthView = ({ onLogin, onRegister }) => {
    const [isLogin, setIsLogin] = useState(true);

    // Login Fields
    const [identifier, setIdentifier] = useState(''); // Name or Email
    const [loginPassword, setLoginPassword] = useState('');

    // Registration Fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');

    // OTP State
    const [otpSent, setOtpSent] = useState(false);
    const [otpValue, setOtpValue] = useState('');
    const [expectedOtp, setExpectedOtp] = useState('1234');

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!identifier || !loginPassword) {
            setError('Please enter Name/Email and Password.');
            return;
        }

        const success = onLogin(identifier, loginPassword);
        if (!success) setError('Invalid credentials.');
    };

    const handleRegistrationRequest = (e) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !age || !mobile || !password) {
            setError('All fields are required.');
            return;
        }

        if (mobile.length < 10) {
            setError('Please enter a valid mobile number.');
            return;
        }

        // Generate random 4-digit OTP
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        setExpectedOtp(code);

        // Attempt to send real OTP via EmailJS
        // Note: Replace these placeholder credentials with real EmailJS keys
        const SERVICE_ID = 'service_pumexyk';
        const TEMPLATE_ID = 'template_lnc4157';
        const PUBLIC_KEY = 'IJouOHqylHxLFcbed';

        emailjs.send(SERVICE_ID, TEMPLATE_ID, {
            to_email: email,
            to_name: name,
            otp_code: code
        }, PUBLIC_KEY).then(() => {
            setOtpSent(true);
            setSuccessMsg(`Real OTP sent to ${email}! Please check your inbox.`);
        }).catch((err) => {
            console.error("EmailJS Error:", err);
            const errorMsg = err?.text || err?.message || 'Unknown network error';
            setError(`EmailJS Error: ${errorMsg}`);
            
            // Still fallback to 1234 for testing purposes
            setExpectedOtp('1234');
            setOtpSent(true);
            setSuccessMsg(`Simulated OTP '1234' generated due to EmailJS failure.`);
        });
    };

    const handleVerifyOtpAndRegister = (e) => {
        e.preventDefault();
        setError('');

        if (otpValue !== expectedOtp) {
            setError('Invalid OTP code. Please try again.');
            return;
        }

        const success = onRegister(name, email, age, mobile, password);
        if (!success) {
            setError('A user with this email or mobile number already exists.');
            setOtpSent(false); // Reset so they can change their details
        } else {
            setSuccessMsg('Registration successful!');
        }
    };

    return (
        <div className="auth-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a' }}>
            <div className="glass-card auth-card" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
                <h1 className="hero-logo" style={{ fontSize: '2rem', marginBottom: '1rem', textAlign: 'center' }}>
                    chesspair<span style={{ color: 'var(--primary)' }}>zzz</span>
                </h1>

                <p style={{ textAlign: 'center', opacity: 0.7, marginBottom: '2rem', fontSize: '0.9rem' }}>Secure Offline Tournament Manager</p>

                <h2 className="neon-text" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    {isLogin ? 'Welcome Back' : (otpSent ? 'Verify Mobile' : 'Create Account')}
                </h2>

                {error && <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                {successMsg && <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{successMsg}</div>}

                {isLogin ? (
                    /* LOGIN FORM */
                    <form onSubmit={handleLoginSubmit}>
                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8, fontSize: '0.8rem' }}>Name or Email</label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="John Doe or email@example.com"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8, fontSize: '0.8rem' }}>Password</label>
                            <input
                                type="password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                            />
                        </div>
                        <button className="btn-primary" type="submit" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                            Login to Dashboard
                        </button>
                    </form>
                ) : (
                    /* REGISTRATION FORM (OTP Verification) */
                    otpSent ? (
                        <form onSubmit={handleVerifyOtpAndRegister}>
                            <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                                We've sent a 4-digit code to <strong>{mobile}</strong>.
                            </p>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.8, fontSize: '0.8rem' }}>Enter OTP</label>
                                <input
                                    type="text"
                                    value={otpValue}
                                    onChange={(e) => setOtpValue(e.target.value)}
                                    placeholder="1234"
                                    maxLength="4"
                                    style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '2px solid var(--primary)', background: 'rgba(0,0,0,0.2)', color: '#fff', textAlign: 'center', fontSize: '2rem', letterSpacing: '10px' }}
                                />
                            </div>
                            <button className="btn-primary" type="submit" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                                Verify & Register
                            </button>
                            <button type="button" className="btn-ghost" onClick={() => setOtpSent(false)} style={{ width: '100%', marginTop: '1rem' }}>
                                Edit Mobile Number
                            </button>
                        </form>
                    ) : (
                        /* REGISTRATION FORM (Initial Details) */
                        <form onSubmit={handleRegistrationRequest}>
                            <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', opacity: 0.7 }}>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', opacity: 0.7 }}>Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="john@example.com"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.8rem' }}>
                                <div className="form-group" style={{ flex: '1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', opacity: 0.7 }}>Age</label>
                                    <input
                                        type="number"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        placeholder="e.g. 28"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: '2' }}>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', opacity: 0.7 }}>Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        placeholder="9876543210"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', opacity: 0.7 }}>Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: '#fff' }}
                                />
                            </div>
                            <button className="btn-primary" type="submit" style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}>
                                Send OTP Verification
                            </button>
                        </form>
                    )
                )}

                <p style={{ marginTop: '1.5rem', textAlign: 'center', opacity: 0.7, fontSize: '0.8rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        className="btn-ghost"
                        style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setOtpSent(false);
                            setError('');
                            setSuccessMsg('');
                        }}
                    >
                        {isLogin ? 'Register Here' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthView;
