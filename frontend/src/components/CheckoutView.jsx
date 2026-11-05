import React, { useState } from 'react';
import { ArrowLeft, MapPin, Banknote, Smartphone, CheckCircle } from 'lucide-react';
import { api } from '../utils/api.js';
import { useApp } from '../context/AppContext.jsx';

export default function CheckoutView() {
    const {
        checkoutData,
        currentUser,
        profilePhone,
        setCurrentView,
        showToast,
        loadOrders,
        fetchProductStock,
        setCart,
        setAppliedCoupon,
        setCouponDiscount
    } = useApp();
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [upiId, setUpiId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [shippingAddress, setShippingAddress] = useState({
        name: currentUser?.email ? currentUser.email.split('@')[0] : '',
        line1: '',
        line2: '',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700001',
        country: 'India',
        phone: profilePhone || ''
    });

    if (!checkoutData) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <h3>No order data found</h3>
                <button className="start-shopping-btn" onClick={() => setCurrentView('cart')}>Return to Cart</button>
            </div>
        );
    }

    async function handlePlaceOrder(e) {
        e.preventDefault();
        if (!shippingAddress.line1 || !shippingAddress.city || !shippingAddress.pincode) {
            showToast('Please fill in complete address details');
            return;
        }
        if (paymentMethod === 'upi' && !upiId.includes('@')) {
            showToast('Please enter a valid UPI ID (e.g. user@upi)');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await api('/api/checkout', {
                method: 'POST',
                body: JSON.stringify({
                    items: checkoutData.items,
                    subtotal: checkoutData.subtotal,
                    couponCode: checkoutData.couponCode,
                    couponDiscount: checkoutData.couponDiscount,
                    paymentMethod,
                    upiId: paymentMethod === 'upi' ? upiId : '',
                    address: {
                        name: shippingAddress.name || currentUser?.email?.split('@')[0] || 'Valued Customer',
                        line1: shippingAddress.line1,
                        line2: shippingAddress.line2 || '',
                        city: shippingAddress.city,
                        state: shippingAddress.state,
                        pincode: shippingAddress.pincode,
                        country: shippingAddress.country
                    }
                })
            });

            setIsProcessing(false);
            if (res.ok) {
                showToast('🎉 Order placed successfully!');
                setCart([]);
                setAppliedCoupon('');
                setCouponDiscount(0);
                await loadOrders();
                await fetchProductStock();
                setCurrentView('profile');
            } else {
                showToast(res.msg || 'Failed to place order ❌');
            }
        } catch (err) {
            setIsProcessing(false);
            showToast('Network error while placing order ❌');
        }
    }

    return (
        <section id="checkoutPage" className="checkout-page-section">
            <div className="page-header-row">
                <button className="back-link-btn" onClick={() => setCurrentView('cart')}>
                    <ArrowLeft size={18} /> Back to Cart
                </button>
                <h2>📦 Order Checkout</h2>
            </div>

            <div className="checkout-grid">
                {/* Shipping & Payment Form Column */}
                <div className="checkout-form-column">
                    <form onSubmit={handlePlaceOrder}>
                        {/* Address Form Card */}
                        <div className="checkout-card">
                            <h3 className="card-title"><MapPin size={20} /> Shipping Address</h3>
                            <div className="form-grid">
                                <div className="form-group full-width">
                                    <label>Recipient Full Name</label>
                                    <input
                                        type="text"
                                        value={shippingAddress.name}
                                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Flat, House No, Building / Street</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 12/B Park Street, Flat 4A"
                                        value={shippingAddress.line1}
                                        onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        value={shippingAddress.city}
                                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>PIN Code</label>
                                    <input
                                        type="text"
                                        value={shippingAddress.pincode}
                                        onChange={(e) => setShippingAddress({ ...shippingAddress, pincode: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Payment Method Selector Card */}
                        <div className="checkout-card margin-top">
                            <h3 className="card-title"><Banknote size={20} /> Payment Option</h3>
                            <div className="payment-options-grid">
                                <label className={`payment-option-card ${paymentMethod === 'cod' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="cod"
                                        checked={paymentMethod === 'cod'}
                                        onChange={() => setPaymentMethod('cod')}
                                    />
                                    <div className="option-content">
                                        <Banknote size={24} className="option-icon" />
                                        <div>
                                            <strong>Cash on Delivery (COD)</strong>
                                            <p>Pay cash or UPI upon package arrival</p>
                                        </div>
                                    </div>
                                </label>

                                <label className={`payment-option-card ${paymentMethod === 'upi' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="upi"
                                        checked={paymentMethod === 'upi'}
                                        onChange={() => setPaymentMethod('upi')}
                                    />
                                    <div className="option-content">
                                        <Smartphone size={24} className="option-icon" />
                                        <div>
                                            <strong>Instant UPI Payment</strong>
                                            <p>Pay via Google Pay, PhonePe, Paytm</p>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {paymentMethod === 'upi' && (
                                <div className="upi-input-box">
                                    <label>Enter Virtual Payment Address (VPA / UPI ID)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. mobileNumber@upi / username@okaxis"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        <button type="submit" className="place-order-submit-btn" disabled={isProcessing}>
                            {isProcessing ? 'Processing Order…' : `Confirm & Place Order (₹${checkoutData.finalTotal})`}
                        </button>
                    </form>
                </div>

                {/* Summary Sidebar Column */}
                <div className="checkout-summary-column">
                    <div className="summary-box-card sticky">
                        <h3 className="card-title">Order Items ({checkoutData.items.length})</h3>
                        <div className="checkout-items-preview-list">
                            {checkoutData.items.map((item) => (
                                <div key={item.id} className="preview-item-row">
                                    <span>{item.name} <strong>x{item.qty}</strong></span>
                                    <span>₹{item.price * item.qty}</span>
                                </div>
                            ))}
                        </div>

                        <hr className="summary-divider" />

                        <div className="summary-line">
                            <span>Subtotal</span>
                            <span>₹{checkoutData.subtotal}</span>
                        </div>
                        {checkoutData.couponDiscount > 0 && (
                            <div className="summary-line discount-line">
                                <span>Coupon ({checkoutData.couponCode})</span>
                                <span>-₹{checkoutData.couponDiscount}</span>
                            </div>
                        )}
                        <div className="summary-line">
                            <span>Delivery</span>
                            <span>{checkoutData.deliveryFee === 0 ? <strong style={{ color: '#16a34a' }}>FREE</strong> : `₹${checkoutData.deliveryFee}`}</span>
                        </div>

                        <hr className="summary-divider" />

                        <div className="summary-line total-line">
                            <strong>Grand Total</strong>
                            <strong className="grand-total-price">₹{checkoutData.finalTotal}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
