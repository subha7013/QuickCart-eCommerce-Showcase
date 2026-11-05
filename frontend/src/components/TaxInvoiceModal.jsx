import React from 'react';
import { Printer, X } from 'lucide-react';
import { printInvoiceDocument } from '../utils/helpers.js';
import { useApp } from '../context/AppContext.jsx';

export default function TaxInvoiceModal() {
    const { invoiceOrder, setInvoiceOrder, currentUser, profilePhone } = useApp();
    const onClose = () => setInvoiceOrder(null);

    if (!invoiceOrder) return null;

    return (
        <div className="invoice-modal-backdrop" onClick={(e) => { if (e.target.className === 'invoice-modal-backdrop') onClose(); }}>
            <div className="invoice-modal-card">
                <div className="invoice-modal-toolbar no-print">
                    <div className="invoice-toolbar-title">
                        <Printer size={18} />
                        <span>Official Tax Invoice Preview</span>
                    </div>
                    <div className="invoice-toolbar-actions">
                        <button className="invoice-print-btn" onClick={() => printInvoiceDocument(invoiceOrder, currentUser, profilePhone)}>
                            <Printer size={15} /> Print / Save PDF
                        </button>
                        <button className="invoice-close-btn" onClick={onClose}>
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="printable-tax-invoice">
                    {/* Header Section */}
                    <div className="invoice-header">
                        <div className="invoice-brand-block">
                            <h1 className="invoice-brand-title">🛒 QuickCart</h1>
                            <p className="invoice-brand-sub">Express Supermarket & Daily Essentials</p>
                            <p className="invoice-legal-info">GSTIN: 19AAACQ1234F1Z5 | FSSAI Lic: 12823019000456</p>
                            <p className="invoice-legal-info">Support: support@quickcart.com | Web: www.quickcart.com</p>
                        </div>
                        <div className="invoice-type-badge">
                            <h2>TAX INVOICE</h2>
                            <span className="cash-memo-label">ORIGINAL FOR RECIPIENT</span>
                        </div>
                    </div>

                    <hr className="invoice-divider" />

                    {/* Meta & Address Grid */}
                    <div className="invoice-meta-grid">
                        <div className="invoice-meta-col">
                            <h4>Order Information</h4>
                            <p><strong>Invoice No:</strong> INV-{String(invoiceOrder._id || invoiceOrder.id || invoiceOrder.orderRef || '001').slice(-8).toUpperCase()}</p>
                            <p><strong>Order Ref:</strong> {String(invoiceOrder.orderRef || invoiceOrder._id || 'N/A')}</p>
                            <p><strong>Order Date:</strong> {(() => {
                                const rawDate = invoiceOrder.createdAt || invoiceOrder.date;
                                if (!rawDate) return new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
                                const d = new Date(rawDate);
                                return isNaN(d.getTime()) ? String(rawDate) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                            })()}</p>
                            {invoiceOrder.status?.toLowerCase() === 'delivered' && (
                                <p><strong>Delivery Date:</strong> <span style={{ color: '#16a34a', fontWeight: 700 }}>
                                    {(() => {
                                        const delRaw = invoiceOrder.deliveredAt || invoiceOrder.updatedAt || invoiceOrder.createdAt || invoiceOrder.date;
                                        if (!delRaw) return 'Delivered';
                                        const d = new Date(delRaw);
                                        return isNaN(d.getTime()) ? String(delRaw) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                                    })()}
                                </span></p>
                            )}
                        </div>
                        <div className="invoice-meta-col">
                            <h4>Billed & Delivered To</h4>
                            <p><strong>Customer Name:</strong> {invoiceOrder.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Valued Customer')}</p>
                            <p><strong>Contact Phone:</strong> {invoiceOrder.phone || profilePhone || 'N/A'}</p>
                            <p><strong>Delivery Address:</strong> {invoiceOrder.address || 'N/A'}{invoiceOrder.city ? `, ${invoiceOrder.city}` : ''}{invoiceOrder.zip ? ` - ${invoiceOrder.zip}` : ''}</p>
                            <p><strong>Payment Method:</strong> {invoiceOrder.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : `Online / ${invoiceOrder.paymentMethod ? String(invoiceOrder.paymentMethod).toUpperCase() : 'Prepaid'}`}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="invoice-items-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item Description</th>
                                <th style={{ textAlign: 'center' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Unit Price</th>
                                <th style={{ textAlign: 'right' }}>Total (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(invoiceOrder.items || []).map((item, idx) => {
                                const qty = Number(item.qty || item.quantity) || 1;
                                const price = Number(item.price) || 0;
                                const itemTotal = qty * price;
                                const fallbackProductLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 24 24' fill='%23eff6ff' stroke='%232563eb' stroke-width='1.5'%3E%3Cpath d='m7.5 4.27 9 5.15'/%3E%3Cpath d='M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z'/%3E%3Cpath d='m3.3 7 8.7 5 8.7-5'/%3E%3Cpath d='M12 22V12'/%3E%3C/svg%3E";
                                const imgUrl = item.image ? (item.image.startsWith('http') ? item.image : `${window.location.origin}${item.image}`) : fallbackProductLogo;
                                return (
                                    <tr key={idx}>
                                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <img
                                                    src={imgUrl}
                                                    alt={item.name}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = fallbackProductLogo;
                                                    }}
                                                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', flexShrink: 0 }}
                                                />
                                                <div>
                                                    <strong style={{ color: '#0f172a', display: 'block' }}>{item.name || 'Product'}</strong>
                                                    {item.subcategory && <small style={{ color: '#64748b' }}>Category: {item.subcategory}</small>}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{qty}</td>
                                        <td style={{ textAlign: 'right' }}>₹{price.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right' }}>₹{itemTotal.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Summary Calculations */}
                    <div className="invoice-summary-wrapper">
                        <div className="invoice-notes-block">
                            <h5>Terms & Information:</h5>
                            <ul>
                                <li>This is a computer-generated tax invoice and requires no physical signature.</li>
                                <li>Includes applicable GST and express local delivery charges.</li>
                                <li>For support or returns, reach out within 24 hours of delivery.</li>
                            </ul>
                        </div>

                        <div className="invoice-totals-block">
                            {(() => {
                                const subtotal = (invoiceOrder.items || []).reduce((acc, item) => acc + ((Number(item.qty || item.quantity) || 1) * (Number(item.price) || 0)), 0);
                                const delivery = invoiceOrder.deliveryFee !== undefined ? Number(invoiceOrder.deliveryFee) || 0 : (subtotal >= 500 ? 0 : 40);
                                const discount = Number(invoiceOrder.couponDiscount || invoiceOrder.discountAmount) || 0;
                                const grandTotal = Number(invoiceOrder.total || invoiceOrder.totalAmount) || (subtotal + delivery - discount);

                                return (
                                    <>
                                        <div className="summary-row">
                                            <span>Items Subtotal:</span>
                                            <span>₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="summary-row">
                                            <span>Delivery Charge:</span>
                                            <span>{delivery === 0 ? <strong style={{ color: '#16a34a' }}>FREE</strong> : `₹${delivery.toFixed(2)}`}</span>
                                        </div>
                                        {discount > 0 && (
                                            <div className="summary-row discount">
                                                <span>Coupon Discount ({invoiceOrder.couponCode || 'APPLIED'}):</span>
                                                <span>-₹{discount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <hr />
                                        <div className="summary-row grand-total">
                                            <span>Grand Total:</span>
                                            <span>₹{grandTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="payment-status-badge">
                                            <span>Payment Status:</span>
                                            <strong className={invoiceOrder.paymentMethod === 'cod' ? 'status-cod' : 'status-paid'}>
                                                {invoiceOrder.paymentMethod === 'cod' ? 'PAY ON DELIVERY' : 'PAID IN FULL'}
                                            </strong>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Footer Banner */}
                    <div className="invoice-footer-banner">
                        <p>Thank you for shopping with QuickCart! 🙏</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
