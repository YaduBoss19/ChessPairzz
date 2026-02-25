
import React, { useState } from 'react';

const AuthView = ({ onLogin, onRegister }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (isLogin) {
            const success = onLogin(email, password);
            if (!success) setError('Invalid email or password');
        } else {
            if (!name || !email || !password) {
                setError('All fields are required');
                return;
            }
            const success = onRegister(name, email, password);
            if (!success) setError('User already exists');
        }
    };

    return (
        <div className="auth-container fade-in">
            <div className="glass-card auth-card">
                <h1 className="hero-logo" style={{ fontSize: '2rem', marginBottom: '2rem' }}>
                    chesspair<span>zzz</span>
                </h1>

                <h2 className="neon-text" style={{ marginBottom: '1.5rem' }}>
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                </h2>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                            />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="error-message" style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</div>}

                    <button type="submit" style={{ width: '100%', marginTop: '1rem' }}>
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', opacity: 0.7, fontSize: '0.9rem' }}>
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        className="btn-ghost"
                        style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem' }}
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Sign Up' : 'Log In'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default AuthView;
