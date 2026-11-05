import React, { useState, useEffect } from 'react';
import {
    Sparkles, Zap, ShieldCheck, RefreshCw, Clock, ArrowRight, ArrowLeft,
    ChevronLeft, ChevronRight, Flame, Percent, Tag, CheckCircle2,
    Truck, Search, AlertCircle, XCircle, Printer, Grid
} from 'lucide-react';
import ProductCard from './ProductCard.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function HomeView() {
    const {
        currentView,
        setCurrentView,
        searchTerm,
        setSearchTerm,
        selectedCategoryName,
        setSelectedCategoryName,
        selectedSubcategory,
        setSelectedSubcategory,
        selectedCategory,
        categoryList,
        filteredProducts,
        currentThemeConfig,
        dbProducts,
        trackOrderByQuery,
        setActiveTrackingOrder,
        generateInvoiceForOrder
    } = useApp();

    const isCategoriesView = currentView === 'categories';

    // Landing Page Order Tracking State (Accessible by all without login)
    const [guestTrackQuery, setGuestTrackQuery] = useState('');
    const [guestTrackResult, setGuestTrackResult] = useState(null);
    const [isGuestTrackingLoading, setIsGuestTrackingLoading] = useState(false);
    const [guestTrackError, setGuestTrackError] = useState('');

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

    // Banner Carousel State
    const [activeSlide, setActiveSlide] = useState(0);

    const isDiwaliTheme = currentThemeConfig?.id === 'diwali';
    const themeHasBannerPng = Boolean(
        currentThemeConfig?.bannerImg && (
            currentThemeConfig.bannerImg.includes('bannerdiwali') ||
            currentThemeConfig.bannerImg.includes('bannerquickcart') ||
            currentThemeConfig.bannerImg.endsWith('.png') ||
            currentThemeConfig.bannerImg.endsWith('.jpg') ||
            currentThemeConfig.bannerImg.endsWith('.jpeg') ||
            currentThemeConfig.bannerImg.startsWith('http') ||
            currentThemeConfig.bannerImg.startsWith('data:')
        )
    );

    const baseSlides = [
        // Slide 0: Current Active Store Theme Campaign Banner
        {
            tag: currentThemeConfig?.festiveTag || (isDiwaliTheme ? 'DIWALI SPECIAL' : 'MEGA SAVINGS'),
            badge: currentThemeConfig?.badge || '⚡ 10-MIN EXPRESS DELIVERY',
            title: currentThemeConfig?.heroHeadline || (isDiwaliTheme ? 'Diwali Mega Dhamaka | Up To 80% OFF' : 'India\'s Favorite 10-Min Superstore'),
            desc: currentThemeConfig?.heroSub || (isDiwaliTheme ? 'Celebrate the Festival of Lights with unmissable deals on sweets, hampers & tech!' : 'Fresh farm vegetables, tech gadgets & fashion essentials delivered in 10 minutes with assured quality.'),
            ctaText: isDiwaliTheme ? 'Shop Diwali Deals' : 'Shop Mega Deals',
            category: 'Groceries',
            bgGradient: currentThemeConfig?.gradientHero || (isDiwaliTheme ? 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 45%, #b45309 100%)' : 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0284c7 100%)'),
            icon: currentThemeConfig?.icon || (isDiwaliTheme ? '🪔' : '🛒'),
            bannerImg: currentThemeConfig?.bannerImg || (isDiwaliTheme ? '/bannerdiwali.png' : (currentThemeConfig?.id === 'default' ? '/bannerquickcart.png' : null))
        },
        // Slide 1: Alternative Campaign Banner (So both Diwali and Default banners are always present!)
        isDiwaliTheme ? {
            tag: 'MEGA SAVINGS SUPERSTORE',
            badge: '⚡ INSTAMART 10-MIN RUSH',
            title: 'QuickCart Superstore Flash Deals',
            desc: 'Everyday groceries, pantry staples, fresh fruits & daily home essentials delivered in 10 minutes.',
            ctaText: 'Explore Superstore',
            category: 'Groceries',
            bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0284c7 100%)',
            icon: '🛒',
            bannerImg: '/bannerquickcart.png'
        } : {
            tag: '🪔 SHUBH DEEPAVALI',
            badge: '🔥 FESTIVE MEGA DHAMAKA',
            title: 'Diwali Grand Dhamaka Festival 2026',
            desc: 'Celebrate with authentic mithai, premium dry fruit gift hampers, decorative lights & festive tech.',
            ctaText: 'Shop Diwali Specials',
            category: 'Groceries',
            bgGradient: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b45309 100%)',
            icon: '🪔',
            bannerImg: '/bannerdiwali.png'
        },
        // Slide 2: Tech Bonanza (Textual Banner)
        {
            tag: 'TECH BONANZA',
            badge: '🔥 UP TO 70% OFF',
            title: 'Genuine Fast Chargers, Earbuds & Gadgets',
            desc: 'Top-rated tech essentials from Realme, Samsung & Apple with instant doorstep delivery.',
            ctaText: 'Explore Tech Gear',
            category: 'Electronics',
            bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #3b82f6 100%)',
            icon: '⚡'
        },
        // Slide 3: Farm Fresh Instamart (Textual Banner)
        {
            tag: 'FARM FRESH INSTAMART',
            badge: '🥦 100% ORGANIC & FRESH',
            title: 'Farm Fresh Vegetables & Daily Fruits',
            desc: 'Crisp potatoes, organic tomatoes, fresh bananas and chillies delivered in 10 minutes flat.',
            ctaText: 'Order Fresh Groceries',
            category: 'Groceries',
            bgGradient: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
            icon: '🍎'
        }
    ];

    // For the theme which has banner pngs, remove textual banners from carousel
    const slides = themeHasBannerPng
        ? baseSlides.filter(s => Boolean(s.bannerImg))
        : baseSlides;

    const safeActiveSlide = activeSlide >= slides.length ? 0 : activeSlide;

    // Auto rotate banners
    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    // Live Flash Sale Countdown simulation
    const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 18, seconds: 24 });
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
                if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return { hours: 4, minutes: 30, seconds: 0 };
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Helper to get products by category
    const electronicsProducts = filteredProducts.filter(p => p.category?.toLowerCase() === 'electronics');
    const groceryProducts = filteredProducts.filter(p => p.category?.toLowerCase() === 'groceries');
    const fashionProducts = filteredProducts.filter(p => p.category?.toLowerCase() === 'fashion');
    const dealProducts = filteredProducts.filter(p => p.price < 500 || p.offerTag);

    return (
        <section id="homePage" className="qc-home-page">
            {/* 0. Categories View Specific Header (When on Categories Page) */}
            {isCategoriesView && (
                <div className="qc-categories-page-header">
                    <button
                        className="qc-back-to-home-btn"
                        onClick={() => {
                            setCurrentView('home');
                            setSelectedCategoryName(null);
                            setSelectedSubcategory(null);
                        }}
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Home</span>
                    </button>
                    <div className="qc-categories-header-title">
                        <h2>{selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name} Collection` : '🌟 All Categories & Catalog'}</h2>
                        <p>{selectedCategory ? selectedCategory.description : 'Explore our complete 10-minute lightning delivery superstore catalog'}</p>
                    </div>
                </div>
            )}

            {/* Categories Nav Tabs (When on Categories Page) */}
            {isCategoriesView && !searchTerm && (
                <div className="qc-categories-nav-tabs">
                    <button
                        className={`qc-cat-tab-btn ${!selectedCategoryName ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedCategoryName(null);
                            setSelectedSubcategory(null);
                        }}
                    >
                        <span>🌟 All Categories ({categoryList.flatMap(c => c.products).length})</span>
                    </button>
                    {categoryList.map(cat => (
                        <button
                            key={cat.name}
                            className={`qc-cat-tab-btn ${selectedCategoryName === cat.name ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedCategoryName(cat.name);
                                setSelectedSubcategory(null);
                            }}
                        >
                            <span>{cat.icon} {cat.name} ({cat.products.length})</span>
                        </button>
                    ))}
                </div>
            )}

            {/* 1. Hero Promo Carousel (Only on Home View) */}
            {!isCategoriesView && !searchTerm && !selectedCategoryName && slides.length > 0 && (
                <div className="qc-hero-carousel-container">
                    <div
                        className={`qc-hero-slide ${slides[safeActiveSlide]?.bannerImg ? 'has-image' : ''}`}
                        style={{ background: slides[safeActiveSlide]?.bgGradient }}
                    >
                        {slides[safeActiveSlide]?.bannerImg ? (
                            <div
                                className="qc-hero-banner-image-wrap"
                                onClick={() => {
                                    if (slides[safeActiveSlide]?.category) {
                                        setSelectedCategoryName(slides[safeActiveSlide].category);
                                        setSelectedSubcategory(null);
                                        setCurrentView('categories');
                                    }
                                }}
                            >
                                <img
                                    src={slides[safeActiveSlide].bannerImg}
                                    alt={slides[safeActiveSlide].title || 'Campaign Banner'}
                                    className="qc-hero-full-banner-img"
                                    onError={(e) => {
                                        if (!e.target.dataset.triedFallback && slides[safeActiveSlide]?.bannerImg) {
                                            e.target.dataset.triedFallback = 'true';
                                            const raw = slides[safeActiveSlide].bannerImg;
                                            e.target.src = raw.startsWith('/assets') ? raw.replace('/assets', '') : '/assets' + (raw.startsWith('/') ? raw : '/' + raw);
                                        } else {
                                            e.target.style.display = 'none';
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="qc-slide-content">
                                    <div className="qc-slide-tags-row">
                                        <span className="qc-slide-festive-tag">
                                            <Sparkles size={12} /> {slides[safeActiveSlide].tag}
                                        </span>
                                        <span className="qc-slide-badge">
                                            {slides[safeActiveSlide].badge}
                                        </span>
                                    </div>

                                    <h2 className="qc-slide-title">
                                        {slides[safeActiveSlide].title}
                                    </h2>
                                    <p className="qc-slide-desc">
                                        {slides[safeActiveSlide].desc}
                                    </p>

                                    <div className="qc-slide-cta-row">
                                        <button
                                            className="qc-slide-cta-btn"
                                            onClick={() => {
                                                setSelectedCategoryName(slides[safeActiveSlide].category);
                                                setSelectedSubcategory(null);
                                                setCurrentView('categories');
                                            }}
                                        >
                                            <span>{slides[safeActiveSlide].ctaText}</span>
                                            <ArrowRight size={16} />
                                        </button>
                                        <span className="qc-slide-free-delivery-tag">
                                            ⚡ Free Shipping on Orders ₹199+
                                        </span>
                                    </div>
                                </div>

                                <div className="qc-slide-visual">
                                    <div className="qc-slide-giant-icon">
                                        {slides[safeActiveSlide].icon}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Slide Prev/Next Arrows */}
                        {slides.length > 1 && (
                            <>
                                <button
                                    className="qc-carousel-arrow prev"
                                    onClick={() => setActiveSlide((safeActiveSlide - 1 + slides.length) % slides.length)}
                                    aria-label="Previous slide"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    className="qc-carousel-arrow next"
                                    onClick={() => setActiveSlide((safeActiveSlide + 1) % slides.length)}
                                    aria-label="Next slide"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Indicator Dots */}
                    {slides.length > 1 && (
                        <div className="qc-carousel-dots">
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`qc-carousel-dot ${safeActiveSlide === idx ? 'active' : ''}`}
                                    onClick={() => setActiveSlide(idx)}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 2. Category Icons Strip (Only on Home View) */}
            {!isCategoriesView && !searchTerm && (
                <div className="qc-category-strip-container">
                    <div className="qc-category-strip-grid">
                        <div
                            className={`qc-cat-circle-card ${!selectedCategoryName ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedCategoryName(null);
                                setSelectedSubcategory(null);
                                setCurrentView('categories');
                            }}
                        >
                            <div className="qc-cat-circle-avatar">🌟</div>
                            <span className="qc-cat-circle-name">All Deals</span>
                        </div>

                        {categoryList.map((cat) => (
                            <div
                                key={cat.name}
                                className={`qc-cat-circle-card ${selectedCategoryName === cat.name ? 'active' : ''}`}
                                onClick={() => {
                                    setSelectedCategoryName(cat.name);
                                    setSelectedSubcategory(null);
                                    setCurrentView('categories');
                                }}
                            >
                                <div className="qc-cat-circle-avatar">{cat.icon}</div>
                                <span className="qc-cat-circle-name">{cat.name}</span>
                            </div>
                        ))}

                        {/* Direct Subcategory Shortcuts */}
                        <div
                            className={`qc-cat-circle-card ${selectedSubcategory === 'Vegetables' ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedCategoryName('Groceries');
                                setSelectedSubcategory('Vegetables');
                                setCurrentView('categories');
                            }}
                        >
                            <div className="qc-cat-circle-avatar">🥔</div>
                            <span className="qc-cat-circle-name">Veggies</span>
                        </div>

                        <div
                            className={`qc-cat-circle-card ${selectedSubcategory === 'Fruits' ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedCategoryName('Groceries');
                                setSelectedSubcategory('Fruits');
                                setCurrentView('categories');
                            }}
                        >
                            <div className="qc-cat-circle-avatar">🍎</div>
                            <span className="qc-cat-circle-name">Fruits</span>
                        </div>

                        <div
                            className={`qc-cat-circle-card ${selectedSubcategory === 'Headset' ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedCategoryName('Electronics');
                                setSelectedSubcategory('Headset');
                                setCurrentView('categories');
                            }}
                        >
                            <div className="qc-cat-circle-avatar">🎧</div>
                            <span className="qc-cat-circle-name">Headsets</span>
                        </div>

                        <div
                            className={`qc-cat-circle-card ${selectedSubcategory === 'Accessories' ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedCategoryName('Electronics');
                                setSelectedSubcategory('Accessories');
                                setCurrentView('categories');
                            }}
                        >
                            <div className="qc-cat-circle-avatar">🔌</div>
                            <span className="qc-cat-circle-name">Chargers</span>
                        </div>

                        <div
                            className={`qc-cat-circle-card ${selectedSubcategory === 'Tshirts' ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedCategoryName('Fashion');
                                setSelectedSubcategory('Tshirts');
                                setCurrentView('categories');
                            }}
                        >
                            <div className="qc-cat-circle-avatar">👕</div>
                            <span className="qc-cat-circle-name">T-Shirts</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Deal of the Day Countdown Ribbon (Only on Home View) */}
            {!isCategoriesView && !searchTerm && !selectedCategoryName && (
                <div className="qc-flash-deal-banner">
                    <div className="qc-flash-left">
                        <span className="qc-flash-flame"><Flame size={20} /></span>
                        <div className="qc-flash-text">
                            <h4>DEAL OF THE DAY</h4>
                            <p>Handpicked mega-discounts on fresh produce & tech favorites</p>
                        </div>
                    </div>
                    <div className="qc-flash-timer-box">
                        <span className="qc-timer-label">Ends in:</span>
                        <div className="qc-timer-digits">
                            <span>{String(timeLeft.hours).padStart(2, '0')}h</span> :
                            <span>{String(timeLeft.minutes).padStart(2, '0')}m</span> :
                            <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Flipkart Assured / Instamart Trust Badges Strip (Only on Home View) */}
            {!isCategoriesView && !searchTerm && !selectedCategoryName && (
                <div className="qc-trust-badges-bar">
                    <div className="qc-trust-badge-item">
                        <div className="qc-trust-icon-box"><Zap size={18} /></div>
                        <div className="qc-trust-info">
                            <strong>10-Min Superfast Delivery</strong>
                            <span>From nearest darkstore directly to your door</span>
                        </div>
                    </div>

                    <div className="qc-trust-badge-item">
                        <div className="qc-trust-icon-box"><ShieldCheck size={18} /></div>
                        <div className="qc-trust-info">
                            <strong>100% Genuine Assured</strong>
                            <span>Quality checked authentic products guaranteed</span>
                        </div>
                    </div>

                    <div className="qc-trust-badge-item">
                        <div className="qc-trust-icon-box"><Percent size={18} /></div>
                        <div className="qc-trust-info">
                            <strong>₹150 Free Cash Welcome</strong>
                            <span>Instant wallet discount on eligible cart totals</span>
                        </div>
                    </div>

                    <div className="qc-trust-badge-item">
                        <div className="qc-trust-icon-box"><RefreshCw size={18} /></div>
                        <div className="qc-trust-info">
                            <strong>Instant AI Help & Escalation</strong>
                            <span>24x7 intelligent support with auto-escalation</span>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. Subcategory Pills Bar (When Category Is Active) */}
            {(isCategoriesView || selectedCategory) && selectedCategory && !searchTerm && (
                <div className="qc-subcat-pills-container">
                    <div className="qc-subcat-header-title">
                        <h3>{selectedCategory.icon} {selectedCategory.name} Collection</h3>
                        <p>{selectedCategory.description}</p>
                    </div>

                    <div className="qc-subcat-pills-row">
                        <button
                            className={`qc-subcat-pill-btn ${!selectedSubcategory ? 'active' : ''}`}
                            onClick={() => setSelectedSubcategory(null)}
                        >
                            All {selectedCategory.name}
                        </button>

                        {selectedCategory.subcategories.map((sub) => (
                            <button
                                key={sub}
                                className={`qc-subcat-pill-btn ${selectedSubcategory === sub ? 'active' : ''}`}
                                onClick={() => setSelectedSubcategory(sub)}
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 6. Search Results Active Notice */}
            {searchTerm && (
                <div className="qc-search-results-banner">
                    <div className="qc-search-banner-content">
                        <h3>Results for "{searchTerm}"</h3>
                        <p>Found {filteredProducts.length} matching products</p>
                    </div>
                    <button className="qc-clear-filter-btn" onClick={() => setSearchTerm('')}>
                        Clear Search
                    </button>
                </div>
            )}

            {/* 7. Product Catalog Grid Display */}
            {filteredProducts.length === 0 ? (
                <div className="qc-no-products-box">
                    <div className="qc-no-products-icon">🔍</div>
                    <h3>No products found</h3>
                    <p>We couldn't find any products matching your query or filter.</p>
                </div>
            ) : isCategoriesView || selectedCategoryName || searchTerm ? (
                /* Full Catalog Grid: When in Categories View, Category Selected, or Searching */
                <div className="qc-products-catalog-section">
                    <div className="qc-catalog-header">
                        <h3 className="qc-catalog-title">
                            {selectedSubcategory ? `${selectedSubcategory} Products` : selectedCategoryName ? `${selectedCategoryName} Collection` : 'All Products'}
                            <span className="qc-count-badge">({filteredProducts.length} items)</span>
                        </h3>
                    </div>
                    <div className="qc-products-grid">
                        {filteredProducts.map((p) => (
                            <ProductCard key={p.id} product={p} />
                        ))}
                    </div>
                </div>
            ) : (
                /* Homepage Multi-Section: SHOW ONLY 2 TO 3 PRODUCTS PER SECTION */
                <div className="qc-home-sections-flow">
                    {/* Section A: Deals of the Day (Max 3 Products) */}
                    {dealProducts.length > 0 && (
                        <div className="qc-products-catalog-section">
                            <div className="qc-catalog-header">
                                <div className="qc-catalog-title-box">
                                    <h3 className="qc-catalog-title">
                                        <Flame size={20} className="qc-title-icon flame" />
                                        <span>Hot Deals & Festive Picks</span>
                                    </h3>
                                    <span className="qc-catalog-subtitle">Special festive discounts with extra instant savings</span>
                                </div>
                                <button
                                    className="qc-view-more-link"
                                    onClick={() => {
                                        setSelectedCategoryName(null);
                                        setSelectedSubcategory(null);
                                        setCurrentView('categories');
                                    }}
                                >
                                    <span>View All Deals</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                            <div className="qc-products-grid">
                                {dealProducts.slice(0, 3).map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section B: Farm Fresh Groceries (Max 3 Products) */}
                    {groceryProducts.length > 0 && (
                        <div className="qc-products-catalog-section">
                            <div className="qc-catalog-header">
                                <div className="qc-catalog-title-box">
                                    <h3 className="qc-catalog-title">
                                        <span className="qc-title-icon">🥦</span>
                                        <span>Fresh Farm Vegetables & Fruits (10 Mins)</span>
                                    </h3>
                                    <span className="qc-catalog-subtitle">Daily harvested vegetables, ripe fruits & household staples</span>
                                </div>
                                <button
                                    className="qc-view-more-link"
                                    onClick={() => {
                                        setSelectedCategoryName('Groceries');
                                        setSelectedSubcategory(null);
                                        setCurrentView('categories');
                                    }}
                                >
                                    <span>View All Groceries</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                            <div className="qc-products-grid">
                                {groceryProducts.slice(0, 3).map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section C: Electronics & Audio Essentials (Max 3 Products) */}
                    {electronicsProducts.length > 0 && (
                        <div className="qc-products-catalog-section">
                            <div className="qc-catalog-header">
                                <div className="qc-catalog-title-box">
                                    <h3 className="qc-catalog-title">
                                        <span className="qc-title-icon">⚡</span>
                                        <span>Electronics, Adapters & Earbuds</span>
                                    </h3>
                                    <span className="qc-catalog-subtitle">Tested genuine chargers, high bass earphones and smartphones</span>
                                </div>
                                <button
                                    className="qc-view-more-link"
                                    onClick={() => {
                                        setSelectedCategoryName('Electronics');
                                        setSelectedSubcategory(null);
                                        setCurrentView('categories');
                                    }}
                                >
                                    <span>View All Tech</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                            <div className="qc-products-grid">
                                {electronicsProducts.slice(0, 3).map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section D: Fashion & Footwear (Max 3 Products) */}
                    {fashionProducts.length > 0 && (
                        <div className="qc-products-catalog-section">
                            <div className="qc-catalog-header">
                                <div className="qc-catalog-title-box">
                                    <h3 className="qc-catalog-title">
                                        <span className="qc-title-icon">👕</span>
                                        <span>Trending Fashion & Footwear</span>
                                    </h3>
                                    <span className="qc-catalog-subtitle">Premium tees & running shoes for daily comfort</span>
                                </div>
                                <button
                                    className="qc-view-more-link"
                                    onClick={() => {
                                        setSelectedCategoryName('Fashion');
                                        setSelectedSubcategory(null);
                                        setCurrentView('categories');
                                    }}
                                >
                                    <span>View All Fashion</span>
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                            <div className="qc-products-grid">
                                {fashionProducts.slice(0, 3).map((p) => (
                                    <ProductCard key={p.id} product={p} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Explore Full Categories Action Banner */}
                    <div className="qc-view-all-categories-banner">
                        <div className="qc-view-all-banner-text">
                            <h3>⚡ Want to explore our entire superstore?</h3>
                            <p>Browse fresh farm produce, tech gadgets, fashion apparel & everyday essentials delivered in 10 minutes flat</p>
                        </div>
                        <button
                            className="qc-view-all-cta-btn"
                            onClick={() => {
                                setSelectedCategoryName(null);
                                setSelectedSubcategory(null);
                                setCurrentView('categories');
                            }}
                        >
                            <span>Explore All Categories & Deals</span>
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Landing Page Order Tracking Pane (Only on Home View) */}
            {!isCategoriesView && (
                <div className="qc-guest-tracking-card">
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
                            >
                                <Printer size={14} /> <span>Download Invoice</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        )}
    </section>
    );
}
