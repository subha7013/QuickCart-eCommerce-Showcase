import React, { useState } from 'react';
import {
    ShoppingBag, ArrowLeft, Trash2, Plus, Minus, Tag, Sparkles,
    AlertCircle, MapPin, CheckCircle2, ChevronRight, Gift, Lock,
    Check, Percent, ShieldCheck
} from 'lucide-react';
import { calculateDeliveryFee } from '../utils/helpers.js';
import { useApp } from '../context/AppContext.jsx';

export default function CartView() {
    const {
        cart,
        increaseCart,
        decreaseCart,
        removeFromCart,
        clearCart,
        couponCode,
        setCouponCode,
        appliedCoupon,
        couponDiscount,
        applyCoupon,
        removeCoupon,
        couponRecommendations,
        getStock,
        getLimitPerOrder,
        setCurrentView,
        showToast,
        currentUser,
        freeCash,
        useFreeCash,
        setUseFreeCash,
        addresses,
        selectedAddressId,
        setSelectedAddressId,
        addAddress,
        setIsRazorpayOpen,
        setPendingOrderData
    } = useApp();

    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [newAddrForm, setNewAddrForm] = useState({
        label: 'Home',
        name: currentUser?.email?.split('@')[0] || 'Customer',
        phone: '',
        line1: '',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700091'
    });

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const deliveryFee = calculateDeliveryFee(subtotal);

    // Calculate free cash to apply if checked
    const maxFreeCashUsable = Math.min(freeCash, Math.max(0, subtotal - couponDiscount + deliveryFee));
    const effectiveFreeCashDiscount = useFreeCash ? maxFreeCashUsable : 0;

    const finalTotal = Math.max(0, subtotal - couponDiscount + deliveryFee - effectiveFreeCashDiscount);

    // Current selected address
    const currentAddress = addresses.find(a => a.id === selectedAddressId) || (addresses.length > 0 ? addresses[0] : null);

    function handleProceedToPayment() {
        if (cart.length === 0) {
            showToast('Your cart is empty');
            return;
        }
        if (!currentUser) {
            showToast('Please sign in to place an order');
            setCurrentView('profile');
            return;
        }
        if (!currentAddress || !currentAddress.line1) {
            showToast('⚠️ Please add a delivery address to place your order');
            setCurrentView('select-address');
            return;
        }

        // Navigate to dedicated address selection / checkout page
        setCurrentView('select-address');
    }

    async function handleQuickAddAddress(e) {
        e.preventDefault();
        if (!newAddrForm.line1 || !newAddrForm.city || !newAddrForm.pincode) {
            showToast('Fill in street address, city, and pincode');
            return;
        }
        await addAddress(newAddrForm);
        setIsAddressModalOpen(false);
    }

    return (
        <section id="cartPage" className="qc-cart-page-section">
            {/* Top Back Row */}
            <div className="qc-cart-top-bar">
                <button className="qc-back-btn" onClick={() => setCurrentView('home')}>
                    <ArrowLeft size={16} /> <span>Continue Shopping</span>
                </button>
                <h2>🛒 Shopping Cart ({cart.length} {cart.length === 1 ? 'Item' : 'Items'})</h2>
            </div>

            {cart.length === 0 ? (
                <div className="qc-empty-cart-card">
                    <div className="qc-empty-cart-icon">🛍️</div>
                    <h3>Your cart is empty</h3>
                    <p>Explore farm-fresh groceries, fast chargers, earbuds and trending fashion.</p>
                    <button className="qc-cta-button" onClick={() => setCurrentView('home')}>
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div className="qc-cart-layout-grid">
                    {/* Left Column: Delivery Address Card & Cart Items */}
                    <div className="qc-cart-left-col">
                        {/* 1. Address Selection Box */}
                        <div className={`qc-cart-address-box ${!currentAddress ? 'empty-addr' : ''}`}>
                            <div className="qc-cart-address-header">
                                <div className="qc-addr-title-row">
                                    <MapPin size={18} className={`qc-addr-pin-icon ${!currentAddress ? 'warn' : ''}`} />
                                    <div>
                                        {currentAddress ? (
                                            <>
                                                <h4>Delivery to: <strong>{currentAddress.label || 'Home'}</strong></h4>
                                                <p className="qc-addr-snippet">
                                                    {currentAddress.name} • {currentAddress.line1}, {currentAddress.city} - {currentAddress.pincode}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <h4 style={{ color: '#dc2626' }}>No delivery address selected</h4>
                                                <p className="qc-addr-snippet" style={{ color: '#b91c1c' }}>
                                                    Please add or choose an address to deliver your order
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button
                                    className="qc-change-addr-btn"
                                    onClick={() => setCurrentView('select-address')}
                                >
                                    {currentAddress ? 'Change / Add' : '+ Add Address'}
                                </button>
                            </div>
                        </div>

                        {/* 2. Cart Items Table */}
                        <div className="qc-cart-items-card">
                            <div className="qc-cart-items-header">
                                <span>Product</span>
                                <span>Quantity</span>
                                <span>Price</span>
                            </div>

                            <div className="qc-cart-items-list">
                                {cart.map((item) => {
                                    const stock = getStock(item);
                                    const limitPerOrder = getLimitPerOrder(item);
                                    const isLimitReached = limitPerOrder > 0 && item.qty >= limitPerOrder;
                                    const itemTotal = item.price * item.qty;

                                    return (
                                        <div key={item.id} className="qc-cart-item-row">
                                            {/* Product cell */}
                                            <div className="qc-cart-prod-cell">
                                                <img
                                                    src={item.image || '/assets/placeholder.jpg'}
                                                    alt={item.name}
                                                    className="qc-cart-img"
                                                    onError={(e) => { e.target.src = 'https://placehold.co/80x80?text=Item'; }}
                                                />
                                                <div className="qc-cart-info">
                                                    <h4>{item.name}</h4>
                                                    <span className="qc-cart-unit-price">₹{item.price} each</span>
                                                    {limitPerOrder > 0 && (
                                                        <span className="qc-limit-tag">Max 1/order</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Quantity Stepper */}
                                            <div className="qc-cart-qty-cell">
                                                <div className="qc-stepper-control">
                                                    <button
                                                        className="qc-stepper-btn"
                                                        onClick={() => decreaseCart(item)}
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="qc-stepper-number">{item.qty}</span>
                                                    <button
                                                        className={`qc-stepper-btn ${isLimitReached ? 'disabled' : ''}`}
                                                        onClick={() => {
                                                            if (isLimitReached) {
                                                                showToast(`"${item.name}" is limited to 1 unit per order`);
                                                            } else {
                                                                increaseCart(item);
                                                            }
                                                        }}
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Price & Delete */}
                                            <div className="qc-cart-price-cell">
                                                <strong>₹{itemTotal}</strong>
                                                <button
                                                    className="qc-cart-remove-btn"
                                                    onClick={() => removeFromCart(item.id)}
                                                    title="Remove item"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Clear Cart Footer */}
                            <div className="qc-cart-card-footer">
                                <span className="qc-delivery-guarantee">
                                    ⚡ 10-Min Delivery Guaranteed from local darkstore
                                </span>
                                <button className="qc-clear-cart-link" onClick={clearCart}>
                                    Clear Cart
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Coupons, Free Cash & Bill Summary */}
                    <div className="qc-cart-right-col">
                        {/* 1. Coupon Code Box */}
                        <div className="qc-coupon-card">
                            <div className="qc-card-header-icon-row">
                                <Tag size={16} />
                                <h4>Apply Coupons & Promo Codes</h4>
                            </div>

                            {appliedCoupon ? (
                                <div className="qc-applied-coupon-pill">
                                    <div className="qc-applied-left">
                                        <Check size={16} className="qc-check-green" />
                                        <div>
                                            <strong>{appliedCoupon} Applied!</strong>
                                            <small>You saved ₹{couponDiscount}</small>
                                        </div>
                                    </div>
                                    <button className="qc-remove-coupon-btn" onClick={removeCoupon}>
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <form
                                    className="qc-coupon-input-form"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        applyCoupon();
                                    }}
                                >
                                    <input
                                        type="text"
                                        placeholder="Enter promo or coupon code..."
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    />
                                    <button type="submit" className="qc-apply-coupon-btn">
                                        Apply
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* 2. Free Cash Option (Checkbox as Requested) */}
                        <div className={`qc-freecash-cart-box ${freeCash === 0 ? 'disabled' : ''}`}>
                            <div className="qc-freecash-cart-header">
                                <div className="qc-fc-label-row">
                                    <Gift size={16} className="qc-gift-icon" />
                                    <div className="qc-fc-text-block">
                                        <strong>QuickCart Free Cash Balance</strong>
                                        <span className="qc-fc-amt">₹{freeCash} Available</span>
                                    </div>
                                </div>

                                {freeCash === 0 && (
                                    <span className="qc-disabled-badge">Disabled</span>
                                )}
                            </div>

                            {freeCash > 0 ? (
                                <label className="qc-fc-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={useFreeCash}
                                        onChange={(e) => setUseFreeCash(e.target.checked)}
                                    />
                                    <span className="qc-fc-checkbox-text">
                                        Apply ₹{maxFreeCashUsable} Free Cash from wallet
                                    </span>
                                </label>
                            ) : (
                                <p className="qc-fc-zero-note">
                                    No Free Cash available in your account. You can redeem voucher codes in Profile &rarr; Free Cash.
                                </p>
                            )}
                        </div>

                        {/* 3. Bill Summary Card */}
                        <div className="qc-bill-summary-card">
                            <h4>Bill Details</h4>

                            <div className="qc-bill-row">
                                <span>Item Total (Subtotal)</span>
                                <span>₹{subtotal}</span>
                            </div>

                            {appliedCoupon && (
                                <div className="qc-bill-row discount">
                                    <span>Coupon Discount ({appliedCoupon})</span>
                                    <span>-₹{couponDiscount}</span>
                                </div>
                            )}

                            {useFreeCash && effectiveFreeCashDiscount > 0 && (
                                <div className="qc-bill-row discount">
                                    <span>Free Cash Applied</span>
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

                            {deliveryFee > 0 && (
                                <div className="qc-delivery-hint">
                                    <small>Add ₹{199 - subtotal} more items for <strong>FREE delivery</strong>!</small>
                                </div>
                            )}

                            <div className="qc-bill-divider"></div>

                            <div className="qc-bill-total-row">
                                <strong>To Pay</strong>
                                <strong className="qc-final-total-amt">₹{finalTotal}</strong>
                            </div>

                            {/* Proceed to Payment CTA */}
                            <button
                                className="qc-checkout-cta-btn"
                                onClick={handleProceedToPayment}
                            >
                                <Lock size={16} />
                                <span>Proceed to Payment (₹{finalTotal})</span>
                            </button>

                            <div className="qc-checkout-trust-footer">
                                <ShieldCheck size={14} />
                                <span>Secured by Razorpay • UPI & Cards accepted</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Address Selection Modal */}
            {isAddressModalOpen && (
                <div className="qc-modal-backdrop">
                    <div className="qc-address-modal-card">
                        <div className="qc-modal-header">
                            <h3>Choose Delivery Address</h3>
                            <button className="qc-modal-close" onClick={() => setIsAddressModalOpen(false)}>✕</button>
                        </div>

                        <div className="qc-modal-address-list">
                            {addresses.map((a) => (
                                <div
                                    key={a.id}
                                    className={`qc-modal-addr-item ${selectedAddressId === a.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedAddressId(a.id);
                                        setIsAddressModalOpen(false);
                                        showToast(`Address set to ${a.label || 'Home'} 📍`);
                                    }}
                                >
                                    <div className="qc-modal-addr-radio">
                                        <input
                                            type="radio"
                                            name="addr-select"
                                            checked={selectedAddressId === a.id}
                                            readOnly
                                        />
                                    </div>
                                    <div className="qc-modal-addr-info">
                                        <strong>{a.name} ({a.label || 'Home'})</strong>
                                        <p>{a.line1}, {a.city} - {a.pincode}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Inline Add Address Form */}
                        <form className="qc-inline-add-addr" onSubmit={handleQuickAddAddress}>
                            <h4>+ Add New Address</h4>
                            <input
                                type="text"
                                placeholder="Street Address / Flat / Building"
                                value={newAddrForm.line1}
                                onChange={(e) => setNewAddrForm({ ...newAddrForm, line1: e.target.value })}
                                required
                            />
                            <div className="qc-inline-row">
                                <input
                                    type="text"
                                    placeholder="City"
                                    value={newAddrForm.city}
                                    onChange={(e) => setNewAddrForm({ ...newAddrForm, city: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="PIN Code"
                                    value={newAddrForm.pincode}
                                    onChange={(e) => setNewAddrForm({ ...newAddrForm, pincode: e.target.value })}
                                    required
                                />
                            </div>
                            <button type="submit" className="qc-cta-button small">
                                Save & Deliver Here
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
