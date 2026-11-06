import React, { useState, useEffect, useRef } from 'react';
import {
    Shield, Package, ShoppingBag, Plus, Trash2, Edit3, CheckCircle2,
    Clock, Truck, AlertCircle, Sparkles, Flame, Tag, LifeBuoy,
    RotateCw, Check, X, Search, Filter, MessageSquare, Gift, Users,
    Calendar, ArrowRight, DollarSign, CheckSquare, Square, RefreshCw,
    Zap, TrendingUp, Award, Mail, Phone, MapPin, CreditCard, RotateCcw,
    FileText, ExternalLink, AlertTriangle, ArrowUpRight, History,
    UserCheck, Send, UploadCloud, Sliders
} from 'lucide-react';
import { api, BASE_URL } from '../utils/api.js';
import { useApp } from '../context/AppContext.jsx';
import { FESTIVAL_THEMES } from '../utils/themeEngine.js';
import { formatProductImage, AVAILABLE_STORE_ASSETS } from '../utils/helpers.js';

export default function AdminDashboard() {
    const {
        isAdmin,
        setIsAdmin,
        adminKey,
        setAdminKey,
        adminProducts,
        setAdminProducts,
        loadAdminProducts,
        fetchProductStock,
        showToast,
        festivalTheme,
        setFestivalTheme,
        currentThemeConfig,
        loadOrders,
        setActiveTrackingOrder,
        customThemes,
        saveCustomTheme,
        deleteCustomTheme
    } = useApp();

    const [inputKey, setInputKey] = useState(adminKey);
    const [activeAdminTab, setActiveAdminTab] = useState('products'); // products, orders, incidents, themes, wallet
    const [adminOrders, setAdminOrders] = useState([]);
    const [adminIncidents, setAdminIncidents] = useState([]);
    const [orderFilter, setOrderFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Admin Users & Free Cash Airdrop State
    const [adminUsers, setAdminUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [userFilter, setUserFilter] = useState('all'); // all, no_orders, has_orders, vip, inactive
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    // Airdrop Campaign Settings
    const [airdropMode, setAirdropMode] = useState('random'); // random, fixed
    const [minCashAmount, setMinCashAmount] = useState('50');
    const [maxCashAmount, setMaxCashAmount] = useState('150');
    const [fixedCashAmount, setFixedCashAmount] = useState('100');
    const [expiryPresetDays, setExpiryPresetDays] = useState('7');
    const [customExpiryDate, setCustomExpiryDate] = useState('');
    const [campaignReason, setCampaignReason] = useState('Festive Surprise Free Cash 🪔');
    const [isAirdropping, setIsAirdropping] = useState(false);
    const [airdropResult, setAirdropResult] = useState(null);

    // Custom Theme & Campaign Creator State
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [isSavingTheme, setIsSavingTheme] = useState(false);
    const [autoActivateTheme, setAutoActivateTheme] = useState(true);
    const bannerFileInputRef = useRef(null);

    const [themeForm, setThemeForm] = useState({
        name: '',
        icon: '⚡',
        tagline: '',
        announcement: '',
        badge: 'FESTIVAL SPECIAL',
        heroHeadline: '',
        heroSub: '',
        primaryColor: '#2874f0',
        secondaryColor: '#ffe500',
        accentColor: '#fb641b',
        navBg: '#2874f0',
        announcementBg: '#1e5fc2',
        bgPage: '#f1f3f6',
        festiveTag: 'BBD Super Deals',
        bannerImg: '/bannerquickcart.png',
        gradientHero: 'linear-gradient(135deg, #172554 0%, #1e40af 50%, #eab308 100%)',
        gradientStart: '#172554',
        gradientEnd: '#eab308',
        gradientAngle: '135deg'
    });

    const GRADIENT_PRESETS = [
        { label: '🌌 Midnight Aurora', value: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0284c7 100%)', start: '#1e3a8a', end: '#0284c7' },
        { label: '🪔 Diwali Crimson', value: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 45%, #b45309 100%)', start: '#7f1d1d', end: '#b45309' },
        { label: '⚡ Flipkart Electric', value: 'linear-gradient(135deg, #172554 0%, #1e40af 50%, #eab308 100%)', start: '#172554', end: '#eab308' },
        { label: '🌸 Myntra Luxe', value: 'linear-gradient(135deg, #831843 0%, #be185d 50%, #f59e0b 100%)', start: '#831843', end: '#f59e0b' },
        { label: '🎉 New Year Velvet', value: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #0369a1 100%)', start: '#3b0764', end: '#0369a1' },
        { label: '🌿 Fresh Emerald', value: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)', start: '#064e3b', end: '#10b981' },
        { label: '🌅 Sunset Gold', value: 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #eab308 100%)', start: '#ea580c', end: '#eab308' },
        { label: '🖤 Cyber Noir', value: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #475569 100%)', start: '#0f172a', end: '#475569' }
    ];

    function updateGradient(start, end, angle) {
        setThemeForm(prev => {
            const newStart = start !== undefined ? start : (prev.gradientStart || '#1e3a8a');
            const newEnd = end !== undefined ? end : (prev.gradientEnd || '#0284c7');
            const newAngle = angle !== undefined ? angle : (prev.gradientAngle || '135deg');
            const generated = `linear-gradient(${newAngle}, ${newStart} 0%, ${newEnd} 100%)`;
            return {
                ...prev,
                gradientStart: newStart,
                gradientEnd: newEnd,
                gradientAngle: newAngle,
                gradientHero: generated
            };
        });
    }

    function handleBannerFileUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            showToast('Please select a valid image file (PNG, JPG, WebP) ⚠️');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast('Banner file size exceeds 5MB limit ⚠️');
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            setThemeForm(prev => ({ ...prev, bannerImg: dataUrl }));
            showToast('Banner image uploaded successfully 🖼️');
        };
        reader.readAsDataURL(file);
    }

    const THEME_PRESETS = [
        {
            key: 'flipkart',
            label: '🛒 Flipkart Big Billion Days',
            data: {
                name: 'Flipkart Big Billion Days',
                icon: '🛒',
                tagline: "India's Greatest Festival Sale! Up to 80% Off",
                announcement: '🔥 The Big Billion Days LIVE! Extra ₹100 Off on orders above ₹499 with QuickCard Credit!',
                badge: 'BIG BILLION DEALS',
                heroHeadline: "India's Biggest Deals Delivered in 10 Mins",
                heroSub: 'Crazy price crashes on tech, groceries & festive essentials',
                primaryColor: '#2874f0',
                secondaryColor: '#ffe500',
                accentColor: '#fb641b',
                navBg: '#2874f0',
                announcementBg: '#1e5fc2',
                bgPage: '#f1f3f6',
                festiveTag: 'BBD Special',
                bannerImg: '/bannerquickcart.png',
                gradientHero: 'linear-gradient(135deg, #172554 0%, #1e40af 50%, #eab308 100%)',
                gradientStart: '#172554',
                gradientEnd: '#eab308',
                gradientAngle: '135deg'
            }
        },
        {
            key: 'myntra',
            label: '👗 Myntra Big Fashion Festival',
            data: {
                name: 'Myntra Big Fashion Festival',
                icon: '👗',
                tagline: 'Glamour, Glitz & Biggest Trends Up to 70% Off',
                announcement: '✨ Myntra Fashion Blast: Claim Flat ₹150 Airdrop Credits on all festive collections!',
                badge: 'FASHION FESTIVAL',
                heroHeadline: 'Festive Glam Delivered to Your Doorstep',
                heroSub: 'Unbox handpicked ethnic wear, luxury perfumes & festive hampers in minutes',
                primaryColor: '#ff3f6c',
                secondaryColor: '#ff905a',
                accentColor: '#535766',
                navBg: '#ff3f6c',
                announcementBg: '#e02f5a',
                bgPage: '#fff5f7',
                festiveTag: 'Myntra Luxe',
                bannerImg: '/bannerquickcart.png',
                gradientHero: 'linear-gradient(135deg, #831843 0%, #be185d 50%, #f59e0b 100%)',
                gradientStart: '#831843',
                gradientEnd: '#f59e0b',
                gradientAngle: '135deg'
            }
        },
        {
            key: 'blinkit',
            label: '⚡ Blinkit 10-Min Flash Rush',
            data: {
                name: 'Blinkit Yellow Rush',
                icon: '⚡',
                tagline: 'Groceries & Sweets delivered in 8-10 Minutes',
                announcement: '⚡ 10-Minute Lightning Delivery! Free delivery on instant sweet boxes & dry fruits!',
                badge: 'BLINKIT 10-MIN RUSH',
                heroHeadline: "Blink & It's There: 10-Minute Festive Rush",
                heroSub: 'Fresh fruits, sweets, puja samagri & chocolates at lightning speed',
                primaryColor: '#f8cb46',
                secondaryColor: '#1d232a',
                accentColor: '#0c831f',
                navBg: '#f8cb46',
                announcementBg: '#e6b72d',
                bgPage: '#fef9e7',
                festiveTag: 'Instant 10m',
                bannerImg: '/bannerquickcart.png',
                gradientHero: 'linear-gradient(135deg, #854d0e 0%, #ca8a04 50%, #15803d 100%)',
                gradientStart: '#854d0e',
                gradientEnd: '#15803d',
                gradientAngle: '135deg'
            }
        },
        {
            key: 'diwali',
            label: '🪔 Diwali Grand Mahotsav',
            data: {
                name: 'Diwali Grand Mahotsav',
                icon: '🪔',
                tagline: 'Light Up Your Celebrations with Mega Discounts',
                announcement: '🪔 Happy Diwali! Flat 50% Off on Mithai & Dry Fruit Hampers + Free Diya Set!',
                badge: 'DIWALI MAHOTSAV',
                heroHeadline: 'Sparkling Festive Offers Delivered in 10 Mins',
                heroSub: 'Puja essentials, golden mithai, decorative lights & festive gift boxes',
                primaryColor: '#b45309',
                secondaryColor: '#fbbf24',
                accentColor: '#7c2d12',
                navBg: '#92400e',
                announcementBg: '#78350f',
                bgPage: '#fffbeb',
                festiveTag: 'Diwali Dhamaka',
                bannerImg: '/bannerdiwali.png',
                gradientHero: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 45%, #b45309 100%)',
                gradientStart: '#7f1d1d',
                gradientEnd: '#b45309',
                gradientAngle: '135deg'
            }
        }
    ];

    function applyThemePreset(presetKey) {
        const found = THEME_PRESETS.find(p => p.key === presetKey);
        if (found) {
            setThemeForm({ ...found.data });
        }
    }

    async function handleSaveTheme(e) {
        e.preventDefault();
        if (!themeForm.name.trim()) {
            showToast('Please provide a campaign name ⚠️');
            return;
        }
        setIsSavingTheme(true);
        const res = await saveCustomTheme(themeForm);
        setIsSavingTheme(false);
        if (res.ok) {
            if (autoActivateTheme && res.theme) {
                setFestivalTheme(res.theme.id);
            }
            setIsThemeModalOpen(false);
        }
    }

    async function handleDeleteTheme(themeId, themeName) {
        if (!window.confirm(`Are you sure you want to delete campaign theme "${themeName}"?`)) {
            return;
        }
        await deleteCustomTheme(themeId);
    }

    // Product Add / Edit Form State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const productImageInputRef = useRef(null);
    const [isProcessingProductImage, setIsProcessingProductImage] = useState(false);
    const [productImagePreviewError, setProductImagePreviewError] = useState(false);
    const [productForm, setProductForm] = useState({
        name: '',
        price: '',
        mrp: '',
        category: 'Groceries',
        subcategory: 'Vegetables',
        stock: '20',
        image: '',
        offerTag: 'Deal of the Day',
        discountPercent: '25',
        featured: false,
        limitPerOrder: '0'
    });

    // Incident Resolution State
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [resolutionNote, setResolutionNote] = useState('');

    // Customer Management 360 State
    const [adminCustomers, setAdminCustomers] = useState([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [customerFilter, setCustomerFilter] = useState('all'); // all, pending_refunds, has_incidents, vip, has_orders, no_orders
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerProfileData, setCustomerProfileData] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [customerSubTab, setCustomerSubTab] = useState('orders'); // orders, incidents, wallet, addresses

    // Refund Action Modal State
    const [refundModalOrder, setRefundModalOrder] = useState(null);
    const [refundForm, setRefundForm] = useState({
        refundStatus: 'pending',
        refundAmount: '',
        refundMethod: 'gift_card',
        refundReason: 'Item damaged / Quality issue',
        refundRemarks: ''
    });
    const [isUpdatingRefund, setIsUpdatingRefund] = useState(false);

    // Incident Escalation Remark State
    const [activeIncidentId, setActiveIncidentId] = useState(null);
    const [incidentRemarkInput, setIncidentRemarkInput] = useState('');
    const [incidentStatusChange, setIncidentStatusChange] = useState('in_progress');
    const [incidentPriorityChange, setIncidentPriorityChange] = useState('high');
    const [isAddingRemark, setIsAddingRemark] = useState(false);

    // Gift Card Direct Top-up State
    const [isDirectTopupOpen, setIsDirectTopupOpen] = useState(false);
    const [directTopupAmount, setDirectTopupAmount] = useState('100');
    const [directTopupReason, setDirectTopupReason] = useState('Customer Goodwill / Escalation Resolution 🎁');
    const [directTopupDays, setDirectTopupDays] = useState('30');
    const [isToppingUp, setIsToppingUp] = useState(false);

    // Promotional Credits Direct Revoke State
    const [isDirectRevokeOpen, setIsDirectRevokeOpen] = useState(false);
    const [directRevokeAmount, setDirectRevokeAmount] = useState('');
    const [directRevokeAll, setDirectRevokeAll] = useState(false);
    const [directRevokeReason, setDirectRevokeReason] = useState('Promotional credit clawback / Policy adjustment ⚠️');
    const [isRevokingCredits, setIsRevokingCredits] = useState(false);

    // Gift Cards Management State
    const [adminGiftCards, setAdminGiftCards] = useState([]);
    const [isLoadingGiftCards, setIsLoadingGiftCards] = useState(false);
    const [newGiftCardForm, setNewGiftCardForm] = useState({
        code: '',
        title: '',
        amount: '100',
        maxRedemptions: '100',
        expiryDays: '60'
    });
    const [isCreatingGiftCard, setIsCreatingGiftCard] = useState(false);

    // Coupon Management State
    const [adminCoupons, setAdminCoupons] = useState([]);
    const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
    const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);
    const [deletingCouponId, setDeletingCouponId] = useState(null);
    const [newCouponForm, setNewCouponForm] = useState({
        code: '',
        discount: '10',
        maxDiscount: '100',
        minOrderVal: '0',
        validUpto: '',
        maxUsesPerUser: '0',
        isFirstOrderOnly: false
    });


    async function handleAdminLogin(e) {
        e.preventDefault();
        try {
            const res = await fetch(BASE_URL + '/api/admin/products', {
                headers: { 'x-admin-key': inputKey },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setAdminKey(inputKey);
                setIsAdmin(true);
                sessionStorage.setItem('qc_admin_key', inputKey);
                sessionStorage.setItem('qc_is_admin', 'true');
                setAdminProducts(data.products || []);
                showToast('Admin authentication successful 🛡️');
                await loadAdminOrders(inputKey);
                await loadAdminIncidents(inputKey);
                await loadAdminCustomers(null, null, inputKey);
            } else {
                showToast('Invalid admin secret key ❌');
            }
        } catch (err) {
            showToast('Failed to authenticate with backend ❌');
        }
    }

    async function loadAdminOrders(keyToUse) {
        const key = keyToUse || adminKey;
        if (!key) return;
        try {
            const res = await fetch(BASE_URL + '/api/admin/orders', {
                headers: { 'x-admin-key': key },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setAdminOrders(data.orders || []);
            }
        } catch (err) {
            console.error('Fetch admin orders error:', err);
        }
    }

    async function loadAdminIncidents(keyToUse) {
        const key = keyToUse || adminKey;
        if (!key) return;
        try {
            const res = await fetch(BASE_URL + '/api/admin/incidents', {
                headers: { 'x-admin-key': key },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setAdminIncidents(data.incidents || []);
            }
        } catch (err) {
            console.error('Fetch admin incidents error:', err);
        }
    }

    async function loadAdminUsers(filterOverride, searchOverride) {
        const key = adminKey;
        if (!key) return;
        setIsLoadingUsers(true);
        try {
            const filter = filterOverride !== undefined ? filterOverride : userFilter;
            const search = searchOverride !== undefined ? searchOverride : userSearchTerm;
            const params = new URLSearchParams();
            if (filter && filter !== 'all') params.append('criteria', filter);
            if (search && search.trim()) params.append('search', search.trim());

            const res = await fetch(`${BASE_URL}/api/admin/users?${params.toString()}`, {
                headers: { 'x-admin-key': key },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setAdminUsers(data.users || []);
            } else {
                showToast(data.msg || 'Failed to fetch users');
            }
        } catch (err) {
            console.error('Fetch admin users error:', err);
            showToast('Failed to load users from database');
        } finally {
            setIsLoadingUsers(false);
        }
    }

    function toggleSelectUser(userId) {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    }

    function toggleSelectAllUsers() {
        if (selectedUserIds.length === adminUsers.length && adminUsers.length > 0) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(adminUsers.map(u => u._id));
        }
    }

    async function handleExecuteAirdrop(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (selectedUserIds.length === 0) {
            showToast('Please select at least one eligible user ⚠️');
            return;
        }

        const isRandom = airdropMode === 'random';
        const min = Number(minCashAmount);
        const max = Number(maxCashAmount);
        const fixed = Number(fixedCashAmount);

        if (isRandom && (min <= 0 || max < min)) {
            showToast('Invalid random range. Max must be >= Min. ❌');
            return;
        }
        if (!isRandom && fixed <= 0) {
            showToast('Please enter a valid fixed amount > 0 ❌');
            return;
        }

        setIsAirdropping(true);
        setAirdropResult(null);

        try {
            const body = {
                userIds: selectedUserIds,
                isRandom,
                minAmount: min,
                maxAmount: max,
                fixedAmount: fixed,
                reason: campaignReason || 'Special Free Cash Gift',
            };

            if (customExpiryDate) {
                body.expiryDate = new Date(customExpiryDate).toISOString();
            } else {
                body.expiryDays = Number(expiryPresetDays) || 7;
            }

            const res = await fetch(`${BASE_URL}/api/admin/wallet/airdrop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(body),
                credentials: 'include'
            });

            const data = await res.json();
            if (data.ok) {
                showToast(data.msg || 'Free Cash credited successfully! 🎉');
                setAirdropResult(data);
                await loadAdminUsers();
            } else {
                showToast(data.msg || 'Failed to distribute Free Cash ❌');
            }
        } catch (err) {
            console.error('Airdrop error:', err);
            showToast('Network error during airdrop ❌');
        } finally {
            setIsAirdropping(false);
        }
    }

    async function loadAdminCustomers(filterOverride, searchOverride, keyOverride) {
        const key = keyOverride || adminKey;
        if (!key) return;
        setIsLoadingCustomers(true);
        try {
            const s = searchOverride !== undefined ? searchOverride : customerSearchTerm;
            const f = filterOverride !== undefined ? filterOverride : customerFilter;
            let url = `${BASE_URL}/api/admin/customers?filter=${encodeURIComponent(f || 'all')}`;
            if (s && s.trim()) url += `&search=${encodeURIComponent(s.trim())}`;

            const res = await fetch(url, {
                headers: { 'x-admin-key': key },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setAdminCustomers(data.customers || []);
            }
        } catch (err) {
            console.error('Failed to load customers:', err);
        } finally {
            setIsLoadingCustomers(false);
        }
    }

    async function loadCustomerProfile(customerId) {
        if (!customerId || !adminKey) return;
        setIsLoadingProfile(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/customers/${customerId}`, {
                headers: { 'x-admin-key': adminKey },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setCustomerProfileData(data);
                setSelectedCustomer(data.customer);
            } else {
                showToast(data.msg || 'Failed to load customer profile ❌');
            }
        } catch (err) {
            console.error('Customer profile load error:', err);
            showToast('Network error loading customer profile ❌');
        } finally {
            setIsLoadingProfile(false);
        }
    }

    function handleOpenRefund(order) {
        setRefundModalOrder(order);
        setRefundForm({
            refundStatus: order.refundStatus && order.refundStatus !== 'none' ? order.refundStatus : 'pending',
            refundAmount: order.refundAmount ? String(order.refundAmount) : String(order.total || 0),
            refundMethod: order.refundMethod || 'gift_card',
            refundReason: order.refundReason || 'Customer requested return / escalation',
            refundRemarks: order.refundRemarks || ''
        });
    }

    async function handleSaveRefund(e) {
        e.preventDefault();
        if (!refundModalOrder) return;
        setIsUpdatingRefund(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/orders/${refundModalOrder._id}/refund`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(refundForm),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast(data.msg || 'Refund status updated successfully! ✅');
                setRefundModalOrder(null);
                if (selectedCustomer?._id) {
                    await loadCustomerProfile(selectedCustomer._id);
                }
                await loadAdminCustomers();
                await loadAdminOrders();
            } else {
                showToast(data.msg || 'Failed to update refund status ❌');
            }
        } catch (err) {
            console.error('Refund update error:', err);
            showToast('Network error updating refund ❌');
        } finally {
            setIsUpdatingRefund(false);
        }
    }

    async function handleAddIncidentRemark(incidentId) {
        if (!incidentRemarkInput.trim()) {
            showToast('Please enter an escalation remark ⚠️');
            return;
        }
        setIsAddingRemark(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/incidents/${incidentId}/remark`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({
                    remark: incidentRemarkInput.trim(),
                    status: incidentStatusChange,
                    priority: incidentPriorityChange
                }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast('Escalation remark saved to incident! 📝');
                setIncidentRemarkInput('');
                setActiveIncidentId(null);
                if (selectedCustomer?._id) {
                    await loadCustomerProfile(selectedCustomer._id);
                }
                await loadAdminIncidents();
                await loadAdminCustomers();
            } else {
                showToast(data.msg || 'Failed to record remark ❌');
            }
        } catch (err) {
            console.error('Remark error:', err);
            showToast('Network error saving remark ❌');
        } finally {
            setIsAddingRemark(false);
        }
    }

    async function handleDirectGiftCardTopup(customerId) {
        const amt = Number(directTopupAmount);
        if (!amt || amt <= 0) {
            showToast('Please enter a valid gift card amount ⚠️');
            return;
        }
        setIsToppingUp(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/customers/${customerId}/giftcard-topup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({
                    amount: amt,
                    reason: directTopupReason,
                    expiryDays: Number(directTopupDays) || 30
                }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast(data.msg || 'Gift card balance credited! 🎁');
                setIsDirectTopupOpen(false);
                if (selectedCustomer?._id) {
                    await loadCustomerProfile(selectedCustomer._id);
                }
                await loadAdminCustomers();
            } else {
                showToast(data.msg || 'Failed to top up gift card ❌');
            }
        } catch (err) {
            console.error('Top-up error:', err);
            showToast('Network error topping up gift card ❌');
        } finally {
            setIsToppingUp(false);
        }
    }

    async function handleDirectGiftCardRevoke(customerId) {
        if (!customerId || !adminKey) return;
        const amt = Number(directRevokeAmount);
        if (!directRevokeAll && (!amt || amt <= 0)) {
            showToast('Please enter an amount to revoke or select Revoke Entire Balance ⚠️');
            return;
        }
        if (!window.confirm(`Are you sure you want to revoke ${directRevokeAll ? 'ALL' : '₹' + amt} promotional credits from this user?`)) {
            return;
        }
        setIsRevokingCredits(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/customers/${customerId}/giftcard-revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({
                    amount: amt,
                    reason: directRevokeReason,
                    revokeAll: directRevokeAll
                }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast(data.msg || 'Promotional credits revoked successfully ⚠️');
                setIsDirectRevokeOpen(false);
                setDirectRevokeAmount('');
                setDirectRevokeAll(false);
                if (selectedCustomer?._id) {
                    await loadCustomerProfile(selectedCustomer._id);
                }
                await loadAdminCustomers();
            } else {
                showToast(data.msg || 'Failed to revoke credits ❌');
            }
        } catch (err) {
            console.error('Revoke credits error:', err);
            showToast('Network error revoking credits ❌');
        } finally {
            setIsRevokingCredits(false);
        }
    }

    async function handleRevokeSingleGrant(customerId, grantId) {
        if (!customerId || !grantId || !adminKey) return;
        const reason = window.prompt("Reason for revoking this specific promotional grant:", "Admin cancellation of individual grant");
        if (reason === null) return;
        try {
            const res = await fetch(`${BASE_URL}/api/admin/customers/${customerId}/grants/${grantId}/revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ reason }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast(data.msg || 'Grant revoked successfully ✅');
                if (selectedCustomer?._id) {
                    await loadCustomerProfile(selectedCustomer._id);
                }
                await loadAdminCustomers();
            } else {
                showToast(data.msg || 'Failed to revoke grant ❌');
            }
        } catch (err) {
            console.error('Grant revoke error:', err);
            showToast('Network error revoking grant ❌');
        }
    }

    async function loadAdminGiftCards(key) {
        const k = key || adminKey;
        if (!k) return;
        setIsLoadingGiftCards(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/giftcards`, {
                headers: { 'x-admin-key': k },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setAdminGiftCards(data.giftCards || []);
            }
        } catch (err) {
            console.error('Failed to load gift cards:', err);
        } finally {
            setIsLoadingGiftCards(false);
        }
    }

    async function handleCreateGiftCard(e) {
        e.preventDefault();
        if (!newGiftCardForm.code.trim()) {
            showToast('Please enter a voucher code ⚠️');
            return;
        }
        setIsCreatingGiftCard(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/giftcards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(newGiftCardForm),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast(data.msg || 'Gift card voucher created! 🎉');
                setNewGiftCardForm({
                    code: '',
                    title: '',
                    amount: '100',
                    maxRedemptions: '100',
                    expiryDays: '60'
                });
                await loadAdminGiftCards();
            } else {
                showToast(data.msg || 'Failed to create gift card ❌');
            }
        } catch (err) {
            console.error('Create gift card error:', err);
            showToast('Network error creating gift card ❌');
        } finally {
            setIsCreatingGiftCard(false);
        }
    }

    async function loadAdminCoupons() {
        if (!adminKey) return;
        setIsLoadingCoupons(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/coupons`, {
                headers: { 'x-admin-key': adminKey },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setAdminCoupons(data.coupons || []);
            } else {
                showToast(data.msg || 'Failed to load coupons');
            }
        } catch (err) {
            console.error('Failed to load coupons:', err);
            showToast('Network error loading coupons ❌');
        } finally {
            setIsLoadingCoupons(false);
        }
    }

    async function handleCreateCoupon(e) {
        e.preventDefault();
        setIsCreatingCoupon(true);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/coupons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({
                    ...newCouponForm,
                    code: newCouponForm.code.trim().toUpperCase(),
                    discount: Number(newCouponForm.discount),
                    maxDiscount: Number(newCouponForm.maxDiscount),
                    minOrderVal: Number(newCouponForm.minOrderVal),
                    maxUsesPerUser: Number(newCouponForm.maxUsesPerUser),
                    validUpto: new Date(newCouponForm.validUpto).toISOString()
                }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast('Coupon created and ready to use');
                setNewCouponForm({
                    code: '',
                    discount: '10',
                    maxDiscount: '100',
                    minOrderVal: '0',
                    validUpto: '',
                    maxUsesPerUser: '0',
                    isFirstOrderOnly: false
                });
                await loadAdminCoupons();
            } else {
                showToast(data.msg || 'Failed to create coupon');
            }
        } catch (err) {
            console.error('Create coupon error:', err);
            showToast('Network error creating coupon ❌');
        } finally {
            setIsCreatingCoupon(false);
        }
    }

    async function handleDeleteCoupon(coupon) {
        if (!window.confirm(`Delete coupon "${coupon.code}"? Customers will no longer be able to use it.`)) return;
        setDeletingCouponId(coupon._id);
        try {
            const res = await fetch(`${BASE_URL}/api/admin/coupons/${coupon._id}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': adminKey },
                credentials: 'include'
            });
            const responseText = await res.text();
            let data = null;
            try {
                data = JSON.parse(responseText);
            } catch {
                // Older or misconfigured servers may return an HTML error page.
            }
            if (res.ok && data?.ok) {
                showToast(data.msg || 'Coupon deleted');
                await loadAdminCoupons();
            } else {
                const message = res.status === 404 && !data
                    ? 'Coupon delete API is missing on the running backend. Restart or redeploy the backend.'
                    : data?.msg || `Failed to delete coupon (HTTP ${res.status})`;
                showToast(message);
            }
        } catch (err) {
            console.error('Delete coupon error:', err);
            showToast('Could not reach the backend. Check its connection or CORS settings ❌');
        } finally {
            setDeletingCouponId(null);
        }
    }

    async function handleRevokeGiftCardCode(cardId, code) {
        const reason = window.prompt(`Reason for revoking gift card code "${code}":`, "Promotional campaign discontinued / fraud prevention");
        if (reason === null) return;
        try {
            const res = await fetch(`${BASE_URL}/api/admin/giftcards/${cardId}/revoke`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ reason }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast(data.msg || 'Gift card revoked successfully ⚠️');
                await loadAdminGiftCards();
            } else {
                showToast(data.msg || 'Failed to revoke gift card ❌');
            }
        } catch (err) {
            console.error('Revoke gift card error:', err);
            showToast('Network error revoking gift card ❌');
        }
    }

    useEffect(() => {
        if (isAdmin) {
            loadAdminProducts();
            loadAdminOrders();
            loadAdminIncidents();
            loadAdminUsers();
            loadAdminCustomers();
            loadAdminGiftCards();
        }
    }, [isAdmin]);

    // Update order status across all 5 milestones
    async function handleUpdateOrderStatus(orderId, newStatus) {
        try {
            const res = await fetch(`${BASE_URL}/api/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast(`Order status updated to "${newStatus.replace(/_/g, ' ').toUpperCase()}" ✅`);
                await loadAdminOrders();
                await fetchProductStock();
                if (loadOrders) await loadOrders();
                if (data.order && setActiveTrackingOrder) {
                    setActiveTrackingOrder(prev => {
                        if (prev && (prev._id === orderId || prev.id === orderId)) {
                            return data.order;
                        }
                        return prev;
                    });
                }
            } else {
                showToast(data.msg || 'Failed to update order status ❌');
            }
        } catch (err) {
            showToast('Network error updating order status ❌');
        }
    }

    // Save Product (Add or Edit)
    async function handleSaveProduct(e) {
        e.preventDefault();
        try {
            const url = editingProduct
                ? `${BASE_URL}/api/admin/products/${editingProduct.id}`
                : `${BASE_URL}/api/admin/products`;

            const method = editingProduct ? 'PUT' : 'POST';

            const payload = {
                ...productForm,
                image: formatProductImage(productForm.image)
            };

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast(editingProduct ? 'Product & Offer updated! ✨' : 'Product added successfully! ✅');
                setIsProductModalOpen(false);
                setEditingProduct(null);
                await loadAdminProducts();
                await fetchProductStock();
            } else {
                showToast(data.msg || 'Failed to save product ❌');
            }
        } catch (err) {
            showToast('Network error saving product ❌');
        }
    }

    async function handleProductImageUpload(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        if (!file.type.startsWith('image/')) {
            showToast('Choose an image file such as JPG, PNG, or WebP');
            return;
        }
        if (file.size > 12 * 1024 * 1024) {
            showToast('Image must be 12 MB or smaller');
            return;
        }

        setIsProcessingProductImage(true);
        try {
            const bitmap = await createImageBitmap(file);
            const scale = Math.min(1, 1200 / bitmap.width, 1200 / bitmap.height);
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(bitmap.width * scale));
            canvas.height = Math.max(1, Math.round(bitmap.height * scale));
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Image processing is unavailable');
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            bitmap.close();

            const compressedImage = await new Promise((resolve, reject) => {
                canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not compress image')), 'image/jpeg', 0.82);
            });
            if (compressedImage.size > 3 * 1024 * 1024) {
                throw new Error('Compressed image is still too large. Choose a smaller image.');
            }

            const imageData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error('Could not read image'));
                reader.readAsDataURL(compressedImage);
            });
            setProductForm(prev => ({ ...prev, image: imageData }));
            setProductImagePreviewError(false);
            showToast('Product image added');
        } catch (error) {
            console.error('Product image upload error:', error);
            showToast(error.message || 'Could not process this image');
        } finally {
            setIsProcessingProductImage(false);
        }
    }

    // Delete Product
    async function handleDeleteProduct(productId) {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            const res = await fetch(`${BASE_URL}/api/admin/products/${productId}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': adminKey },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast('Product removed from catalog 🗑️');
                await loadAdminProducts();
                await fetchProductStock();
            } else {
                showToast(data.msg || 'Failed to remove product ❌');
            }
        } catch (err) {
            showToast('Network error deleting product ❌');
        }
    }

    // Update Incident Ticket Status
    async function handleUpdateIncident(incidentId, status, notes) {
        try {
            const res = await fetch(`${BASE_URL}/api/admin/incidents/${incidentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': adminKey
                },
                body: JSON.stringify({ status, resolutionNotes: notes }),
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                showToast(`Ticket #${data.incident.ticketId} marked as ${status} ✅`);
                setSelectedIncident(null);
                await loadAdminIncidents();
            } else {
                showToast('Failed to update ticket');
            }
        } catch (err) {
            showToast('Error updating ticket');
        }
    }

    // Filtered orders
    const filteredOrders = adminOrders.filter(o => {
        if (orderFilter !== 'all' && (o.status || 'placed') !== orderFilter) return false;
        return true;
    });

    // Filtered products
    const filteredProductsList = adminProducts.filter(p => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return p.name?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q) || p.subcategory?.toLowerCase().includes(q);
    });

    // ---------------- NOT AUTHENTICATED: LOGIN SCREEN ----------------
    if (!isAdmin) {
        return (
            <section className="qc-admin-login-section">
                <div className="qc-admin-login-card">
                    <div className="qc-admin-shield-icon">
                        <Shield size={36} />
                    </div>
                    <h3>Restricted Admin Portal</h3>
                    <p>Enter administrative secret key to manage catalog, festive offers, orders & support incidents.</p>

                    <form onSubmit={handleAdminLogin} className="qc-admin-login-form">
                        <div className="qc-form-group">
                            <label>Admin Secret Key</label>
                            <input
                                type="password"
                                placeholder="Enter admin key"
                                value={inputKey}
                                onChange={(e) => setInputKey(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="qc-cta-button">
                            Enter Admin Panel
                        </button>
                    </form>
                </div>
            </section>
        );
    }

    // ---------------- AUTHENTICATED ADMIN DASHBOARD ----------------
    return (
        <section className="qc-admin-dashboard-section">
            {/* Top Admin Header */}
            <div className="qc-admin-header-card">
                <div className="qc-admin-header-left">
                    <div className="qc-admin-badge-icon">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2>QuickCart Administration Center</h2>
                        <span className="qc-admin-status-text">
                            Active Session • Full Store Access
                        </span>
                    </div>
                </div>

                <div className="qc-admin-header-right">
                    <div className="qc-admin-theme-tag">
                        <span>Active Festival: <strong>{currentThemeConfig.name}</strong></span>
                    </div>
                    <button
                        className="qc-admin-logout-btn"
                        onClick={() => {
                            setIsAdmin(false);
                            setAdminKey('');
                            sessionStorage.removeItem('qc_admin_key');
                            sessionStorage.removeItem('qc_is_admin');
                            showToast('Admin session closed');
                        }}
                    >
                        Exit Admin
                    </button>
                </div>
            </div>

            {/* Admin Tabs */}
            <div className="qc-admin-tabs-row">
                <button
                    className={`qc-admin-tab ${activeAdminTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveAdminTab('products')}
                >
                    <Package size={16} />
                    <span>Product Catalog & Offers ({adminProducts.length})</span>
                </button>

                <button
                    className={`qc-admin-tab ${activeAdminTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveAdminTab('orders')}
                >
                    <ShoppingBag size={16} />
                    <span>Orders & Dispatch ({adminOrders.length})</span>
                </button>

                <button
                    className={`qc-admin-tab ${activeAdminTab === 'customers' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveAdminTab('customers');
                        loadAdminCustomers();
                    }}
                >
                    <Users size={16} />
                    <span>Customer 360 & Escalations ({adminCustomers.length})</span>
                </button>

                <button
                    className={`qc-admin-tab ${activeAdminTab === 'incidents' ? 'active' : ''}`}
                    onClick={() => setActiveAdminTab('incidents')}
                >
                    <LifeBuoy size={16} />
                    <span>Customer Support Tickets ({adminIncidents.length})</span>
                </button>

                <button
                    className={`qc-admin-tab ${activeAdminTab === 'themes' ? 'active' : ''}`}
                    onClick={() => setActiveAdminTab('themes')}
                >
                    <Sparkles size={16} />
                    <span>Festival & Campaign Engine</span>
                </button>

                <button
                    className={`qc-admin-tab ${activeAdminTab === 'wallet' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveAdminTab('wallet');
                        loadAdminUsers();
                    }}
                >
                    <Gift size={16} />
                    <span>Wallet Campaigns & Airdrop</span>
                </button>

                <button
                    className={`qc-admin-tab ${activeAdminTab === 'giftcards' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveAdminTab('giftcards');
                        loadAdminGiftCards();
                    }}
                >
                    <Tag size={16} />
                    <span>Promotional Gift Cards ({adminGiftCards.length})</span>
                </button>

                <button
                    className={`qc-admin-tab ${activeAdminTab === 'coupons' ? 'active' : ''}`}
                    onClick={() => {
                        setActiveAdminTab('coupons');
                        loadAdminCoupons();
                    }}
                >
                    <Tag size={16} />
                    <span>Coupons ({adminCoupons.length})</span>
                </button>
            </div>

            {/* TAB 1: PRODUCT CATALOG & OFFERS */}
            {activeAdminTab === 'products' && (
                <div className="qc-admin-panel-content">
                    <div className="qc-admin-action-bar">
                        <div className="qc-admin-search-box">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search products by name, category, or subcategory..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <button
                            className="qc-cta-button small"
                            onClick={() => {
                                setEditingProduct(null);
                                setProductForm({
                                    name: '',
                                    price: '',
                                    mrp: '',
                                    category: 'Groceries',
                                    subcategory: 'Vegetables',
                                    stock: '25',
                                    image: '/assets/potato.jpg',
                                    offerTag: 'Festive Special',
                                    discountPercent: '30',
                                    featured: true,
                                    limitPerOrder: '0'
                                });
                                setIsProductModalOpen(true);
                            }}
                        >
                            <Plus size={16} />
                            <span>Add New Product</span>
                        </button>
                    </div>

                    {/* Products Management Table */}
                    <div className="qc-admin-table-card">
                        <div className="qc-table-responsive">
                            <table className="qc-data-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Price / MRP</th>
                                        <th>Offer Feature</th>
                                        <th>Stock</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProductsList.map((p) => (
                                        <tr key={p.id}>
                                            <td className="qc-table-prod-name">
                                                <img
                                                    src={formatProductImage(p.image)}
                                                    alt={p.name}
                                                    className="qc-table-thumb"
                                                    onError={(e) => {
                                                        if (!e.target.dataset.tried) {
                                                            e.target.dataset.tried = 'true';
                                                            e.target.src = '/assets/banana.jpg';
                                                        }
                                                    }}
                                                />
                                                <div>
                                                    <strong>{p.name}</strong>
                                                    <small>ID: {p.id}</small>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="qc-cat-tag">{p.category}</span>
                                                <small className="qc-subcat-text">{p.subcategory}</small>
                                            </td>
                                            <td>
                                                <strong>₹{p.price}</strong>
                                                {p.mrp > p.price && (
                                                    <span className="qc-table-mrp"> (MRP: ₹{p.mrp})</span>
                                                )}
                                            </td>
                                            <td>
                                                {p.offerTag ? (
                                                    <span className="qc-table-offer-tag">
                                                        <Flame size={12} /> {p.offerTag} ({p.discountPercent || 20}% OFF)
                                                    </span>
                                                ) : (
                                                    <span className="qc-no-offer">Standard</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`qc-stock-pill ${p.stock === 0 ? 'zero' : p.stock <= 5 ? 'low' : 'good'}`}>
                                                    {p.stock} units
                                                </span>
                                            </td>
                                            <td>
                                                <div className="qc-table-actions-cell">
                                                    <button
                                                        className="qc-table-btn edit"
                                                        onClick={() => {
                                                            setEditingProduct(p);
                                                            setProductForm({
                                                                name: p.name,
                                                                price: p.price,
                                                                mrp: p.mrp || Math.round(p.price * 1.35),
                                                                category: p.category,
                                                                subcategory: p.subcategory || '',
                                                                stock: p.stock,
                                                                image: p.image || '',
                                                                offerTag: p.offerTag || 'Deal of the Day',
                                                                discountPercent: p.discountPercent || 25,
                                                                featured: p.featured || false,
                                                                limitPerOrder: p.limitPerOrder || 0
                                                            });
                                                            setIsProductModalOpen(true);
                                                        }}
                                                        title="Edit Product & Offer Tag"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>
                                                    <button
                                                        className="qc-table-btn delete"
                                                        onClick={() => handleDeleteProduct(p.id)}
                                                        title="Delete Product"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: ORDERS & 5-STEP DELIVERY */}
            {activeAdminTab === 'orders' && (
                <div className="qc-admin-panel-content">
                    {/* Orders Filter Row */}
                    <div className="qc-orders-filter-bar">
                        <span className="qc-filter-label"><Filter size={15} /> Filter by Status:</span>
                        {['all', 'placed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map((st) => (
                            <button
                                key={st}
                                className={`qc-order-filter-pill ${orderFilter === st ? 'active' : ''}`}
                                onClick={() => setOrderFilter(st)}
                            >
                                {st.replace(/_/g, ' ').toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className="qc-admin-orders-list">
                        {filteredOrders.length === 0 ? (
                            <div className="qc-empty-section-box">
                                <ShoppingBag size={48} className="qc-empty-icon" />
                                <h4>No orders found matching this filter</h4>
                            </div>
                        ) : (
                            filteredOrders.map((order) => {
                                const currentStatus = order.status || 'placed';
                                const trackingId = order.trackingId || ('QC-TRK-' + (order._id?.slice(-6) || '12345'));

                                return (
                                    <div key={order._id} className="qc-admin-order-card">
                                        <div className="qc-admin-order-top">
                                            <div className="qc-admin-order-id-block">
                                                <strong>Order #{order._id?.slice(-8)}</strong>
                                                <span className="qc-admin-trk-pill">
                                                    <Truck size={12} /> {trackingId}
                                                </span>
                                                <small>{new Date(order.createdAt).toLocaleString()}</small>
                                            </div>

                                            <div className="qc-admin-order-price-block">
                                                <span className="qc-admin-customer-info">
                                                    Customer: {order.userId?.email || order.address?.name || 'Customer'}
                                                </span>
                                                <strong>Total: ₹{order.total}</strong>
                                            </div>
                                        </div>

                                        {/* Items */}
                                        <div className="qc-admin-order-items">
                                            {order.items?.map((item, idx) => (
                                                <span key={idx} className="qc-admin-item-tag">
                                                    {item.name} × {item.qty} (₹{item.price * item.qty})
                                                </span>
                                            ))}
                                        </div>

                                        {/* Status Update Dropdown (5-Milestones) */}
                                        <div className="qc-admin-status-control-row">
                                            <span className="qc-status-label">Update Delivery Status:</span>
                                            <div className="qc-status-btn-group">
                                                {[
                                                    { val: 'placed', label: 'Placed' },
                                                    { val: 'packed', label: 'Packed' },
                                                    { val: 'shipped', label: 'Shipped' },
                                                    { val: 'out_for_delivery', label: 'Out for Delivery' },
                                                    { val: 'delivered', label: 'Delivered' },
                                                    { val: 'cancelled', label: 'Cancelled' }
                                                ].map((s) => (
                                                    <button
                                                        key={s.val}
                                                        className={`qc-status-step-btn ${currentStatus === s.val ? 'active' : ''} ${s.val === 'cancelled' ? 'danger' : ''}`}
                                                        onClick={() => handleUpdateOrderStatus(order._id, s.val)}
                                                    >
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Order Refund Status & Customer 360 Shortcuts */}
                                        <div className="qc-admin-order-refund-row">
                                            <div className="qc-order-refund-status-tag">
                                                <span>Refund Status: </span>
                                                {order.refundStatus === 'pending' && <span className="qc-status-chip pending">⏳ Pending Review (₹{order.refundAmount || order.total})</span>}
                                                {order.refundStatus === 'processed' && <span className="qc-status-chip processed">🔄 Processed (₹{order.refundAmount || order.total})</span>}
                                                {order.refundStatus === 'credited' && <span className="qc-status-chip credited">✅ Credited to {order.refundMethod === 'gift_card' ? 'Gift Card' : 'Bank'} (₹{order.refundAmount || order.total})</span>}
                                                {(!order.refundStatus || order.refundStatus === 'none') && <span className="qc-status-chip none">No Refund</span>}
                                            </div>
                                            <div className="qc-flex-align gap-2">
                                                <button
                                                    className="qc-order-action-btn small secondary"
                                                    onClick={() => handleOpenRefund(order)}
                                                >
                                                    <RotateCcw size={12} />
                                                    <span>Manage Refund</span>
                                                </button>
                                                {order.userId && (
                                                    <button
                                                        className="qc-order-action-btn small primary"
                                                        onClick={() => {
                                                            const uId = order.userId?._id || order.userId;
                                                            setActiveAdminTab('customers');
                                                            loadCustomerProfile(uId);
                                                        }}
                                                    >
                                                        <Users size={12} />
                                                        <span>Customer 360</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* TAB: CUSTOMER MANAGEMENT 360 & ESCALATIONS */}
            {activeAdminTab === 'customers' && (
                <div className="qc-admin-panel-content">
                    {/* Header bar */}
                    <div className="qc-customer-admin-header">
                        <div className="qc-customer-title-area">
                            <div className="qc-customer-title-icon">
                                <Users size={26} />
                            </div>
                            <div>
                                <h3>Customer Management 360 & Incident Escalations</h3>
                                <p>Inspect complete customer records, browse order history, track refund lifecycle (pending, processed, credited), and add remarks to escalations.</p>
                            </div>
                        </div>

                        {selectedCustomer && (
                            <button
                                className="qc-order-action-btn secondary"
                                onClick={() => {
                                    setSelectedCustomer(null);
                                    setCustomerProfileData(null);
                                }}
                            >
                                ← Back to Customer Directory
                            </button>
                        )}
                    </div>

                    {!selectedCustomer ? (
                        /* ================== VIEW 1: CUSTOMER DIRECTORY ================== */
                        <div className="qc-customer-directory-wrapper">
                            {/* Search and Filters Bar */}
                            <div className="qc-customer-toolbar">
                                <div className="qc-admin-search-box flex-1">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search by customer email, phone, or ID..."
                                        value={customerSearchTerm}
                                        onChange={(e) => {
                                            setCustomerSearchTerm(e.target.value);
                                            loadAdminCustomers(undefined, e.target.value);
                                        }}
                                    />
                                    {customerSearchTerm && (
                                        <button
                                            type="button"
                                            className="qc-search-clear-btn"
                                            onClick={() => {
                                                setCustomerSearchTerm('');
                                                loadAdminCustomers(undefined, '');
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="qc-customer-filter-pills">
                                    {[
                                        { val: 'all', label: `All (${adminCustomers.length})` },
                                        { val: 'pending_refunds', label: `⚠️ Pending Refunds (${adminCustomers.filter(c => c.refundStats?.pending > 0).length})` },
                                        { val: 'has_incidents', label: `🚨 Escalated (${adminCustomers.filter(c => c.incidentStats?.open > 0).length})` },
                                        { val: 'vip', label: '👑 VIP Customers' },
                                        { val: 'has_orders', label: '📦 Has Orders' },
                                        { val: 'no_orders', label: '0️⃣ No Orders' }
                                    ].map((f) => (
                                        <button
                                            key={f.val}
                                            className={`qc-filter-pill-btn ${customerFilter === f.val ? 'active' : ''}`}
                                            onClick={() => {
                                                setCustomerFilter(f.val);
                                                loadAdminCustomers(f.val);
                                            }}
                                        >
                                            {f.label}
                                        </button>
                                    ))}

                                    <button
                                        className="qc-refresh-icon-btn"
                                        title="Reload Customers"
                                        onClick={() => loadAdminCustomers()}
                                        disabled={isLoadingCustomers}
                                    >
                                        <RotateCw size={14} className={isLoadingCustomers ? 'spin' : ''} />
                                    </button>
                                </div>
                            </div>

                            {/* Customer List Grid */}
                            {isLoadingCustomers ? (
                                <div className="qc-loading-spinner-box">
                                    <RotateCw size={32} className="spin text-primary" />
                                    <p>Loading Customer Profiles...</p>
                                </div>
                            ) : adminCustomers.length === 0 ? (
                                <div className="qc-empty-section-box">
                                    <Users size={48} className="qc-empty-icon" />
                                    <h4>No customers found</h4>
                                    <p>Try adjusting your search criteria or filter options.</p>
                                </div>
                            ) : (
                                <div className="qc-customer-cards-grid">
                                    {adminCustomers.map((c) => {
                                        const initials = (c.email?.slice(0, 2) || 'QC').toUpperCase();
                                        const isVIP = c.totalSpent >= 1000 || c.totalOrders >= 3;

                                        return (
                                            <div key={c._id} className="qc-customer-card">
                                                <div className="qc-customer-card-header">
                                                    <div className="qc-customer-avatar-box">
                                                        <span>{initials}</span>
                                                    </div>
                                                    <div className="qc-customer-identity">
                                                        <div className="qc-customer-email-line">
                                                            <strong>{c.email}</strong>
                                                            {isVIP && <span className="qc-vip-tag">👑 VIP</span>}
                                                        </div>
                                                        <span className="qc-customer-phone">
                                                            {c.phone ? `📞 ${c.phone}` : 'No phone linked'}
                                                        </span>
                                                        <small className="qc-customer-date">
                                                            Joined: {new Date(c.createdAt).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                </div>

                                                <div className="qc-customer-card-metrics">
                                                    <div className="qc-cust-metric">
                                                        <span>Orders</span>
                                                        <strong>{c.totalOrders || 0}</strong>
                                                    </div>
                                                    <div className="qc-cust-metric">
                                                        <span>Spent</span>
                                                        <strong>₹{c.totalSpent || 0}</strong>
                                                    </div>
                                                    <div className="qc-cust-metric highlight">
                                                        <span>Gift Card Bal</span>
                                                        <strong>₹{c.giftCardBalance || 0}</strong>
                                                    </div>
                                                </div>

                                                {/* Refund & Incident Indicators */}
                                                <div className="qc-customer-status-strips">
                                                    <div className="qc-status-indicator-col">
                                                        <small>Refund Status:</small>
                                                        {c.refundStats?.pending > 0 ? (
                                                            <span className="qc-status-chip pending">
                                                                ⚠️ {c.refundStats.pending} Pending
                                                            </span>
                                                        ) : c.refundStats?.credited > 0 ? (
                                                            <span className="qc-status-chip credited">
                                                                ✅ {c.refundStats.credited} Credited
                                                            </span>
                                                        ) : c.refundStats?.processed > 0 ? (
                                                            <span className="qc-status-chip processed">
                                                                🔄 {c.refundStats.processed} Processed
                                                            </span>
                                                        ) : (
                                                            <span className="qc-status-chip none">Cleared</span>
                                                        )}
                                                    </div>

                                                    <div className="qc-status-indicator-col">
                                                        <small>Escalations:</small>
                                                        {c.incidentStats?.open > 0 ? (
                                                            <span className="qc-status-chip incident-open">
                                                                🚨 {c.incidentStats.open} Open Ticket
                                                            </span>
                                                        ) : (
                                                            <span className="qc-status-chip incident-none">
                                                                {c.incidentStats?.total > 0 ? '✓ Resolved' : 'None'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="qc-customer-card-footer">
                                                    <button
                                                        className="qc-view-profile-btn"
                                                        onClick={() => loadCustomerProfile(c._id)}
                                                    >
                                                        <span>View 360 Profile</span>
                                                        <ArrowRight size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* ================== VIEW 2: CUSTOMER 360 PROFILE VIEW ================== */
                        <div className="qc-customer-360-workspace">
                            {isLoadingProfile ? (
                                <div className="qc-loading-spinner-box">
                                    <RotateCw size={32} className="spin text-primary" />
                                    <p>Loading 360 Profile...</p>
                                </div>
                            ) : (
                                <>
                                    {/* Top Profile Summary Card */}
                                    <div className="qc-customer-profile-hero">
                                        <div className="qc-profile-hero-left">
                                            <div className="qc-customer-profile-avatar">
                                                {(selectedCustomer.email?.slice(0, 2) || 'QC').toUpperCase()}
                                            </div>
                                            <div className="qc-profile-hero-meta">
                                                <div className="qc-profile-title-row">
                                                    <h4>{selectedCustomer.email}</h4>
                                                    {(selectedCustomer.giftCardBalance >= 500 || customerProfileData?.orders?.length >= 3) && (
                                                        <span className="qc-vip-badge">👑 Premier VIP Member</span>
                                                    )}
                                                </div>
                                                <div className="qc-profile-submeta">
                                                    <span>📞 {selectedCustomer.phone || 'No phone registered'}</span>
                                                    <span>•</span>
                                                    <span>📅 Member Since: {new Date(selectedCustomer.createdAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>📍 {selectedCustomer.addresses?.length || 0} Saved Addresses</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="qc-profile-hero-stats">
                                            <div className="qc-hero-stat-card">
                                                <span className="qc-stat-label">Total Orders</span>
                                                <strong className="qc-stat-val">{customerProfileData?.orders?.length || 0}</strong>
                                            </div>
                                            <div className="qc-hero-stat-card">
                                                <span className="qc-stat-label">Lifetime Spend</span>
                                                <strong className="qc-stat-val">
                                                    ₹{customerProfileData?.orders?.filter(o => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0) || 0}
                                                </strong>
                                            </div>
                                            <div className="qc-hero-stat-card highlight">
                                                <span className="qc-stat-label">Gift Card Balance</span>
                                                <strong className="qc-stat-val">₹{selectedCustomer.giftCardBalance || 0}</strong>
                                                <small>{selectedCustomer.activeGrants?.length || 0} active grants</small>
                                            </div>
                                            <div className="qc-hero-stat-card">
                                                <span className="qc-stat-label">Refunds Pending</span>
                                                <strong className={`qc-stat-val ${customerProfileData?.refundSummary?.pendingCount > 0 ? 'text-amber' : ''}`}>
                                                    {customerProfileData?.refundSummary?.pendingCount || 0}
                                                </strong>
                                                <small>Credited: ₹{customerProfileData?.refundSummary?.creditedAmount || 0}</small>
                                            </div>
                                        </div>

                                        <div className="qc-profile-hero-actions">
                                            <button
                                                className="qc-cta-button small"
                                                onClick={() => {
                                                    setIsDirectTopupOpen(!isDirectTopupOpen);
                                                    setIsDirectRevokeOpen(false);
                                                }}
                                            >
                                                <Gift size={14} />
                                                <span>{isDirectTopupOpen ? 'Close Top-Up' : '+ Give Promotional Credits'}</span>
                                            </button>
                                            <button
                                                className="qc-admin-btn-danger small"
                                                style={{ marginLeft: '8px' }}
                                                onClick={() => {
                                                    setIsDirectRevokeOpen(!isDirectRevokeOpen);
                                                    setIsDirectTopupOpen(false);
                                                    setDirectRevokeAmount(String(selectedCustomer?.giftCardBalance || ''));
                                                    setDirectRevokeAll(false);
                                                }}
                                            >
                                                <AlertTriangle size={14} />
                                                <span>{isDirectRevokeOpen ? 'Close Revoke' : '- Revoke Credits'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Direct Gift Card Top-Up Inline Form */}
                                    {isDirectTopupOpen && (
                                        <div className="qc-direct-topup-card">
                                            <div className="qc-topup-header">
                                                <Sparkles size={16} className="qc-text-sparkle" />
                                                <strong>Direct Gift Card Balance Adjustment / Customer Delight Grant</strong>
                                            </div>
                                            <div className="qc-topup-form-row">
                                                <div className="qc-form-group">
                                                    <label>Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={directTopupAmount}
                                                        onChange={(e) => setDirectTopupAmount(e.target.value)}
                                                        placeholder="100"
                                                    />
                                                </div>
                                                <div className="qc-form-group flex-2">
                                                    <label>Reason / Audit Note</label>
                                                    <input
                                                        type="text"
                                                        value={directTopupReason}
                                                        onChange={(e) => setDirectTopupReason(e.target.value)}
                                                        placeholder="e.g. Apology for delivery delay / Support resolution"
                                                    />
                                                </div>
                                                <div className="qc-form-group">
                                                    <label>Validity (Days)</label>
                                                    <input
                                                        type="number"
                                                        value={directTopupDays}
                                                        onChange={(e) => setDirectTopupDays(e.target.value)}
                                                        placeholder="30"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="qc-cta-button"
                                                    disabled={isToppingUp}
                                                    onClick={() => handleDirectGiftCardTopup(selectedCustomer._id)}
                                                >
                                                    {isToppingUp ? <RotateCw size={14} className="spin" /> : <Gift size={14} />}
                                                    <span>Credit Balance</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Direct Promotional Credits Revoke Inline Form */}
                                    {isDirectRevokeOpen && (
                                        <div className="qc-direct-topup-card qc-direct-revoke-card">
                                            <div className="qc-topup-header" style={{ color: '#b91c1c' }}>
                                                <AlertTriangle size={16} />
                                                <strong>Revoke Promotional Credits / Gift Card Clawback (Current Active Balance: ₹{selectedCustomer?.giftCardBalance || 0})</strong>
                                            </div>
                                            <div className="qc-topup-form-row">
                                                <div className="qc-form-group">
                                                    <label>Amount to Revoke (₹)</label>
                                                    <input
                                                        type="number"
                                                        value={directRevokeAmount}
                                                        onChange={(e) => {
                                                            setDirectRevokeAmount(e.target.value);
                                                            setDirectRevokeAll(false);
                                                        }}
                                                        placeholder={`Max ₹${selectedCustomer?.giftCardBalance || 0}`}
                                                        disabled={directRevokeAll}
                                                    />
                                                </div>
                                                <div className="qc-form-group flex-2">
                                                    <label>Revocation Reason / Audit Note</label>
                                                    <input
                                                        type="text"
                                                        value={directRevokeReason}
                                                        onChange={(e) => setDirectRevokeReason(e.target.value)}
                                                        placeholder="e.g. Promotional credit clawback / Policy adjustment"
                                                    />
                                                </div>
                                                <div className="qc-form-group" style={{ display: 'flex', alignItems: 'center', paddingBottom: '10px' }}>
                                                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={directRevokeAll}
                                                            onChange={(e) => {
                                                                setDirectRevokeAll(e.target.checked);
                                                                if (e.target.checked) {
                                                                    setDirectRevokeAmount(String(selectedCustomer?.giftCardBalance || 0));
                                                                }
                                                            }}
                                                        />
                                                        Revoke All
                                                    </label>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="qc-admin-btn-danger"
                                                    style={{ height: '38px', padding: '0 16px' }}
                                                    disabled={isRevokingCredits || (selectedCustomer?.giftCardBalance || 0) <= 0}
                                                    onClick={() => handleDirectGiftCardRevoke(selectedCustomer._id)}
                                                >
                                                    {isRevokingCredits ? <RotateCw size={14} className="spin" /> : <AlertTriangle size={14} />}
                                                    <span>Confirm Revocation</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sub-tabs Navigation */}
                                    <div className="qc-customer-subtabs-bar">
                                        <button
                                            className={`qc-subtab-btn ${customerSubTab === 'orders' ? 'active' : ''}`}
                                            onClick={() => setCustomerSubTab('orders')}
                                        >
                                            <ShoppingBag size={14} />
                                            <span>Order History & Refunds ({customerProfileData?.orders?.length || 0})</span>
                                        </button>
                                        <button
                                            className={`qc-subtab-btn ${customerSubTab === 'incidents' ? 'active' : ''}`}
                                            onClick={() => setCustomerSubTab('incidents')}
                                        >
                                            <LifeBuoy size={14} />
                                            <span>Incident Escalations & Remarks ({customerProfileData?.incidents?.length || 0})</span>
                                        </button>
                                        <button
                                            className={`qc-subtab-btn ${customerSubTab === 'wallet' ? 'active' : ''}`}
                                            onClick={() => setCustomerSubTab('wallet')}
                                        >
                                            <Gift size={14} />
                                            <span>Gift Card & Wallet Grants</span>
                                        </button>
                                        <button
                                            className={`qc-subtab-btn ${customerSubTab === 'addresses' ? 'active' : ''}`}
                                            onClick={() => setCustomerSubTab('addresses')}
                                        >
                                            <MapPin size={14} />
                                            <span>Saved Addresses ({selectedCustomer.addresses?.length || 0})</span>
                                        </button>
                                    </div>

                                    {/* ================== SUBTAB 1: ORDER HISTORY & REFUNDS ================== */}
                                    {customerSubTab === 'orders' && (
                                        <div className="qc-subtab-content">
                                            {customerProfileData?.orders?.length === 0 ? (
                                                <div className="qc-empty-section-box">
                                                    <ShoppingBag size={40} className="qc-empty-icon" />
                                                    <h4>No orders placed yet</h4>
                                                    <p>This customer hasn't checked out any orders on QuickCart yet.</p>
                                                </div>
                                            ) : (
                                                <div className="qc-customer-orders-list">
                                                    {customerProfileData.orders.map((ord) => {
                                                        const refStatus = ord.refundStatus || 'none';
                                                        return (
                                                            <div key={ord._id} className="qc-cust-order-card">
                                                                <div className="qc-cust-order-header">
                                                                    <div className="qc-cust-order-id-meta">
                                                                        <strong>Order #{ord._id.slice(-8)}</strong>
                                                                        <span className="qc-admin-trk-pill">
                                                                            <Truck size={12} /> {ord.trackingId || `QC-TRK-${ord._id.slice(-6)}`}
                                                                        </span>
                                                                        <span className="qc-order-time-text">
                                                                            {new Date(ord.createdAt).toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                    <div className="qc-cust-order-header-right">
                                                                        <span className={`qc-ticket-status-pill ${ord.status}`}>
                                                                            {ord.status?.toUpperCase()}
                                                                        </span>
                                                                        <strong className="qc-order-total-price">₹{ord.total}</strong>
                                                                    </div>
                                                                </div>

                                                                {/* Items breakdown */}
                                                                <div className="qc-cust-order-items-strip">
                                                                    {ord.items?.map((it, idx) => (
                                                                        <div key={idx} className="qc-cust-item-mini">
                                                                            {it.image && <img src={it.image} alt={it.name} />}
                                                                            <div className="qc-cust-item-text">
                                                                                <span>{it.name}</span>
                                                                                <small>{it.qty} × ₹{it.price}</small>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                {/* REFUND STATUS BAR & CONTROLS */}
                                                                <div className="qc-cust-refund-panel">
                                                                    <div className="qc-refund-status-indicator">
                                                                        <span className="qc-refund-label">Refund Lifecycle Status:</span>
                                                                        {refStatus === 'pending' && (
                                                                            <span className="qc-refund-badge pending">
                                                                                ⏳ Pending Review (₹{ord.refundAmount || ord.total})
                                                                            </span>
                                                                        )}
                                                                        {refStatus === 'processed' && (
                                                                            <span className="qc-refund-badge processed">
                                                                                🔄 Processed / In-Transit (₹{ord.refundAmount || ord.total})
                                                                            </span>
                                                                        )}
                                                                        {refStatus === 'credited' && (
                                                                            <span className="qc-refund-badge credited">
                                                                                ✅ Credited to {ord.refundMethod === 'gift_card' ? 'Gift Card Balance' : 'Original Payment'} (₹{ord.refundAmount || ord.total})
                                                                            </span>
                                                                        )}
                                                                        {refStatus === 'none' && (
                                                                            <span className="qc-refund-badge none">No Refund Requested</span>
                                                                        )}

                                                                        {ord.refundRemarks && (
                                                                            <span className="qc-refund-remark-note">
                                                                                Remarks: <em>{ord.refundRemarks}</em>
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    <button
                                                                        className="qc-manage-refund-btn"
                                                                        onClick={() => handleOpenRefund(ord)}
                                                                    >
                                                                        <RotateCcw size={13} />
                                                                        <span>{refStatus === 'none' ? 'Initiate / Record Refund' : 'Manage Refund Status'}</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ================== SUBTAB 2: INCIDENT ESCALATIONS & REMARKS ================== */}
                                    {customerSubTab === 'incidents' && (
                                        <div className="qc-subtab-content">
                                            {customerProfileData?.incidents?.length === 0 ? (
                                                <div className="qc-empty-section-box">
                                                    <LifeBuoy size={40} className="qc-empty-icon" />
                                                    <h4>No support incidents or escalations</h4>
                                                    <p>This customer has not raised any support escalation tickets.</p>
                                                </div>
                                            ) : (
                                                <div className="qc-customer-incidents-list">
                                                    {customerProfileData.incidents.map((inc) => (
                                                        <div key={inc._id} className="qc-cust-incident-card">
                                                            <div className="qc-incident-card-top">
                                                                <div className="qc-inc-id-row">
                                                                    <strong>#{inc.ticketId}</strong>
                                                                    <span className={`qc-ticket-priority ${inc.priority || 'medium'}`}>
                                                                        {inc.priority?.toUpperCase()} PRIORITY
                                                                    </span>
                                                                    <span className={`qc-ticket-status-pill ${inc.status}`}>
                                                                        {inc.status?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <small className="qc-inc-time">{new Date(inc.createdAt).toLocaleString()}</small>
                                                            </div>

                                                            <h5 className="qc-inc-subject">{inc.subject}</h5>
                                                            <div className="qc-inc-meta-tags">
                                                                <span className="qc-inc-meta-pill">Category: {inc.category}</span>
                                                                {inc.orderId && <span className="qc-inc-meta-pill">Order Ref: #{inc.orderId}</span>}
                                                            </div>

                                                            {/* Conversation Chat Log */}
                                                            <div className="qc-inc-chat-box">
                                                                <label>Conversation Log:</label>
                                                                <div className="qc-inc-messages">
                                                                    {inc.chatHistory?.map((msg, idx) => (
                                                                        <div key={idx} className={`qc-inc-msg ${msg.sender}`}>
                                                                            <span className="qc-msg-author">
                                                                                {msg.sender === 'user' ? 'Customer' : msg.sender === 'agent' ? 'Support Agent' : 'Quickie Bot'}:
                                                                            </span>
                                                                            <span className="qc-msg-text">{msg.text}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Historical Admin Remarks Log */}
                                                            {inc.adminRemarks && inc.adminRemarks.length > 0 && (
                                                                <div className="qc-admin-remarks-history">
                                                                    <label>Internal Admin Escalation Remarks:</label>
                                                                    <div className="qc-remarks-list">
                                                                        {inc.adminRemarks.map((rem, rIdx) => (
                                                                            <div key={rIdx} className="qc-remark-entry">
                                                                                <div className="qc-remark-meta">
                                                                                    <strong>{rem.by || 'Admin Support'}</strong>
                                                                                    <small>{new Date(rem.createdAt).toLocaleString()}</small>
                                                                                </div>
                                                                                <p className="qc-remark-text">{rem.remark}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Add Escalation Remark Controls */}
                                                            <div className="qc-add-remark-section">
                                                                <div className="qc-remark-input-wrap">
                                                                    <label>Add Escalation Remark / Investigation Note:</label>
                                                                    <textarea
                                                                        rows="2"
                                                                        placeholder="Write internal remark (e.g. Spoke with delivery partner; confirmed item was misdelivered. Approved refund to customer gift card)..."
                                                                        value={activeIncidentId === inc._id ? incidentRemarkInput : ''}
                                                                        onChange={(e) => {
                                                                            setActiveIncidentId(inc._id);
                                                                            setIncidentRemarkInput(e.target.value);
                                                                        }}
                                                                        onFocus={() => setActiveIncidentId(inc._id)}
                                                                    />
                                                                </div>

                                                                <div className="qc-remark-actions-row">
                                                                    <div className="qc-remark-dropdowns">
                                                                        <div className="qc-form-mini-group">
                                                                            <label>Update Status:</label>
                                                                            <select
                                                                                value={activeIncidentId === inc._id ? incidentStatusChange : (inc.status || 'in_progress')}
                                                                                onChange={(e) => {
                                                                                    setActiveIncidentId(inc._id);
                                                                                    setIncidentStatusChange(e.target.value);
                                                                                }}
                                                                            >
                                                                                <option value="open">Open</option>
                                                                                <option value="in_progress">In Progress</option>
                                                                                <option value="resolved">Resolved</option>
                                                                                <option value="closed">Closed</option>
                                                                            </select>
                                                                        </div>

                                                                        <div className="qc-form-mini-group">
                                                                            <label>Priority:</label>
                                                                            <select
                                                                                value={activeIncidentId === inc._id ? incidentPriorityChange : (inc.priority || 'high')}
                                                                                onChange={(e) => {
                                                                                    setActiveIncidentId(inc._id);
                                                                                    setIncidentPriorityChange(e.target.value);
                                                                                }}
                                                                            >
                                                                                <option value="low">Low</option>
                                                                                <option value="medium">Medium</option>
                                                                                <option value="high">High</option>
                                                                                <option value="urgent">Urgent</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>

                                                                    <button
                                                                        className="qc-cta-button small"
                                                                        disabled={isAddingRemark && activeIncidentId === inc._id}
                                                                        onClick={() => handleAddIncidentRemark(inc._id)}
                                                                    >
                                                                        <Send size={13} />
                                                                        <span>Save Remark & Update Incident</span>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ================== SUBTAB 3: GIFT CARD & WALLET GRANTS ================== */}
                                    {customerSubTab === 'wallet' && (
                                        <div className="qc-subtab-content">
                                            <div className="qc-wallet-overview-cards">
                                                <div className="qc-wallet-card-highlight">
                                                    <div className="qc-wallet-badge">Active Balance</div>
                                                    <h3>₹{selectedCustomer.giftCardBalance || 0}</h3>
                                                    <p>Available for immediate 1-click checkout on QuickCart orders.</p>
                                                </div>
                                            </div>

                                            <div className="qc-grants-table-wrap">
                                                <h5>Active Unexpired Gift Card Grants ({selectedCustomer.activeGrants?.length || 0})</h5>
                                                {selectedCustomer.activeGrants?.length === 0 ? (
                                                    <p className="qc-text-muted">No active unexpired grants found.</p>
                                                ) : (
                                                    <table className="qc-admin-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Grant ID</th>
                                                                <th>Remaining</th>
                                                                <th>Original</th>
                                                                <th>Reason / Source</th>
                                                                <th>Expires On</th>
                                                                <th>Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedCustomer.activeGrants.map((g) => (
                                                                <tr key={g.id}>
                                                                    <td><code>{g.id}</code></td>
                                                                    <td><strong>₹{g.amount}</strong></td>
                                                                    <td>₹{g.originalAmount}</td>
                                                                    <td>{g.reason} ({g.source})</td>
                                                                    <td>{new Date(g.expiresAt).toLocaleDateString()}</td>
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="qc-admin-btn-danger mini"
                                                                            title="Revoke this grant"
                                                                            onClick={() => handleRevokeSingleGrant(selectedCustomer._id, g.id)}
                                                                        >
                                                                            Revoke
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>

                                            {/* Past & Revoked Grants Audit Table */}
                                            {selectedCustomer.pastGrants && selectedCustomer.pastGrants.length > 0 && (
                                                <div className="qc-grants-table-wrap" style={{ marginTop: '28px' }}>
                                                    <h5>Past, Used & Revoked Grants History ({selectedCustomer.pastGrants.length})</h5>
                                                    <table className="qc-admin-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Grant ID</th>
                                                                <th>Status</th>
                                                                <th>Amount</th>
                                                                <th>Details / Reason</th>
                                                                <th>Timestamp</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedCustomer.pastGrants.map((g) => (
                                                                <tr key={g.id}>
                                                                    <td><code>{g.id}</code></td>
                                                                    <td>
                                                                        {g.isRevoked ? (
                                                                            <span className="qc-tag-red">Revoked</span>
                                                                        ) : (
                                                                            <span className="qc-tag-gray">Expired / Used</span>
                                                                        )}
                                                                    </td>
                                                                    <td>₹{Math.abs(g.originalAmount || g.amount || 0)}</td>
                                                                    <td>
                                                                        <div>{g.reason}</div>
                                                                        {g.revokedReason && (
                                                                            <small style={{ color: '#b91c1c', display: 'block', marginTop: '2px' }}>
                                                                                Audit Note: {g.revokedReason}
                                                                            </small>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <small>{new Date(g.revokedAt || g.expiresAt || Date.now()).toLocaleDateString()}</small>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ================== SUBTAB 4: SAVED ADDRESSES & PAYMENTS ================== */}
                                    {customerSubTab === 'addresses' && (
                                        <div className="qc-subtab-content">
                                            <div className="qc-addresses-grid">
                                                {selectedCustomer.addresses?.length === 0 ? (
                                                    <div className="qc-empty-section-box">
                                                        <MapPin size={40} className="qc-empty-icon" />
                                                        <h4>No delivery addresses saved</h4>
                                                        <p>Customer has not added any delivery addresses yet.</p>
                                                    </div>
                                                ) : (
                                                    selectedCustomer.addresses.map((addr, aIdx) => (
                                                        <div key={addr.id || aIdx} className="qc-address-card">
                                                            <div className="qc-addr-badge">{addr.label || 'Home'}</div>
                                                            <strong>{addr.name}</strong>
                                                            <p>{addr.line1}</p>
                                                            {addr.line2 && <p>{addr.line2}</p>}
                                                            <p>{addr.city}, {addr.state} - {addr.pincode}</p>
                                                            <small>📞 {addr.phone || selectedCustomer.phone}</small>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: CUSTOMER SUPPORT TICKETS / INCIDENTS */}
            {activeAdminTab === 'incidents' && (
                <div className="qc-admin-panel-content">
                    <div className="qc-admin-incidents-header">
                        <h3>Customer Escalation Incident Tickets</h3>
                        <p>Real-time tickets automatically escalated from the AI Support Chatbot.</p>
                    </div>

                    <div className="qc-admin-incidents-grid">
                        {adminIncidents.length === 0 ? (
                            <div className="qc-empty-section-box">
                                <LifeBuoy size={48} className="qc-empty-icon" />
                                <h4>No support incidents raised yet</h4>
                                <p>When a customer escalates from the AI chatbot, incidents will appear here.</p>
                            </div>
                        ) : (
                            adminIncidents.map((inc) => (
                                <div key={inc._id} className="qc-admin-incident-card">
                                    <div className="qc-incident-top">
                                        <div className="qc-incident-id-badge">
                                            <span>#{inc.ticketId}</span>
                                            <span className={`qc-ticket-priority ${inc.priority || 'medium'}`}>
                                                {inc.priority?.toUpperCase()} PRIORITY
                                            </span>
                                        </div>
                                        <span className={`qc-ticket-status-pill ${inc.status}`}>
                                            {inc.status?.toUpperCase()}
                                        </span>
                                    </div>

                                    <h4 className="qc-incident-subject">{inc.subject}</h4>
                                    <p className="qc-incident-user">
                                        User: <strong>{inc.userEmail}</strong> • Order Ref: <strong>{inc.orderId || 'General'}</strong>
                                    </p>

                                    {/* Chat Transcript preview */}
                                    <div className="qc-incident-chat-preview">
                                        <small>Conversation Transcript ({inc.chatHistory?.length || 0} messages):</small>
                                        <div className="qc-transcript-scroll">
                                            {inc.chatHistory?.map((c, i) => (
                                                <div key={i} className={`qc-transcript-msg ${c.sender}`}>
                                                    <strong>{c.sender === 'user' ? 'Customer' : 'Quickie Bot'}: </strong>
                                                    <span>{c.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action controls */}
                                    <div className="qc-incident-actions">
                                        <button
                                            className="qc-order-action-btn primary small"
                                            onClick={() => handleUpdateIncident(inc._id, 'resolved', 'Resolved by Admin')}
                                        >
                                            <CheckCircle2 size={13} />
                                            <span>Mark as Resolved</span>
                                        </button>
                                        <button
                                            className="qc-order-action-btn secondary small"
                                            onClick={() => handleUpdateIncident(inc._id, 'in_progress', 'Assigned to investigation')}
                                        >
                                            In Progress
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: FESTIVAL & CAMPAIGN ENGINE */}
            {activeAdminTab === 'themes' && (
                <div className="qc-admin-panel-content">
                    <div className="qc-themes-header-bar">
                        <div>
                            <div className="qc-flex-align gap-2">
                                <h3>Festival Campaign & Theme Engine</h3>
                                <span className="qc-admin-badge-count">{Object.keys(FESTIVAL_THEMES).length + (customThemes?.length || 0)} Available</span>
                            </div>
                            <p>Deploy real-time themed sales like Flipkart Big Billion Days, Myntra Fashion Festival & Blinkit Yellow Rush with custom banners and palettes!</p>
                        </div>
                        <button
                            className="qc-admin-add-theme-btn"
                            onClick={() => {
                                applyThemePreset('flipkart');
                                setIsThemeModalOpen(true);
                            }}
                        >
                            <Plus size={16} />
                            <span>+ Create Campaign Theme</span>
                        </button>
                    </div>

                    {/* CUSTOM CAMPAIGNS CREATED BY ADMIN */}
                    {customThemes && customThemes.length > 0 && (
                        <div className="qc-campaign-section-block">
                            <div className="qc-section-subhead">
                                <Sparkles size={16} className="qc-text-sparkle" />
                                <span>Custom Admin Campaigns ({customThemes.length})</span>
                                <span className="qc-subhead-pill">Persisted in Cloud DB</span>
                            </div>

                            <div className="qc-themes-card-grid">
                                {customThemes.map((theme) => {
                                    const isCurrent = festivalTheme === theme.id;
                                    return (
                                        <div
                                            key={theme.id}
                                            className={`qc-theme-admin-card custom-card ${isCurrent ? 'active' : ''}`}
                                            style={{ borderColor: isCurrent ? theme.primaryColor : '#cbd5e1' }}
                                        >
                                            <div
                                                className="qc-theme-admin-preview"
                                                style={{ background: theme.gradientHero || theme.primaryColor }}
                                            >
                                                <span className="qc-theme-hero-icon">{theme.icon}</span>
                                                <h4>{theme.name}</h4>
                                                <span className="qc-theme-custom-pill">Admin Custom</span>
                                            </div>

                                            <div className="qc-theme-admin-info">
                                                <p className="qc-theme-tagline">{theme.tagline}</p>
                                                <p className="qc-theme-sample-banner">
                                                    <strong>Banner:</strong> {theme.announcement}
                                                </p>
                                                <div className="qc-theme-meta-row">
                                                    <span className="qc-theme-badge-preview">{theme.badge || 'CAMPAIGN'}</span>
                                                    <div className="qc-theme-color-palette">
                                                        <span style={{ background: theme.primaryColor }} title="Primary"></span>
                                                        <span style={{ background: theme.secondaryColor }} title="Secondary"></span>
                                                        <span style={{ background: theme.accentColor }} title="Accent"></span>
                                                    </div>
                                                </div>

                                                <div className="qc-theme-card-actions">
                                                    <button
                                                        className={`qc-activate-theme-btn ${isCurrent ? 'current' : ''}`}
                                                        onClick={() => setFestivalTheme(theme.id)}
                                                    >
                                                        {isCurrent ? 'Active Festival Theme' : 'Activate Campaign'}
                                                    </button>
                                                    <button
                                                        className="qc-delete-theme-btn"
                                                        title="Delete Custom Theme"
                                                        onClick={() => handleDeleteTheme(theme.id, theme.name)}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* BUILT-IN SEASONAL PRESETS */}
                    <div className="qc-campaign-section-block">
                        <div className="qc-section-subhead">
                            <Tag size={16} />
                            <span>Built-in Indian Festival & Event Presets</span>
                        </div>

                        <div className="qc-themes-card-grid">
                            {Object.values(FESTIVAL_THEMES).map((theme) => {
                                const isCurrent = festivalTheme === theme.id;

                                return (
                                    <div
                                        key={theme.id}
                                        className={`qc-theme-admin-card ${isCurrent ? 'active' : ''}`}
                                        style={{ borderColor: isCurrent ? theme.primaryColor : '#e2e8f0' }}
                                    >
                                        <div
                                            className="qc-theme-admin-preview"
                                            style={{ background: theme.gradientHero }}
                                        >
                                            <span className="qc-theme-hero-icon">{theme.icon}</span>
                                            <h4>{theme.name}</h4>
                                        </div>

                                        <div className="qc-theme-admin-info">
                                            <p className="qc-theme-tagline">{theme.tagline}</p>
                                            <p className="qc-theme-sample-banner">
                                                <strong>Banner:</strong> {theme.announcement}
                                            </p>
                                            <div className="qc-theme-color-palette">
                                                <span style={{ background: theme.primaryColor }}></span>
                                                <span style={{ background: theme.secondaryColor }}></span>
                                                <span style={{ background: theme.accentColor }}></span>
                                            </div>

                                            <button
                                                className={`qc-activate-theme-btn ${isCurrent ? 'current' : ''}`}
                                                onClick={() => setFestivalTheme(theme.id)}
                                            >
                                                {isCurrent ? 'Active Festival Theme' : 'Activate This Festival'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 5: WALLET CAMPAIGNS & USER AIRDROP */}
            {activeAdminTab === 'wallet' && (
                <div className="qc-admin-panel-content">
                    <div className="qc-wallet-admin-header">
                        <div className="qc-wallet-title-area">
                            <div className="qc-wallet-title-icon">
                                <Gift size={28} />
                            </div>
                            <div>
                                <h3>Targeted Wallet Airdrops & Eligibility Filter</h3>
                                <p>Filter user database by shopping patterns, credit random/fixed promotional Free Cash, and enforce automatic expiry for unused balances.</p>
                            </div>
                        </div>
                        <button
                            className="qc-refresh-status-btn"
                            onClick={() => loadAdminUsers()}
                            disabled={isLoadingUsers}
                            title="Refresh users list"
                        >
                            <RotateCw size={14} className={isLoadingUsers ? 'spin' : ''} />
                            <span>{isLoadingUsers ? 'Syncing...' : 'Refresh Users'}</span>
                        </button>
                    </div>

                    {/* Airdrop Success / Results Banner */}
                    {airdropResult && (
                        <div className="qc-airdrop-result-banner">
                            <div className="qc-airdrop-result-header">
                                <div className="qc-airdrop-result-title">
                                    <CheckCircle2 size={24} className="qc-text-success" />
                                    <div>
                                        <h4>{airdropResult.msg}</h4>
                                        <p>
                                            Total Distributed: <strong>₹{airdropResult.totalDistributed}</strong> across <strong>{airdropResult.count} recipient(s)</strong> •
                                            Unused Cash Expiry: <strong>{new Date(airdropResult.expiryDate).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong>
                                        </p>
                                    </div>
                                </div>
                                <button className="qc-modal-close" onClick={() => setAirdropResult(null)}>✕</button>
                            </div>
                            <div className="qc-airdrop-recipients-list">
                                {airdropResult.details?.map((item, idx) => (
                                    <div key={idx} className="qc-airdrop-chip">
                                        <span className="qc-chip-user">{item.email}</span>
                                        <span className="qc-chip-amount">+₹{item.amount}</span>
                                        <span className="qc-chip-balance">Balance: ₹{item.newBalance}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="qc-airdrop-layout-grid">
                        {/* LEFT COLUMN: USER DATABASE & ELIGIBILITY FILTER */}
                        <div className="qc-user-filter-col">
                            {/* Filter Criteria Tabs */}
                            <div className="qc-criteria-filter-pills">
                                {[
                                    { key: 'all', label: 'All Users', icon: '🌟' },
                                    { key: 'no_orders', label: 'Zero Orders / New', icon: '🐣' },
                                    { key: 'has_orders', label: 'Active Buyers', icon: '🛒' },
                                    { key: 'vip', label: 'VIP Spenders', icon: '💎' },
                                    { key: 'inactive', label: 'Inactive (7+ Days)', icon: '💤' }
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        className={`qc-criteria-pill ${userFilter === tab.key ? 'active' : ''}`}
                                        onClick={() => {
                                            setUserFilter(tab.key);
                                            loadAdminUsers(tab.key, userSearchTerm);
                                        }}
                                    >
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Search and Selection Toolbar */}
                            <div className="qc-user-action-bar">
                                <div className="qc-admin-search-box compact">
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search user by email or phone..."
                                        value={userSearchTerm}
                                        onChange={(e) => {
                                            setUserSearchTerm(e.target.value);
                                            loadAdminUsers(userFilter, e.target.value);
                                        }}
                                    />
                                    {userSearchTerm && (
                                        <button
                                            type="button"
                                            className="qc-search-clear-btn"
                                            onClick={() => {
                                                setUserSearchTerm('');
                                                loadAdminUsers(userFilter, '');
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <div className="qc-user-selection-actions">
                                    <button
                                        type="button"
                                        className="qc-select-all-btn"
                                        onClick={toggleSelectAllUsers}
                                    >
                                        {selectedUserIds.length === adminUsers.length && adminUsers.length > 0
                                            ? 'Deselect All'
                                            : `Select All (${adminUsers.length})`}
                                    </button>
                                    <span className="qc-selection-count-tag">
                                        <strong>{selectedUserIds.length}</strong> selected
                                    </span>
                                </div>
                            </div>

                            {/* Users Table */}
                            <div className="qc-admin-table-card">
                                <div className="qc-table-responsive">
                                    <table className="qc-data-table qc-users-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={adminUsers.length > 0 && selectedUserIds.length === adminUsers.length}
                                                        onChange={toggleSelectAllUsers}
                                                    />
                                                </th>
                                                <th>User Profile</th>
                                                <th>Shopping History</th>
                                                <th>Current Wallet</th>
                                                <th>Criteria Category</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="qc-empty-cell">
                                                        {isLoadingUsers ? 'Loading user database...' : 'No users match the selected criteria.'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                adminUsers.map((u) => {
                                                    const isSelected = selectedUserIds.includes(u._id);
                                                    let criteriaTag = 'Member';
                                                    let criteriaClass = 'member';
                                                    if (u.totalOrders === 0) {
                                                        criteriaTag = 'New (0 Orders)';
                                                        criteriaClass = 'new';
                                                    } else if (u.totalSpent >= 1000 || u.totalOrders >= 3) {
                                                        criteriaTag = 'VIP Spender';
                                                        criteriaClass = 'vip';
                                                    } else if (u.totalOrders > 0) {
                                                        criteriaTag = 'Active Buyer';
                                                        criteriaClass = 'active';
                                                    }

                                                    return (
                                                        <tr
                                                            key={u._id}
                                                            className={`qc-user-row ${isSelected ? 'row-selected' : ''}`}
                                                            onClick={() => toggleSelectUser(u._id)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <td onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => toggleSelectUser(u._id)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <div className="qc-user-cell-profile">
                                                                    <strong>{u.email}</strong>
                                                                    <small>{u.phone || 'No phone'}</small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="qc-user-orders-stat">
                                                                    <span><strong>{u.totalOrders}</strong> order(s)</span>
                                                                    <span>Total: <strong>₹{u.totalSpent}</strong></span>
                                                                    <small className="qc-text-muted">
                                                                        {u.lastOrderDate ? `Last: ${new Date(u.lastOrderDate).toLocaleDateString()}` : 'Never ordered'}
                                                                    </small>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className="qc-user-wallet-stat">
                                                                    <span className="qc-wallet-cash">₹{u.freeCash}</span>
                                                                    {u.activeGrantsCount > 0 && (
                                                                        <span className="qc-active-grants-badge">
                                                                            {u.activeGrantsCount} unexpired
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`qc-criteria-badge ${criteriaClass}`}>
                                                                    {criteriaTag}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: AIRDROP CAMPAIGN CONFIGURATOR */}
                        <div className="qc-airdrop-config-col">
                            <div className="qc-airdrop-card">
                                <div className="qc-airdrop-card-header">
                                    <Sparkles size={20} className="qc-text-accent" />
                                    <h4>Airdrop Campaign Configurator</h4>
                                </div>
                                <p className="qc-airdrop-intro">
                                    Distribute free cash directly into selected users' wallets with automatic expiration dates.
                                </p>

                                <form onSubmit={handleExecuteAirdrop} className="qc-airdrop-form">
                                    {/* 1. Cash Credit Strategy Mode */}
                                    <div className="qc-form-group">
                                        <label className="qc-form-label">
                                            <strong>1. Free Cash Distribution Mode</strong>
                                        </label>
                                        <div className="qc-mode-selector-grid">
                                            <button
                                                type="button"
                                                className={`qc-mode-btn ${airdropMode === 'random' ? 'active' : ''}`}
                                                onClick={() => setAirdropMode('random')}
                                            >
                                                <Zap size={16} />
                                                <div>
                                                    <strong>🎲 Random Range</strong>
                                                    <small>Different random cash per user</small>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                className={`qc-mode-btn ${airdropMode === 'fixed' ? 'active' : ''}`}
                                                onClick={() => setAirdropMode('fixed')}
                                            >
                                                <DollarSign size={16} />
                                                <div>
                                                    <strong>🎯 Fixed Amount</strong>
                                                    <small>Identical cash for all</small>
                                                </div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Amount Inputs */}
                                    {airdropMode === 'random' ? (
                                        <div className="qc-form-row">
                                            <div className="qc-form-group">
                                                <label>Minimum (₹)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={minCashAmount}
                                                    onChange={(e) => setMinCashAmount(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="qc-form-group">
                                                <label>Maximum (₹)</label>
                                                <input
                                                    type="number"
                                                    min={minCashAmount || '1'}
                                                    value={maxCashAmount}
                                                    onChange={(e) => setMaxCashAmount(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="qc-form-group">
                                            <label>Fixed Cash Amount (₹)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={fixedCashAmount}
                                                onChange={(e) => setFixedCashAmount(e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}

                                    {/* 2. Expiration Date Configuration (Unused Cash Expiry) */}
                                    <div className="qc-form-group">
                                        <label className="qc-form-label">
                                            <Clock size={14} />
                                            <strong>2. Unused Cash Expiration Timeline</strong>
                                        </label>
                                        <p className="qc-field-help">
                                            Unused cash will automatically expire and be deducted from the user's wallet after this deadline.
                                        </p>

                                        <div className="qc-expiry-presets-row">
                                            {['3', '7', '15', '30'].map((d) => (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    className={`qc-expiry-btn ${!customExpiryDate && expiryPresetDays === d ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setExpiryPresetDays(d);
                                                        setCustomExpiryDate('');
                                                    }}
                                                >
                                                    {d} Days
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className={`qc-expiry-btn ${customExpiryDate ? 'active' : ''}`}
                                                onClick={() => {
                                                    const tomorrow = new Date();
                                                    tomorrow.setDate(tomorrow.getDate() + 7);
                                                    setCustomExpiryDate(tomorrow.toISOString().split('T')[0]);
                                                }}
                                            >
                                                Custom Date
                                            </button>
                                        </div>

                                        {customExpiryDate && (
                                            <div className="qc-custom-date-box">
                                                <label>Select Exact Expiry Date:</label>
                                                <input
                                                    type="date"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    value={customExpiryDate}
                                                    onChange={(e) => setCustomExpiryDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        )}

                                        {/* Expiry Date Preview Alert */}
                                        <div className="qc-expiry-preview-box">
                                            <Calendar size={15} />
                                            <span>
                                                Expires on: <strong>
                                                    {customExpiryDate
                                                        ? new Date(customExpiryDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                                                        : (() => {
                                                            const d = new Date();
                                                            d.setDate(d.getDate() + Number(expiryPresetDays || 7));
                                                            return `${d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} (${expiryPresetDays} days)`;
                                                        })()}
                                                </strong>
                                            </span>
                                        </div>
                                    </div>

                                    {/* 3. Campaign Note / Reason */}
                                    <div className="qc-form-group">
                                        <label className="qc-form-label">
                                            <strong>3. Campaign Title / Reason</strong>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Diwali Dhamaka Bonus 🪔"
                                            value={campaignReason}
                                            onChange={(e) => setCampaignReason(e.target.value)}
                                            required
                                        />
                                        <div className="qc-campaign-presets">
                                            <span onClick={() => setCampaignReason('Diwali Surprise Cash 🪔')}>Diwali Surprise 🪔</span>
                                            <span onClick={() => setCampaignReason('Welcome Activation Bonus 🐣')}>Welcome Gift 🐣</span>
                                            <span onClick={() => setCampaignReason('VIP Exclusive Cashback 💎')}>VIP Perk 💎</span>
                                            <span onClick={() => setCampaignReason('We Miss You! Return Bonus 🎁')}>We Miss You 🎁</span>
                                        </div>
                                    </div>

                                    {/* Campaign Summary & Submission */}
                                    <div className="qc-airdrop-summary-box">
                                        <div className="qc-summary-item">
                                            <span>Targeted Recipients:</span>
                                            <strong>{selectedUserIds.length} user(s)</strong>
                                        </div>
                                        <div className="qc-summary-item">
                                            <span>Amount Mode:</span>
                                            <strong>{airdropMode === 'random' ? `Random ₹${minCashAmount} - ₹${maxCashAmount}` : `Fixed ₹${fixedCashAmount}`}</strong>
                                        </div>
                                        <div className="qc-summary-item">
                                            <span>Auto-Expiry:</span>
                                            <strong>{customExpiryDate ? customExpiryDate : `${expiryPresetDays} Days`}</strong>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="qc-cta-button qc-airdrop-submit-btn"
                                        disabled={isAirdropping || selectedUserIds.length === 0}
                                    >
                                        {isAirdropping ? (
                                            <>
                                                <RotateCw size={16} className="spin" />
                                                <span>Airdropping Free Cash...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Gift size={16} />
                                                <span>Credit Free Cash to {selectedUserIds.length} User(s)</span>
                                            </>
                                        )}
                                    </button>

                                    {selectedUserIds.length === 0 && (
                                        <p className="qc-airdrop-warn">
                                            ⚠️ Select at least one user from the list on the left to activate airdrop.
                                        </p>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 7: PROMOTIONAL GIFT CARDS MANAGEMENT */}
            {activeAdminTab === 'giftcards' && (
                <div className="qc-admin-panel-content">
                    <div className="qc-admin-action-bar">
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Promotional Gift Cards & Vouchers Directory</h3>
                            <p className="qc-admin-subtext" style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                                Issue gift cards, configure redemption caps, monitor usage per user, and revoke promotional vouchers.
                            </p>
                        </div>
                        <button
                            className="qc-cta-button small"
                            onClick={() => loadAdminGiftCards()}
                        >
                            <RotateCw size={14} className={isLoadingGiftCards ? 'spin' : ''} />
                            <span>Refresh Gift Cards</span>
                        </button>
                    </div>

                    <div className="qc-giftcards-admin-layout" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'start', marginTop: '20px' }}>
                        {/* Left: Create New Gift Card Form */}
                        <div className="qc-card" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div className="qc-topup-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
                                <Sparkles size={18} className="qc-text-accent" />
                                <span>Issue New Promotional Gift Card</span>
                            </div>
                            <form onSubmit={handleCreateGiftCard} className="qc-giftcard-form">
                                <div className="qc-form-group" style={{ marginBottom: '14px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Voucher Code (Unique, Uppercase)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. MEGA500 or SUMMER250"
                                        value={newGiftCardForm.code}
                                        onChange={(e) => setNewGiftCardForm({ ...newGiftCardForm, code: e.target.value.toUpperCase() })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                    />
                                </div>
                                <div className="qc-form-group" style={{ marginBottom: '14px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Campaign Title / Description</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Festival Season Promotional Credit"
                                        value={newGiftCardForm.title}
                                        onChange={(e) => setNewGiftCardForm({ ...newGiftCardForm, title: e.target.value })}
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <div className="qc-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                                    <div className="qc-form-group">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Amount (₹)</label>
                                        <input
                                            type="number"
                                            placeholder="100"
                                            min="1"
                                            value={newGiftCardForm.amount}
                                            onChange={(e) => setNewGiftCardForm({ ...newGiftCardForm, amount: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                    <div className="qc-form-group">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Max Redemptions</label>
                                        <input
                                            type="number"
                                            placeholder="1 for single user, 500 for promo"
                                            min="1"
                                            value={newGiftCardForm.maxRedemptions}
                                            onChange={(e) => setNewGiftCardForm({ ...newGiftCardForm, maxRedemptions: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                </div>
                                <div className="qc-form-group" style={{ marginBottom: '18px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Validity Duration (Days)</label>
                                    <input
                                        type="number"
                                        placeholder="60"
                                        min="1"
                                        value={newGiftCardForm.expiryDays}
                                        onChange={(e) => setNewGiftCardForm({ ...newGiftCardForm, expiryDays: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="qc-cta-button"
                                    disabled={isCreatingGiftCard}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {isCreatingGiftCard ? <RotateCw size={15} className="spin" /> : <Gift size={15} />}
                                    <span>Issue Promotional Voucher</span>
                                </button>
                            </form>
                        </div>

                        {/* Right: Issued Gift Cards Table */}
                        <div className="qc-card" style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div className="qc-table-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Database Gift Cards & Vouchers ({adminGiftCards.length})</h4>
                
                            </div>

                            {isLoadingGiftCards ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                    <RotateCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
                                    <p>Loading promotional gift cards...</p>
                                </div>
                            ) : adminGiftCards.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                    <Gift size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                    <p>No promotional gift cards issued yet. Use the form to generate vouchers.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="qc-admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Campaign / Title</th>
                                                <th>Amount</th>
                                                <th>Usage Cap</th>
                                                <th>Status</th>
                                                <th>Expires</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminGiftCards.map((card) => {
                                                const isExpired = new Date(card.expiresAt) <= new Date();
                                                return (
                                                    <tr key={card._id}>
                                                        <td>
                                                            <code style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontWeight: 800, color: '#1e293b' }}>
                                                                {card.code}
                                                            </code>
                                                        </td>
                                                        <td>
                                                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{card.title || 'Promotional Voucher'}</div>
                                                            <small className="qc-text-muted">Issued: {new Date(card.createdAt).toLocaleDateString()}</small>
                                                        </td>
                                                        <td>
                                                            <strong style={{ color: '#16a34a', fontSize: '14px' }}>₹{card.amount}</strong>
                                                        </td>
                                                        <td>
                                                            <span style={{ fontWeight: 600 }}>{card.redemptionCount || 0}</span> / {card.maxRedemptions || 1}
                                                        </td>
                                                        <td>
                                                            {card.isRevoked ? (
                                                                <span className="qc-tag-red">Revoked</span>
                                                            ) : isExpired ? (
                                                                <span className="qc-tag-gray">Expired</span>
                                                            ) : !card.isActive ? (
                                                                <span className="qc-tag-gray">Depleted</span>
                                                            ) : (
                                                                <span className="qc-tag-green">Active</span>
                                                            )}
                                                            {card.revokedReason && (
                                                                <div style={{ fontSize: '10px', color: '#b91c1c', marginTop: '2px' }}>{card.revokedReason}</div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <small>{new Date(card.expiresAt).toLocaleDateString()}</small>
                                                        </td>
                                                        <td>
                                                            {!card.isRevoked && card.isActive && !isExpired ? (
                                                                <button
                                                                    type="button"
                                                                    className="qc-admin-btn-danger mini"
                                                                    onClick={() => handleRevokeGiftCardCode(card._id, card.code)}
                                                                >
                                                                    Revoke Code
                                                                </button>
                                                            ) : (
                                                                <span className="qc-text-muted" style={{ fontSize: '11px' }}>—</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeAdminTab === 'coupons' && (
                <div className="qc-admin-panel-content">
                    <div className="qc-admin-action-bar">
                        <div>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Coupon Management</h3>
                            <p className="qc-admin-subtext" style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                                Create discount codes for customers and manage their validity rules.
                            </p>
                        </div>
                        <button className="qc-cta-button small" onClick={loadAdminCoupons}>
                            <RotateCw size={14} className={isLoadingCoupons ? 'spin' : ''} />
                            <span>Refresh Coupons</span>
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: '24px', alignItems: 'start', marginTop: '20px' }}>
                        <div className="qc-card" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' }}>
                            <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800 }}>Create Coupon</h4>
                            <form onSubmit={handleCreateCoupon}>
                                <label className="qc-form-group" style={{ display: 'block', marginBottom: '12px' }}>
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>Coupon Code</span>
                                    <input type="text" value={newCouponForm.code} onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })} required maxLength={32} placeholder="e.g. SAVE20" style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', textTransform: 'uppercase' }} />
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <label className="qc-form-group" style={{ display: 'block', marginBottom: '12px' }}>
                                        <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>Discount (%)</span>
                                        <input type="number" min="0.01" max="100" step="0.01" value={newCouponForm.discount} onChange={(e) => setNewCouponForm({ ...newCouponForm, discount: e.target.value })} required style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                    </label>
                                    <label className="qc-form-group" style={{ display: 'block', marginBottom: '12px' }}>
                                        <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>Max Discount (₹)</span>
                                        <input type="number" min="0" step="0.01" value={newCouponForm.maxDiscount} onChange={(e) => setNewCouponForm({ ...newCouponForm, maxDiscount: e.target.value })} required style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                    </label>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <label className="qc-form-group" style={{ display: 'block', marginBottom: '12px' }}>
                                        <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>Minimum Order (₹)</span>
                                        <input type="number" min="0" step="0.01" value={newCouponForm.minOrderVal} onChange={(e) => setNewCouponForm({ ...newCouponForm, minOrderVal: e.target.value })} required style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                    </label>
                                    <label className="qc-form-group" style={{ display: 'block', marginBottom: '12px' }}>
                                        <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>Uses Per Customer</span>
                                        <input type="number" min="0" step="1" value={newCouponForm.maxUsesPerUser} onChange={(e) => setNewCouponForm({ ...newCouponForm, maxUsesPerUser: e.target.value })} required style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                    </label>
                                </div>
                                <label className="qc-form-group" style={{ display: 'block', marginBottom: '12px' }}>
                                    <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '5px' }}>Valid Until</span>
                                    <input type="datetime-local" value={newCouponForm.validUpto} onChange={(e) => setNewCouponForm({ ...newCouponForm, validUpto: e.target.value })} required min={new Date().toISOString().slice(0, 16)} style={{ width: '100%', padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0 16px', fontSize: '13px', fontWeight: 600 }}>
                                    <input type="checkbox" checked={newCouponForm.isFirstOrderOnly} onChange={(e) => setNewCouponForm({ ...newCouponForm, isFirstOrderOnly: e.target.checked })} />
                                    First order only
                                </label>
                                <button type="submit" className="qc-cta-button" disabled={isCreatingCoupon} style={{ width: '100%', justifyContent: 'center' }}>
                                    {isCreatingCoupon ? <RotateCw size={15} className="spin" /> : <Plus size={15} />}
                                    <span>{isCreatingCoupon ? 'Creating...' : 'Create Coupon'}</span>
                                </button>
                            </form>
                        </div>

                        <div className="qc-card" style={{ background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px', minWidth: 0 }}>
                            <h4 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 800 }}>Coupons ({adminCoupons.length})</h4>
                            {isLoadingCoupons ? (
                                <p style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Loading coupons...</p>
                            ) : adminCoupons.length === 0 ? (
                                <p style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No coupons created yet.</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="qc-admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead><tr><th>Code</th><th>Discount</th><th>Minimum</th><th>Per Customer</th><th>Valid Until</th><th>Status</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {adminCoupons.map((coupon) => {
                                                const expired = new Date(coupon.validUpto) <= new Date();
                                                return (
                                                    <tr key={coupon._id}>
                                                        <td><code style={{ fontWeight: 800 }}>{coupon.code}</code></td>
                                                        <td>{coupon.discount}%{coupon.maxDiscount > 0 ? ` (max ₹${coupon.maxDiscount})` : ''}</td>
                                                        <td>₹{coupon.minOrderVal}</td>
                                                        <td>{coupon.maxUsesPerUser > 0 ? coupon.maxUsesPerUser : 'Unlimited'}{coupon.isFirstOrderOnly ? ' · First order' : ''}</td>
                                                        <td>{new Date(coupon.validUpto).toLocaleString()}</td>
                                                        <td>{!coupon.isActive ? 'Inactive' : expired ? 'Expired' : 'Active'}</td>
                                                        <td>
                                                            <button
                                                                type="button"
                                                                className="qc-admin-btn-danger mini"
                                                                onClick={() => handleDeleteCoupon(coupon)}
                                                                disabled={deletingCouponId === coupon._id}
                                                                aria-label={`Delete coupon ${coupon.code}`}
                                                            >
                                                                {deletingCouponId === coupon._id ? 'Deleting...' : <><Trash2 size={13} /> Delete</>}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Product & Offer Feature Modal */}
            {isProductModalOpen && (
                <div className="qc-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setIsProductModalOpen(false); }}>
                    <div className="qc-admin-product-modal">
                        <div className="qc-modal-header">
                            <div className="qc-modal-title-wrap">
                                <div className="qc-modal-icon">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <h3>{editingProduct ? 'Edit Product & Apply Offers' : 'Add New Product to QuickCart'}</h3>
                                    <p className="qc-modal-subtext">Manage catalog pricing, stock inventory, categories, and promotional tags</p>
                                </div>
                            </div>
                            <button className="qc-modal-close" onClick={() => setIsProductModalOpen(false)}>✕</button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="qc-product-admin-form">
                            <div className="qc-form-group">
                                <label>Product Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Fresh Organic Tomatoes 1kg"
                                    value={productForm.name}
                                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="qc-form-row qc-three-col">
                                <div className="qc-form-group">
                                    <label>Selling Price (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 45"
                                        value={productForm.price}
                                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="qc-form-group">
                                    <label>Original MRP (₹)</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 60"
                                        value={productForm.mrp}
                                        onChange={(e) => setProductForm({ ...productForm, mrp: e.target.value })}
                                    />
                                </div>
                                <div className="qc-form-group">
                                    <label>Inventory Stock</label>
                                    <input
                                        type="number"
                                        placeholder="e.g. 100"
                                        value={productForm.stock}
                                        onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="qc-form-row">
                                <div className="qc-form-group">
                                    <label>Category</label>
                                    <select
                                        value={productForm.category}
                                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                    >
                                        <option value="Groceries">Groceries</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Fashion">Fashion</option>
                                    </select>
                                </div>
                                <div className="qc-form-group">
                                    <label>Subcategory</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Vegetables, Dairy, Audio"
                                        value={productForm.subcategory}
                                        onChange={(e) => setProductForm({ ...productForm, subcategory: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="qc-form-group">
                                <label>Product Image</label>
                                
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                                        ⚡ Select from Built-in Store Assets
                                    </label>
                                    <select
                                        style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                setProductForm({ ...productForm, image: e.target.value });
                                                setProductImagePreviewError(false);
                                            }
                                        }}
                                        value={AVAILABLE_STORE_ASSETS.some(a => a.path === productForm.image) ? productForm.image : ''}
                                    >
                                        <option value="">-- Choose a built-in catalog image --</option>
                                        {AVAILABLE_STORE_ASSETS.map((asset) => (
                                            <option key={asset.path} value={asset.path}>
                                                {asset.label} ({asset.path})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. /assets/mango.jpg or https://..."
                                        value={productForm.image}
                                        onChange={(e) => {
                                            setProductForm({ ...productForm, image: e.target.value });
                                            setProductImagePreviewError(false);
                                        }}
                                        onBlur={(e) => {
                                            if (e.target.value && !e.target.value.startsWith('http') && !e.target.value.startsWith('data:')) {
                                                setProductForm({ ...productForm, image: formatProductImage(e.target.value) });
                                            }
                                        }}
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        className="qc-cta-button small"
                                        onClick={() => productImageInputRef.current?.click()}
                                        disabled={isProcessingProductImage}
                                        title="Upload custom image from device"
                                    >
                                        <UploadCloud size={15} />
                                        <span>{isProcessingProductImage ? 'Processing...' : 'Upload File'}</span>
                                    </button>
                                </div>
                                <input
                                    ref={productImageInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProductImageUpload}
                                    style={{ display: 'none' }}
                                />
                                <small style={{ display: 'block', marginTop: '7px', color: '#64748b' }}>
                                    Pick from the asset dropdown above, upload a file, or enter an image path (e.g. /assets/mango.jpg or an https:// URL).
                                </small>
                                {productForm.image && (
                                    <div className="qc-product-img-preview-row">
                                        {productImagePreviewError ? (
                                            <span>Image could not load. Check the URL or choose an image from store assets.</span>
                                        ) : (
                                            <img src={formatProductImage(productForm.image)} alt="Product preview" onError={() => setProductImagePreviewError(true)} />
                                        )}
                                        {!productForm.image.startsWith('data:') && <span>Resolved Path: {formatProductImage(productForm.image)}</span>}
                                    </div>
                                )}
                            </div>

                            {/* Specific Offer Feature Controls as requested */}
                            <div className="qc-admin-offer-feature-card">
                                <h4>✨ Apply Specific Offer Feature (Flipkart Style)</h4>
                                <div className="qc-form-row">
                                    <div className="qc-form-group">
                                        <label>Offer Tag</label>
                                        <select
                                            value={productForm.offerTag}
                                            onChange={(e) => setProductForm({ ...productForm, offerTag: e.target.value })}
                                        >
                                            <option value="">None (Standard Product)</option>
                                            <option value="Deal of the Day">Deal of the Day</option>
                                            <option value="Festive Pick">Festive Pick</option>
                                            <option value="Bestseller">Bestseller</option>
                                            <option value="Trending Now">Trending Now</option>
                                            <option value="Hot Deal">Hot Deal</option>
                                            <option value="50% OFF">50% OFF</option>
                                        </select>
                                    </div>
                                    <div className="qc-form-group">
                                        <label>Discount Badge (%)</label>
                                        <input
                                            type="number"
                                            placeholder="e.g. 25"
                                            value={productForm.discountPercent}
                                            onChange={(e) => setProductForm({ ...productForm, discountPercent: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="qc-modal-actions">
                                <button type="submit" className="qc-cta-button">
                                    {editingProduct ? 'Save Changes' : 'Add Product'}
                                </button>
                                <button
                                    type="button"
                                    className="qc-order-action-btn secondary"
                                    onClick={() => setIsProductModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Festive & Campaign Theme Modal (Flipkart, Myntra, Blinkit style) */}
            {isThemeModalOpen && (
                <div className="qc-modal-backdrop">
                    <div className="qc-admin-theme-modal">
                        <div className="qc-modal-header">
                            <div className="qc-modal-title-wrap">
                                <Sparkles size={20} className="qc-text-sparkle" />
                                <div>
                                    <h3>Create Custom Festival Campaign Theme</h3>
                                    <p className="qc-modal-subtext">Reskin QuickCart live like Flipkart Big Billion Days, Myntra Fashion Fest, or Blinkit</p>
                                </div>
                            </div>
                            <button className="qc-modal-close" onClick={() => setIsThemeModalOpen(false)}>✕</button>
                        </div>

                        {/* Quick Autofill Presets */}
                        <div className="qc-theme-presets-bar">
                            <span className="qc-presets-label">⚡ 1-Click Presets:</span>
                            <div className="qc-preset-chips">
                                {THEME_PRESETS.map((preset) => (
                                    <button
                                        type="button"
                                        key={preset.key}
                                        className="qc-preset-chip-btn"
                                        onClick={() => applyThemePreset(preset.key)}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <form onSubmit={handleSaveTheme} className="qc-theme-admin-form">
                            <div className="qc-theme-form-columns">
                                {/* Left Column: Campaign Details & Texts */}
                                <div className="qc-theme-form-col">
                                    <div className="qc-form-row">
                                        <div className="qc-form-group flex-2">
                                            <label>Campaign Name *</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Flipkart Big Billion Days"
                                                value={themeForm.name}
                                                onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="qc-form-group flex-1">
                                            <label>Icon / Emoji</label>
                                            <input
                                                type="text"
                                                placeholder="🛒 or 👗 or ⚡"
                                                value={themeForm.icon}
                                                onChange={(e) => setThemeForm({ ...themeForm, icon: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="qc-form-row">
                                        <div className="qc-form-group flex-1">
                                            <label>Tagline / Offer Punchline</label>
                                            <input
                                                type="text"
                                                placeholder="India's Greatest Festival Sale! 80% Off"
                                                value={themeForm.tagline}
                                                onChange={(e) => setThemeForm({ ...themeForm, tagline: e.target.value })}
                                            />
                                        </div>
                                        <div className="qc-form-group flex-1">
                                            <label>Campaign Badge</label>
                                            <input
                                                type="text"
                                                placeholder="BIG BILLION DEALS"
                                                value={themeForm.badge}
                                                onChange={(e) => setThemeForm({ ...themeForm, badge: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="qc-form-group">
                                        <label>Announcement Bar Text (Top of whole app)</label>
                                        <textarea
                                            rows="2"
                                            placeholder="🔥 The Big Billion Days LIVE! Extra ₹100 Off with QuickCard Credit!"
                                            value={themeForm.announcement}
                                            onChange={(e) => setThemeForm({ ...themeForm, announcement: e.target.value })}
                                        />
                                    </div>

                                    <div className="qc-form-row">
                                        <div className="qc-form-group flex-1">
                                            <label>Hero Headline</label>
                                            <input
                                                type="text"
                                                placeholder="India's Biggest Deals Delivered in 10 Mins"
                                                value={themeForm.heroHeadline}
                                                onChange={(e) => setThemeForm({ ...themeForm, heroHeadline: e.target.value })}
                                            />
                                        </div>
                                        <div className="qc-form-group flex-1">
                                            <label>Hero Subtitle</label>
                                            <input
                                                type="text"
                                                placeholder="Crazy price crashes on tech, groceries & essentials"
                                                value={themeForm.heroSub}
                                                onChange={(e) => setThemeForm({ ...themeForm, heroSub: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="qc-form-group">
                                        <label>Special Festive Tag</label>
                                        <input
                                            type="text"
                                            placeholder="BBD Special, Blinkit Rush, Myntra Luxe..."
                                            value={themeForm.festiveTag}
                                            onChange={(e) => setThemeForm({ ...themeForm, festiveTag: e.target.value })}
                                        />
                                    </div>

                                    {/* Campaign Banner Image Input & Upload Option */}
                                    <div className="qc-form-group qc-banner-builder-card">
                                        <div className="qc-banner-header-row">
                                            <label>🖼️ Campaign Hero Banner Image</label>
                                            <span className="qc-banner-optional-badge">Optional (Replaces Textual Hero)</span>
                                        </div>

                                        {/* Hidden file input for device upload */}
                                        <input
                                            type="file"
                                            ref={bannerFileInputRef}
                                            accept="image/png,image/jpeg,image/webp,image/jpg"
                                            style={{ display: 'none' }}
                                            onChange={handleBannerFileUpload}
                                        />

                                        <div className="qc-banner-input-actions">
                                            <button
                                                type="button"
                                                className="qc-btn-upload-banner"
                                                onClick={() => bannerFileInputRef.current?.click()}
                                                title="Choose an image file from your computer"
                                            >
                                                <UploadCloud size={16} />
                                                <span>Upload from PC / Device</span>
                                            </button>

                                            <span className="qc-or-divider">OR</span>

                                            <input
                                                type="text"
                                                className="qc-banner-url-input"
                                                placeholder="Paste image path (/bannerdiwali.png) or URL..."
                                                value={themeForm.bannerImg || ''}
                                                onChange={(e) => setThemeForm({ ...themeForm, bannerImg: e.target.value })}
                                            />
                                        </div>

                                        <div className="qc-banner-quick-chips">
                                            <span className="qc-quick-chip-label">Presets:</span>
                                            <button
                                                type="button"
                                                className={`qc-quick-chip ${themeForm.bannerImg === '/bannerdiwali.png' ? 'active' : ''}`}
                                                onClick={() => setThemeForm({ ...themeForm, bannerImg: '/bannerdiwali.png' })}
                                            >
                                                🪔 Diwali Special
                                            </button>
                                            <button
                                                type="button"
                                                className={`qc-quick-chip ${themeForm.bannerImg === '/bannerquickcart.png' ? 'active' : ''}`}
                                                onClick={() => setThemeForm({ ...themeForm, bannerImg: '/bannerquickcart.png' })}
                                            >
                                                🛒 QuickCart Super
                                            </button>
                                            {themeForm.bannerImg && (
                                                <button
                                                    type="button"
                                                    className="qc-quick-chip qc-clear-banner-chip"
                                                    onClick={() => setThemeForm({ ...themeForm, bannerImg: null })}
                                                >
                                                    ❌ Clear Banner (Use Gradient)
                                                </button>
                                            )}
                                        </div>

                                        {/* Banner Preview or Helper Info */}
                                        {themeForm.bannerImg ? (
                                            <div className="qc-theme-banner-preview">
                                                <div className="qc-banner-preview-img-wrap">
                                                    <img
                                                        src={themeForm.bannerImg}
                                                        alt="Theme Banner Preview"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                </div>
                                                <div className="qc-banner-preview-meta">
                                                    <span className="qc-banner-active-label">
                                                        ✅ Active Banner: {themeForm.bannerImg.startsWith('data:') ? 'Custom Uploaded Image (Ready)' : themeForm.bannerImg}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        className="qc-banner-remove-btn"
                                                        onClick={() => setThemeForm({ ...themeForm, bannerImg: null })}
                                                    >
                                                        <Trash2 size={13} /> Remove Banner
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="qc-banner-empty-note">
                                                <span>ℹ️ No banner image selected — store will display modern <strong>Textual Hero Banner with Linear Gradient</strong></span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Colors, Linear Gradients & Live Preview */}
                                <div className="qc-theme-form-col">
                                    {/* Linear Gradient Hero Background Builder */}
                                    <div className="qc-gradient-builder-card">
                                        <div className="qc-gradient-header">
                                            <label className="qc-subhead-label">
                                                <Sparkles size={15} /> 🌈 Linear Gradient Colors
                                            </label>
                                            <span className="qc-gradient-help-badge">For Hero & Theme Accents</span>
                                        </div>

                                        <div className="qc-gradient-controls-grid">
                                            <div className="qc-color-input-card">
                                                <label>Gradient Start Color</label>
                                                <div className="qc-color-picker-row">
                                                    <input
                                                        type="color"
                                                        value={themeForm.gradientStart || '#1e3a8a'}
                                                        onChange={(e) => updateGradient(e.target.value, undefined, undefined)}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={themeForm.gradientStart || '#1e3a8a'}
                                                        onChange={(e) => updateGradient(e.target.value, undefined, undefined)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="qc-color-input-card">
                                                <label>Gradient End Color</label>
                                                <div className="qc-color-picker-row">
                                                    <input
                                                        type="color"
                                                        value={themeForm.gradientEnd || '#0284c7'}
                                                        onChange={(e) => updateGradient(undefined, e.target.value, undefined)}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={themeForm.gradientEnd || '#0284c7'}
                                                        onChange={(e) => updateGradient(undefined, e.target.value, undefined)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="qc-gradient-angle-box">
                                                <label>Gradient Angle</label>
                                                <div className="qc-angle-btns">
                                                    {['135deg', '90deg', '180deg', '45deg'].map((angle) => (
                                                        <button
                                                            key={angle}
                                                            type="button"
                                                            className={`qc-angle-btn ${(themeForm.gradientAngle || '135deg') === angle ? 'active' : ''}`}
                                                            onClick={() => updateGradient(undefined, undefined, angle)}
                                                        >
                                                            {angle === '135deg' ? '↘ 135°' : angle === '90deg' ? '→ 90°' : angle === '180deg' ? '↓ 180°' : '↗ 45°'}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Live Gradient Preview Swatch */}
                                        <div className="qc-gradient-preview-wrap">
                                            <div
                                                className="qc-gradient-swatch-bar"
                                                style={{ background: themeForm.gradientHero || 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)' }}
                                            >
                                                <span>Live Linear Gradient Preview</span>
                                            </div>
                                        </div>

                                        {/* Curated Linear Gradient Presets */}
                                        <div className="qc-gradient-presets-section">
                                            <span className="qc-quick-chip-label">Curated Gradient Palettes:</span>
                                            <div className="qc-gradient-presets-grid">
                                                {GRADIENT_PRESETS.map((p) => (
                                                    <button
                                                        key={p.label}
                                                        type="button"
                                                        className="qc-gradient-preset-chip"
                                                        onClick={() => {
                                                            setThemeForm(prev => ({
                                                                ...prev,
                                                                gradientHero: p.value,
                                                                gradientStart: p.start,
                                                                gradientEnd: p.end,
                                                                gradientAngle: '135deg'
                                                            }));
                                                        }}
                                                    >
                                                        <span className="qc-grad-dot" style={{ background: p.value }}></span>
                                                        <span>{p.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Direct CSS Gradient Code Input */}
                                        <div className="qc-form-group qc-gradient-css-group">
                                            <label>CSS Gradient Rule (Editable)</label>
                                            <input
                                                type="text"
                                                className="qc-code-input"
                                                value={themeForm.gradientHero || ''}
                                                onChange={(e) => setThemeForm({ ...themeForm, gradientHero: e.target.value })}
                                                placeholder="linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)"
                                            />
                                        </div>
                                    </div>

                                    {/* Palette Colors */}
                                    <label className="qc-subhead-label">🎨 Additional Brand Colors</label>
                                    <div className="qc-color-picker-grid">
                                        <div className="qc-color-input-card">
                                            <label>Primary Brand</label>
                                            <div className="qc-color-picker-row">
                                                <input
                                                    type="color"
                                                    value={themeForm.primaryColor}
                                                    onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value, navBg: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    value={themeForm.primaryColor}
                                                    onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value, navBg: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="qc-color-input-card">
                                            <label>Secondary Accent</label>
                                            <div className="qc-color-picker-row">
                                                <input
                                                    type="color"
                                                    value={themeForm.secondaryColor}
                                                    onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    value={themeForm.secondaryColor}
                                                    onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="qc-color-input-card">
                                            <label>Buttons / CTA Color</label>
                                            <div className="qc-color-picker-row">
                                                <input
                                                    type="color"
                                                    value={themeForm.accentColor}
                                                    onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    value={themeForm.accentColor}
                                                    onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="qc-color-input-card">
                                            <label>Announcement Bar BG</label>
                                            <div className="qc-color-picker-row">
                                                <input
                                                    type="color"
                                                    value={themeForm.announcementBg}
                                                    onChange={(e) => setThemeForm({ ...themeForm, announcementBg: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    value={themeForm.announcementBg}
                                                    onChange={(e) => setThemeForm({ ...themeForm, announcementBg: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="qc-color-input-card full-span">
                                            <label>Page Background Tone</label>
                                            <div className="qc-color-picker-row">
                                                <input
                                                    type="color"
                                                    value={themeForm.bgPage}
                                                    onChange={(e) => setThemeForm({ ...themeForm, bgPage: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    value={themeForm.bgPage}
                                                    onChange={(e) => setThemeForm({ ...themeForm, bgPage: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Live Real-time Card Mockup */}
                                    <div className="qc-theme-mockup-wrap">
                                        <label className="qc-subhead-label">👁️ Real-Time Store Preview</label>
                                        <div
                                            className="qc-theme-live-mockup"
                                            style={{ background: themeForm.bgPage, borderColor: themeForm.primaryColor }}
                                        >
                                            {/* Mockup Announcement */}
                                            <div
                                                className="qc-mockup-announcement"
                                                style={{ background: themeForm.announcementBg, color: '#ffffff' }}
                                            >
                                                <span>{themeForm.announcement || 'Campaign Announcement Banner'}</span>
                                            </div>
                                            {/* Mockup Nav */}
                                            <div
                                                className="qc-mockup-navbar"
                                                style={{ background: themeForm.primaryColor, color: '#ffffff' }}
                                            >
                                                <div className="qc-mockup-brand">
                                                    <span>{themeForm.icon}</span>
                                                    <strong>QuickCart</strong>
                                                    <span className="qc-mockup-tag" style={{ background: themeForm.secondaryColor, color: '#1e293b' }}>
                                                        {themeForm.badge || 'SPECIAL'}
                                                    </span>
                                                </div>
                                                <span className="qc-mockup-clock">⚡ 10 Mins</span>
                                            </div>
                                            {/* Mockup Hero */}
                                            <div
                                                className="qc-mockup-hero"
                                                style={{ background: themeForm.gradientHero || themeForm.primaryColor }}
                                            >
                                                {themeForm.bannerImg ? (
                                                    <div className="qc-mockup-banner-row">
                                                        <img
                                                            src={themeForm.bannerImg}
                                                            alt="Banner Mockup"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h5>{themeForm.heroHeadline || 'Hero Headline'}</h5>
                                                        <p>{themeForm.heroSub || 'Hero sub-headline text'}</p>
                                                        <button
                                                            type="button"
                                                            className="qc-mockup-cta"
                                                            style={{ background: themeForm.accentColor, color: '#ffffff' }}
                                                        >
                                                            Shop Now • {themeForm.festiveTag || 'Special'}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="qc-theme-modal-footer">
                                <label className="qc-auto-activate-toggle">
                                    <input
                                        type="checkbox"
                                        checked={autoActivateTheme}
                                        onChange={(e) => setAutoActivateTheme(e.target.checked)}
                                    />
                                    <span>Activate this festival theme immediately on store for all users</span>
                                </label>

                                <div className="qc-modal-actions">
                                    <button
                                        type="button"
                                        className="qc-order-action-btn secondary"
                                        onClick={() => setIsThemeModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="qc-cta-button"
                                        disabled={isSavingTheme}
                                    >
                                        {isSavingTheme ? (
                                            <>
                                                <RotateCw size={15} className="spin" />
                                                <span>Publishing Campaign...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={15} />
                                                <span>Save & Publish Campaign Theme</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* REFUND LIFECYCLE MANAGEMENT MODAL (Pending, Processed, Credited) */}
            {refundModalOrder && (
                <div className="qc-modal-backdrop">
                    <div className="qc-admin-refund-modal">
                        <div className="qc-modal-header">
                            <div className="qc-modal-title-wrap">
                                <RotateCcw size={20} className="qc-text-refund-icon" />
                                <div>
                                    <h3>Order Refund Lifecycle Management</h3>
                                    <p className="qc-modal-subtext">Order #{refundModalOrder._id.slice(-8)} • Customer: {refundModalOrder.userId?.email || refundModalOrder.address?.name || 'Customer'}</p>
                                </div>
                            </div>
                            <button className="qc-modal-close" onClick={() => setRefundModalOrder(null)}>✕</button>
                        </div>

                        <form onSubmit={handleSaveRefund} className="qc-refund-modal-form">
                            <div className="qc-refund-order-brief">
                                <div className="qc-brief-item">
                                    <span>Order Total:</span>
                                    <strong>₹{refundModalOrder.total}</strong>
                                </div>
                                <div className="qc-brief-item">
                                    <span>Placed On:</span>
                                    <span>{new Date(refundModalOrder.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="qc-brief-item">
                                    <span>Delivery Status:</span>
                                    <span className={`qc-ticket-status-pill ${refundModalOrder.status}`}>{refundModalOrder.status}</span>
                                </div>
                            </div>

                            <div className="qc-form-row">
                                <div className="qc-form-group flex-1">
                                    <label>Refund Status Lifecycle *</label>
                                    <select
                                        value={refundForm.refundStatus}
                                        onChange={(e) => setRefundForm({ ...refundForm, refundStatus: e.target.value })}
                                        required
                                    >
                                        <option value="pending">⏳ Pending (Under Customer Escalation Review)</option>
                                        <option value="processed">🔄 Processed (Approved & Being Disbursed)</option>
                                        <option value="credited">✅ Credited (Successfully Refunded to Customer)</option>
                                        <option value="none">None (No Refund)</option>
                                    </select>
                                </div>

                                <div className="qc-form-group flex-1">
                                    <label>Refund Amount (₹) *</label>
                                    <input
                                        type="number"
                                        value={refundForm.refundAmount}
                                        onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })}
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="qc-form-row">
                                <div className="qc-form-group flex-1">
                                    <label>Refund Disbursement Method</label>
                                    <select
                                        value={refundForm.refundMethod}
                                        onChange={(e) => setRefundForm({ ...refundForm, refundMethod: e.target.value })}
                                    >
                                        <option value="gift_card">🎁 QuickCart Gift Card Balance (Instant Credit)</option>
                                        <option value="original_payment">💳 Original Payment Method (Bank / UPI / Card)</option>
                                    </select>
                                </div>

                                <div className="qc-form-group flex-1">
                                    <label>Refund Reason</label>
                                    <select
                                        value={refundForm.refundReason}
                                        onChange={(e) => setRefundForm({ ...refundForm, refundReason: e.target.value })}
                                    >
                                        <option value="Item damaged / Quality issue">Item damaged / Quality issue</option>
                                        <option value="Order cancelled by customer">Order cancelled by customer</option>
                                        <option value="Delivery delayed past promise">Delivery delayed past promise</option>
                                        <option value="Missing / Wrong items delivered">Missing / Wrong items delivered</option>
                                        <option value="Customer escalation goodwill refund">Customer escalation goodwill refund</option>
                                    </select>
                                </div>
                            </div>

                            <div className="qc-form-group">
                                <label>Admin Resolution Remarks / Audit Trail</label>
                                <textarea
                                    rows="2"
                                    placeholder="Add internal notes for customer support escalation audit trail..."
                                    value={refundForm.refundRemarks}
                                    onChange={(e) => setRefundForm({ ...refundForm, refundRemarks: e.target.value })}
                                />
                            </div>

                            {refundForm.refundStatus === 'credited' && refundForm.refundMethod === 'gift_card' && (
                                <div className="qc-instant-credit-alert">
                                    <Sparkles size={16} />
                                    <span>
                                        ⚡ <strong>Instant Credit Action:</strong> Saving status as <strong>CREDITED</strong> via Gift Card will immediately disburse <strong>₹{refundForm.refundAmount || refundModalOrder.total}</strong> directly into the customer's wallet balance!
                                    </span>
                                </div>
                            )}

                            <div className="qc-modal-actions">
                                <button
                                    type="button"
                                    className="qc-order-action-btn secondary"
                                    onClick={() => setRefundModalOrder(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="qc-cta-button"
                                    disabled={isUpdatingRefund}
                                >
                                    {isUpdatingRefund ? (
                                        <>
                                            <RotateCw size={15} className="spin" />
                                            <span>Updating Refund...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={15} />
                                            <span>Save & Update Refund Status</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
