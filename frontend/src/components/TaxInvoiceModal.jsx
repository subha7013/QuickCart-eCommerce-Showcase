import React from 'react';
import { Download, X, Truck, ExternalLink, ShieldCheck, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { downloadInvoicePdf, getInvoiceDetails, formatProductImage } from '../utils/helpers.js';
import { useApp } from '../context/AppContext.jsx';

export default function TaxInvoiceModal() {
    const { invoiceOrder, setInvoiceOrder, currentUser, profilePhone, setCurrentView, setActiveTrackingOrder, setSearchTerm } = useApp();
    const onClose = () => setInvoiceOrder(null);

    if (!invoiceOrder) return null;

    const inv = getInvoiceDetails(invoiceOrder, currentUser, profilePhone);
    if (!inv) return null;

    function handleNavigateTracking(e) {
        if (e && e.preventDefault) e.preventDefault();
        setActiveTrackingOrder(invoiceOrder);
        const trackingQuery = invoiceOrder.trackingId
            ? `id=${encodeURIComponent(invoiceOrder.trackingId)}`
            : (invoiceOrder._id ? `id=${encodeURIComponent(invoiceOrder._id)}` : '');
        setCurrentView('tracking', { query: trackingQuery });
        onClose();
    }

    function handleNavigateHome(e) {
        if (e && e.preventDefault) e.preventDefault();
        setCurrentView('home');
        onClose();
    }

    function handleNavigateProduct(e, item) {
        if (e && e.preventDefault) e.preventDefault();
        if (setSearchTerm && item?.name) {
            setSearchTerm(item.name);
        }
        setCurrentView('home');
        onClose();
    }

    const fallbackProductLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 24 24' fill='%23eff6ff' stroke='%232563eb' stroke-width='1.5'%3E%3Cpath d='m7.5 4.27 9 5.15'/%3E%3Cpath d='M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z'/%3E%3Cpath d='m3.3 7 8.7 5 8.7-5'/%3E%3Cpath d='M12 22V12'/%3E%3C/svg%3E";

    return (
        <div className="invoice-modal-backdrop" onClick={(e) => { if (e.target.className === 'invoice-modal-backdrop') onClose(); }}>
            <div className="invoice-modal-card" onClick={(e) => e.stopPropagation()}>
                {/* Top Action Toolbar */}
                <div className="invoice-modal-toolbar no-print">
                    <div className="invoice-toolbar-title">
                        <Download size={18} />
                        <span>Official Tax Invoice — {inv.invoiceNo}</span>
                    </div>
                    <div className="invoice-toolbar-actions">
                        <button
                            className="invoice-print-btn"
                            onClick={() => downloadInvoicePdf(invoiceOrder, currentUser, profilePhone)}
                            title="Download official PDF copy"
                        >
                            <Download size={15} />
                            <span>Download PDF</span>
                        </button>
                        <button className="invoice-close-btn" onClick={onClose} aria-label="Close invoice">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="printable-tax-invoice">
                    {/* Header Section */}
                    <div className="invoice-header">
                        <div className="invoice-brand-block">
                            <div className="invoice-brand-logo-row">
                                <a href="/" onClick={handleNavigateHome} className="invoice-brand-title">
                                    🛒 QuickCart
                                </a>
                                <span className="invoice-brand-pill">⚡ 10-Min Superstore</span>
                            </div>
                            <p className="invoice-brand-sub">Express Supermarket & Instant Daily Essentials</p>
                            <p className="invoice-legal-info">GSTIN: 19AAACQ1234F1Z5 | FSSAI Lic: 12823019000456</p>
                            <p className="invoice-legal-info">
                                <span>Support: support@quickcart.com</span>
                                <span className="invoice-dot-sep">•</span>
                                <span>Web: <a href="/" onClick={handleNavigateHome} className="invoice-inline-link">{inv.storeOrigin.replace(/^https?:\/\//, '')}</a></span>
                            </p>
                        </div>

                        <div className="invoice-type-badge">
                            <h2>TAX INVOICE</h2>
                            <span className="cash-memo-label">ORIGINAL FOR RECIPIENT</span>
                            {inv.trackingId && (
                                <a
                                    href={inv.trackingRoute}
                                    onClick={handleNavigateTracking}
                                    className="invoice-live-track-badge"
                                    title="View real-time delivery status"
                                >
                                    <Truck size={12} />
                                    <span>Track Order Live ↗</span>
                                </a>
                            )}
                        </div>
                    </div>

                    <hr className="invoice-divider" />

                    {/* Metadata & Customer Address Grid */}
                    <div className="invoice-meta-grid">
                        {/* Column 1: Order Information */}
                        <div className="invoice-meta-col">
                            <h4>Order Information</h4>
                            <div className="invoice-meta-item">
                                <span className="meta-label">Invoice No:</span>
                                <strong className="meta-val highlight">{inv.invoiceNo}</strong>
                            </div>
                            <div className="invoice-meta-item">
                                <span className="meta-label">Tracking ID:</span>
                                <span className="meta-val">{inv.trackingId || inv.orderRef}</span>
                            </div>
                            <div className="invoice-meta-item">
                                <span className="meta-label">Order Date:</span>
                                <span className="meta-val">{inv.orderDateStr}</span>
                            </div>
                            <div className="invoice-meta-item">
                                <span className="meta-label">Order Status:</span>
                                <span className={`invoice-status-chip ${inv.status}`}>
                                    {inv.status.replace(/_/g, ' ').toUpperCase()}
                                </span>
                            </div>
                            <div className="invoice-meta-item">
                                <span className="meta-label">Payment Method:</span>
                                <span className="meta-val">{inv.paymentMethod}</span>
                            </div>
                        </div>

                        {/* Column 2: Billed & Delivered To (Uses Address Name, Not Account Name) */}
                        <div className="invoice-meta-col">
                            <h4>Billed & Delivered To</h4>
                            <div className="invoice-meta-item">
                                <span className="meta-label">Customer Name:</span>
                                <strong className="meta-val customer-name">{inv.billingName}</strong>
                            </div>
                            <div className="invoice-meta-item">
                                <span className="meta-label">Contact Phone:</span>
                                <span className="meta-val">{inv.phone}</span>
                            </div>
                            <div className="invoice-meta-item address-item">
                                <span className="meta-label">Delivery Address:</span>
                                <div className="meta-val address-block">
                                    {inv.street && <p className="addr-line">{inv.street}</p>}
                                    <p className="addr-line">
                                        {[inv.city, inv.state].filter(Boolean).join(', ')}
                                        {inv.pincode ? ` - ${inv.pincode}` : ''}
                                    </p>
                                    <p className="addr-line country">{inv.country}</p>
                                    {inv.fullAddress && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([inv.street, inv.city, inv.pincode, inv.country].filter(Boolean).join(', '))}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="invoice-map-link no-print"
                                            title="Open delivery location in Maps"
                                        >
                                            <MapPin size={12} />
                                            <span>View Address on Maps ↗</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="invoice-table-responsive-wrap">
                        <table className="invoice-items-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                                    <th>Item & Description</th>
                                    <th style={{ width: '70px', textAlign: 'center' }}>Qty</th>
                                    <th style={{ width: '110px', textAlign: 'right' }}>Unit Price</th>
                                    <th style={{ width: '120px', textAlign: 'right' }}>Total (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inv.items.map((item, idx) => (
                                    <tr key={item.id || idx}>
                                        <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                                        <td>
                                            <div className="invoice-prod-cell">
                                                <a
                                                    href={`/?search=${encodeURIComponent(item.name)}`}
                                                    onClick={(e) => handleNavigateProduct(e, item)}
                                                    className="invoice-prod-img-wrap"
                                                    title={`View "${item.name}" in store`}
                                                >
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="invoice-prod-thumb"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = fallbackProductLogo;
                                                        }}
                                                    />
                                                </a>
                                                <div className="invoice-prod-info">
                                                    <a
                                                        href={`/?search=${encodeURIComponent(item.name)}`}
                                                        onClick={(e) => handleNavigateProduct(e, item)}
                                                        className="invoice-prod-name-link"
                                                        title={`View "${item.name}" in store`}
                                                    >
                                                        <strong className="invoice-prod-name">{item.name}</strong>
                                                    </a>
                                                    {item.description && (
                                                        <span className="invoice-prod-desc">{item.description}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.qty}</td>
                                        <td style={{ textAlign: 'right', color: '#475569' }}>₹{item.price.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Calculations & Notes */}
                    <div className="invoice-summary-wrapper">
                        {/* Terms & Quick Actions */}
                        <div className="invoice-notes-block">
                            <h5>Terms & Verification:</h5>
                            <ul>
                                <li>This is a computer-generated official tax invoice; no physical signature is required.</li>
                                <li>Prices are inclusive of applicable GST (CGST ₹{inv.cgst} + SGST ₹{inv.sgst}).</li>
                                <li>Includes 10-minute express doorstep fulfillment & quality assurance.</li>
                                <li>For queries or returns, please reach out via 24x7 Support within 24 hours.</li>
                            </ul>
                            <div className="invoice-quick-routes">
                                <button
                                    type="button"
                                    className="invoice-route-btn"
                                    onClick={handleNavigateTracking}
                                >
                                    <Truck size={14} />
                                    <span>View Real-Time Tracking Stepper ↗</span>
                                </button>
                            </div>
                        </div>

                        {/* Totals Summary */}
                        <div className="invoice-totals-block">
                            <div className="summary-row">
                                <span>Items Subtotal:</span>
                                <span>₹{inv.subtotal.toFixed(2)}</span>
                            </div>

                            <div className="summary-row">
                                <span>Express Delivery Fee:</span>
                                <span>
                                    {inv.deliveryFee === 0 ? (
                                        <strong style={{ color: '#16a34a' }}>FREE</strong>
                                    ) : (
                                        `₹${inv.deliveryFee.toFixed(2)}`
                                    )}
                                </span>
                            </div>

                            {inv.couponDiscount > 0 && (
                                <div className="summary-row discount">
                                    <span>Coupon Discount ({inv.couponCode || 'PROMO'}):</span>
                                    <span>-₹{inv.couponDiscount.toFixed(2)}</span>
                                </div>
                            )}

                            {inv.freeCashUsed > 0 && (
                                <div className="summary-row discount">
                                    <span>Free Cash Wallet Used:</span>
                                    <span>-₹{inv.freeCashUsed.toFixed(2)}</span>
                                </div>
                            )}

                            <hr className="summary-divider" />

                            <div className="summary-row grand-total">
                                <span>Grand Total:</span>
                                <span className="total-amount">₹{inv.grandTotal.toFixed(2)}</span>
                            </div>

                            <div className="payment-status-badge">
                                <span className="status-title">Payment Status:</span>
                                <strong className={inv.isCod ? 'status-cod' : 'status-paid'}>
                                    {inv.paymentStatus}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* Footer Banner */}
                    <div className="invoice-footer-banner">
                        <p>Thank you for shopping with <strong>QuickCart</strong>! Delivering joy in 10 minutes. 🙏</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
