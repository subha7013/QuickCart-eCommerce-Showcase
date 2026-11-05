import React from 'react';
import { Heart, ArrowLeft } from 'lucide-react';
import ProductCard from './ProductCard.jsx';
import { useApp } from '../context/AppContext.jsx';

export default function WishlistView() {
    const { wishlist, setCurrentView } = useApp();

    return (
        <section id="wishlistPage" className="qc-wishlist-page-section">
            <div className="qc-page-header-row">
                <button className="qc-back-btn" onClick={() => setCurrentView('home')}>
                    <ArrowLeft size={16} /> <span>Continue Shopping</span>
                </button>
                <h2>❤️ My Wishlist ({wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'})</h2>
            </div>

            {wishlist.length === 0 ? (
                <div className="qc-empty-section-box">
                    <Heart size={56} className="qc-empty-icon" />
                    <h3>Your Wishlist is Empty</h3>
                    <p>Explore our products and tap the heart icon on any item to save it for later.</p>
                    <button className="qc-cta-button" onClick={() => setCurrentView('home')}>
                        Explore Products
                    </button>
                </div>
            ) : (
                <div className="qc-products-catalog-section">
                    <div className="qc-products-grid">
                        {wishlist.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
