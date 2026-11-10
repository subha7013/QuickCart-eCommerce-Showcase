import React from 'react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

function FloatingCartBar() {
    const { cartItemCount, cartTotal, currentView, setCurrentView } = useApp();

    if (cartItemCount <= 0 || ['cart', 'checkout', 'select-address'].includes(currentView)) {
        return null;
    }

    return (
        <a
            href="/cart"
            className="floating-cart-bar"
            onClick={(e) => {
                e.preventDefault();
                setCurrentView('cart');
            }}
            role="button"
            aria-label="View Cart"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setCurrentView('cart');
                }
            }}
        >
            <div className="floating-cart-info">
                <div className="floating-cart-icon-wrap">
                    <ShoppingBag size={15} />
                </div>
                <div className="floating-cart-details">
                    <span className="floating-cart-count">
                        {cartItemCount} {cartItemCount === 1 ? 'ITEM' : 'ITEMS'}
                    </span>
                    <span className="floating-cart-divider">•</span>
                    <span className="floating-cart-total">₹{cartTotal}</span>
                </div>
            </div>
            <div className="floating-cart-action">
                <span>View Cart</span>
                <ChevronRight size={15} className="floating-cart-chevron" />
            </div>
        </a>
    );
}

export default FloatingCartBar;
