export function calculateDeliveryFee(subtotal) {
    if (subtotal >= 199) {
        return 0;
    } else if (subtotal >= 100) {
        return 20;
    } else {
        return 40;
    }
}

export function formatDate(dateVal) {
    if (!dateVal) return new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? String(dateVal) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function safeNum(val) {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
}

export function printInvoiceDocument(order, currentUser = null, profilePhone = '') {
    if (!order) return;
    const invoiceNo = 'INV-' + String(order._id || order.id || order.orderRef || '001').slice(-8).toUpperCase();
    const orderRef = String(order.orderRef || order._id || 'N/A');
    
    // Dates
    const rawDate = order.createdAt || order.date;
    let orderDateStr = 'N/A';
    if (rawDate) {
        const d = new Date(rawDate);
        orderDateStr = isNaN(d.getTime()) ? String(rawDate) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    } else {
        orderDateStr = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    }

    const statusNorm = (order.status || 'placed').toLowerCase();
    let deliveryDateStr = null;
    if (statusNorm === 'delivered') {
        const delRaw = order.deliveredAt || order.updatedAt || rawDate;
        if (delRaw) {
            const d = new Date(delRaw);
            deliveryDateStr = isNaN(d.getTime()) ? String(delRaw) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
        } else {
            deliveryDateStr = 'Delivered';
        }
    }

    const customerName = order.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Valued Customer');
    const customerPhone = order.phone || profilePhone || 'N/A';
    const deliveryAddress = (order.address || 'N/A') + (order.city ? `, ${order.city}` : '') + (order.zip ? ` - ${order.zip}` : '');

    const items = order.items || [];
    const subtotal = items.reduce((acc, item) => acc + ((Number(item.qty || item.quantity) || 1) * (Number(item.price) || 0)), 0);
    const deliveryFee = order.deliveryFee !== undefined ? Number(order.deliveryFee) || 0 : (subtotal >= 500 ? 0 : 40);
    const discount = Number(order.couponDiscount || order.discountAmount) || 0;
    const grandTotal = Number(order.total || order.totalAmount) || (subtotal + deliveryFee - discount);

    const isCod = order.paymentMethod === 'cod';

    const fallbackProductLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44' viewBox='0 0 24 24' fill='%23eff6ff' stroke='%232563eb' stroke-width='1.5'%3E%3Cpath d='m7.5 4.27 9 5.15'/%3E%3Cpath d='M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z'/%3E%3Cpath d='m3.3 7 8.7 5 8.7-5'/%3E%3Cpath d='M12 22V12'/%3E%3C/svg%3E";

    const itemsHtml = items.map((item, idx) => {
        const qty = Number(item.qty || item.quantity) || 1;
        const price = Number(item.price) || 0;
        const total = qty * price;
        const imgUrl = item.image ? (item.image.startsWith('http') ? item.image : `${window.location.origin}${item.image}`) : fallbackProductLogo;

        return `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${imgUrl}" alt="${item.name || 'Product'}" onerror="this.onerror=null;this.src='${fallbackProductLogo}';" style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; background: #f8fafc; display: block;" />
                        <div>
                            <strong style="color: #0f172a; display: block; font-size: 0.9rem;">${item.name || 'Product'}</strong>
                            ${item.subcategory ? `<span style="font-size: 0.75rem; color: #64748b;">Category: ${item.subcategory}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: 600;">${qty}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${price.toFixed(2)}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 700;">₹${total.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Tax Invoice - ${invoiceNo}</title>
            <meta charset="utf-8" />
            <style>
                body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a; margin: 0; padding: 24px; background: #ffffff; }
                .invoice-card { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 28px; background: #ffffff; }
                .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                .brand-title { font-size: 26px; font-weight: 800; color: #16a34a; margin: 0 0 4px 0; }
                .brand-sub { font-size: 14px; font-weight: 600; color: #475569; margin: 0 0 6px 0; }
                .legal-info { font-size: 12px; color: #64748b; margin: 2px 0; }
                .invoice-badge { text-align: right; }
                .invoice-badge h2 { font-size: 22px; font-weight: 900; margin: 0; color: #0f172a; }
                .cash-label { display: inline-block; background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; border: 1px solid #cbd5e1; margin-top: 4px; }
                .divider { border: none; border-top: 2px dashed #cbd5e1; margin: 18px 0; }
                .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 16px; border-radius: 10px; border: 1px solid #e2e8f0; margin-bottom: 20px; }
                .meta-col h4 { margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
                .meta-col p { margin: 4px 0; font-size: 13px; color: #334155; line-height: 1.4; }
                .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .table th { background: #0f172a; color: #ffffff; font-size: 12px; font-weight: 700; text-transform: uppercase; padding: 10px; text-align: left; }
                .summary-container { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; margin-bottom: 20px; }
                .notes { background: #f1f5f9; padding: 14px; border-radius: 8px; border-left: 4px solid #3b82f6; font-size: 12px; color: #475569; }
                .notes h5 { margin: 0 0 6px 0; font-size: 13px; color: #1e293b; }
                .notes ul { margin: 0; padding-left: 16px; }
                .totals { background: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 10px; }
                .row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #334155; }
                .row.grand { font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 8px; }
                .row.discount { color: #16a34a; font-weight: 600; }
                .status-paid { background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 12px; }
                .status-cod { background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 12px; }
                .footer-banner { text-align: center; border-top: 2px solid #0f172a; padding-top: 14px; margin-top: 14px; }
                .footer-banner p { font-size: 15px; font-weight: 700; color: #16a34a; margin: 0; }
            </style>
        </head>
        <body>
            <div class="invoice-card">
                <div class="header">
                    <div>
                        <h1 class="brand-title">🛒 QuickCart</h1>
                        <p class="brand-sub">Express Supermarket & Daily Essentials</p>
                        <p class="legal-info">GSTIN: 19AAACQ1234F1Z5 | FSSAI Lic: 12823019000456</p>
                        <p class="legal-info">Support: support@quickcart.com | Web: www.quickcart.com</p>
                    </div>
                    <div class="invoice-badge">
                        <h2>TAX INVOICE</h2>
                        <span class="cash-label">ORIGINAL FOR RECIPIENT</span>
                    </div>
                </div>

                <hr class="divider" />

                <div class="meta-grid">
                    <div class="meta-col">
                        <h4>Order Details</h4>
                        <p><strong>Invoice No:</strong> ${invoiceNo}</p>
                        <p><strong>Order Ref:</strong> ${orderRef}</p>
                        <p><strong>Order Date:</strong> ${orderDateStr}</p>
                        ${deliveryDateStr ? `<p><strong>Delivery Date:</strong> <span style="color: #16a34a; font-weight: 700;">${deliveryDateStr}</span></p>` : ''}
                    </div>
                    <div class="meta-col">
                        <h4>Billed & Delivered To</h4>
                        <p><strong>Customer Name:</strong> ${customerName}</p>
                        <p><strong>Phone:</strong> ${customerPhone}</p>
                        <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
                        <p><strong>Payment Method:</strong> ${isCod ? 'Cash on Delivery (COD)' : `Online / ${order.paymentMethod ? String(order.paymentMethod).toUpperCase() : 'Prepaid'}`}</p>
                    </div>
                </div>

                <table class="table">
                    <thead>
                        <tr>
                            <th style="width: 40px; text-align: center;">#</th>
                            <th>Product Description</th>
                            <th style="text-align: center; width: 60px;">Qty</th>
                            <th style="text-align: right; width: 100px;">Price</th>
                            <th style="text-align: right; width: 100px;">Total (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>

                <div class="summary-container">
                    <div class="notes">
                        <h5>Terms & Conditions:</h5>
                        <ul>
                            <li>This is a computer-generated tax invoice and requires no physical signature.</li>
                            <li>Includes applicable GST and local delivery charges.</li>
                            <li>For support or returns, reach out within 24 hours of delivery.</li>
                        </ul>
                    </div>
                    <div class="totals">
                        <div class="row">
                            <span>Items Subtotal:</span>
                            <span>₹${subtotal.toFixed(2)}</span>
                        </div>
                        <div class="row">
                            <span>Delivery Charge:</span>
                            <span>${deliveryFee === 0 ? '<strong style="color: #16a34a;">FREE</strong>' : `₹${deliveryFee.toFixed(2)}`}</span>
                        </div>
                        ${discount > 0 ? `
                            <div class="row discount">
                                <span>Coupon Discount (${order.couponCode || 'APPLIED'}):</span>
                                <span>-₹${discount.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 8px 0;" />
                        <div class="row grand">
                            <span>Grand Total:</span>
                            <span>₹${grandTotal.toFixed(2)}</span>
                        </div>
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 12px; color: #64748b;">Payment Status:</span>
                            <span class="${isCod ? 'status-cod' : 'status-paid'}">${isCod ? 'PAY ON DELIVERY' : 'PAID IN FULL'}</span>
                        </div>
                    </div>
                </div>

                <div class="footer-banner">
                    <p>Thank you for shopping with QuickCart! 🙏</p>
                </div>
            </div>
            <script>
                var hasPrinted = false;
                function triggerSafePrint() {
                    if (hasPrinted) return;
                    hasPrinted = true;
                    setTimeout(function() {
                        window.focus();
                        window.print();
                    }, 250);
                }
                window.addEventListener('load', function() {
                    var imgs = Array.from(document.images);
                    if (!imgs || imgs.length === 0) {
                        triggerSafePrint();
                        return;
                    }
                    Promise.all(imgs.map(function(img) {
                        if (img.complete) return Promise.resolve();
                        return new Promise(function(resolve) {
                            img.onload = resolve;
                            img.onerror = resolve;
                        });
                    })).then(triggerSafePrint);
                });
            </script>
        </body>
        </html>
    `;

    // Render inside a hidden iframe to prevent the main window from turning white
    let iframe = document.getElementById('qc-invoice-print-frame');
    if (iframe) {
        iframe.remove();
    }
    iframe = document.createElement('iframe');
    iframe.id = 'qc-invoice-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    try {
        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
            doc.open();
            doc.write(htmlContent);
            doc.close();
        }
    } catch (e) {
        console.error('Failed to populate print iframe:', e);
    }
}
