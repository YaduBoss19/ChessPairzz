import React, { useState, useEffect } from 'react';

const PaymentGatewayView = ({ plan, onPaymentSuccess, onCancel }) => {
    const [step, setStep] = useState('pending'); // pending, success, failed

    const handleRazorpayPayment = () => {
        // Convert the string price (e.g. ₹4,999) to an integer paise (cents) value
        const numericPrice = parseFloat(plan.inrPrice.replace(/[^0-9.]/g, ''));
        const amountInPaise = Math.round(numericPrice * 100);

        const options = {
            // ⚠️ IMPORTANT: Replace this with your actual Razorpay Key ID
            // You can get this from your Razorpay Dashboard -> Account & Settings -> API Keys
            key: "rzp_test_ST2PK9P2kI0LLH",
            amount: amountInPaise,
            currency: "INR",
            name: "ChessPairzzz Pro Software",
            description: `Upgrading to ${plan.name} Subscription`,
            image: "https://your-logo-url.com/logo.png",
            handler: function (response) {
                console.log("Payment Successful. ID:", response.razorpay_payment_id);
                setStep('success');
            },
            prefill: {
                name: "Customer Name",
                email: "customer@chessclub.com",
            },
            theme: {
                color: "#14b8a6"
            },
            modal: {
                ondismiss: function () {
                    console.log("Payment popup closed by user");
                }
            }
        };

        // Open Razorpay Checkout standard popup
        if (window.Razorpay) {
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                console.error("Payment Failed:", response.error.description);
                alert("Payment failed! " + response.error.description);
            });
            rzp.open();
        } else {
            alert("Razorpay SDK not loaded. Please ensure you are connected to the internet.");
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
                    <h2 className="neon-text">Secure Checkout</h2>
                    <p style={{ opacity: 0.6 }}>Review your subscription</p>
                </div>

                <div className="plan-summary" style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', margin: '2rem 0', textAlign: 'left' }}>
                    <div className="plan-line" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.2rem' }}>
                        <span>Plan Selected:</span>
                        <strong className="neon-text">{plan.name}</strong>
                    </div>
                    <div className="plan-line" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
                        <span>Total Payable:</span>
                        <strong>{plan.inrPrice}</strong>
                    </div>
                </div>

                {step === 'pending' && (
                    <>
                        <button
                            onClick={handleRazorpayPayment}
                            style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Pay Securely with Razorpay
                        </button>
                        <button className="btn-ghost" onClick={onCancel} style={{ marginTop: '1rem', width: '100%' }}>
                            Cancel
                        </button>
                    </>
                )}

                {step === 'success' && (
                    <div className="success-visual zoom-in" style={{ padding: '2rem 0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem', color: '#10b981' }}>✅</div>
                        <h3 className="neon-text" style={{ fontSize: '1.8rem' }}>Payment Successful!</h3>
                        <p style={{ marginTop: '1rem', opacity: 0.8 }}>Upgrading your software license now... Please wait.</p>
                    </div>
                )}

                <div className="security-badges" style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', justifyContent: 'center', opacity: 0.6, fontSize: '0.8rem' }}>
                    <span>📱 GPay / UPI Supported</span>
                    <span>🔒 256-bit SSL</span>
                    <span>✅ PCI-DSS Compliant</span>
                </div>
            </div>
        </div>
    );
};

export default PaymentGatewayView;
