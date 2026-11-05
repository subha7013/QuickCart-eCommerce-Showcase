import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api, BASE_URL } from '../utils/api.js';
import { printInvoiceDocument } from '../utils/helpers.js';
import { categories } from '../data/categories.js';
import { FESTIVAL_THEMES, getActiveTheme } from '../utils/themeEngine.js';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [currentView, setCurrentView] = useState('home');
    const [selectedCategoryName, setSelectedCategoryName] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [dbProducts, setDbProducts] = useState([]);
    const [productStock, setProductStock] = useState({});
    const [isAdmin, setIsAdmin] = useState(() => {
        return sessionStorage.getItem('qc_is_admin') === 'true';
    });
    const [adminKey, setAdminKey] = useState(() => {
        return sessionStorage.getItem('qc_admin_key') || '';
    });
    const [adminProducts, setAdminProducts] = useState([]);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [wishlist, setWishlist] = useState([]);
    const [toast, setToast] = useState('');
    const [profilePhone, setProfilePhone] = useState('');
    const [orders, setOrders] = useState([]);
    const [showBanner, setShowBanner] = useState(true);
    const [checkoutData, setCheckoutData] = useState(null);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);
    const [couponRecommendations, setCouponRecommendations] = useState([]);
    const [isFetchingRecs, setIsFetchingRecs] = useState(false);
    const [invoiceOrder, setInvoiceOrder] = useState(null);
    const [hideMobileTopNav, setHideMobileTopNav] = useState(false);

    // Festival Theme State (Admin Controlled)
    const [festivalTheme, setFestivalThemeState] = useState(() => {
        return localStorage.getItem('qc_festival_theme') || 'default';
    });
    const [customThemes, setCustomThemes] = useState([]);

    async function setFestivalTheme(themeId) {
        if (!isAdmin || !adminKey) {
            showToast('Access restricted: Only verified Admins can change store themes 🛡️');
            return;
        }

        const allThemes = { ...FESTIVAL_THEMES, ...customThemes.reduce((acc, t) => ({ ...acc, [t.id]: t }), {}) };

        if (allThemes[themeId]) {
            setFestivalThemeState(themeId);
            localStorage.setItem('qc_festival_theme', themeId);
            showToast(`Theme set to ${allThemes[themeId].name} ✨`);
            try {
                const res = await fetch(`${BASE_URL}/api/admin/theme`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-admin-key': adminKey
                    },
                    body: JSON.stringify({ theme: themeId }),
                    credentials: 'include'
                });
                const data = await res.json();
                if (!data.ok) {
                    showToast(data.msg || 'Failed to update theme on server');
                }
            } catch (err) {
                console.error('Failed to sync theme with backend:', err);
            }
        }
    }

    async function fetchTheme() {
        try {
            const res = await api('/api/theme');
            if (res.ok) {
                if (res.customThemes && Array.isArray(res.customThemes)) {
                    setCustomThemes(res.customThemes);
                }
                if (res.theme) {
                    setFestivalThemeState(res.theme);
                    localStorage.setItem('qc_festival_theme', res.theme);
                }
            }
        } catch (e) { }
    }

    async function saveCustomTheme(themeData) {
        if (!isAdmin || !adminKey) {
            showToast('Access restricted to administrators 🛡️');
            return { ok: false, msg: 'Unauthorized' };
        }
        try {
            const res = await fetch(`${BASE_URL}/api/admin/themes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(themeData),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                if (data.customThemes) setCustomThemes(data.customThemes);
                showToast(data.msg || `Theme "${themeData.name}" saved! 🎨`);
                return data;
            } else {
                showToast(data.msg || 'Failed to save theme ❌');
                return data;
            }
        } catch (err) {
            showToast('Network error saving theme ❌');
            return { ok: false, msg: 'Network error' };
        }
    }

    async function deleteCustomTheme(themeId) {
        if (!isAdmin || !adminKey) {
            showToast('Access restricted to administrators 🛡️');
            return { ok: false, msg: 'Unauthorized' };
        }
        try {
            const res = await fetch(`${BASE_URL}/api/admin/themes/${themeId}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-key': adminKey
                },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                if (data.customThemes) setCustomThemes(data.customThemes);
                if (data.activeTheme) setFestivalThemeState(data.activeTheme);
                showToast(data.msg || 'Custom theme removed 🗑️');
                return data;
            }
        } catch (err) {
            showToast('Failed to delete theme ❌');
        }
        return { ok: false };
    }

    const currentThemeConfig = useMemo(() => {
        return getActiveTheme(festivalTheme, customThemes);
    }, [festivalTheme, customThemes]);

    // Free Cash & Wallet state (real balance loaded via fetchMe)
    const [freeCash, setFreeCash] = useState(0);
    const [useFreeCash, setUseFreeCash] = useState(false);

    // User Addresses & Payment Methods (loaded from authenticated user profile)
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);

    // Live Order Tracking state
    const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);

    // Razorpay Simulation Modal state
    const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
    const [pendingOrderData, setPendingOrderData] = useState(null);

    // Customer Support Incidents state
    const [userIncidents, setUserIncidents] = useState([]);

    const categoryList = useMemo(() => {
        const base = [
            {
                name: 'Electronics',
                icon: '📱',
                description: 'Chargers, earbuds, headsets and smart accessories.',
                subcategories: ['Mobile', 'Headset', 'Accessories', 'Speakers'],
                products: []
            },
            {
                name: 'Fashion',
                icon: '👕',
                description: 'T-shirts, shoes and everyday style essentials.',
                subcategories: ['Tshirts', 'Jeans', 'Shoes'],
                products: []
            },
            {
                name: 'Groceries',
                icon: '🛒',
                description: 'Fresh vegetables, farm fruits, essentials and staples.',
                subcategories: ['Vegetables', 'Fruits', 'Chocolates', 'Dairy', 'Snacks', 'Biscuits'],
                products: []
            }
        ];

        const productsSource = dbProducts.length > 0
            ? dbProducts
            : categories.flatMap(cat => cat.products.map(p => ({ ...p, category: cat.name })));

        productsSource.forEach(p => {
            const cat = base.find(c => c.name.toLowerCase() === p.category?.toLowerCase());
            if (cat) {
                if (p.subcategory && !cat.subcategories.includes(p.subcategory)) {
                    cat.subcategories.push(p.subcategory);
                }
                if (!cat.products.some(prod => prod.id === p.id)) {
                    cat.products.push({
                        ...p,
                        mrp: p.mrp || Math.round((p.price || 99) * 1.35),
                        rating: p.rating || 4.4,
                        ratingsCount: p.ratingsCount || 134,
                        offerTag: p.offerTag || (p.price < 50 ? 'Daily Steal' : p.price > 1000 ? 'Festival Special' : 'Best Value')
                    });
                }
            }
        });

        return base;
    }, [dbProducts]);

    const selectedCategory = useMemo(() => {
        return categoryList.find(c => c.name === selectedCategoryName) || null;
    }, [categoryList, selectedCategoryName]);

    function showToast(message) {
        setToast(message);
        setTimeout(() => setToast(''), 3200);
    }

    async function fetchMe() {
        const res = await api('/api/me');
        if (res.ok) {
            const userData = res.user || { email: res.email, phone: res.phone || '' };
            setCurrentUser(userData);
            setProfilePhone(userData.phone || '');
            if (userData.freeCash !== undefined) {
                setFreeCash(userData.freeCash);
            }
            if (userData.addresses && Array.isArray(userData.addresses)) {
                setAddresses(userData.addresses);
                if (userData.addresses.length > 0) {
                    const def = userData.addresses.find(a => a.isDefault) || userData.addresses[0];
                    setSelectedAddressId(def.id);
                } else {
                    setSelectedAddressId(null);
                }
            } else {
                setAddresses([]);
                setSelectedAddressId(null);
            }
            if (userData.savedPaymentMethods) {
                setSavedPaymentMethods(userData.savedPaymentMethods);
            }
        } else {
            setCurrentUser(null);
        }
    }

    async function loadOrders() {
        const res = await api('/api/orders');
        if (res.ok && res.orders) {
            setOrders(res.orders);
        }
    }

    async function loadAdminProducts() {
        if (!adminKey) return;
        const res = await fetch(BASE_URL + '/api/admin/products', {
            headers: { 'x-admin-key': adminKey },
            credentials: 'include',
        });
        const data = await res.json();
        if (data.ok) {
            setAdminProducts(data.products || []);
        }
    }

    async function fetchProductStock() {
        try {
            const res = await api('/api/products');
            if (res.ok && res.products) {
                setDbProducts(res.products);
                const map = {};
                res.products.forEach(p => { map[p.id] = p.stock; });
                setProductStock(map);
            }
        } catch (e) { }
    }

    function getStock(product) {
        if (product.id && productStock[product.id] !== undefined) {
            return productStock[product.id];
        }
        return product.stock ?? 0;
    }

    function getLimitPerOrder(product) {
        return Number(product?.limitPerOrder || 0);
    }

    function generateInvoiceForOrder(order, e) {
        if (e && e.stopPropagation) e.stopPropagation();
        setInvoiceOrder(order);
        setTimeout(() => {
            printInvoiceDocument(order, currentUser, profilePhone);
        }, 150);
    }

    async function cancelUserOrder(order, e) {
        if (e && e.stopPropagation) e.stopPropagation();
        const targetId = typeof order === 'object' ? (order._id || order.id) : order;
        if (!targetId || targetId === 'local-order') {
            showToast("Cannot cancel local offline order ❌");
            return;
        }
        if (!window.confirm("Are you sure you want to cancel this order? Items will be returned to inventory.")) return;
        try {
            const res = await api(`/api/orders/${targetId}/cancel`, {
                method: 'PUT',
            });
            if (res && res.ok) {
                showToast("Order cancelled successfully ✅ Inventory restocked!");
                if (typeof res.freeCash === 'number') {
                    setFreeCash(res.freeCash);
                }
                await loadOrders();
                await fetchProductStock();
                await fetchMe();
            } else {
                showToast((res && res.msg) ? res.msg : "Failed to cancel order ❌");
            }
        } catch (err) {
            console.error("Cancel order error:", err);
            showToast("Failed to process order cancellation ❌");
        }
    }

    async function applyCoupon(codeToApply) {
        const code = codeToApply || couponCode;
        if (!code) {
            showToast('Enter a coupon code');
            return;
        }
        const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        const res = await api('/api/coupon/validate', {
            method: 'POST',
            body: JSON.stringify({ code, subtotal: cartSubtotal }),
        });
        if (res.ok) {
            setAppliedCoupon(code.toUpperCase());
            setCouponDiscount(res.discount);
            setCouponDiscountPercent(res.discountPercent || 0);
            showToast(`Coupon "${code.toUpperCase()}" applied! Saved ₹${res.discount} 🎉`);
        } else {
            showToast(res.msg || 'Invalid coupon ❌');
        }
    }

    function removeCoupon() {
        setAppliedCoupon('');
        setCouponDiscount(0);
        setCouponDiscountPercent(0);
        setCouponCode('');
        showToast('Coupon removed');
    }

    // Address Management
    async function addAddress(newAddr) {
        if (currentUser) {
            const res = await api('/api/user/address', {
                method: 'POST',
                body: JSON.stringify(newAddr)
            });
            if (res.ok && res.addresses) {
                setAddresses(res.addresses);
                const added = res.addresses[res.addresses.length - 1];
                if (added) setSelectedAddressId(added.id);
                showToast('Delivery address saved ✅');
                return added;
            }
        }
        // Local fallback
        const localAddr = { ...newAddr, id: 'addr_' + Date.now().toString(36) };
        setAddresses(prev => [...prev, localAddr]);
        setSelectedAddressId(localAddr.id);
        showToast('Delivery address added ✅');
        return localAddr;
    }

    async function removeAddress(id) {
        if (currentUser) {
            const res = await api(`/api/user/address/${id}`, { method: 'DELETE' });
            if (res.ok && res.addresses) {
                setAddresses(res.addresses);
                if (res.addresses.length > 0) {
                    if (selectedAddressId === id || !res.addresses.some(a => a.id === selectedAddressId)) {
                        setSelectedAddressId(res.addresses[0].id);
                    }
                } else {
                    setSelectedAddressId(null);
                }
                showToast('Address removed');
                return;
            }
        }
        setAddresses(prev => {
            const updated = prev.filter(a => a.id !== id);
            if (updated.length > 0) {
                if (selectedAddressId === id || !updated.some(a => a.id === selectedAddressId)) {
                    setSelectedAddressId(updated[0].id);
                }
            } else {
                setSelectedAddressId(null);
            }
            return updated;
        });
        showToast('Address removed');
    }

    // Gift Voucher / Free Cash (Production Authenticated)
    async function redeemGiftCard(code) {
        if (!currentUser) {
            showToast('Please sign in to your QuickCart account to redeem vouchers 🔒');
            return false;
        }
        const res = await api('/api/user/redeem-giftcard', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
        if (res.ok) {
            if (typeof res.freeCash === 'number') {
                setFreeCash(res.freeCash);
            }
            showToast(res.msg || `🎉 Added ₹${res.added} Free Cash to your wallet!`);
            return true;
        } else {
            showToast(res.msg || 'Invalid voucher code ❌');
            return false;
        }
    }

    async function refreshWallet() {
        if (!currentUser) return null;
        try {
            const res = await api('/api/user/wallet');
            if (res && res.ok) {
                if (typeof res.freeCash === 'number') {
                    setFreeCash(res.freeCash);
                }
                return res;
            }
        } catch (e) {
            console.error('Wallet refresh error:', e);
        }
        return null;
    }

    // Support Incidents Escalation (Production Authenticated)
    async function escalateIncident({ orderId, subject, category, chatHistory, priority }) {
        if (!currentUser) {
            showToast('Please sign in to submit support tickets 🔒');
            return { ok: false, msg: 'Authentication required' };
        }
        const res = await api('/api/support/escalate', {
            method: 'POST',
            body: JSON.stringify({ orderId, subject, category, chatHistory, priority })
        });
        if (res.ok) {
            setUserIncidents(prev => [res.incident, ...prev]);
            return res;
        }
        return { ok: false, msg: res.msg || 'Escalation failed' };
    }

    async function fetchUserIncidents() {
        if (!currentUser) return;
        const res = await api('/api/support/my-incidents');
        if (res.ok && res.incidents) {
            setUserIncidents(res.incidents);
        }
    }

    function addToWishlist(product) {
        if (!wishlist.some((item) => item.id === product.id)) {
            setWishlist((prev) => [...prev, product]);
        }
        showToast(`${product.name} added to wishlist ❤️`);
    }

    function removeFromWishlist(id) {
        setWishlist((prev) => prev.filter((item) => item.id !== id));
        showToast('Removed from wishlist');
    }

    function increaseCart(product) {
        const liveStock = getStock(product);
        const existingCartItem = cart.find((item) => item.id === product.id);
        const limitPerOrder = getLimitPerOrder(product);
        if (limitPerOrder > 0 && existingCartItem && existingCartItem.qty >= limitPerOrder) {
            showToast(`"${product.name}" is limited to 1 unit per order`);
            return;
        }
        if (liveStock === 0) {
            showToast(`"${product.name}" is out of stock ❌`);
            return;
        }
        if (existingCartItem && existingCartItem.qty >= liveStock) {
            showToast(`Only ${liveStock} unit(s) available in stock`);
            return;
        }
        setCart((prev) => {
            const exists = prev.find((item) => item.id === product.id);
            if (exists) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { ...product, qty: 1 }];
        });
    }

    function decreaseCart(product) {
        setCart((prev) => {
            const exists = prev.find((item) => item.id === product.id);
            if (exists && exists.qty > 1) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty - 1 } : item
                );
            }
            return prev.filter((item) => item.id !== product.id);
        });
    }

    function removeFromCart(id) {
        setCart((prev) => prev.filter((item) => item.id !== id));
    }

    function clearCart() {
        setCart([]);
        removeCoupon();
        setUseFreeCash(false);
    }

    async function trackOrderByQuery(query) {
        if (!query || !query.trim()) {
            showToast('Please enter an Order ID or Tracking ID');
            return { ok: false, msg: 'Please enter an Order ID or Tracking ID' };
        }
        try {
            const res = await api(`/api/orders/track/${encodeURIComponent(query.trim())}`);
            if (res.ok && res.order) {
                setActiveTrackingOrder(res.order);
                return { ok: true, order: res.order };
            } else {
                return { ok: false, msg: res.msg || 'No order found with this Tracking ID or Order ID' };
            }
        } catch (err) {
            return { ok: false, msg: 'Network error looking up order' };
        }
    }

    useEffect(() => {
        fetchMe();
        fetchProductStock();
        fetchTheme();
    }, []);

    useEffect(() => {
        if (currentUser) {
            loadOrders();
            fetchUserIncidents();
        }
    }, [currentUser]);

    // Live Order Polling: Automatically syncs when admin updates status
    useEffect(() => {
        let intervalId = null;
        const shouldPoll = currentView === 'profile' || currentView === 'orders' || currentView === 'tracking';
        if (shouldPoll) {
            intervalId = setInterval(async () => {
                if (currentUser) {
                    await loadOrders();
                }
                if (activeTrackingOrder && (activeTrackingOrder._id || activeTrackingOrder.trackingId)) {
                    try {
                        const targetId = activeTrackingOrder._id || activeTrackingOrder.trackingId;
                        const res = await api(`/api/orders/track/${encodeURIComponent(targetId)}`);
                        if (res && res.ok && res.order) {
                            setActiveTrackingOrder(prev => {
                                if (prev && prev.status !== res.order.status) {
                                    showToast(`Order Status Updated: "${res.order.status.replace(/_/g, ' ').toUpperCase()}" 🚚`);
                                }
                                return res.order;
                            });
                        }
                    } catch (e) { }
                }
            }, 3000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [currentView, currentUser, activeTrackingOrder?._id]);

    const filteredProducts = useMemo(() => {
        let pool = [];
        if (selectedCategory) {
            pool = selectedCategory.products;
        } else {
            pool = categoryList.flatMap((c) => c.products);
        }

        if (selectedSubcategory) {
            pool = pool.filter(
                (p) => p.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase()
            );
        }

        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase().trim();
            pool = pool.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.subcategory?.toLowerCase().includes(query) ||
                    p.category?.toLowerCase().includes(query)
            );
        }

        return pool;
    }, [categoryList, selectedCategory, selectedSubcategory, searchTerm]);

    const cartItemCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    const value = {
        currentView, setCurrentView,
        selectedCategoryName, setSelectedCategoryName,
        selectedSubcategory, setSelectedSubcategory,
        currentUser, setCurrentUser,
        searchTerm, setSearchTerm,
        cart, setCart,
        dbProducts, setDbProducts,
        productStock, setProductStock,
        isAdmin, setIsAdmin,
        adminKey, setAdminKey,
        adminProducts, setAdminProducts,
        isMobileDrawerOpen, setIsMobileDrawerOpen,
        wishlist, setWishlist,
        toast, setToast, showToast,
        profilePhone, setProfilePhone,
        orders, setOrders,
        showBanner, setShowBanner,
        checkoutData, setCheckoutData,
        couponCode, setCouponCode,
        appliedCoupon, setAppliedCoupon,
        couponDiscount, setCouponDiscount,
        couponDiscountPercent, setCouponDiscountPercent,
        couponRecommendations, setCouponRecommendations,
        isFetchingRecs, setIsFetchingRecs,
        invoiceOrder, setInvoiceOrder,
        hideMobileTopNav, setHideMobileTopNav,
        categoryList, selectedCategory, filteredProducts,
        fetchMe, loadOrders, loadAdminProducts, fetchProductStock,
        getStock, getLimitPerOrder, generateInvoiceForOrder, cancelUserOrder,
        applyCoupon, removeCoupon, addToWishlist, removeFromWishlist,
        increaseCart, decreaseCart, removeFromCart, clearCart,
        cartItemCount, cartTotal,
        // Festival Engine
        festivalTheme, setFestivalTheme, currentThemeConfig, fetchTheme,
        customThemes, saveCustomTheme, deleteCustomTheme,
        // Free cash / Wallet
        freeCash, setFreeCash, useFreeCash, setUseFreeCash, redeemGiftCard, refreshWallet,
        // Addresses
        addresses, setAddresses, addAddress, removeAddress, selectedAddressId, setSelectedAddressId,
        // Saved payments
        savedPaymentMethods, setSavedPaymentMethods,
        // Live tracking
        activeTrackingOrder, setActiveTrackingOrder, trackOrderByQuery,
        // Razorpay modal
        isRazorpayOpen, setIsRazorpayOpen, pendingOrderData, setPendingOrderData,
        // Incidents
        userIncidents, setUserIncidents, escalateIncident, fetchUserIncidents
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
