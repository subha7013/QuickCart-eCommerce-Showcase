import React, { useState, useEffect } from 'react';
import {
    User, Smartphone, BadgeCheck, RotateCw, XCircle, Lock, Printer, Download,
    ChevronUp, ChevronDown, Truck, Clock, CheckCircle2, Package,
    Banknote, ShoppingBag, AlertCircle, MapPin, CreditCard, Gift,
    Shield, Headphones, LogOut, Plus, Trash2, Heart, ExternalLink,
    Sparkles, ShieldCheck, Search, Calendar, Zap
} from 'lucide-react';
import { api } from '../utils/api.js';
import { useApp } from '../context/AppContext.jsx';
import { formatProductImage } from '../utils/helpers.js';
import SupportChatbot from './SupportChatbot.jsx';

export default function UserProfileView() {
    const {
        currentUser,
        setCurrentUser,
        profilePhone,
        setProfilePhone,
        orders,
        loadOrders,
        fetchProductStock,
        showToast,
        currentView,
        setCurrentView,
        isAdmin,
        setIsAdmin,
        setAdminKey,
        setAdminProducts,
        increaseCart,
        setInvoiceOrder,
        generateInvoiceForOrder,
        cancelUserOrder,
        freeCash,
        redeemGiftCard,
        addresses,
        addAddress,
        removeAddress,
        savedPaymentMethods,
        wishlist,
        removeFromWishlist,
        userIncidents,
        setActiveTrackingOrder,
        trackOrderByQuery,
        fetchMe,
        setAddresses,
        setSelectedAddressId
    } = useApp();

    const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'admin', 'track'
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [signupForm, setSignupForm] = useState({ email: '', phone: '', password: '', confirmPassword: '' });
    const [adminLoginKey, setAdminLoginKey] = useState('');
    const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
    const [activeTab, setActiveTab] = useState('orders'); // orders, addresses, payments, wishlist, freecash, privacy, support
    const [expandedOrders, setExpandedOrders] = useState({});

    // Synchronize activeTab when routed to /orders
    useEffect(() => {
        if (currentView === 'orders') {
            setActiveTab('orders');
        }
    }, [currentView]);

    // Guest Order Tracking State (No login required)
    const [guestTrackQuery, setGuestTrackQuery] = useState('');
    const [guestTrackResult, setGuestTrackResult] = useState(null);
    const [isGuestTrackingLoading, setIsGuestTrackingLoading] = useState(false);
    const [guestTrackError, setGuestTrackError] = useState('');

    // Member Order Tracking State (For tracking other orders)
    const [memberTrackQuery, setMemberTrackQuery] = useState('');
    const [isMemberTrackingLoading, setIsMemberTrackingLoading] = useState(false);
    const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

    // Wallet Breakdown State (Active Grants & Expiry)
    const [walletDetails, setWalletDetails] = useState(null);
    const [isLoadingWallet, setIsLoadingWallet] = useState(false);
    const [showPastGrants, setShowPastGrants] = useState(false);

    async function loadWalletDetails() {
        if (!currentUser) return;
        setIsLoadingWallet(true);
        try {
            const res = await api('/api/user/wallet');
            if (res.ok) {
                setWalletDetails(res);
                if (typeof res.freeCash === 'number') {
                    setFreeCash(res.freeCash);
                }
            }
        } catch (e) {
            console.error('Fetch wallet error:', e);
        } finally {
            setIsLoadingWallet(false);
        }
    }

    useEffect(() => {
        if (currentUser && activeTab === 'freecash') {
            loadWalletDetails();
        }
    }, [currentUser, activeTab]);

    const MILESTONES = [
        { key: 'placed', label: 'Placed', icon: '📝' },
        { key: 'packed', label: 'Packed', icon: '📦' },
        { key: 'shipped', label: 'Shipped', icon: '🚚' },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: '⚡' },
        { key: 'delivered', label: 'Delivered', icon: '🎉' }
    ];

    function getMilestoneIndex(status) {
        const s = (status || 'placed').toLowerCase();
        if (s === 'processing') return 1;
        if (s === 'cancelled') return -1;
        const idx = MILESTONES.findIndex(m => m.key === s);
        return idx !== -1 ? idx : 0;
    }

    async function handleGuestTrack(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!guestTrackQuery.trim()) {
            setGuestTrackError('Please enter a Tracking ID or Order ID');
            return;
        }
        setGuestTrackError('');
        setIsGuestTrackingLoading(true);
        const res = await trackOrderByQuery(guestTrackQuery.trim());
        setIsGuestTrackingLoading(false);
        if (res.ok && res.order) {
            setGuestTrackResult(res.order);
        } else {
            setGuestTrackResult(null);
            setGuestTrackError(res.msg || 'No order found with this Tracking ID or Order ID');
        }
    }

    async function handleMemberTrack(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!memberTrackQuery.trim()) {
            showToast('Please enter an Order ID or Tracking ID');
            return;
        }
        setIsMemberTrackingLoading(true);
        const res = await trackOrderByQuery(memberTrackQuery.trim());
        setIsMemberTrackingLoading(false);
        if (res.ok && res.order) {
            setActiveTrackingOrder(res.order);
            setCurrentView('tracking');
        } else {
            showToast(res.msg || 'Order not found');
        }
    }

    // New Address Form State
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [newAddressForm, setNewAddressForm] = useState({
        label: 'Home',
        name: currentUser?.email?.split('@')[0] || '',
        phone: profilePhone || '',
        line1: '',
        line2: '',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700091',
        isDefault: false
    });

    // Gift Voucher State
    const [voucherCode, setVoucherCode] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    // Password Update State
    const [passUpdateForm, setPassUpdateForm] = useState({ currentPass: '', newPass: '', phoneUpdate: profilePhone || '' });

    function toggleOrderExpand(orderRef) {
        setExpandedOrders(prev => ({
            ...prev,
            [orderRef]: !prev[orderRef]
        }));
    }

    async function handleLogin(e) {
        if (e && e.preventDefault) e.preventDefault();
        let res = await api('/api/login', {
            method: 'POST',
            body: JSON.stringify(loginForm),
        });
        if (!res.ok && (res.msg === 'User not found' || loginForm.email === 'user@quickcart.com')) {
            // Auto register demo account so login never fails for fresh environments
            await api('/api/register', {
                method: 'POST',
                body: JSON.stringify({ email: loginForm.email, password: loginForm.password, phone: '+91 98765 43210' })
            });
            res = await api('/api/login', {
                method: 'POST',
                body: JSON.stringify(loginForm),
            });
        }
        if (res.ok) {
            showToast('Welcome back to QuickCart! 🎉');
            await fetchMe();
            await loadOrders();
            await fetchProductStock();
        } else {
            showToast(res.msg || 'Invalid email or password ❌');
        }
    }

    async function handleAdminLogin(e) {
        e.preventDefault();
        const key = adminLoginKey.trim();
        if (!key) return;
        setIsAdminLoggingIn(true);
        try {
            const res = await api('/api/admin/products', {
                headers: { 'x-admin-key': key }
            });
            if (!res.ok) {
                showToast('Invalid admin secret key ❌');
                return;
            }
            sessionStorage.setItem('qc_admin_key', key);
            sessionStorage.setItem('qc_is_admin', 'true');
            setAdminKey(key);
            setAdminProducts(res.products || []);
            setIsAdmin(true);
            setCurrentView('admin');
            showToast('Admin authentication successful 🛡️');
        } catch (error) {
            showToast('Failed to authenticate with backend ❌');
        } finally {
            setIsAdminLoggingIn(false);
        }
    }

    async function handleSignup(e) {
        e.preventDefault();
        if (signupForm.password !== signupForm.confirmPassword) {
            showToast('Passwords do not match ❌');
            return;
        }
        const res = await api('/api/register', {
            method: 'POST',
            body: JSON.stringify({
                email: signupForm.email,
                phone: signupForm.phone,
                password: signupForm.password
            }),
        });
        if (res.ok) {
            showToast('Account created! Welcome to QuickCart 🎉');
            await fetchMe();
            await loadOrders();
        } else {
            showToast(res.msg || 'Registration failed ❌');
        }
    }

    async function logoutUser() {
        await api('/api/auth/logout', { method: 'POST' });
        setCurrentUser(null);
        setAddresses([]);
        setSelectedAddressId(null);
        showToast('Logged out successfully 👋');
    }

    async function handleAddAddressSubmit(e) {
        e.preventDefault();
        if (!newAddressForm.line1 || !newAddressForm.city || !newAddressForm.pincode) {
            showToast('Please fill all required address fields');
            return;
        }
        await addAddress(newAddressForm);
        setIsAddingAddress(false);
        setNewAddressForm({
            label: 'Home',
            name: currentUser?.email?.split('@')[0] || '',
            phone: profilePhone || '',
            line1: '',
            line2: '',
            city: 'Kolkata',
            state: 'West Bengal',
            pincode: '700091',
            isDefault: false
        });
    }

    async function handleRedeemVoucher(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!voucherCode.trim()) {
            showToast('Enter a voucher code');
            return;
        }
        setIsRedeeming(true);
        await redeemGiftCard(voucherCode.trim());
        await loadWalletDetails();
        setIsRedeeming(false);
        setVoucherCode('');
    }

    async function handleUpdateProfile(e) {
        e.preventDefault();
        const res = await api('/api/user/update', {
            method: 'POST',
            body: JSON.stringify({
                phone: passUpdateForm.phoneUpdate,
                password: passUpdateForm.newPass || undefined
            })
        });
        if (res.ok) {
            showToast('Account details updated successfully ✅');
            if (passUpdateForm.phoneUpdate) setProfilePhone(passUpdateForm.phoneUpdate);
            setPassUpdateForm({ currentPass: '', newPass: '', phoneUpdate: passUpdateForm.phoneUpdate });
        } else {
            showToast(res.msg || 'Failed to update account ❌');
        }
    }

    // ---------------- AUTH VIEW IF NOT LOGGED IN ----------------
    if (!currentUser) {
        return (
            <section id="profilePage" className="qc-auth-page-section">
                <div className="qc-auth-card">
                    <div className="qc-auth-brand-badge">
                        <span>🛒</span>
                    </div>

                    <div className="qc-auth-tabs">
                        <button
                            className={`qc-auth-tab ${authMode === 'login' ? 'active' : ''}`}
                            onClick={() => setAuthMode('login')}
                        >
                            Login
                        </button>
                        <button
                            className={`qc-auth-tab ${authMode === 'signup' ? 'active' : ''}`}
                            onClick={() => setAuthMode('signup')}
                        >
                            Signup
                        </button>
                        <button
                            className={`qc-auth-tab ${authMode === 'admin' ? 'active' : ''}`}
                            onClick={() => setAuthMode('admin')}
                        >
                            Admin
                        </button>
                    </div>

                    {authMode === 'login' ? (
                        <form className="qc-auth-form" onSubmit={handleLogin}>
                            <h3>Welcome Back to QuickCart</h3>
                            <p className="qc-auth-subtitle">
                                Sign in to place order,view order history & claim Free Cash.
                            </p>

                            <div className="qc-form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={loginForm.email}
                                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="qc-form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={loginForm.password}
                                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                    required
                                />
                            </div>

                            <button type="submit" className="qc-auth-submit-btn">
                                Sign In & Continue
                            </button>


                        </form>
                    ) : authMode === 'signup' ? (
                        <form className="qc-auth-form" onSubmit={handleSignup}>
                            <h3>Create New QuickCart Account</h3>
                            <p className="qc-auth-subtitle">
                                Join now and get <strong>₹150 Free Cash Welcome Bonus</strong>!
                            </p>

                            <div className="qc-form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={signupForm.email}
                                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="qc-form-group">
                                <label>Mobile Phone (+91)</label>
                                <input
                                    type="tel"
                                    placeholder="+91 98765 43210"
                                    value={signupForm.phone}
                                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                                />
                            </div>

                            <div className="qc-form-group">
                                <label>Create Password</label>
                                <input
                                    type="password"
                                    placeholder="At least 6 characters"
                                    value={signupForm.password}
                                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="qc-form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={signupForm.confirmPassword}
                                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <button type="submit" className="qc-auth-submit-btn">
                                Create Account & Claim ₹150
                            </button>
                        </form>
                    ) : authMode === 'admin' ? (
                        <form className="qc-auth-form" onSubmit={handleAdminLogin}>
                            <h3>Admin Access</h3>
                            <p className="qc-auth-subtitle">Enter the admin key to open the store dashboard.</p>
                            <div className="qc-form-group">
                                <label>Admin Secret Key</label>
                                <input
                                    type="password"
                                    placeholder="Enter admin key"
                                    value={adminLoginKey}
                                    onChange={(e) => setAdminLoginKey(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                />
                            </div>
                            <button type="submit" className="qc-auth-submit-btn" disabled={isAdminLoggingIn}>
                                {isAdminLoggingIn ? 'Verifying...' : 'Open Admin Dashboard'}
                            </button>
                        </form>
                    ) : (
                        /* Guest Order Tracking Tab (No login required) */
                        <div className="qc-guest-tracking-pane">
                            <h3>🔍 Track Any Order Without Login</h3>
                            <p className="qc-auth-subtitle">
                                Enter your Tracking ID (e.g. QC-TRK-XXXXXX) or Order ID to view real-time delivery status.
                            </p>

                            <form onSubmit={handleGuestTrack} className="qc-guest-track-form">
                                <div className="qc-guest-input-wrap">
                                    <Search size={18} className="qc-guest-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Enter Tracking ID or Order ID..."
                                        value={guestTrackQuery}
                                        onChange={(e) => setGuestTrackQuery(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        className="qc-guest-search-btn"
                                        disabled={isGuestTrackingLoading}
                                    >
                                        {isGuestTrackingLoading ? 'Searching...' : 'Track Order'}
                                    </button>
                                </div>
                            </form>

                            {guestTrackError && (
                                <div className="qc-track-error-alert">
                                    <AlertCircle size={16} />
                                    <span>{guestTrackError}</span>
                                </div>
                            )}

                            {guestTrackResult && (
                                <div className="qc-guest-order-card">
                                    <div className="qc-guest-order-header">
                                        <div>
                                            <h4>Order #{guestTrackResult._id?.slice(-8)}</h4>
                                            <span className="qc-guest-trk-pill">
                                                <Truck size={13} /> {guestTrackResult.trackingId || ('QC-TRK-' + guestTrackResult._id?.slice(-6))}
                                            </span>
                                            <small className="qc-order-placed-time">
                                                Placed on: {new Date(guestTrackResult.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </small>
                                        </div>
                                        <div className="qc-guest-status-badge-wrap">
                                            <span className={`qc-order-status-badge ${guestTrackResult.status}`}>
                                                {(guestTrackResult.status || 'placed').replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                            <span className="qc-live-pulse-indicator">
                                                <span className="pulse-dot"></span> Live Status
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stepper if not cancelled */}
                                    {guestTrackResult.status === 'cancelled' ? (
                                        <div className="qc-track-cancelled-box">
                                            <XCircle size={20} />
                                            <div>
                                                <strong>Order Cancelled</strong>
                                                <p>This order was marked as cancelled. Any payments will be refunded.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="qc-guest-stepper">
                                            {MILESTONES.map((m, idx) => {
                                                const currentIdx = getMilestoneIndex(guestTrackResult.status);
                                                const isDone = idx <= currentIdx;
                                                const isCurrent = idx === currentIdx;
                                                return (
                                                    <div key={m.key} className={`qc-guest-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                                                        <div className="qc-guest-step-marker">
                                                            {isDone ? <CheckCircle2 size={16} /> : <span>{idx + 1}</span>}
                                                        </div>
                                                        <span className="qc-guest-step-label">{m.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div className="qc-guest-meta-grid">
                                        <div className="qc-guest-meta-item">
                                            <span className="meta-label">Recipient:</span>
                                            <strong>{guestTrackResult.customerName || guestTrackResult.address?.name || 'Customer'}</strong>
                                        </div>
                                        <div className="qc-guest-meta-item">
                                            <span className="meta-label">Delivery Address:</span>
                                            <span>{guestTrackResult.address?.city || 'India'} ({guestTrackResult.address?.pincode || 'PIN'})</span>
                                        </div>
                                        <div className="qc-guest-meta-item">
                                            <span className="meta-label">Items:</span>
                                            <span>{guestTrackResult.items?.length || 0} product(s)</span>
                                        </div>
                                        <div className="qc-guest-meta-item">
                                            <span className="meta-label">Total Amount:</span>
                                            <strong>₹{guestTrackResult.total} (via {(guestTrackResult.paymentMethod || 'COD').toUpperCase()})</strong>
                                        </div>
                                    </div>

                                    <div className="qc-guest-actions-row">
                                        <button
                                            className="qc-order-action-btn primary"
                                            onClick={() => {
                                                setActiveTrackingOrder(guestTrackResult);
                                                setCurrentView('tracking');
                                            }}
                                        >
                                            <Truck size={14} /> <span>Open Full Tracking View</span>
                                        </button>
                                        <button
                                            className="qc-order-action-btn secondary"
                                            onClick={(e) => generateInvoiceForOrder(guestTrackResult, e)}
                                            title="Download Tax Invoice as PDF"
                                        >
                                            <Download size={14} /> <span>Download Invoice (PDF)</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>
        );
    }

    // ---------------- LOGGED IN PROFILE DASHBOARD ----------------
    return (
        <section id="profilePage" className="qc-profile-dashboard">
            {/* Top Welcome Header Banner */}
            <div className="qc-profile-hero-banner">
                <div className="qc-profile-hero-left">
                    <div className="qc-profile-avatar-circle">
                        <span>{currentUser.email?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="qc-profile-hero-text">
                        <div className="qc-hero-name-row">
                            <h2>Welcome, {currentUser.email?.split('@')[0]}!</h2>
                            <span className="qc-vip-badge">
                                <BadgeCheck size={14} /> QuickCart VIP Member
                            </span>
                        </div>
                        <p className="qc-hero-contact-row">
                            <span><User size={12} /> {currentUser.email}</span>
                            <span><Smartphone size={12} /> {profilePhone || 'Phone: +91 98765 43210'}</span>
                        </p>
                    </div>
                </div>

                <div className="qc-profile-hero-stats">
                    <div className="qc-stat-pill" onClick={() => setActiveTab('freecash')}>
                        <span className="qc-stat-icon">💰</span>
                        <div className="qc-stat-info">
                            <strong>₹{freeCash}</strong>
                            <small>Free Cash</small>
                        </div>
                    </div>

                    <div className="qc-stat-pill" onClick={() => setActiveTab('orders')}>
                        <span className="qc-stat-icon">📦</span>
                        <div className="qc-stat-info">
                            <strong>{orders.length}</strong>
                            <small>Orders</small>
                        </div>
                    </div>

                    <div className="qc-stat-pill" onClick={() => setActiveTab('wishlist')}>
                        <span className="qc-stat-icon">❤️</span>
                        <div className="qc-stat-info">
                            <strong>{wishlist.length}</strong>
                            <small>Wishlist</small>
                        </div>
                    </div>

                    <button className="qc-hero-logout-btn" onClick={logoutUser} title="Sign Out">
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* 2-Column Profile Layout Container */}
            <div className="qc-profile-layout-container">
                {/* Left Sidebar Menu */}
                <aside className="qc-profile-sidebar">
                    <div className="qc-profile-sidebar-header">
                        <span className="qc-sidebar-title">Account Menu</span>
                    </div>

                    <div className="qc-profile-nav-tabs">
                        <button
                            className={`qc-profile-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            <Package size={18} />
                            <span>My Orders ({orders.length})</span>
                        </button>

                        <button
                            className={`qc-profile-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
                            onClick={() => setActiveTab('payments')}
                        >
                            <CreditCard size={18} />
                            <span>Payment Methods</span>
                        </button>

                        <button
                            className={`qc-profile-tab-btn ${activeTab === 'addresses' ? 'active' : ''}`}
                            onClick={() => setActiveTab('addresses')}
                        >
                            <MapPin size={18} />
                            <span>Addresses ({addresses.length})</span>
                        </button>

                        <button
                            className={`qc-profile-tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
                            onClick={() => setActiveTab('wishlist')}
                        >
                            <Heart size={18} />
                            <span>Wishlist ({wishlist.length})</span>
                        </button>

                        <button
                            className={`qc-profile-tab-btn ${activeTab === 'freecash' ? 'active' : ''}`}
                            onClick={() => setActiveTab('freecash')}
                        >
                            <Gift size={18} />
                            <span>Gift Card / Free Cash (₹{freeCash})</span>
                        </button>

                        <button
                            className={`qc-profile-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
                            onClick={() => setActiveTab('privacy')}
                        >
                            <Shield size={18} />
                            <span>Privacy Center</span>
                        </button>

                        <button
                            className={`qc-profile-tab-btn ${activeTab === 'support' ? 'active' : ''}`}
                            onClick={() => setActiveTab('support')}
                        >
                            <Headphones size={18} />
                            <span>Customer Support & AI</span>
                        </button>

                        {isAdmin && (
                            <button
                                className="qc-profile-tab-btn"
                                onClick={() => setCurrentView('admin')}
                                style={{ color: '#2563eb', fontWeight: 700 }}
                            >
                                <Shield size={18} />
                                <span>Admin Dashboard</span>
                            </button>
                        )}
                    </div>
                </aside>

                {/* Right Content Area Based on Active Tab (Default: My Orders) */}
                <main className="qc-profile-tab-panel">

                    {/* 1. MY ORDERS SECTION */}
                    {activeTab === 'orders' && (
                        <div className="qc-orders-section">
                            <div className="qc-section-heading-row">
                                <div>
                                    <h3>Order History</h3>
                                    <p>View past orders, track delivery status, and download tax invoices.</p>
                                </div>
                                <button
                                    className="qc-refresh-status-btn"
                                    onClick={async () => {
                                        setIsRefreshingOrders(true);
                                        await loadOrders();
                                        setIsRefreshingOrders(false);
                                        showToast('Order statuses refreshed from warehouse 🔄');
                                    }}
                                    disabled={isRefreshingOrders}
                                    title="Sync latest status from admin"
                                >
                                    <RotateCw size={14} className={isRefreshingOrders ? 'spin' : ''} />
                                    <span>{isRefreshingOrders ? 'Syncing...' : 'Refresh Status'}</span>
                                </button>
                            </div>

                            {/* Track Any Other Order Tool (For checking friends/family or guest orders) */}


                            {orders.length === 0 ? (
                                <div className="qc-empty-section-box">
                                    <ShoppingBag size={48} className="qc-empty-icon" />
                                    <h4>No orders placed yet</h4>
                                    <p>Browse fresh fruits, vegetables, adapters and fashion to place your first 10-min order!</p>
                                    <button className="qc-cta-button" onClick={() => setCurrentView('home')}>
                                        Start Shopping
                                    </button>
                                </div>
                            ) : (
                                <div className="qc-orders-cards-list">
                                    {orders.map((order) => {
                                        const isExpanded = expandedOrders[order._id] || false;
                                        const trackingId = order.trackingId || ('QC-TRK-' + (order._id?.slice(-6) || '92841'));
                                        const status = order.status || 'placed';

                                        return (
                                            <div key={order._id} className="qc-order-card">
                                                <div className="qc-order-card-header">
                                                    <div className="qc-order-meta-left">
                                                        <span className="qc-order-tracking-tag">
                                                            <Truck size={13} /> {trackingId}
                                                        </span>
                                                        <span className="qc-order-date">
                                                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                                day: 'numeric', month: 'short', year: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>

                                                    <div className="qc-order-meta-right">
                                                        <span className={`qc-order-status-badge ${status}`}>
                                                            {status.replace(/_/g, ' ').toUpperCase()}
                                                        </span>
                                                        <strong className="qc-order-total-price">
                                                            ₹{order.total}
                                                        </strong>
                                                    </div>
                                                </div>

                                                {/* Preview Items */}
                                                <div className="qc-order-items-preview">
                                                    {order.items?.map((item, idx) => (
                                                        <div key={idx} className="qc-order-item-pill">
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
                                                            <span>{item.name} × {item.qty}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Order Card Actions */}
                                                <div className="qc-order-card-actions">
                                                    <button
                                                        className="qc-order-action-btn primary"
                                                        onClick={() => {
                                                            setActiveTrackingOrder(order);
                                                            setCurrentView('tracking');
                                                        }}
                                                    >
                                                        <Truck size={14} />
                                                        <span>Track Order</span>
                                                    </button>

                                                    <button
                                                        className="qc-order-action-btn secondary"
                                                        onClick={(e) => generateInvoiceForOrder(order, e)}
                                                        title="Download Tax Invoice as PDF"
                                                    >
                                                        <Download size={14} />
                                                        <span>Download Invoice</span>
                                                    </button>

                                                    {status === 'placed' && (
                                                        <button
                                                            className="qc-order-action-btn danger"
                                                            onClick={(e) => cancelUserOrder(order, e)}
                                                        >
                                                            <XCircle size={14} />
                                                            <span>Cancel Order</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        className="qc-order-expand-toggle"
                                                        onClick={() => toggleOrderExpand(order._id)}
                                                    >
                                                        <span>{isExpanded ? 'Hide Details' : 'View Full Details'}</span>
                                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                    </button>
                                                </div>

                                                {/* Expanded Detailed View */}
                                                {isExpanded && (
                                                    <div className="qc-order-expanded-tray">
                                                        <div className="qc-tray-grid">
                                                            <div className="qc-tray-box">
                                                                <h5>Delivery Address</h5>
                                                                <p><strong>{order.address?.name || 'Customer'}</strong></p>
                                                                <p>{order.address?.line1}</p>
                                                                {order.address?.line2 && <p>{order.address?.line2}</p>}
                                                                <p>{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
                                                            </div>

                                                            <div className="qc-tray-box">
                                                                <h5>Payment & Discounts</h5>
                                                                <p>Payment: <strong>{(order.paymentMethod || 'COD').toUpperCase()}</strong></p>
                                                                {order.couponCode && (
                                                                    <p>Coupon Applied: <strong>{order.couponCode}</strong> (-₹{order.couponDiscount})</p>
                                                                )}
                                                                {order.freeCashUsed > 0 && (
                                                                    <p>Free Cash Used: <strong>₹{order.freeCashUsed}</strong></p>
                                                                )}
                                                                <p>Delivery Fee: <strong>₹{order.deliveryFee || 0}</strong></p>
                                                                <p>Final Total: <strong>₹{order.total}</strong></p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2. ADDRESS SECTION */}
                    {activeTab === 'addresses' && (
                        <div className="qc-addresses-section">
                            <div className="qc-section-heading-row">
                                <div>
                                    <h3>Saved Delivery Addresses</h3>
                                    <p>Manage your delivery locations for 10-minute lightning checkout.</p>
                                </div>
                                <button
                                    className="qc-cta-button small"
                                    onClick={() => setIsAddingAddress(!isAddingAddress)}
                                >
                                    <Plus size={15} />
                                    <span>{isAddingAddress ? 'Cancel' : 'Add New Address'}</span>
                                </button>
                            </div>

                            {/* Add Address Form Modal / Inline */}
                            {isAddingAddress && (
                                <form className="qc-address-form-box" onSubmit={handleAddAddressSubmit}>
                                    <h4>Add New Address</h4>
                                    <div className="qc-form-row">
                                        <div className="qc-form-group">
                                            <label>Label</label>
                                            <select
                                                value={newAddressForm.label}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, label: e.target.value })}
                                            >
                                                <option value="Home">Home</option>
                                                <option value="Work">Work</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="qc-form-group">
                                            <label>Contact Name</label>
                                            <input
                                                type="text"
                                                value={newAddressForm.name}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="qc-form-group">
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                value={newAddressForm.phone}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="qc-form-group">
                                        <label>Street Address / Flat No / Building</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Flat 3A, Silver Oak Apts, Sector 2"
                                            value={newAddressForm.line1}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, line1: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="qc-form-group">
                                        <label>Landmark / Area (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Near City Center Mall"
                                            value={newAddressForm.line2}
                                            onChange={(e) => setNewAddressForm({ ...newAddressForm, line2: e.target.value })}
                                        />
                                    </div>

                                    <div className="qc-form-row">
                                        <div className="qc-form-group">
                                            <label>City</label>
                                            <input
                                                type="text"
                                                value={newAddressForm.city}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, city: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="qc-form-group">
                                            <label>State</label>
                                            <input
                                                type="text"
                                                value={newAddressForm.state}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, state: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="qc-form-group">
                                            <label>PIN Code</label>
                                            <input
                                                type="text"
                                                value={newAddressForm.pincode}
                                                onChange={(e) => setNewAddressForm({ ...newAddressForm, pincode: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="qc-form-actions">
                                        <button type="submit" className="qc-cta-button">
                                            Save Address
                                        </button>
                                        <button
                                            type="button"
                                            className="qc-order-action-btn secondary"
                                            onClick={() => setIsAddingAddress(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Addresses Grid */}
                            <div className="qc-addresses-grid">
                                {addresses.map((addr) => (
                                    <div key={addr.id} className="qc-address-card">
                                        <div className="qc-address-card-header">
                                            <span className="qc-address-label-badge">{addr.label || 'Home'}</span>
                                            {addr.isDefault && (
                                                <span className="qc-default-addr-chip">Default Address</span>
                                            )}
                                            <button
                                                className="qc-delete-addr-btn"
                                                onClick={() => removeAddress(addr.id)}
                                                title="Delete Address"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>

                                        <h4 className="qc-addr-name">{addr.name}</h4>
                                        <p className="qc-addr-text">{addr.line1}</p>
                                        {addr.line2 && <p className="qc-addr-text">{addr.line2}</p>}
                                        <p className="qc-addr-text">
                                            {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                                        </p>
                                        {addr.phone && (
                                            <p className="qc-addr-phone">Phone: {addr.phone}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. PAYMENT METHODS SECTION */}
                    {activeTab === 'payments' && (
                        <div className="qc-payments-section">
                            <div className="qc-section-heading-row">
                                <div>
                                    <h3>Saved Payment Methods</h3>
                                    <p>Manage your UPI handles and cards for simulated 1-click checkout.</p>
                                </div>
                            </div>

                            <div className="qc-payments-grid">
                                {savedPaymentMethods.map((pm) => (
                                    <div key={pm.id} className="qc-payment-method-card">
                                        <div className="qc-pm-icon-box">
                                            {pm.type === 'upi' ? <Smartphone size={20} /> : <CreditCard size={20} />}
                                        </div>
                                        <div className="qc-pm-details">
                                            <strong>{pm.details}</strong>
                                            <small>{pm.type === 'upi' ? 'Unified Payments Interface' : 'Saved Card'}</small>
                                        </div>
                                        {pm.isDefault && <span className="qc-pm-default-badge">Primary</span>}
                                    </div>
                                ))}

                                <div className="qc-payment-method-card add-new">
                                    <Plus size={20} />
                                    <span>Add New UPI ID / Card</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. WISHLIST SECTION */}
                    {activeTab === 'wishlist' && (
                        <div className="qc-wishlist-tab-section">
                            <div className="qc-section-heading-row">
                                <div>
                                    <h3>My Saved Wishlist ({wishlist.length} Items)</h3>
                                    <p>Items you've bookmarked to buy later.</p>
                                </div>
                            </div>

                            {wishlist.length === 0 ? (
                                <div className="qc-empty-section-box">
                                    <Heart size={48} className="qc-empty-icon" />
                                    <h4>Your wishlist is empty</h4>
                                    <p>Click the heart icon on any product to save it here!</p>
                                    <button className="qc-cta-button" onClick={() => setCurrentView('home')}>
                                        Explore Products
                                    </button>
                                </div>
                            ) : (
                                <div className="qc-wishlist-grid-view">
                                    {wishlist.map((item) => (
                                        <div key={item.id} className="qc-wishlist-item-card">
                                            <img
                                                src={formatProductImage(item.image)}
                                                alt={item.name}
                                                className="qc-wishlist-item-img"
                                                onError={(e) => {
                                                    if (!e.target.dataset.tried) {
                                                        e.target.dataset.tried = 'true';
                                                        e.target.src = '/assets/banana.jpg';
                                                    }
                                                }}
                                            />
                                            <div className="qc-wishlist-item-info">
                                                <h4>{item.name}</h4>
                                                <span className="qc-wishlist-price">₹{item.price}</span>
                                                <div className="qc-wishlist-actions-row">
                                                    <button
                                                        className="qc-order-action-btn primary small"
                                                        onClick={() => {
                                                            increaseCart(item);
                                                            showToast(`Added ${item.name} to cart 🛒`);
                                                        }}
                                                    >
                                                        Move to Cart
                                                    </button>
                                                    <button
                                                        className="qc-order-action-btn secondary small"
                                                        onClick={() => removeFromWishlist(item.id)}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5. GIFT CARD / FREECASH CREDITS SECTION */}
                    {activeTab === 'freecash' && (() => {
                        const totalCreditsUsedInOrders = orders.reduce((sum, o) => sum + (Number(o.freeCashUsed) || 0), 0);
                        const ordersWithCredits = orders.filter(o => Number(o.freeCashUsed) > 0);

                        return (
                            <div className="qc-freecash-section">
                                <div className="qc-section-heading-row">
                                    <div>
                                        <h3>QuickCart Wallet & Free Cash Credits</h3>
                                        <p>Manage promotional credits, track order usage, and redeem reward vouchers.</p>
                                    </div>
                                    <button
                                        className="qc-refresh-status-btn"
                                        onClick={loadWalletDetails}
                                        disabled={isLoadingWallet}
                                        title="Sync wallet from database"
                                    >
                                        <RotateCw size={14} className={isLoadingWallet ? 'spin' : ''} />
                                        <span>{isLoadingWallet ? 'Syncing...' : 'Sync Wallet'}</span>
                                    </button>
                                </div>

                                {/* Top Hero Balance Card */}
                                <div className="qc-freecash-hero-card">
                                    <div className="qc-fc-left">
                                        <span className="qc-fc-tag">Available QuickCart Credits</span>
                                        <h2 className="qc-fc-balance">₹{freeCash}</h2>
                                        <p className="qc-fc-sub">
                                            ✓ 100% usable on fresh fruits, groceries, adapters & fashion • Auto-deducted at checkout
                                        </p>
                                    </div>
                                    <div className="qc-fc-right">
                                        <div className="qc-fc-coins-icon">🪙</div>
                                    </div>
                                </div>

                                {/* Quick Metrics Bar */}
                                <div className="qc-credits-metrics-grid">
                                    <div className="qc-credit-metric-card">
                                        <span className="qc-cm-label">Available Balance</span>
                                        <strong className="qc-cm-val text-success">₹{freeCash}</strong>
                                        <small>Ready to spend immediately</small>
                                    </div>
                                    <div className="qc-credit-metric-card">
                                        <span className="qc-cm-label">Credits Used on Orders</span>
                                        <strong className="qc-cm-val text-primary">₹{totalCreditsUsedInOrders}</strong>
                                        <small>Saved across {ordersWithCredits.length} order(s)</small>
                                    </div>
                                    <div className="qc-credit-metric-card">
                                        <span className="qc-cm-label">Active Wallet Grants</span>
                                        <strong className="qc-cm-val">{walletDetails?.activeGrants?.length || 0}</strong>
                                        <small>Promotional allocations</small>
                                    </div>
                                </div>

                                {/* Active Grants Breakdown with Expiry Dates */}
                                <div className="qc-wallet-grants-card">
                                    <div className="qc-grants-header">
                                        <div className="qc-grants-title">
                                            <Sparkles size={18} className="qc-text-accent" />
                                            <h4>Active Promotional Credit Allocations</h4>
                                        </div>
                                        <span className="qc-grants-count-badge">
                                            {walletDetails?.activeGrants?.length || 0} Active Grant(s)
                                        </span>
                                    </div>

                                    {isLoadingWallet ? (
                                        <div className="qc-grants-loading">
                                            <RotateCw size={18} className="spin" />
                                            <span>Syncing unexpired promotional grants...</span>
                                        </div>
                                    ) : walletDetails?.activeGrants && walletDetails.activeGrants.length > 0 ? (
                                        <div className="qc-active-grants-grid">
                                            {walletDetails.activeGrants.map((grant) => {
                                                const isSoon = grant.daysRemaining <= 2;
                                                const usedSoFar = (grant.originalAmount || grant.amount) - grant.amount;
                                                return (
                                                    <div
                                                        key={grant.id}
                                                        className={`qc-grant-item-card ${isSoon ? 'expiring-soon' : ''}`}
                                                    >
                                                        <div className="qc-grant-top-row">
                                                            <span className="qc-grant-amount">+₹{grant.amount}</span>
                                                            <span className={`qc-grant-expiry-tag ${isSoon ? 'urgent' : ''}`}>
                                                                <Clock size={12} />
                                                                {grant.daysRemaining === 0
                                                                    ? '🚨 Expires Today!'
                                                                    : grant.daysRemaining === 1
                                                                        ? '⏳ Expires Tomorrow!'
                                                                        : `⏳ Expires in ${grant.daysRemaining} days`}
                                                            </span>
                                                        </div>

                                                        <div className="qc-grant-reason-row">
                                                            <strong>{grant.reason || 'Promotional Credit'}</strong>
                                                            <small className="qc-grant-source">
                                                                {grant.source === 'admin_airdrop' ? 'Exclusive Airdrop 🎁' : grant.source === 'refund' ? 'Order Refund 🔄' : 'Gift Voucher 🎫'}
                                                            </small>
                                                        </div>

                                                        {grant.originalAmount && grant.amount < grant.originalAmount && (
                                                            <div className="qc-grant-partial-note">
                                                                <span>₹{grant.amount} remaining of ₹{grant.originalAmount} (₹{usedSoFar} spent)</span>
                                                            </div>
                                                        )}

                                                        <div className="qc-grant-deadline">
                                                            <Calendar size={12} />
                                                            <span>
                                                                Auto-expires on: <strong>
                                                                    {new Date(grant.expiresAt).toLocaleDateString('en-IN', {
                                                                        weekday: 'short',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        year: 'numeric'
                                                                    })}
                                                                </strong>
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="qc-no-grants-notice">
                                            <p>
                                                Your ₹{freeCash} QuickCart wallet balance is active. No pending expiration deadlines on standard credits.
                                            </p>
                                        </div>
                                    )}

                                    {/* Smart FIFO Notice */}
                                    <div className="qc-fifo-guarantee-box">
                                        <Zap size={16} className="qc-text-accent" />
                                        <div>
                                            <strong>💡 Smart Expiration Protection (Earliest Expiry First)</strong>
                                            <p>
                                                When placing an order with credits, QuickCart's wallet engine automatically consumes promotional cash with the nearest expiration date first to maximize your savings.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Past Expired / Used Grants Toggle */}
                                    {walletDetails?.pastGrants && walletDetails.pastGrants.length > 0 && (
                                        <div className="qc-past-grants-section">
                                            <button
                                                type="button"
                                                className="qc-toggle-past-grants-btn"
                                                onClick={() => setShowPastGrants(!showPastGrants)}
                                            >
                                                <span>{showPastGrants ? 'Hide' : 'View'} Past / Expired Grants History ({walletDetails.pastGrants.length})</span>
                                                {showPastGrants ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>

                                            {showPastGrants && (
                                                <div className="qc-past-grants-list">
                                                    {walletDetails.pastGrants.map((pg) => (
                                                        <div key={pg.id} className="qc-past-grant-row">
                                                            <div>
                                                                <span className="qc-past-reason">{pg.reason || 'Bonus'}</span>
                                                                <small className="qc-past-date">
                                                                    {new Date(pg.expiresAt).toLocaleDateString('en-IN')}
                                                                </small>
                                                            </div>
                                                            <span className={`qc-past-badge ${pg.isExpired ? 'expired' : 'used'}`}>
                                                                {pg.isExpired ? 'Expired Unused' : 'Fully Spent'} (₹{pg.originalAmount})
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Recent Orders Where Credits Were Used */}
                                <div className="qc-wallet-orders-history-card">
                                    <div className="qc-grants-header">
                                        <div className="qc-grants-title">
                                            <Package size={18} className="qc-text-accent" />
                                            <h4>Credits Used on Past Orders ({ordersWithCredits.length})</h4>
                                        </div>
                                    </div>

                                    {ordersWithCredits.length === 0 ? (
                                        <div className="qc-no-grants-notice">
                                            <p>
                                                No credits have been redeemed on orders yet. Simply check the <strong>"Use Free Cash Balance"</strong> box in your cart to deduct credits instantly on your next order!
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="qc-credits-used-orders-list">
                                            {ordersWithCredits.map((order) => {
                                                const trackingId = order.trackingId || ('QC-TRK-' + (order._id?.slice(-6) || '92841'));
                                                return (
                                                    <div key={order._id} className="qc-credit-used-order-row">
                                                        <div className="qc-cu-left">
                                                            <span className="qc-cu-trk">{trackingId}</span>
                                                            <small className="qc-cu-date">
                                                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </small>
                                                        </div>
                                                        <div className="qc-cu-center">
                                                            <span className="qc-cu-deduction">-₹{order.freeCashUsed} Credits</span>
                                                            <small>Paid: ₹{order.total} via {(order.paymentMethod || 'COD').toUpperCase()}</small>
                                                        </div>
                                                        <div className="qc-cu-right">
                                                            <span className={`qc-order-status-badge ${order.status}`}>
                                                                {order.status.toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Gift Voucher Redemption Box (Private - No Hardcoded Codes) */}
                                <div className="qc-redeem-card">
                                    <h4>Redeem Promotional Voucher / Reward Code</h4>
                                    <p>
                                        Received an exclusive voucher or promotion code via SMS, email, or a customer loyalty airdrop? Enter it below to credit your account directly.
                                    </p>
                                    <form className="qc-redeem-form" onSubmit={handleRedeemVoucher}>
                                        <input
                                            type="text"
                                            placeholder="Enter your received voucher code..."
                                            value={voucherCode}
                                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                                            required
                                        />
                                        <button type="submit" className="qc-cta-button" disabled={isRedeeming}>
                                            {isRedeeming ? 'Validating...' : 'Claim Voucher'}
                                        </button>
                                    </form>
                                    <small className="qc-redeem-hint-note">
                                        🔒 Credits are immediately added to your active balance and protected with automatic earliest-expiry tracking.
                                    </small>
                                </div>
                            </div>
                        );
                    })()}

                    {/* 6. PRIVACY CENTER */}
                    {activeTab === 'privacy' && (
                        <div className="qc-privacy-section">
                            <div className="qc-section-heading-row">
                                <div>
                                    <h3>Privacy & Security Center</h3>
                                    <p>Manage your account credentials, security preferences and data privacy.</p>
                                </div>
                            </div>

                            <form className="qc-privacy-form-card" onSubmit={handleUpdateProfile}>
                                <h4>Account Security Settings</h4>
                                <div className="qc-form-group">
                                    <label>Registered Email</label>
                                    <input type="email" value={currentUser.email} disabled />
                                </div>

                                <div className="qc-form-group">
                                    <label>Update Mobile Phone</label>
                                    <input
                                        type="tel"
                                        value={passUpdateForm.phoneUpdate}
                                        onChange={(e) => setPassUpdateForm({ ...passUpdateForm, phoneUpdate: e.target.value })}
                                    />
                                </div>

                                <div className="qc-form-group">
                                    <label>Change Password (Leave blank to keep unchanged)</label>
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        value={passUpdateForm.newPass}
                                        onChange={(e) => setPassUpdateForm({ ...passUpdateForm, newPass: e.target.value })}
                                    />
                                </div>

                                <button type="submit" className="qc-cta-button">
                                    Save Security Preferences
                                </button>
                            </form>
                        </div>
                    )}

                    {/* 7. CUSTOMER SUPPORT & AI CHATBOT */}
                    {activeTab === 'support' && (
                        <div className="qc-support-tab-section">
                            <div className="qc-section-heading-row">
                                <div>
                                    <h3>24x7 Intelligent Customer Support</h3>
                                    <p>
                                        Chat real-time with our AI assistant like a human agent. If unresolved, your inquiry is automatically escalated to an Admin Priority Incident.
                                    </p>
                                </div>
                            </div>

                            {/* Embed SupportChatbot */}
                            <SupportChatbot />
                        </div>
                    )}

                </main>
            </div>
        </section>
    );
}
