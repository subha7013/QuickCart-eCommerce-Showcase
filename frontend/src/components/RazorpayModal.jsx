import React, { useState } from 'react';
import {
    ShieldCheck, X, Smartphone, CreditCard, Landmark, Banknote,
    CheckCircle2, Loader2, Lock, ArrowRight, Sparkles
} from 'lucide-react';
import { api } from '../utils/api.js';
import { openRazorpayCheckout } from '../utils/razorpay.js';
import { useApp } from '../context/AppContext.jsx';

export default function RazorpayModal() {
    const {
        isRazorpayOpen,
        setIsRazorpayOpen,
        pendingOrderData,
        setPendingOrderData,
        currentUser,
        setCart,
        setAppliedCoupon,
        setCouponDiscount,
        loadOrders,
        fetchProductStock,
        fetchMe,
        setFreeCash,
        setActiveTrackingOrder,
        setCurrentView,
        showToast
    } = useApp();

    const [selectedMethod, setSelectedMethod] = useState('upi'); // upi, card, netbanking, cod
    const [upiApp, setUpiApp] = useState('gpay'); // gpay, phonepe, paytm, custom
    const [customUpiId, setCustomUpiId] = useState('');
    const [cardDetails, setCardDetails] = useState({
        number: '',
        name: currentUser?.email?.split('@')[0] || '',
        expiry: '',
        cvv: ''
    });
    const [selectedBank, setSelectedBank] = useState('HDFC Bank');

    // Simulation states
    const [paymentStep, setPaymentStep] = useState('select'); // select, processing, otp, success
    const [otpCode, setOtpCode] = useState('');

    if (!isRazorpayOpen || !pendingOrderData) return null;

    const amountToPay = pendingOrderData.finalTotal;

    async function handleLaunchOfficialRazorpay() {
        setIsRazorpayOpen(false);
        await openRazorpayCheckout({
            amount: amountToPay,
            orderData: pendingOrderData,
            currentUser,
            onSuccess: async (res) => {
                if (typeof res.freeCash === 'number') {
                    setFreeCash(res.freeCash);
                }
                setPendingOrderData(null);
                setCart([]);
                setAppliedCoupon('');
                setCouponDiscount(0);

                await loadOrders();
                await fetchProductStock();
                await fetchMe();

                setActiveTrackingOrder(res.order);
                setCurrentView('tracking');
                showToast('🎉 Order confirmed! Tracking live package.');
            },
            onError: (msg) => {
                showToast(msg || 'Payment failed ❌');
            },
            onDismiss: () => {
                showToast('Razorpay payment cancelled');
            }
        });
    }

    async function handleSimulatePayment() {
        setPaymentStep('processing');

        // Simulate banking network handshake
        setTimeout(() => {
            if (selectedMethod === 'cod') {
                finalizeOrderPlacement('cod', 'cod_' + Date.now().toString(36));
            } else {
                setPaymentStep('otp');
            }
        }, 1200);
    }

    async function handleVerifyOtpAndComplete() {
        if (!otpCode || otpCode.trim().length < 4) {
            showToast('⚠️ Please enter the OTP');
            return;
        }
        setPaymentStep('processing');
        setTimeout(async () => {
            const simulatedPayId = 'pay_rzp_' + Math.floor(100000000 + Math.random() * 900000000);
            await finalizeOrderPlacement(selectedMethod, simulatedPayId);
        }, 1400);
    }

    async function finalizeOrderPlacement(method, paymentId) {
        try {
            const res = await api('/api/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    items: pendingOrderData.items,
                    subtotal: pendingOrderData.subtotal,
                    couponCode: pendingOrderData.couponCode,
                    couponDiscount: pendingOrderData.couponDiscount,
                    freeCashUsed: pendingOrderData.freeCashUsed || 0,
                    paymentMethod: method,
                    paymentId,
                    upiId: method === 'upi' ? (customUpiId || `${currentUser?.email?.split('@')[0] || 'user'}@${upiApp}`) : '',
                    address: pendingOrderData.address
                })
            });

            if (res.ok && res.order) {
                if (typeof res.freeCash === 'number') {
                    setFreeCash(res.freeCash);
                }
                setPaymentStep('success');
                setTimeout(async () => {
                    setIsRazorpayOpen(false);
                    setPendingOrderData(null);
                    setCart([]);
                    setAppliedCoupon('');
                    setCouponDiscount(0);

                    await loadOrders();
                    await fetchProductStock();
                    await fetchMe();

                    setActiveTrackingOrder(res.order);
                    setCurrentView('tracking');
                    showToast('🎉 Order confirmed! Tracking live shipment.');
                    setPaymentStep('select');
                }, 1200);
            } else {
                setPaymentStep('select');
                showToast(res.msg || 'Payment failed ❌');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setPaymentStep('select');
            showToast('Payment network error ❌');
        }
    }

    return (
        <div className="qc-modal-backdrop">
            <div className="qc-razorpay-modal-container">
                {/* Razorpay Top Header */}
                <div className="qc-rzp-header">
                    <div className="qc-rzp-brand-row">
                        <div className="qc-rzp-logo-badge">
                            <span>RZP</span>
                        </div>
                        <div className="qc-rzp-merchant-info">
                            <h3>QuickCart</h3>
                        </div>
                    </div>

                    <div className="qc-rzp-header-right">
                        <div className="qc-rzp-amount-badge">
                            <small>AMOUNT PAYABLE</small>
                            <strong>₹{amountToPay}</strong>
                        </div>
                        <button
                            className="qc-rzp-close-btn"
                            onClick={() => {
                                if (paymentStep === 'processing') return;
                                setIsRazorpayOpen(false);
                                setPaymentStep('select');
                            }}
                            disabled={paymentStep === 'processing'}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body - Step: Select Method */}
                {paymentStep === 'select' && (
                    <div className="qc-rzp-body">
                        {/* Left Methods Tabs */}
                        <div className="qc-rzp-methods-nav">
                            <button
                                className={`qc-rzp-tab ${selectedMethod === 'upi' ? 'active' : ''}`}
                                onClick={() => setSelectedMethod('upi')}
                            >
                                <Smartphone size={16} />
                                <span>UPI</span>
                            </button>


                        </div>

                        {/* Right Method Details */}
                        <div className="qc-rzp-method-panel">
                            {selectedMethod === 'upi' && (
                                <div className="qc-rzp-upi-view">
                                    <h4>Fast UPI Payment</h4>
                                    <p className="qc-rzp-hint">Pay using any UPI app on your device</p>

                                    <div className="qc-upi-apps-grid">
                                        <div
                                            className={`qc-upi-app-card ${upiApp === 'gpay' ? 'active' : ''}`}
                                            onClick={() => setUpiApp('gpay')}
                                        >
                                            <span className="qc-app-icon">🔵</span>
                                            <span>Google Pay</span>
                                        </div>
                                        <div
                                            className={`qc-upi-app-card ${upiApp === 'phonepe' ? 'active' : ''}`}
                                            onClick={() => setUpiApp('phonepe')}
                                        >
                                            <span className="qc-app-icon">🟣</span>
                                            <span>PhonePe</span>
                                        </div>
                                        <div
                                            className={`qc-upi-app-card ${upiApp === 'paytm' ? 'active' : ''}`}
                                            onClick={() => setUpiApp('paytm')}
                                        >
                                            <span className="qc-app-icon">🔷</span>
                                            <span>Paytm UPI</span>
                                        </div>
                                    </div>

                                    <div className="qc-rzp-or-divider">OR ENTER UPI ID</div>

                                    <div className="qc-rzp-input-group">
                                        <label>Virtual Payment Address (VPA)</label>
                                        <input
                                            type="text"
                                            placeholder="username@okhdfcbank"
                                            value={customUpiId}
                                            onChange={(e) => setCustomUpiId(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Pay Button / Demo Simulator */}
                            <button
                                className="qc-rzp-pay-now-btn"
                                style={{ background: '#475569' }}
                                onClick={handleSimulatePayment}
                            >
                                <Lock size={15} />
                                <span>Pay (₹{amountToPay})</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Body - Step: Processing */}
                {paymentStep === 'processing' && (
                    <div className="qc-rzp-processing-view">
                        <Loader2 size={48} className="qc-spin-loader" />
                        <h4>Communicating with Payment Gateway...</h4>
                        <p>Simulating bank authentication. Please do not refresh.</p>
                    </div>
                )}

                {/* Body - Step: OTP Simulator */}
                {paymentStep === 'otp' && (
                    <div className="qc-rzp-otp-view">
                        <div className="qc-otp-shield-icon">
                            <ShieldCheck size={36} />
                        </div>
                        <h4>Enter One-Time Password (OTP)</h4>
                        <p>An OTP has been sent to your registered mobile number for ₹{amountToPay}.</p>

                        <div className="qc-otp-input-box">
                            <input
                                type="text"
                                className="qc-otp-input-field"
                                placeholder="Enter 6-digit OTP"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                maxLength={6}
                            />
                        </div>

                        <button
                            className="qc-rzp-pay-now-btn"
                            onClick={handleVerifyOtpAndComplete}
                        >
                            <CheckCircle2 size={16} />
                            <span>Verify & Authorize Payment</span>
                        </button>
                    </div>
                )}

                {/* Body - Step: Success */}
                {paymentStep === 'success' && (
                    <div className="qc-rzp-success-view">
                        <div className="qc-success-check-circle">
                            <CheckCircle2 size={54} />
                        </div>
                        <h3>Payment Successful!</h3>
                        <p>Transaction ID: <strong>pay_rzp_{Math.floor(100000000 + Math.random() * 900000000)}</strong></p>
                        <span className="qc-redirecting-text">Redirecting to live package tracking...</span>
                    </div>
                )}
            </div>
        </div>
    );
}
