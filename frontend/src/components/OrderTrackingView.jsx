import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Truck, Package, Clock, MapPin,
    Printer, Download, ArrowLeft, AlertCircle, XCircle,
    RotateCw, Search, ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { api } from '../utils/api.js';
import { formatProductImage } from '../utils/helpers.js';

export default function OrderTrackingView() {
    const {
        activeTrackingOrder,
        setActiveTrackingOrder,
        orders,
        setCurrentView,
        generateInvoiceForOrder,
        setInvoiceOrder,
        trackOrderByQuery,
        showToast
    } = useApp();

    // Default to latest order if none specifically active
    const order = activeTrackingOrder || (orders.length > 0 ? orders[0] : null);

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTrackId, setSearchTrackId] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [lastUpdatedTime, setLastUpdatedTime] = useState(() => new Date().toLocaleTimeString());

    // 5 Real Milestones
    const MILESTONES = [
        { key: 'placed', label: 'Placed', desc: 'Order received & confirmed', icon: '📝' },
        { key: 'packed', label: 'Packed', desc: 'Prepared & verified at warehouse', icon: '📦' },
        { key: 'shipped', label: 'Shipped', desc: 'Dispatched with courier partner', icon: '🚚' },
        { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Delivery agent is en route', icon: '⚡' },
        { key: 'delivered', label: 'Delivered', desc: 'Arrived at your doorstep', icon: '🎉' }
    ];

    const currentStatus = (order?.status || 'placed').toLowerCase();

    function getStatusIndex(status) {
        if (status === 'processing') return 1; // packed
        if (status === 'cancelled') return -1;
        const idx = MILESTONES.findIndex(m => m.key === status);
        return idx !== -1 ? idx : 0;
    }

    const currentStepIndex = getStatusIndex(currentStatus);

    // Deep-link hydration & URL query sync
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const queryId = params.get('id') || params.get('trackingId');
        if (queryId && (!activeTrackingOrder || (activeTrackingOrder._id !== queryId && activeTrackingOrder.trackingId !== queryId))) {
            trackOrderByQuery(queryId);
        }
    }, []);

    useEffect(() => {
        if (order && (order.trackingId || order._id)) {
            const trackId = order.trackingId || order._id;
            const currentSearch = new URLSearchParams(window.location.search);
            if (currentSearch.get('id') !== trackId) {
                const newUrl = `/tracking?id=${encodeURIComponent(trackId)}`;
                window.history.replaceState({ view: 'tracking' }, '', newUrl);
            }
        }
    }, [order?.trackingId, order?._id]);

    // Refresh live status from backend
    async function handleRefreshStatus() {
        if (!order) return;
        setIsRefreshing(true);
        try {
            const targetId = order._id || order.trackingId;
            const res = await api(`/api/orders/track/${encodeURIComponent(targetId)}`);
            if (res && res.ok && res.order) {
                setActiveTrackingOrder(res.order);
                setLastUpdatedTime(new Date().toLocaleTimeString());
                showToast(`Live status synced: "${res.order.status.replace(/_/g, ' ').toUpperCase()}" 🔄`);
            } else {
                showToast('Status is already up to date');
            }
        } catch (e) {
            showToast('Unable to reach server');
        } finally {
            setIsRefreshing(false);
        }
    }

    // Search another order directly from tracking view
    async function handleSearchOtherOrder(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!searchTrackId.trim()) {
            showToast('Enter an Order ID or Tracking ID');
            return;
        }
        setIsSearching(true);
        const res = await trackOrderByQuery(searchTrackId.trim());
        setIsSearching(false);
        if (res.ok && res.order) {
            setActiveTrackingOrder(res.order);
            setLastUpdatedTime(new Date().toLocaleTimeString());
            setSearchTrackId('');
            showToast('Order loaded successfully! 📦');
        } else {
            showToast(res.msg || 'No order found');
        }
    }

    if (!order) {
        return (
            <section className="qc-tracking-page-section">
                <div className="qc-empty-section-box">
                    <Package size={56} className="qc-empty-icon" />
                    <h3>Track Any QuickCart Order</h3>
                    <p>Enter your Tracking ID (e.g. QC-TRK-XXXXXX) or Order ID to view real-time delivery status.</p>

                    <form onSubmit={handleSearchOtherOrder} className="qc-inline-track-search">
                        <input
                            type="text"
                            placeholder="Enter Tracking ID or Order ID..."
                            value={searchTrackId}
                            onChange={(e) => setSearchTrackId(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={isSearching} className="qc-cta-button">
                            {isSearching ? 'Searching...' : 'Track Order'}
                        </button>
                    </form>

                    <div style={{ marginTop: '20px' }}>
                        <button className="qc-order-action-btn secondary" onClick={() => setCurrentView('home')}>
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    const trackingId = order.trackingId || ('QC-TRK-' + (order._id?.slice(-6) || '849201'));
    const isCancelled = currentStatus === 'cancelled';

    // Status titles & descriptions
    const STATUS_INFO = {
        placed: {
            title: 'Order Placed & Confirmed',
            desc: 'Your order has been recorded in our system and is queued for fulfillment.',
            color: '#2563eb'
        },
        processing: {
            title: 'Processing Order',
            desc: 'Fulfillment center is gathering your items for packaging.',
            color: '#0284c7'
        },
        packed: {
            title: 'Order Packed & Verified',
            desc: 'All items have been carefully inspected, bagged, and sealed for handover.',
            color: '#0d9488'
        },
        shipped: {
            title: 'Dispatched & In Transit',
            desc: 'Shipment has been handed over to the courier partner and is moving towards your city.',
            color: '#6366f1'
        },
        out_for_delivery: {
            title: 'Out for Delivery',
            desc: 'Your package is out with the local delivery executive and arriving at your address today.',
            color: '#f59e0b'
        },
        delivered: {
            title: 'Order Delivered Successfully!',
            desc: 'Package has been delivered to your doorstep. Thank you for shopping with QuickCart!',
            color: '#10b981'
        },
        cancelled: {
            title: 'Order Cancelled',
            desc: 'This order was cancelled. Any payment made or Free Cash applied has been refunded.',
            color: '#ef4444'
        }
    };

    const currentStatusDetails = STATUS_INFO[currentStatus] || STATUS_INFO.placed;

    return (
        <section id="trackingPage" className="qc-tracking-page-section">
            {/* Top Back Nav & Actions */}
            <div className="qc-tracking-header-row">
                <button className="qc-back-btn" onClick={() => setCurrentView('orders')}>
                    <ArrowLeft size={16} /> <span>Back to My Orders</span>
                </button>

                <div className="qc-tracking-header-right">
                    <button
                        className="qc-track-refresh-btn"
                        onClick={handleRefreshStatus}
                        disabled={isRefreshing}
                        title="Click to check updated status immediately"
                    >
                        <RotateCw size={13} className={isRefreshing ? 'spin' : ''} />
                        <span>{isRefreshing ? 'Syncing...' : 'Refresh Status'}</span>
                    </button>
                </div>
            </div>

            {/* Hero Live Status Card */}
            <div
                className={`qc-tracking-hero-card ${isCancelled ? 'cancelled' : ''}`}
                style={{
                    background: isCancelled
                        ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)'
                        : currentStatus === 'delivered'
                            ? 'linear-gradient(135deg, #065f46 0%, #10b981 100%)'
                            : currentStatus === 'out_for_delivery'
                                ? 'linear-gradient(135deg, #b45309 0%, #f59e0b 100%)'
                                : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
                }}
            >
                <div className="qc-hero-eta-left">
                    <div className="qc-hero-top-badge-row">
                        <span className="qc-status-capsule-badge">
                            {currentStatus.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="qc-hero-sync-time">
                            Updated: {lastUpdatedTime}
                        </span>
                    </div>

                    <h3 className="qc-eta-title">
                        {currentStatusDetails.title}
                    </h3>
                    <p className="qc-eta-subtitle">
                        {currentStatusDetails.desc}
                    </p>
                </div>

                <div className="qc-hero-eta-right">
                    <div className="qc-tracking-id-box">
                        <small>Tracking ID</small>
                        <strong>{trackingId}</strong>
                    </div>
                </div>
            </div>

            {/* Stepper or Cancelled Alert */}
            {isCancelled ? (
                <div className="qc-tracking-cancelled-banner">
                    <XCircle size={28} className="qc-cancel-icon" />
                    <div>
                        <h4>This Order Has Been Cancelled</h4>
                        <p>Items have been returned to warehouse inventory. If payment was completed, refunds are credited back to your account/wallet.</p>
                    </div>
                </div>
            ) : (
                <div className="qc-milestone-stepper-card">
                    <div className="qc-stepper-timeline">
                        {MILESTONES.map((step, idx) => {
                            const isCompleted = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;

                            return (
                                <div
                                    key={step.key}
                                    className={`qc-timeline-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                                >
                                    <div className="qc-timeline-marker">
                                        {isCompleted ? (
                                            <CheckCircle2 size={22} className="qc-marker-check" />
                                        ) : (
                                            <div className="qc-marker-pending">{idx + 1}</div>
                                        )}
                                    </div>

                                    <div className="qc-timeline-info">
                                        <span className="qc-step-icon">{step.icon}</span>
                                        <h4 className="qc-step-label">{step.label}</h4>
                                        <p className="qc-step-desc">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Two-Column Shipment & Delivery Details Grid */}
            <div className="qc-tracking-details-grid">
                {/* 1. Delivery Address Card */}
                <div className="qc-tracking-info-card">
                    <div className="qc-card-title-row">
                        <MapPin size={18} className="qc-card-icon" />
                        <h4>Delivery Address</h4>
                    </div>
                    <div className="qc-card-content-block">
                        <strong className="qc-recipient-name">
                            {order.customerName || order.address?.name || 'Customer'}
                        </strong>
                        <p className="qc-address-lines">
                            {order.address?.line1} {order.address?.line2 ? `, ${order.address.line2}` : ''}
                        </p>
                        <p className="qc-address-city">
                            {order.address?.city}, {order.address?.state} - <strong>{order.address?.pincode}</strong>
                        </p>
                        <p className="qc-address-country">{order.address?.country || 'India'}</p>
                        {order.address?.phone && (
                            <p className="qc-address-phone">
                                Phone: <span>{order.address.phone}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* 2. Order & Payment Info Card */}
                <div className="qc-tracking-info-card">
                    <div className="qc-card-title-row">
                        <Package size={18} className="qc-card-icon" />
                        <h4>Order Details</h4>
                    </div>
                    <div className="qc-card-content-block">
                        <div className="qc-info-row">
                            <span>Order ID:</span>
                            <strong>#{order._id?.slice(-8) || order._id}</strong>
                        </div>
                        <div className="qc-info-row">
                            <span>Tracking ID:</span>
                            <strong>{trackingId}</strong>
                        </div>
                        <div className="qc-info-row">
                            <span>Placed On:</span>
                            <span>
                                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className="qc-info-row">
                            <span>Payment Method:</span>
                            <strong className="qc-payment-method-tag">
                                {(order.paymentMethod || 'COD').toUpperCase()}
                            </strong>
                        </div>
                        {order.paymentId && (
                            <div className="qc-info-row">
                                <span>Payment Ref:</span>
                                <small>{order.paymentId}</small>
                            </div>
                        )}
                        <div className="qc-info-row">
                            <span>Fulfillment:</span>
                            <span className="qc-verified-pill">
                                <ShieldCheck size={12} /> Assured Warehouse Logistics
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items & Cost Breakdown Card */}
            <div className="qc-tracking-summary-card">
                <div className="qc-summary-card-header">
                    <h4>Shipment Items ({order.items?.length || 0})</h4>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            className="qc-order-action-btn secondary small"
                            onClick={(e) => {
                                if (e && e.stopPropagation) e.stopPropagation();
                                setInvoiceOrder(order);
                            }}
                            title="View Official Tax Invoice"
                        >
                            <Printer size={13} />
                            <span>View Invoice</span>
                        </button>
                        <button
                            className="qc-order-action-btn secondary small"
                            onClick={(e) => generateInvoiceForOrder(order, e)}
                            title="Download Tax Invoice as PDF"
                        >
                            <Download size={13} />
                            <span>Download PDF</span>
                        </button>
                    </div>
                </div>

                <div className="qc-summary-items-list">
                    {order.items?.map((item, idx) => (
                        <div key={idx} className="qc-summary-item-row">
                            <img
                                src={formatProductImage(item.image)}
                                alt={item.name}
                                className="qc-summary-item-img"
                                onError={(e) => {
                                    if (!e.target.dataset.tried) {
                                        e.target.dataset.tried = 'true';
                                        e.target.src = '/assets/banana.jpg';
                                    }
                                }}
                            />
                            <div className="qc-summary-item-info">
                                <h5>{item.name}</h5>
                                <span className="qc-summary-item-subcat">{item.category} • {item.subcategory}</span>
                            </div>
                            <div className="qc-summary-item-pricing">
                                <span>₹{item.price} × {item.qty}</span>
                                <strong>₹{item.price * item.qty}</strong>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Price Breakdown Footer */}
                <div className="qc-summary-price-breakdown">
                    <div className="qc-breakdown-row">
                        <span>Items Subtotal:</span>
                        <span>₹{order.subtotal}</span>
                    </div>
                    {order.couponCode && (
                        <div className="qc-breakdown-row green">
                            <span>Coupon Savings ({order.couponCode}):</span>
                            <span>-₹{order.couponDiscount}</span>
                        </div>
                    )}
                    {order.freeCashUsed > 0 && (
                        <div className="qc-breakdown-row green">
                            <span>Free Cash Wallet Applied:</span>
                            <span>-₹{order.freeCashUsed}</span>
                        </div>
                    )}
                    <div className="qc-breakdown-row">
                        <span>Delivery Fee:</span>
                        <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
                    </div>
                    <div className="qc-breakdown-row total">
                        <strong>Total Paid (via {(order.paymentMethod || 'COD').toUpperCase()}):</strong>
                        <strong>₹{order.total}</strong>
                    </div>
                </div>
            </div>
        </section>
    );
}
