import React from 'react';
import Navbar from './components/Navbar.jsx';
import MobileDrawer from './components/MobileDrawer.jsx';
import HomeView from './components/HomeView.jsx';
import WishlistView from './components/WishlistView.jsx';
import CartView from './components/CartView.jsx';
import UserProfileView from './components/UserProfileView.jsx';
import OrderTrackingView from './components/OrderTrackingView.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AddressSelectView from './components/AddressSelectView.jsx';
import Footer from './components/Footer.jsx';
import FloatingCartBar from './components/FloatingCartBar.jsx';
import TaxInvoiceModal from './components/TaxInvoiceModal.jsx';
import RazorpayModal from './components/RazorpayModal.jsx';
import { AppProvider, useApp } from './context/AppContext.jsx';

function AppContent() {
    const { currentView, toast, festivalTheme, currentThemeConfig } = useApp();

    const dynamicThemeStyles = currentThemeConfig ? {
        '--qc-primary': currentThemeConfig.primaryColor,
        '--qc-primary-dark': currentThemeConfig.primaryColor,
        '--qc-secondary': currentThemeConfig.secondaryColor,
        '--qc-nav-bg': currentThemeConfig.navBg || currentThemeConfig.primaryColor,
        '--qc-announcement-bg': currentThemeConfig.announcementBg || currentThemeConfig.primaryColor,
        '--qc-instamart': currentThemeConfig.accentColor || '#0c831f',
        '--qc-bg-page': currentThemeConfig.bgPage || '#f1f3f6',
        '--qc-hero-gradient': currentThemeConfig.gradientHero || 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0284c7 100%)'
    } : undefined;

    return (
        <div className="qc-app-shell" data-theme={festivalTheme} style={dynamicThemeStyles}>
            <Navbar />
            <MobileDrawer />

            <main className="qc-main-content">
                {(currentView === 'home' || currentView === 'categories') && <HomeView />}
                {currentView === 'wishlist' && <WishlistView />}
                {currentView === 'cart' && <CartView />}
                {(currentView === 'select-address' || currentView === 'checkout') && <AddressSelectView />}
                {(currentView === 'profile' || currentView === 'orders') && <UserProfileView />}
                {currentView === 'tracking' && <OrderTrackingView />}
                {currentView === 'admin' && <AdminDashboard />}
            </main>

            <Footer />
            <FloatingCartBar />
            <TaxInvoiceModal />
            <RazorpayModal />

            {toast && <div className="qc-toast-notification">{toast}</div>}
        </div>
    );
}

function App() {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
}

export default App;
