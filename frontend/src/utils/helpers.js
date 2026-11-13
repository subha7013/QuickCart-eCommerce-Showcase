export function calculateDeliveryFee(subtotal) {
    if (subtotal >= 199) {
        return 0;
    } else if (subtotal >= 100) {
        return 20;
    } else {
        return 40;
    }
}

export function formatProductImage(rawImage) {
    if (!rawImage || typeof rawImage !== 'string') {
        return '/assets/banana.jpg';
    }
    let img = rawImage.trim();
    if (!img) return '/assets/banana.jpg';

    // Data URLs (Base64) - preserve as-is
    if (img.startsWith('data:image/')) {
        return img;
    }

    // Direct HTTP / HTTPS URLs - preserve as-is
    if (img.startsWith('http://') || img.startsWith('https://')) {
        return img;
    }

    // Normalize Windows backslashes
    img = img.replace(/\\/g, '/');

    // Strip leading ./ or /
    img = img.replace(/^(\.\/|\/)+/, '');

    // Strip redundant repository or build paths
    img = img.replace(/^(frontend\/public\/|frontend\/|public\/)/i, '');

    // Fix plural typos (potatoes.jpg -> potato.jpg, etc.)
    if (img === 'assets/potatoes.jpg' || img === 'potatoes.jpg') {
        return '/assets/potato.jpg';
    }
    if (img === 'assets/blacktee.jpg' || img === 'blacktee.jpg') {
        return '/assets/Tshirts1.jpg';
    }

    // Ensure leading slash if starting with assets/, uploads/, images/, static/
    if (img.startsWith('assets/') || img.startsWith('uploads/') || img.startsWith('images/') || img.startsWith('static/')) {
        return '/' + img;
    }

    if (img.startsWith('banner')) {
        return '/' + img;
    }

    // Bare filenames (e.g. "mango.jpg", "banana.jpg")
    return '/assets/' + img;
}

export const AVAILABLE_STORE_ASSETS = [
    { label: '🥭 Alphonso Mango', path: '/assets/mango.jpg', category: 'Groceries' },
    { label: '🍌 Daily Fresh Banana', path: '/assets/banana.jpg', category: 'Groceries' },
    { label: '🍎 Fresh Apple', path: '/assets/apple.jpg', category: 'Groceries' },
    { label: '🥔 Fresh Potato', path: '/assets/potato.jpg', category: 'Groceries' },
    { label: '🍅 Organic Tomato', path: '/assets/tomato.jpg', category: 'Groceries' },
    { label: '🍆 Fresh Brinjal', path: '/assets/brinjal.jpg', category: 'Groceries' },
    { label: '🧄 Fresh Garlic', path: '/assets/garlic.jpg', category: 'Groceries' },
    { label: '🫚 Fresh Ginger', path: '/assets/ginger.jpg', category: 'Groceries' },
    { label: '🌶️ Bullet Chilli', path: '/assets/chilli2.jpg', category: 'Groceries' },
    { label: '🌶️ Green Chilli', path: '/assets/chilli1.jpg', category: 'Groceries' },
    { label: '🥒 Organic Parwal', path: '/assets/parwal.jpg', category: 'Groceries' },
    { label: '🎃 Sweet Pumpkin', path: '/assets/pumpkin.jpg', category: 'Groceries' },
    { label: '📱 Dual Port Adapter', path: '/assets/charger1.jpg', category: 'Electronics' },
    { label: '📱 Samsung Adapter', path: '/assets/charger2.jpg', category: 'Electronics' },
    { label: '📱 Apple 20W Adapter', path: '/assets/charger3.jpg', category: 'Electronics' },
    { label: '🎧 Realme Buds Q', path: '/assets/earbuds1.jpg', category: 'Electronics' },
    { label: '🎧 Boult Earbuds', path: '/assets/earbuds2.jpg', category: 'Electronics' },
    { label: '🎧 Wireless Earbuds', path: '/assets/earbuds3.jpg', category: 'Electronics' },
    { label: '🎧 Studio Headset 1', path: '/assets/headset1.jpg', category: 'Electronics' },
    { label: '🎧 Studio Headset 2', path: '/assets/headset2.jpg', category: 'Electronics' },
    { label: '📱 Nothing 3a Pro Phone', path: '/assets/nothing.jpg', category: 'Electronics' },
    { label: '🔋 Powerbank 10000mAh', path: '/assets/powerbank1.jpg', category: 'Electronics' },
    { label: '🔋 Powerbank 20000mAh', path: '/assets/powerbank2.jpg', category: 'Electronics' },
    { label: '🔊 Soundbar Express', path: '/assets/soundbar1.jpg', category: 'Electronics' },
    { label: '⌚ Smartwatch Fit', path: '/assets/smartwatch1.jpg', category: 'Electronics' },
    { label: '👕 Roadster T-Shirt', path: '/assets/Tshirts1.jpg', category: 'Fashion' },
    { label: '👟 Campus Running Shoes', path: '/assets/Shoes1.jpg', category: 'Fashion' },
];

