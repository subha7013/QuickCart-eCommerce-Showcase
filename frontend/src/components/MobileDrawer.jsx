import React from 'react';
import { X, User, Heart, ShoppingBag, Shield, Grid, Home, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function MobileDrawer() {
    const {
        isMobileDrawerOpen: isOpen,
        setIsMobileDrawerOpen,
        currentUser,
        isAdmin,
        currentView,
        setCurrentView,
        wishlist,
        categoryList,
        selectedCategoryName,
        setSelectedCategoryName,
        setSelectedSubcategory
    } = useApp();

    const onClose = () => setIsMobileDrawerOpen(false);
    const wishlistCount = wishlist.length;

    if (!isOpen) return null;

    return (
        <div className="mobile-drawer-overlay" onClick={onClose}>
            <div className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
                <div className="drawer-header">
                    <span className="brand-logo">🛒 QuickCart</span>
                    <button className="close-btn" onClick={onClose} aria-label="Close menu">
                        <X size={20} />
                    </button>
                </div>
                <div className="drawer-content">
                    <div className="drawer-user-section">
                        {currentUser ? (
                            <div className="user-info-card" onClick={() => { setCurrentView('profile'); onClose(); }}>
                                <div className="user-avatar-sm">{currentUser.email.charAt(0).toUpperCase()}</div>
                                <div>
                                    <p className="user-name">{currentUser.email.split('@')[0]}</p>
                                    <p className="user-email">{currentUser.email}</p>
                                </div>
                            </div>
                        ) : (
                            <button className="drawer-auth-btn" onClick={() => { setCurrentView('profile'); onClose(); }}>
                                <User size={16} /> Login / Sign Up
                            </button>
                        )}
                    </div>

                    <nav className="drawer-nav">
                        <button
                            className={`drawer-link ${currentView === 'home' && !selectedCategoryName ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedCategoryName(null);
                                setSelectedSubcategory(null);
                                setCurrentView('home');
                                onClose();
                            }}
                        >
                            <Home size={18} /> Home
                        </button>
                        <button
                            className={`drawer-link ${currentView === 'categories' ? 'active' : ''}`}
                            onClick={() => {
                                setCurrentView('categories');
                                onClose();
                            }}
                        >
                            <Grid size={18} /> All Categories
                        </button>

                        <div className="drawer-category-group">
                            <span className="group-title">Browse Categories</span>
                            {categoryList.map((cat) => (
                                <button
                                    key={cat.name}
                                    className={`drawer-sublink ${selectedCategoryName === cat.name ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedCategoryName(cat.name);
                                        setSelectedSubcategory(cat.subcategories[0] || null);
                                        setCurrentView('home');
                                        onClose();
                                    }}
                                >
                                    <span>{cat.icon}</span> {cat.name}
                                </button>
                            ))}
                        </div>

                        <div className="drawer-divider" />

                        {isAdmin && (
                            <button
                                className={`drawer-link ${currentView === 'admin' ? 'active' : ''}`}
                                onClick={() => { setCurrentView('admin'); onClose(); }}
                            >
                                <Shield size={18} /> Admin Dashboard
                            </button>
                        )}

                        {currentUser && (
                            <button
                                className={`drawer-link ${currentView === 'profile' ? 'active' : ''}`}
                                onClick={() => { setCurrentView('profile'); onClose(); }}
                            >
                                <ShoppingBag size={18} /> My Orders
                            </button>
                        )}

                        <button
                            className={`drawer-link ${currentView === 'tracking' ? 'active' : ''}`}
                            onClick={() => { setCurrentView('tracking'); onClose(); }}
                        >
                            <Truck size={18} /> Track Any Order
                        </button>

                        <button
                            className={`drawer-link ${currentView === 'wishlist' ? 'active' : ''}`}
                            onClick={() => { setCurrentView('wishlist'); onClose(); }}
                        >
                            <Heart size={18} /> Wishlist ({wishlistCount})
                        </button>

                    </nav>
                </div>
            </div>
        </div>
    );
}
