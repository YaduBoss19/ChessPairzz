import React, { useState, useEffect } from 'react';

const PaymentGatewayView = ({ plan, onPaymentSuccess, onCancel }) => {
    const [step, setStep] = useState('pending'); // pending, success
    const [accessCode, setAccessCode] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const numericPrice = parseFloat(plan.inrPrice.replace(/[^0-9.]/g, ''));
    // Generate a UPI payment link
    const upiId = "ppyadukrishnan202@okhdfcbank"; // Replace with your actual UPI ID
    const upiName = "Yadu Krishnan";
    const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${numericPrice}&cu=INR`;
    
    // Using an external API to generate the QR code image from the UPI link
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}&color=000000&bgcolor=ffffff`;

    const handleVerifyCode = () => {
        // Simple mock verification logic for the unique access code.
        // In a real app with a backend, you'd send this code to your server to verify.
        // Here we just check if it's "YADUPRO2026" or matches a certain pattern like starting with "PRO-"
        if (accessCode.trim().toUpperCase() === 'YADUPRO2026' || accessCode.trim().toUpperCase().startsWith('PRO-')) {
            setErrorMsg('');
            setStep('success');
        } else {
            setErrorMsg('Invalid Access Code. Please check and try again.');
        }
    };

    // Auto-progress to dashboard success after showing the checkmark for 3 seconds
    useEffect(() => {
        if (step === 'success') {
            const timer = setTimeout(() => {
                onPaymentSuccess(plan);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step, plan, onPaymentSuccess]);

    return (
        <div className="payment-gateway-container fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '2rem' }}>
            <div className="glass-card payment-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                <div className="payment-header">
                    <h2 className="neon-text">Secure Activation</h2>
                    <p style={{ opacity: 0.6 }}>Upgrade to {plan.name}</p>
                </div>

                {step === 'pending' && (
                    <>
                        <div className="plan-summary" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', margin: '1.5rem 0', textAlign: 'left' }}>
                            <div className="plan-line" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                                <span>Total Payable:</span>
                                <strong className="neon-text">{plan.inrPrice}</strong>
                            </div>
                            <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: 0 }}>
                                1. Scan the QR code below using GPay, PhonePe, or any UPI app to make the payment. <br/>
                                2. Contact the admin with a screenshot to receive your <strong>Unique Access Code</strong>.
                            </p>
                        </div>

                        <div style={{ background: '#fff', padding: '1rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <img src={qrCodeUrl} alt="UPI Payment QR Code" style={{ display: 'block' }} />
                        </div>
                        
                        <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>UPI ID: <strong>{upiId}</strong></p>

                        <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: 0.8 }}>Enter Unique Access Code:</label>
                            <input 
                                type="text"
                                placeholder="e.g. YADUPRO2026 or PRO-XXXX"
                                value={accessCode}
                                onChange={(e) => setAccessCode(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: '#fff', marginBottom: '1rem' }}
                            />
                            {errorMsg && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>{errorMsg}</p>}
                            
                            <button
                                onClick={handleVerifyCode}
                                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Verify & Activate Plan
                            </button>
                        </div>

                        <button className="btn-ghost" onClick={onCancel} style={{ marginTop: '1rem', width: '100%' }}>
                            Cancel
                        </button>
                    </>
                )}

                {step === 'success' && (
                    <div className="success-visual zoom-in" style={{ padding: '2rem 0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem', color: '#10b981' }}>✅</div>
                        <h3 className="neon-text" style={{ fontSize: '1.8rem' }}>Verification Successful!</h3>
                        <p style={{ marginTop: '1rem', opacity: 0.8 }}>Upgrading your software license now... Please wait.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentGatewayView;
