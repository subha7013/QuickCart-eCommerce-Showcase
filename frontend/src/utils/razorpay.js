import { api } from './api.js';

/**
 * Ensures the official Razorpay Checkout SDK script is loaded in the DOM.
 */
export function loadRazorpaySDK() {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const existingScript = document.querySelector('script[src*="checkout.razorpay.com"]');
        if (existingScript) {
            existingScript.onload = () => resolve(true);
            existingScript.onerror = () => resolve(false);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

/**
 * Opens the official Razorpay standard checkout popup.
 */
export async function openRazorpayCheckout({
    amount, // total payable amount in Rupees
    orderData, // { items, subtotal, couponCode, couponDiscount, freeCashUsed, address }
    currentUser,
    onSuccess,
    onError,
    onDismiss
}) {
    const isLoaded = await loadRazorpaySDK();
    if (!isLoaded || !window.Razorpay) {
        if (onError) onError('Could not load Razorpay payment gateway SDK. Please check your internet connection.');
        return;
    }

    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const amountInPaise = Math.round(Number(amount) * 100);

    // 1. Create order on the backend with Razorpay Orders API
    let serverOrderId = null;
    try {
        const createRes = await api('/api/razorpay/create-order', {
            method: 'POST',
            body: JSON.stringify({ amount: Number(amount) })
        });

        if (createRes && createRes.ok && createRes.orderId) {
            serverOrderId = createRes.orderId;
        } else {
            const errorMsg = createRes?.msg || 'Could not initialize order with Razorpay.';
            console.error('Razorpay order creation failed:', errorMsg);
            if (onError) {
                onError(`⚠️ ${errorMsg}`);
            }
            return;
        }
    } catch (e) {
        console.error('Backend Razorpay order creation error:', e);
        if (onError) onError('Could not connect to backend server for payment.');
        return;
    }

    const customerName = orderData.address?.name || (currentUser?.email ? currentUser.email.split('@')[0] : '');
    const customerEmail = currentUser?.email || '';
    const customerPhone = orderData.address?.phone || currentUser?.phone || '';

    const options = {
        key: keyId,
        amount: amountInPaise,
        currency: 'INR',
        name: 'QuickCart',
        description: 'Instant 10-Minute Grocery & Essentials Delivery',
        image: 'https://cdn-icons-png.flaticon.com/512/3737/3737372.png',
        order_id: serverOrderId || undefined,
        prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone
        },
        notes: {
            address: `${orderData.address?.line1 || ''}, ${orderData.address?.city || ''} ${orderData.address?.pincode || ''}`,
            itemsCount: String(orderData.items?.length || 0)
        },
        theme: {
            color: '#2563eb'
        },
        modal: {
            ondismiss: function () {
                if (onDismiss) onDismiss();
            }
        },
        handler: async function (response) {
            // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
            try {
                if (response.razorpay_signature && serverOrderId) {
                    // Authenticated server signature verification
                    const verifyRes = await api('/api/razorpay/verify-payment', {
                        method: 'POST',
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            items: orderData.items,
                            subtotal: orderData.subtotal,
                            couponCode: orderData.couponCode,
                            couponDiscount: orderData.couponDiscount,
                            freeCashUsed: orderData.freeCashUsed || 0,
                            address: orderData.address
                        })
                    });

                    if (verifyRes && verifyRes.ok && verifyRes.order) {
                        if (onSuccess) onSuccess(verifyRes);
                    } else {
                        if (onError) onError(verifyRes?.msg || 'Payment signature verification failed');
                    }
                } else {
                    // Direct test checkout completion
                    const checkoutRes = await api('/api/checkout', {
                        method: 'POST',
                        body: JSON.stringify({
                            items: orderData.items,
                            subtotal: orderData.subtotal,
                            couponCode: orderData.couponCode,
                            couponDiscount: orderData.couponDiscount,
                            freeCashUsed: orderData.freeCashUsed || 0,
                            paymentMethod: 'razorpay',
                            paymentId: response.razorpay_payment_id || ('pay_rzp_' + Date.now().toString(36)),
                            address: orderData.address
                        })
                    });

                    if (checkoutRes && checkoutRes.ok && checkoutRes.order) {
                        if (onSuccess) onSuccess(checkoutRes);
                    } else {
                        if (onError) onError(checkoutRes?.msg || 'Order placement failed');
                    }
                }
            } catch (err) {
                console.error('Payment confirmation error:', err);
                if (onError) onError('Network error confirming payment');
            }
        }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
        console.error('Razorpay payment failed:', response.error);
        if (onError) {
            onError(response.error?.description || 'Payment was declined or cancelled.');
        }
    });

    rzp.open();
}

