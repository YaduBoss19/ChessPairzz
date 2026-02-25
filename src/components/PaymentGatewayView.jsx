
import React, { useState, useEffect } from 'react';

const PaymentGatewayView = ({ plan, onPaymentSuccess, onCancel }) => {
    const [step, setStep] = useState('selection'); // selection, initiation, processing, verifying, success
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [mockDetail, setMockDetail] = useState('');
    const [progress, setProgress] = useState(0);

    const paymentMethods = [
        { id: 'gpay', name: 'Google Pay', icon: '📱', placeholder: 'Enter GPay ID (e.g. user@okaxis)' },
        { id: 'bank', name: 'Bank Transfer', icon: '🏦', placeholder: 'Enter Account Number' },
        { id: 'card', name: 'Credit/Debit Card', icon: '💳', placeholder: 'Enter Card Number (XXXX XXXX XXXX XXXX)' }
    ];

    const handleMethodSelect = (method) => {
        setSelectedMethod(method);
        setStep('initiation');
    };

    const handlePayNow = (e) => {
        e.preventDefault();
        handleRazorpayPayment();
    };

    const handleRazorpayPayment = () => {
        const amountInPaise = Math.round(parseFloat(plan.inrPrice.replace(/[^0-9.]/g, '')) * 100);

        const options = {
            key: "YOUR_RAZORPAY_KEY_ID", // Enter your Key ID here
            amount: amountInPaise,
            currency: "INR",
            name: "chesspairzzz",
            description: `${plan.name} Subscription`,
            image: "https://your-logo-url.com/logo.png",
            handler: function (response) {
                console.log("Payment Successful:", response);
                setStep('success');
            },
            prefill: {
                name: "User Name",
                email: "user@example.com",
            },
            theme: {
                color: "#14b8a6"
            },
            modal: {
                ondismiss: function () {
                    setStep('selection');
                }
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    useEffect(() => {
        if (step === 'success') {
            const timer = setTimeout(() => {
                onPaymentSuccess(plan);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [step, plan, onPaymentSuccess]);

    return (
        <div className="payment-gateway-container fade-in">
            <div className="glass-card payment-card">
                <div className="payment-header">
                    <h2 className="neon-text">Secure Checkout</h2>
                    <p style={{ opacity: 0.6 }}>
                        {step === 'selection' && 'Select Payment Method'}
                        {step === 'initiation' && 'Enter Payment Details'}
                        {['processing', 'verifying'].includes(step) && 'Simulated Payment Processor'}
                        {step === 'success' && 'Transaction Complete'}
                    </p>
                </div>

                <div className="plan-summary">
                    <div className="plan-line">
                        <span>Plan:</span>
                        <strong className="neon-text">{plan.name}</strong>
                    </div>
                    <div className="plan-line">
                        <span>Amount:</span>
                        <strong>{plan.price} / {plan.inrPrice}</strong>
                    </div>
                    {selectedMethod && (
                        <div className="plan-line" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--glass-border)' }}>
                            <span>Method:</span>
                            <strong style={{ color: 'var(--primary)' }}>{selectedMethod.name}</strong>
                        </div>
                    )}
                </div>

                <div className="processing-visual">
                    {step === 'selection' && (
                        <div className="method-selection-grid">
                            {paymentMethods.map(method => (
                                <div
                                    key={method.id}
                                    className="method-option-card"
                                    onClick={() => handleMethodSelect(method)}
                                >
                                    <div className="method-icon">{method.icon}</div>
                                    <div className="method-name">{method.name}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 'initiation' && (
                        <div className="initiation-form fade-in">
                            <form onSubmit={handlePayNow}>
                                <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>
                                        {selectedMethod?.name} Details
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={mockDetail}
                                        onChange={(e) => setMockDetail(e.target.value)}
                                        placeholder={selectedMethod?.placeholder}
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="pricing-btn" style={{ width: '100%' }}>
                                    Pay Now
                                </button>
                                <button type="button" className="btn-ghost" onClick={() => setStep('selection')} style={{ width: '100%', marginTop: '1rem' }}>
                                    Back to Selection
                                </button>
                            </form>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="loader-container">
                            <div className="spinner"></div>
                            <p>Authorizing through {selectedMethod?.name}...</p>
                        </div>
                    )}

                    {step === 'verifying' && (
                        <div className="loader-container">
                            <div className="spinner dual"></div>
                            <p>Verifying secure transaction...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="success-visual zoom-in">
                            <div className="checkmark-circle">
                                <div className="checkmark"></div>
                            </div>
                            <h3 className="neon-text">Payment Successful!</h3>
                            <p>Upgrading your account now...</p>
                        </div>
                    )}
                </div>

                {(step === 'processing' || step === 'verifying') && (
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                )}

                {!['processing', 'verifying', 'success'].includes(step) && (
                    <button className="btn-ghost" onClick={onCancel} style={{ marginTop: '2rem', width: '100%' }}>
                        Cancel Order
                    </button>
                )}

                <div className="security-badges" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center', opacity: 0.4, fontSize: '0.7rem' }}>
                    <span>🔒 SSL Encryption</span>
                    <span>✅ PCI Compliant</span>
                    <span>💳 Secure Gateway</span>
                </div>
            </div>
        </div>
    );
};

export default PaymentGatewayView;
