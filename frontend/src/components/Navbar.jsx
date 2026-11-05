import React, { useState } from 'react';
import {
    Menu, Search, ShoppingBag, Heart, User, Shield, Home, Grid,
    ChevronDown, Sparkles, Zap, X, Truck
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function Navbar() {
    const {
        currentView,
        setCurrentView,
        searchTerm,
        setSearchTerm,
        selectedCategoryName,
        setSelectedCategoryName,
        selectedSubcategory,
        setSelectedSubcategory,
        categoryList,
        wishlist,
        cartItemCount,
        currentUser,
        isAdmin,
        hideMobileTopNav,
        setIsMobileDrawerOpen,
        currentThemeConfig
    } = useApp();

    const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
    const wishlistCount = wishlist.length;

    function handleNavigate(view) {
        setCurrentView(view);
        setIsCatDropdownOpen(false);
    }

    function selectSubcategory(catName, subcat) {
        setSelectedCategoryName(catName);
        setSelectedSubcategory(subcat);
        setCurrentView('categories');
        setIsCatDropdownOpen(false);
    }

    return (
        <header className="qc-header">
            {/* Top Festive Announcement Ribbon */}
            <div className="qc-announcement-bar">
                <div className="qc-announcement-content">
                    <div className="qc-announcement-left">
                        <span className="qc-announcement-badge">
                            <Zap size={13} /> {currentThemeConfig.badge}
                        </span>
                        <p className="qc-announcement-text">{currentThemeConfig.announcement}</p>
                    </div>

                    <div className="qc-announcement-right">
                        <div className="qc-announcement-festive-tag">
                            <span>{currentThemeConfig.festiveTag || '✨ Festive Special'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Navigation Bar */}
            <nav className={`qc-main-nav ${hideMobileTopNav ? 'hide-mobile' : ''}`}>
                <div className="qc-nav-container">
                    {/* Left: Hamburger & Brand */}
                    <div className="qc-nav-left">
                        <button
                            className="qc-hamburger-btn"
                            onClick={() => setIsMobileDrawerOpen(true)}
                            aria-label="Open Navigation"
                        >
                            <Menu size={22} />
                        </button>

                        <div
                            className="qc-brand-logo"
                            onClick={() => {
                                setSelectedCategoryName(null);
                                setSelectedSubcategory(null);
                                setCurrentView('home');
                            }}
                        >
                            <div className="qc-brand-badge">{currentThemeConfig.icon}</div>
                            <div className="qc-brand-text">
                                <h1 className="qc-brand-title">
                                    Quick<span className="qc-brand-highlight">Cart</span>
                                </h1>
                                <span className="qc-brand-sub">
                                    ⚡ 10-Min Superstore
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Center: Search Box */}
                    <div className="qc-search-wrapper">
                        <div className="qc-search-box">
                            <Search size={18} className="qc-search-icon" />
                            <input
                                type="text"
                                className="qc-search-input"
                                placeholder="Search for fresh veggies, ripe fruits, chargers, earbuds, sneakers..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    if (currentView !== 'home') setCurrentView('home');
                                }}
                            />
                            {searchTerm && (
                                <button className="qc-clear-search" onClick={() => setSearchTerm('')}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Right: Navigation Actions (Home, Categories with Subcategories, Wishlist, Cart, Profile, Admin) */}
                    <div className="qc-nav-right">
                        {/* Home Button */}
                        <button
                            className={`qc-nav-action-btn ${currentView === 'home' && !selectedCategoryName ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedCategoryName(null);
                                setSelectedSubcategory(null);
                                setCurrentView('home');
                            }}
                            title="Go to Home"
                        >
                            <Home size={18} />
                            <span>Home</span>
                        </button>

                        {/* Categories with Subcategories Mega-Menu */}
                        <div
                            className="qc-cat-dropdown-wrapper"
                            onMouseEnter={() => setIsCatDropdownOpen(true)}
                            onMouseLeave={() => setIsCatDropdownOpen(false)}
                        >
                            <button
                                className={`qc-nav-action-btn ${currentView === 'categories' || selectedCategoryName ? 'active' : ''}`}
                                onClick={() => {
                                    setCurrentView('categories');
                                    setIsCatDropdownOpen(!isCatDropdownOpen);
                                }}
                            >
                                <Grid size={18} />
                                <span>{selectedCategoryName || 'Categories'}</span>
                                <ChevronDown size={14} />
                            </button>

                            {isCatDropdownOpen && (
                                <div className="qc-mega-menu">
                                    <div className="qc-mega-menu-header">
                                        <span
                                            className="qc-all-cat-link"
                                            onClick={() => {
                                                setSelectedCategoryName(null);
                                                setSelectedSubcategory(null);
                                                setCurrentView('categories');
                                                setIsCatDropdownOpen(false);
                                            }}
                                        >
                                            🌟 View All Categories & Deals
                                        </span>
                                    </div>

                                    <div className="qc-mega-columns-grid">
                                        {categoryList.map((cat) => (
                                            <div key={cat.name} className="qc-mega-column">
                                                <div
                                                    className="qc-mega-cat-title"
                                                    onClick={() => {
                                                        setSelectedCategoryName(cat.name);
                                                        setSelectedSubcategory(null);
                                                        setCurrentView('categories');
                                                        setIsCatDropdownOpen(false);
                                                    }}
                                                >
                                                    <span className="qc-cat-icon">{cat.icon}</span>
                                                    <span>{cat.name}</span>
                                                </div>
                                                <ul className="qc-mega-subcat-list">
                                                    {cat.subcategories.map((sub) => (
                                                        <li
                                                            key={sub}
                                                            className={`qc-subcat-item ${selectedSubcategory === sub && selectedCategoryName === cat.name ? 'active' : ''}`}
                                                            onClick={() => selectSubcategory(cat.name, sub)}
                                                        >
                                                            {sub}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Wishlist */}
                        <button
                            className={`qc-nav-action-btn ${currentView === 'wishlist' ? 'active' : ''}`}
                            onClick={() => handleNavigate('wishlist')}
                            title="My Wishlist"
                        >
                            <div className="qc-icon-badge-box">
                                <Heart size={18} />
                                {wishlistCount > 0 && <span className="qc-badge-pill">{wishlistCount}</span>}
                            </div>
                            <span>Wishlist</span>
                        </button>

                        {/* Cart */}
                        <button
                            className={`qc-nav-action-btn qc-cart-btn ${currentView === 'cart' ? 'active' : ''}`}
                            onClick={() => handleNavigate('cart')}
                            title="Shopping Cart"
                        >
                            <div className="qc-icon-badge-box">
                                <ShoppingBag size={18} />
                                {cartItemCount > 0 && (
                                    <span className="qc-badge-pill highlight">{cartItemCount}</span>
                                )}
                            </div>
                            <span>Cart</span>
                        </button>



                        {/* Profile Section */}
                        {currentUser && (
                            <button
                                className={`qc-nav-action-btn qc-profile-btn ${currentView === 'profile' ? 'active' : ''}`}
                                onClick={() => handleNavigate('profile')}
                                title="My Account & Orders"
                            >
                                <span className="qc-avatar-circle">
                                    {currentUser.email?.charAt(0).toUpperCase()}
                                </span>
                                <span className="qc-user-name">
                                    {currentUser.email?.split('@')[0]}
                                </span>
                            </button>
                        )}

                        {!currentUser && !isAdmin && (
                            <button
                                className={`qc-nav-action-btn ${currentView === 'profile' ? 'active' : ''}`}
                                onClick={() => handleNavigate('profile')}
                                title="Sign In"
                            >
                                <User size={18} />
                                <span>Login</span>
                            </button>
                        )}

                        {isAdmin && (
                            <button
                                className={`qc-nav-action-btn qc-admin-btn ${currentView === 'admin' ? 'active' : ''}`}
                                onClick={() => handleNavigate('admin')}
                                title="Return to Admin Dashboard"
                            >
                                <Shield size={18} />
                                <span>Admin</span>
                            </button>
                        )}

                    </div>
                </div>
            </nav>
        </header>
    );
}
