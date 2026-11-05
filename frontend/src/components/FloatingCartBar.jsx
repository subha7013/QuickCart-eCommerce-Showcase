import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

function FloatingCartBar() {
    const { cartItemCount, cartTotal, currentView, setCurrentView } = useApp();

    if (cartItemCount <= 0 || currentView === 'cart' || currentView === 'checkout') {
        return null;
    }

    return (
        <div className="floating-cart-bar" onClick={() => setCurrentView('cart')}>
            <div className="floating-cart-info">
                <span className="floating-cart-count">
                    {cartItemCount} {cartItemCount === 1 ? 'ITEM' : 'ITEMS'}
                </span>
                <span className="floating-cart-total">₹{cartTotal}</span>
            </div>
            <div className="floating-cart-action">
                <span>
                    View Cart <ChevronRight size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                </span>
            </div>
        </div>
    );
}

export default FloatingCartBar;
