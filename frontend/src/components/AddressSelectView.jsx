import React, { useState } from 'react';
import {
    ArrowLeft, MapPin, Plus, CheckCircle2, Trash2, Home, Briefcase,
    Building2, ShieldCheck, Lock, AlertCircle, Sparkles, Phone, User,
    Zap, Navigation, Clock, CreditCard, Banknote
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { calculateDeliveryFee, formatProductImage } from '../utils/helpers.js';
import { openRazorpayCheckout } from '../utils/razorpay.js';
import { api } from '../utils/api.js';

export default function AddressSelectView() {
    const {
        cart,
        addresses,
        selectedAddressId,
        setSelectedAddressId,
        addAddress,
        removeAddress,
        currentUser,
        profilePhone,
        setCurrentView,
        showToast,
        couponDiscount,
        appliedCoupon,
        freeCash,
        useFreeCash,
        setIsRazorpayOpen,
        setPendingOrderData,
        setCart,
        setAppliedCoupon,
        setCouponDiscount,
        setFreeCash,
        loadOrders,
        fetchProductStock,
        fetchMe,
        setActiveTrackingOrder
    } = useApp();

    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay'); // 'razorpay' | 'cod'
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(addresses.length === 0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        label: 'Home',
        name: currentUser?.email ? currentUser.email.split('@')[0] : '',
        phone: profilePhone || '',
        line1: '',
        line2: '',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700091',
        isDefault: addresses.length === 0
    });

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryFee = calculateDeliveryFee(subtotal);
    const maxFreeCashUsable = Math.min(freeCash, Math.max(0, subtotal - couponDiscount + deliveryFee));
    const effectiveFreeCashDiscount = useFreeCash ? maxFreeCashUsable : 0;
    const finalTotal = Math.max(0, subtotal - couponDiscount + deliveryFee - effectiveFreeCashDiscount);

    const selectedAddress = addresses.find(a => a.id === selectedAddressId) || (addresses.length > 0 ? addresses[0] : null);

    async function handleAddAddressSubmit(e) {
        e.preventDefault();
        if (!form.name.trim() || !form.line1.trim() || !form.city.trim() || !form.pincode.trim()) {
            showToast('⚠️ Please fill in all required address fields');
            return;
        }

        if (form.phone && form.phone.replace(/\D/g, '').length < 10) {
            showToast('⚠️ Please enter a valid 10-digit mobile number');
            return;
        }

        setIsSubmitting(true);
        try {
            const added = await addAddress(form);
            setIsSubmitting(false);
            setIsAddingNew(false);
            if (added && added.id) {
                setSelectedAddressId(added.id);
            }
            // Reset form
            setForm({
                label: 'Home',
                name: currentUser?.email ? currentUser.email.split('@')[0] : '',
                phone: profilePhone || '',
                line1: '',
                line2: '',
                city: 'Kolkata',
                state: 'West Bengal',
                pincode: '700091',
                isDefault: false
            });
        } catch (err) {
            setIsSubmitting(false);
            showToast('Failed to save address ❌');
        }
    }

    function handleAutoFillKolkata() {
        setForm(prev => ({
            ...prev,
            city: 'Kolkata',
            state: 'West Bengal',
            pincode: '700091',
            line1: prev.line1 || 'Flat 4B, Greenfield Heights, Tower B',
            line2: prev.line2 || 'Block EP & GP, Sector V, Salt Lake'
        }));
        showToast('📍 Auto-filled Kolkata Sector V (700091)');
    }

    async function handleOrderSuccess(res) {
        if (res && res.ok && res.order) {
            if (typeof res.freeCash === 'number') {
                setFreeCash(res.freeCash);
            }
            setCart([]);
            setAppliedCoupon('');
            setCouponDiscount(0);

            await loadOrders();
            await fetchProductStock();
            await fetchMe();

            setActiveTrackingOrder(res.order);
            setCurrentView('tracking');
            showToast('🎉 Order placed successfully! Tracking package live.');
        } else {
            showToast(res?.msg || 'Failed to place order ❌');
        }
    }

    async function handleProceedToPayment() {
        if (cart.length === 0) {
            showToast('Your cart is empty');
            setCurrentView('home');
            return;
        }

        if (!selectedAddress || !selectedAddress.line1) {
            showToast('⚠️ Please select or add a delivery address to continue');
            setIsAddingNew(true);
            return;
        }

        const orderData = {
            items: cart,
            subtotal,
            couponCode: appliedCoupon,
            couponDiscount,
            freeCashUsed: effectiveFreeCashDiscount,
            deliveryFee,
            finalTotal,
            address: selectedAddress
        };

        // If entire amount was covered by FreeCash / credits
        if (finalTotal === 0) {
            setIsProcessingPayment(true);
            try {
                const res = await api('/api/checkout', {
                    method: 'POST',
                    body: JSON.stringify({
                        items: cart,
                        subtotal,
                        couponCode: appliedCoupon,
                        couponDiscount,
                        freeCashUsed: effectiveFreeCashDiscount,
                        paymentMethod: 'wallet',
                        paymentId: 'pay_freecash_' + Date.now().toString(36),
                        address: selectedAddress
                    })
                });
                await handleOrderSuccess(res);
            } catch (err) {
                showToast('Failed to place order ❌');
            } finally {
                setIsProcessingPayment(false);
            }
            return;
        }

        // Cash on delivery
        if (selectedPaymentMethod === 'cod') {
            setIsProcessingPayment(true);
            try {
                const res = await api('/api/checkout', {
                    method: 'POST',
                    body: JSON.stringify({
                        items: cart,
                        subtotal,
                        couponCode: appliedCoupon,
                        couponDiscount,
                        freeCashUsed: effectiveFreeCashDiscount,
                        paymentMethod: 'cod',
                        paymentId: 'cod_' + Date.now().toString(36),
                        address: selectedAddress
                    })
                });
                await handleOrderSuccess(res);
            } catch (err) {
                showToast('COD Order failed ❌');
            } finally {
                setIsProcessingPayment(false);
            }
            return;
        }

        // UPI (Direct Simulator & QR)
        if (selectedPaymentMethod === 'upi') {
            setPendingOrderData({
                items: cart,
                subtotal,
                couponCode: appliedCoupon,
                couponDiscount,
                freeCashUsed: effectiveFreeCashDiscount,
                deliveryFee,
                finalTotal,
                address: selectedAddress
            });
            setIsRazorpayOpen(true);
            return;
        }

        // Razorpay Online Payment Gateway (Cards, NetBanking, Wallets)
        setIsProcessingPayment(true);
        try {
            await openRazorpayCheckout({
                amount: finalTotal,
                orderData,
                currentUser,
                onSuccess: async (res) => {
                    setIsProcessingPayment(false);
                    await handleOrderSuccess(res);
                },
                onError: (errMsg) => {
                    setIsProcessingPayment(false);
                    showToast(errMsg || 'Payment failed ❌');
                },
                onDismiss: () => {
                    setIsProcessingPayment(false);
                    showToast('Razorpay checkout window closed');
                }
            });
        } catch (err) {
            setIsProcessingPayment(false);
            console.error('Razorpay launch error:', err);
            showToast('Could not launch Razorpay gateway ❌');
        }
    }

    return (
        <section className="qc-address-select-page">
            {/* Checkout Stepper Bar */}
            <div className="qc-checkout-stepper-wrap">
                <button className="qc-back-btn" onClick={() => setCurrentView('cart')}>
                    <ArrowLeft size={16} /> <span>Back to Cart</span>
                </button>

                <div className="qc-checkout-stepper">
                    <div className="qc-step done">
                        <span className="qc-step-num">✓</span>
                        <span className="qc-step-text">Cart</span>
                    </div>
                    <div className="qc-step-line done"></div>
                    <div className="qc-step active">
                        <span className="qc-step-num">2</span>
                        <span className="qc-step-text">Delivery Address</span>
                    </div>
                    <div className="qc-step-line"></div>
                    <div className="qc-step">
                        <span className="qc-step-num">3</span>
                        <span className="qc-step-text">Payment</span>
                    </div>
                </div>
            </div>

            <div className="qc-address-page-layout">
                {/* Left Column: Address Selection & Form */}
                <div className="qc-address-left-col">
                    <div className="qc-address-header-box">
                        <div className="qc-address-header-title">
                            <MapPin size={22} className="qc-header-pin-icon" />
                            <div>
                                <h2>Select Delivery Address</h2>
                                <p>Choose where you want your order delivered with 10-minute lightning delivery</p>
                            </div>
                        </div>

                        {!isAddingNew && (
                            <button
                                className="qc-add-new-addr-trigger-btn"
                                onClick={() => setIsAddingNew(true)}
                            >
                                <Plus size={16} />
                                <span>Add New Address</span>
                            </button>
                        )}
                    </div>

                    {/* Alert if no addresses exist */}
                    {addresses.length === 0 && !isAddingNew && (
                        <div className="qc-no-address-banner">
                            <AlertCircle size={24} className="qc-warn-icon" />
                            <div>
                                <h4>No Delivery Address Found</h4>
                                <p>You have deleted or don't have any saved address. Please add an address below to place your order.</p>
                            </div>
                            <button
                                className="qc-cta-button small"
                                onClick={() => setIsAddingNew(true)}
                            >
                                + Add Address Now
                            </button>
                        </div>
                    )}

                    {/* Add New Address Form Modal/Card */}
                    {isAddingNew && (
                        <div className="qc-new-address-card">
                            <div className="qc-card-sub-header">
                                <div className="qc-card-sub-title">
                                    <Plus size={18} className="text-primary" />
                                    <h3>Add New Delivery Address</h3>
                                </div>
                                <div className="qc-card-sub-actions">
                                    <button
                                        type="button"
                                        className="qc-autofill-btn"
                                        onClick={handleAutoFillKolkata}
                                        title="Auto-fill Kolkata Sector V 700091 defaults"
                                    >
                                        <Navigation size={13} />
                                        <span>Auto-fill Current Location</span>
                                    </button>
                                    {addresses.length > 0 && (
                                        <button
                                            type="button"
                                            className="qc-cancel-sub-btn"
                                            onClick={() => setIsAddingNew(false)}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={handleAddAddressSubmit} className="qc-address-entry-form">
                                {/* Address Type Selector */}
                                <div className="qc-addr-type-pills">
                                    <label className="qc-field-label">Address Type</label>
                                    <div className="qc-pills-row">
                                        <button
                                            type="button"
                                            className={`qc-pill-btn ${form.label === 'Home' ? 'active' : ''}`}
                                            onClick={() => setForm({ ...form, label: 'Home' })}
                                        >
                                            <Home size={15} /> <span>Home (All Day Delivery)</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`qc-pill-btn ${form.label === 'Work' ? 'active' : ''}`}
                                            onClick={() => setForm({ ...form, label: 'Work' })}
                                        >
                                            <Briefcase size={15} /> <span>Work / Office (10 AM - 6 PM)</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`qc-pill-btn ${form.label === 'Other' ? 'active' : ''}`}
                                            onClick={() => setForm({ ...form, label: 'Other' })}
                                        >
                                            <Building2 size={15} /> <span>Other</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="qc-form-row">
                                    <div className="qc-form-group">
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Rahul Sharma"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="qc-form-group">
                                        <label>10-Digit Mobile Number *</label>
                                        <input
                                            type="tel"
                                            placeholder="e.g. 9876543210"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="qc-form-group">
                                    <label>Flat, House No, Building, Apartment *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Flat 302, Greenfield Residency, Tower B"
                                        value={form.line1}
                                        onChange={(e) => setForm({ ...form, line1: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="qc-form-row">
                                    <div className="qc-form-group">
                                        <label>Area, Street, Sector / Village</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Salt Lake Sector V, Near Tech Hub"
                                            value={form.line2}
                                            onChange={(e) => setForm({ ...form, line2: e.target.value })}
                                        />
                                    </div>
                                    <div className="qc-form-group">
                                        <label>PIN Code *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 700091"
                                            maxLength={6}
                                            value={form.pincode}
                                            onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="qc-form-row">
                                    <div className="qc-form-group">
                                        <label>Town / City *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Kolkata"
                                            value={form.city}
                                            onChange={(e) => setForm({ ...form, city: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="qc-form-group">
                                        <label>State *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. West Bengal"
                                            value={form.state}
                                            onChange={(e) => setForm({ ...form, state: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="qc-form-checkbox-row">
                                    <label className="qc-checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={form.isDefault}
                                            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                                        />
                                        <span>Use this as my default delivery address</span>
                                    </label>
                                </div>

                                <div className="qc-addr-form-actions">
                                    <button
                                        type="submit"
                                        className="qc-cta-button"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Saving Address…' : 'Save & Deliver to this Address'}
                                    </button>
                                    {addresses.length > 0 && (
                                        <button
                                            type="button"
                                            className="qc-order-action-btn secondary"
                                            onClick={() => setIsAddingNew(false)}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Saved Addresses List */}
                    <div className="qc-saved-addresses-grid">
                        {addresses.map((addr) => {
                            const isSelected = selectedAddressId === addr.id;
                            return (
                                <div
                                    key={addr.id}
                                    className={`qc-address-selection-card ${isSelected ? 'selected' : ''}`}
                                    onClick={() => setSelectedAddressId(addr.id)}
                                >
                                    <div className="qc-addr-card-top">
                                        <div className="qc-addr-top-left">
                                            <div className="qc-radio-indicator">
                                                <input
                                                    type="radio"
                                                    name="selectedAddress"
                                                    checked={isSelected}
                                                    onChange={() => setSelectedAddressId(addr.id)}
                                                />
                                                <span className="qc-radio-circle"></span>
                                            </div>

                                            <div className="qc-addr-meta-top">
                                                <span className={`qc-addr-tag-pill ${String(addr.label || 'Home').toLowerCase()}`}>
                                                    {addr.label === 'Work' ? <><Briefcase size={12} /> Work</> : (addr.label === 'Other' ? <><Building2 size={12} /> Other</> : <><Home size={12} /> Home</>)}
                                                </span>
                                                {addr.isDefault && (
                                                    <span className="qc-default-badge">DEFAULT</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="qc-addr-top-right">
                                            <span className="qc-delivery-speed-pill">
                                                <Zap size={11} /> 10-Min Rush
                                            </span>
                                            <button
                                                type="button"
                                                className="qc-addr-delete-btn"
                                                title="Delete this address"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Delete delivery address "${addr.line1}"?`)) {
                                                        removeAddress(addr.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="qc-addr-card-body">
                                        <div className="qc-recipient-row">
                                            <h4 className="qc-recipient-name">
                                                <User size={15} className="qc-text-muted-icon" />
                                                <span>{addr.name || 'Valued Customer'}</span>
                                            </h4>
                                            {addr.phone && (
                                                <span className="qc-addr-phone">
                                                    <Phone size={12} className="qc-text-muted-icon" />
                                                    <span>{addr.phone}</span>
                                                </span>
                                            )}
                                        </div>
                                        <p className="qc-addr-street-line">{addr.line1}</p>
                                        {addr.line2 && <p className="qc-addr-sub-line">{addr.line2}</p>}
                                        <div className="qc-addr-city-pin-row">
                                            <MapPin size={13} className="qc-text-muted-icon" />
                                            <span><strong>{addr.city}</strong>, {addr.state} • <strong className="qc-pincode-highlight">PIN: {addr.pincode}</strong></span>
                                        </div>
                                    </div>

                                    {isSelected ? (
                                        <div className="qc-addr-card-selected-bar">
                                            <CheckCircle2 size={15} />
                                            <span>Delivering to this Address</span>
                                        </div>
                                    ) : (
                                        <div className="qc-addr-select-cta-row">
                                            <span>Click to deliver here</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Order Summary & Proceed to Payment */}
                <div className="qc-address-right-col">
                    <div className="qc-address-summary-card">
                        <h3>Order Summary ({cart.length} {cart.length === 1 ? 'item' : 'items'})</h3>

                        {/* Cart items preview */}
                        <div className="qc-summary-items-list">
                            {cart.map((item) => (
                                <div key={item.id} className="qc-summary-item-row">
                                    <img
                                        src={formatProductImage(item.image)}
                                        alt={item.name}
                                        onError={(e) => {
                                            if (!e.target.dataset.tried) {
                                                e.target.dataset.tried = 'true';
                                                e.target.src = '/assets/banana.jpg';
                                            }
                                        }}
                                    />
                                    <div className="qc-sum-item-info">
                                        <p className="qc-sum-name">{item.name}</p>
                                        <span className="qc-sum-qty">Qty: <strong>{item.qty}</strong> × ₹{item.price}</span>
                                    </div>
                                    <span className="qc-sum-price">₹{item.price * item.qty}</span>
                                </div>
                            ))}
                        </div>

                        <div className="qc-bill-divider"></div>

                        {/* Price Calculations */}
                        <div className="qc-bill-rows">
                            <div className="qc-bill-row">
                                <span>Item Total</span>
                                <span>₹{subtotal}</span>
                            </div>

                            {couponDiscount > 0 && (
                                <div className="qc-bill-row qc-discount-row">
                                    <span>Coupon Discount ({appliedCoupon})</span>
                                    <span>-₹{couponDiscount}</span>
                                </div>
                            )}

                            {effectiveFreeCashDiscount > 0 && (
                                <div className="qc-bill-row qc-freecash-row">
                                    <span>QuickCard Credits Applied</span>
                                    <span>-₹{effectiveFreeCashDiscount}</span>
                                </div>
                            )}

                            <div className="qc-bill-row">
                                <span>Delivery Partner Fee</span>
                                <span>
                                    {deliveryFee === 0 ? (
                                        <strong className="qc-free-tag">FREE</strong>
                                    ) : (
                                        `₹${deliveryFee}`
                                    )}
                                </span>
                            </div>

                            <div className="qc-bill-divider"></div>

                            <div className="qc-bill-total-row">
                                <strong>Total Amount</strong>
                                <strong className="qc-final-total-amt">₹{finalTotal}</strong>
                            </div>
                        </div>

                        {/* Selected address pill in summary */}
                        <div className="qc-chosen-address-summary">
                            <MapPin size={16} className="qc-chosen-pin" />
                            <div>
                                {selectedAddress ? (
                                    <>
                                        <span className="qc-chosen-label">Delivering to {selectedAddress.label || 'Home'}:</span>
                                        <p className="qc-chosen-text">
                                            {selectedAddress.name} • {selectedAddress.line1}, {selectedAddress.city} - {selectedAddress.pincode}
                                        </p>
                                    </>
                                ) : (
                                    <span className="qc-chosen-warning">⚠️ No address selected</span>
                                )}
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="qc-checkout-payment-methods">
                            <h4>Select Payment Method</h4>
                            <div className="qc-pay-method-options">
                                <label className={`qc-pay-method-card ${selectedPaymentMethod === 'razorpay' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="checkoutPayMethod"
                                        value="razorpay"
                                        checked={selectedPaymentMethod === 'razorpay'}
                                        onChange={() => setSelectedPaymentMethod('razorpay')}
                                    />
                                    <div className="qc-pay-method-info">
                                        <div className="qc-pay-method-title">
                                            <span>💳 Pay Online (Cards & NetBanking)</span>
                                            <span className="qc-pay-recommended-badge">⚡ Instant & Fast</span>
                                        </div>
                                        <p className="qc-pay-method-sub">Credit/Debit Cards, NetBanking & Wallets</p>
                                    </div>
                                </label>

                                <label className={`qc-pay-method-card ${selectedPaymentMethod === 'upi' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="checkoutPayMethod"
                                        value="upi"
                                        checked={selectedPaymentMethod === 'upi'}
                                        onChange={() => setSelectedPaymentMethod('upi')}
                                    />
                                    <div className="qc-pay-method-info">
                                        <div className="qc-pay-method-title">
                                            <span>📱 UPI & QR Code</span>
                                            <span className="qc-pay-recommended-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>GPay • PhonePe • Paytm</span>
                                        </div>
                                        <p className="qc-pay-method-sub">Instant zero-fee payment via any UPI App or QR code</p>
                                    </div>
                                </label>

                                <label className={`qc-pay-method-card ${selectedPaymentMethod === 'cod' ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="checkoutPayMethod"
                                        value="cod"
                                        checked={selectedPaymentMethod === 'cod'}
                                        onChange={() => setSelectedPaymentMethod('cod')}
                                    />
                                    <div className="qc-pay-method-info">
                                        <div className="qc-pay-method-title">
                                            <span>💵 Cash on Delivery</span>
                                        </div>
                                        <p className="qc-pay-method-sub">Pay cash or scan QR when delivery partner arrives</p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Deliver Here & Proceed to Payment Button */}
                        <button
                            className={`qc-checkout-cta-btn ${!selectedAddress || isProcessingPayment ? 'disabled' : ''}`}
                            onClick={handleProceedToPayment}
                            disabled={!selectedAddress || isProcessingPayment}
                        >
                            <Lock size={16} />
                            <span>
                                {isProcessingPayment
                                    ? 'Opening Payment Gateway…'
                                    : !selectedAddress
                                    ? 'Please Select or Add Address'
                                    : selectedPaymentMethod === 'upi'
                                    ? `Pay ₹${finalTotal} via UPI & QR`
                                    : selectedPaymentMethod === 'razorpay'
                                    ? `Pay ₹${finalTotal} Online (Instant & Fast)`
                                    : `Place Cash on Delivery Order (₹${finalTotal})`}
                            </span>
                        </button>

                        <div className="qc-checkout-trust-footer">
                            <ShieldCheck size={14} />
                            <span>100% Safe Payments • UPI, Cards, Netbanking & COD</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