export function formatDate(dateVal) {
    if (!dateVal) return new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? String(dateVal) : d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function safeNum(val) {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
}

export function getInvoiceDetails(order, currentUser = null, profilePhone = '') {
    if (!order) return null;

    const addr = (order && typeof order.address === 'object' && order.address)
        || (order && typeof order.shippingAddress === 'object' && order.shippingAddress)
        || (order && typeof order.deliveryAddress === 'object' && order.deliveryAddress)
        || null;

    const rawAddrStr = typeof order?.address === 'string' ? order.address : '';

    // 1. Billing Name: MUST be the name in the address, NOT in the account!
    const billingName = (addr?.name && String(addr.name).trim())
        || (addr?.fullName && String(addr.fullName).trim())
        || (order?.customerName && String(order.customerName).trim())
        || (order?.name && String(order.name).trim())
        || (rawAddrStr && rawAddrStr.split(',')[0]?.trim())
        || (currentUser?.name && String(currentUser.name).trim())
        || (currentUser?.email ? currentUser.email.split('@')[0] : 'Valued Customer');

    // 2. Phone: phone in address or profilePhone or account
    const phone = (addr?.phone && String(addr.phone).trim())
        || (order?.phone && String(order.phone).trim())
        || (profilePhone && String(profilePhone).trim())
        || (currentUser?.phone && String(currentUser.phone).trim())
        || 'N/A';

    // 3. Address Lines & Full Address
    const streetParts = [addr?.line1, addr?.line2, addr?.street, addr?.address].filter(Boolean).map(s => String(s).trim());
    const street = streetParts.join(', ');
    const city = addr?.city ? String(addr.city).trim() : (order?.city || '');
    const state = addr?.state ? String(addr.state).trim() : (order?.state || '');
    const pincode = addr?.pincode || addr?.zip || addr?.postalCode || order?.zip || order?.pincode || '';
    const country = addr?.country || 'India';

    let fullAddress = '';
    if (street || city || state || pincode) {
        const parts = [];
        if (street) parts.push(street);
        if (city) parts.push(city);
        if (state) parts.push(state);
        if (pincode) parts.push(pincode.startsWith('PIN') ? pincode : `PIN: ${pincode}`);
        if (country && country !== 'India') parts.push(country);
        fullAddress = parts.join(', ');
    } else if (rawAddrStr) {
        fullAddress = rawAddrStr;
    } else {
        fullAddress = 'Standard Delivery Address on File';
    }

    // 4. Identification & Dates
    const rawId = String(order.trackingId ? order.trackingId.replace('QC-TRK-', '') : (order._id || order.id || order.orderRef || '001'));
    const invoiceNo = 'INV-' + rawId.slice(-8).toUpperCase();
    const orderRef = String(order.orderRef || order.trackingId || order._id || 'N/A');
    const trackingId = order.trackingId || '';
    const trackingRoute = trackingId ? `/tracking?id=${encodeURIComponent(trackingId)}` : (order._id ? `/tracking?id=${encodeURIComponent(order._id)}` : '/tracking');

    const rawDate = order.createdAt || order.date;
    let orderDateStr = 'N/A';
    if (rawDate) {
        const d = new Date(rawDate);
        orderDateStr = isNaN(d.getTime()) ? String(rawDate) : (d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
    } else {
        orderDateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    // 5. Payment details
    const methodRaw = String(order.paymentMethod || 'cod').toLowerCase();
    const isCod = methodRaw === 'cod';
    let paymentMethod = 'Cash on Delivery (COD)';
    if (methodRaw === 'upi') paymentMethod = 'UPI (Instant Transfer)';
    else if (methodRaw === 'razorpay') paymentMethod = 'Online / Razorpay Secured';
    else if (methodRaw === 'card') paymentMethod = 'Credit / Debit Card';
    else if (methodRaw === 'netbanking') paymentMethod = 'Net Banking';
    else if (!isCod) paymentMethod = `Prepaid (${methodRaw.toUpperCase()})`;

    const paymentStatus = isCod ? 'PAY ON DELIVERY' : 'PAID IN FULL';

    // 6. Items
    const items = (order.items || []).map((item, idx) => {
        const qty = Number(item.qty || item.quantity) || 1;
        const price = Number(item.price) || 0;
        const total = qty * price;
        const name = item.name || 'Product';
        const description = item.description || (item.subcategory ? `${item.category ? item.category + ' • ' : ''}${item.subcategory}` : (item.category || ''));
        const image = formatProductImage(item.image);
        return {
            idx: idx + 1,
            id: item.id || `item-${idx}`,
            name,
            description,
            image,
            qty,
            price,
            total
        };
    });

    // 7. Calculations
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const deliveryFee = order.deliveryFee !== undefined ? Number(order.deliveryFee) : (subtotal >= 199 ? 0 : 40);
    const couponDiscount = Number(order.couponDiscount || order.discountAmount) || 0;
    const freeCashUsed = Number(order.freeCashUsed) || 0;
    const grandTotal = Number(order.total || order.totalAmount) || Math.max(0, subtotal + deliveryFee - couponDiscount - freeCashUsed);

    // GST Breakdown (groceries/essentials 5% total = 2.5% CGST + 2.5% SGST)
    const taxableBase = grandTotal / 1.05;
    const cgst = (taxableBase * 0.025).toFixed(2);
    const sgst = (taxableBase * 0.025).toFixed(2);

    const storeOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://speedmart-order.netlify.app';

    return {
        invoiceNo,
        orderRef,
        trackingId,
        trackingRoute,
        orderDateStr,
        billingName,
        phone,
        street,
        city,
        state,
        pincode,
        country,
        fullAddress,
        isCod,
        paymentMethod,
        paymentStatus,
        paymentId: order.paymentId || (isCod ? 'N/A (Cash on Delivery)' : 'Prepaid'),
        items,
        subtotal,
        deliveryFee,
        couponCode: order.couponCode || '',
        couponDiscount,
        freeCashUsed,
        grandTotal,
        cgst,
        sgst,
        storeOrigin,
        status: (order.status || 'placed').toLowerCase()
    };
}

export function downloadInvoicePdf(order, currentUser = null, profilePhone = '') {
    if (!order) return;
    const inv = getInvoiceDetails(order, currentUser, profilePhone);
    if (!inv) return;

    function cleanText(str) {
        return String(str || '')
            .replace(/\u20B9/g, 'Rs. ')
            .replace(/[^\x20-\x7E]/g, ' ')
            .replace(/\\/g, '\\\\')
            .replace(/\(/g, '\\(')
            .replace(/\)/g, '\\)');
    }

    const customerName = cleanText(inv.billingName);
    const customerPhone = cleanText(inv.phone);
    const fullAddress = cleanText(inv.fullAddress);
    const isCod = inv.isCod;
    const paymentMethod = cleanText(inv.paymentMethod);
    const invoiceNo = cleanText(inv.invoiceNo);
    const orderRef = cleanText(inv.orderRef);
    const trackingId = cleanText(inv.trackingId);
    const orderDateStr = cleanText(inv.orderDateStr);
    const subtotal = inv.subtotal;
    const deliveryFee = inv.deliveryFee;
    const discount = inv.couponDiscount;
    const freeCashUsed = inv.freeCashUsed;
    const grandTotal = inv.grandTotal;
    const items = inv.items;

    let stream = '';

    // Top Header Accent Stripe (QuickCart Green)
    stream += '0.047 0.514 0.122 rg 0 831.89 595.28 10 re f\n';

    // Company Branding (Left)
    stream += 'BT /F2 22 Tf 0.047 0.514 0.122 rg 40 792 Td (QuickCart) Tj ET\n';
    stream += 'BT /F1 9 Tf 0.28 0.33 0.39 rg 40 778 Td (Express 10-Minute Supermarket & Daily Essentials) Tj ET\n';
    stream += 'BT /F1 8 Tf 0.42 0.48 0.55 rg 40 765 Td (GSTIN: 19AAACQ1234F1Z5 | FSSAI Lic: 12823019000456) Tj ET\n';
    stream += 'BT /F1 8 Tf 0.42 0.48 0.55 rg 40 753 Td (Support: support@quickcart.com | Web: ' + cleanText(inv.storeOrigin.replace(/^https?:\/\//, '')) + ') Tj ET\n';

    // Tax Invoice Badge (Right)
    stream += 'BT /F2 18 Tf 0.06 0.09 0.16 rg 420 792 Td (TAX INVOICE) Tj ET\n';
    stream += '0.94 0.96 0.98 rg 420 772 135 14 re f\n';
    stream += '0.8 0.85 0.9 RG 0.5 w 420 772 135 14 re S\n';
    stream += 'BT /F2 7.5 Tf 0.28 0.33 0.39 rg 426 776 Td (ORIGINAL FOR RECIPIENT) Tj ET\n';

    // Top separator
    stream += '0.8 0.85 0.9 RG 1 w 40 740 m 555 740 l S\n';

    // Metadata Card
    stream += '0.97 0.98 0.99 rg 40 645 515 85 re f\n';
    stream += '0.82 0.86 0.9 RG 0.8 w 40 645 515 85 re S\n';
    stream += '0.85 0.89 0.93 RG 0.8 w 295 645 m 295 730 l S\n';

    // Order Info (Left)
    stream += 'BT /F2 9.5 Tf 0.06 0.09 0.16 rg 52 715 Td (ORDER DETAILS) Tj ET\n';
    stream += 'BT /F1 8.5 Tf 0.2 0.25 0.3 rg 52 700 Td (Invoice No: ' + invoiceNo + ') Tj ET\n';
    stream += 'BT /F1 8.5 Tf 0.2 0.25 0.3 rg 52 687 Td (Tracking ID: ' + (trackingId || orderRef) + ') Tj ET\n';
    stream += 'BT /F1 8.5 Tf 0.2 0.25 0.3 rg 52 674 Td (Date: ' + orderDateStr + ') Tj ET\n';
    const statusLabel = cleanText((order.status || 'placed').toUpperCase());
    stream += 'BT /F2 8.5 Tf 0.047 0.514 0.122 rg 52 660 Td (Status: ' + statusLabel + ' | 10-Min Fast Track) Tj ET\n';

    // Customer Info (Right) -> Uses Billing Name from Address!
    stream += 'BT /F2 9.5 Tf 0.06 0.09 0.16 rg 307 715 Td (BILLED & DELIVERED TO) Tj ET\n';
    stream += 'BT /F2 8.5 Tf 0.08 0.12 0.2 rg 307 700 Td (Customer: ' + customerName + ') Tj ET\n';
    stream += 'BT /F1 8.5 Tf 0.2 0.25 0.3 rg 307 687 Td (Phone: ' + customerPhone + ') Tj ET\n';
    const addrLine1 = fullAddress.slice(0, 44);
    const addrLine2 = fullAddress.length > 44 ? fullAddress.slice(44, 88) : '';
    stream += 'BT /F1 8.5 Tf 0.2 0.25 0.3 rg 307 674 Td (Address: ' + addrLine1 + ') Tj ET\n';
    if (addrLine2) {
        stream += 'BT /F1 8.5 Tf 0.2 0.25 0.3 rg 307 662 Td (' + addrLine2 + ') Tj ET\n';
    } else {
        stream += 'BT /F1 8.5 Tf 0.2 0.25 0.3 rg 307 662 Td (Payment: ' + paymentMethod + ') Tj ET\n';
    }

    // Table Header
    stream += '0.06 0.09 0.16 rg 40 615 515 20 re f\n';
    stream += 'BT /F2 8.5 Tf 1 1 1 rg 50 621 Td (#) Tj ET\n';
    stream += 'BT /F2 8.5 Tf 1 1 1 rg 85 621 Td (PRODUCT DESCRIPTION & CATEGORY) Tj ET\n';
    stream += 'BT /F2 8.5 Tf 1 1 1 rg 350 621 Td (QTY) Tj ET\n';
    stream += 'BT /F2 8.5 Tf 1 1 1 rg 410 621 Td (UNIT PRICE) Tj ET\n';
    stream += 'BT /F2 8.5 Tf 1 1 1 rg 495 621 Td (AMOUNT) Tj ET\n';

    // Table Rows
    let curY = 595;
    const rowHeight = 22;
    items.slice(0, 15).forEach((item, idx) => {
        const qty = item.qty;
        const price = item.price;
        const total = item.total;
        const descSuffix = item.description ? (' (' + item.description.slice(0, 18) + ')') : '';
        const name = cleanText(item.name + descSuffix).slice(0, 44);
        if (idx % 2 === 1) {
            stream += '0.97 0.98 0.99 rg 40 ' + (curY - 5) + ' 515 ' + rowHeight + ' re f\n';
        }
        stream += '0.9 0.92 0.95 RG 0.5 w 40 ' + (curY - 5) + ' m 555 ' + (curY - 5) + ' l S\n';
        stream += 'BT /F1 8.5 Tf 0.2 0.25 0.3 rg 50 ' + curY + ' Td (' + (idx + 1) + ') Tj ET\n';
        stream += 'BT /F2 8.5 Tf 0.1 0.15 0.2 rg 85 ' + curY + ' Td (' + name + ') Tj ET\n';
        stream += 'BT /F1 8.5 Tf 0.2 0.25 0.3 rg 355 ' + curY + ' Td (' + qty + ') Tj ET\n';
        stream += 'BT /F1 8.5 Tf 0.2 0.25 0.3 rg 410 ' + curY + ' Td (Rs. ' + price.toFixed(2) + ') Tj ET\n';
        stream += 'BT /F2 8.5 Tf 0.1 0.15 0.2 rg 495 ' + curY + ' Td (Rs. ' + total.toFixed(2) + ') Tj ET\n';
        curY -= rowHeight;
    });

    stream += '0.8 0.85 0.9 RG 1 w 40 ' + (curY - 5) + ' m 555 ' + (curY - 5) + ' l S\n';

    // Summary Box
    const summaryTop = curY - 20;
    stream += '0.96 0.97 0.98 rg 40 ' + (summaryTop - 70) + ' 260 70 re f\n';
    stream += '0.23 0.51 0.96 RG 3 w 40 ' + (summaryTop - 70) + ' m 40 ' + summaryTop + ' l S\n';
    stream += 'BT /F2 8.5 Tf 0.1 0.15 0.2 rg 50 ' + (summaryTop - 15) + ' Td (Terms & Information:) Tj ET\n';
    stream += 'BT /F1 7.5 Tf 0.3 0.35 0.4 rg 50 ' + (summaryTop - 30) + ' Td (* Computer-generated tax invoice. No signature needed.) Tj ET\n';
    stream += 'BT /F1 7.5 Tf 0.3 0.35 0.4 rg 50 ' + (summaryTop - 44) + ' Td (* Inclusive of 5% GST (CGST 2.5% + SGST 2.5%).) Tj ET\n';
    stream += 'BT /F1 7.5 Tf 0.3 0.35 0.4 rg 50 ' + (summaryTop - 58) + ' Td (* Track order anytime at: ' + cleanText(inv.storeOrigin.replace(/^https?:\/\//, '')) + '/tracking) Tj ET\n';

    stream += '0.97 0.98 0.99 rg 315 ' + (summaryTop - 100) + ' 240 100 re f\n';
    stream += '0.82 0.86 0.9 RG 0.8 w 315 ' + (summaryTop - 100) + ' 240 100 re S\n';

    let totY = summaryTop - 16;
    stream += 'BT /F1 8.5 Tf 0.3 0.35 0.4 rg 325 ' + totY + ' Td (Items Subtotal:) Tj ET\n';
    stream += 'BT /F2 8.5 Tf 0.1 0.15 0.2 rg 475 ' + totY + ' Td (Rs. ' + subtotal.toFixed(2) + ') Tj ET\n';

    totY -= 15;
    stream += 'BT /F1 8.5 Tf 0.3 0.35 0.4 rg 325 ' + totY + ' Td (Delivery Fee:) Tj ET\n';
    const delivText = deliveryFee === 0 ? 'FREE' : ('Rs. ' + deliveryFee.toFixed(2));
    stream += 'BT /F2 8.5 Tf 0.047 0.514 0.122 rg 475 ' + totY + ' Td (' + delivText + ') Tj ET\n';

    if (discount > 0) {
        totY -= 15;
        stream += 'BT /F1 8.5 Tf 0.047 0.514 0.122 rg 325 ' + totY + ' Td (Coupon Discount:) Tj ET\n';
        stream += 'BT /F2 8.5 Tf 0.047 0.514 0.122 rg 475 ' + totY + ' Td (-Rs. ' + discount.toFixed(2) + ') Tj ET\n';
    }

    if (freeCashUsed > 0) {
        totY -= 15;
        stream += 'BT /F1 8.5 Tf 0.047 0.514 0.122 rg 325 ' + totY + ' Td (Free Cash Wallet:) Tj ET\n';
        stream += 'BT /F2 8.5 Tf 0.047 0.514 0.122 rg 475 ' + totY + ' Td (-Rs. ' + freeCashUsed.toFixed(2) + ') Tj ET\n';
    }

    totY -= 10;
    stream += '0.8 0.85 0.9 RG 0.8 w 325 ' + totY + ' m 545 ' + totY + ' l S\n';

    totY -= 14;
    stream += 'BT /F2 11 Tf 0.06 0.09 0.16 rg 325 ' + totY + ' Td (Grand Total:) Tj ET\n';
    stream += 'BT /F2 11 Tf 0.047 0.514 0.122 rg 465 ' + totY + ' Td (Rs. ' + grandTotal.toFixed(2) + ') Tj ET\n';

    totY -= 14;
    const payStatus = cleanText(isCod ? 'PAY ON DELIVERY' : 'PAID IN FULL');
    stream += 'BT /F2 7.5 Tf 0.3 0.35 0.4 rg 325 ' + totY + ' Td (Payment Status: ' + payStatus + ') Tj ET\n';

    // Footer
    stream += '0.8 0.85 0.9 RG 1 w 40 50 m 555 50 l S\n';
    stream += 'BT /F2 9.5 Tf 0.047 0.514 0.122 rg 160 34 Td (Thank you for shopping with QuickCart! 10-Minute Superstore) Tj ET\n';

    // Build PDF Binary String
    const streamLen = new TextEncoder().encode(stream).length;
    let body = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [];
    const getLen = (str) => new TextEncoder().encode(str).length;

    offsets.push(getLen(body));
    body += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

    offsets.push(getLen(body));
    body += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

    offsets.push(getLen(body));
    body += '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';

    offsets.push(getLen(body));
    body += '4 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + stream + 'endstream\nendobj\n';

    offsets.push(getLen(body));
    body += '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n';

    offsets.push(getLen(body));
    body += '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n';

    const xrefOffset = getLen(body);
    body += 'xref\n0 7\n0000000000 65535 f \n';
    for (let i = 0; i < offsets.length; i++) {
        body += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    body += 'trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n';

    // Download PDF directly as Blob without opening any window or print dialog
    try {
        const bytes = new TextEncoder().encode(body);
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `QuickCart_Invoice_${invoiceNo}.pdf`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        }, 250);
    } catch (err) {
        console.error('Failed to trigger direct PDF download:', err);
    }
}

export function printInvoiceDocument(order, currentUser = null, profilePhone = '') {
    downloadInvoicePdf(order, currentUser, profilePhone);
}
