import React from 'react';
import { Heart, Plus, Minus, Star, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function ProductCard({ product }) {
    const {
        cart,
        wishlist,
        getStock,
        getLimitPerOrder,
        increaseCart,
        decreaseCart,
        addToWishlist,
        removeFromWishlist,
        showToast,
        currentThemeConfig
    } = useApp();

    const stock = getStock(product);
    const cartItem = cart.find((item) => item.id === product.id);
    const inCartQty = cartItem ? cartItem.qty : 0;
    const isWishlisted = wishlist.some((item) => item.id === product.id);
    const limitPerOrder = getLimitPerOrder(product);
    const isLimitReached = limitPerOrder > 0 && inCartQty >= limitPerOrder;

    // Calculate discount & savings
    const price = Number(product.price) || 0;
    const mrp = Number(product.mrp) || Math.round(price * 1.35);
    const discountPercent = product.discountPercent || (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
    const savings = Math.max(0, mrp - price);

    return (
        <div className="qc-product-card">
            {/* Top Image Box */}
            <div className="qc-prod-img-box">
                <img
                    src={product.image || '/assets/placeholder.jpg'}
                    alt={product.name}
                    className="qc-prod-img"
                    onError={(e) => { e.target.src = 'https://placehold.co/240x240?text=' + encodeURIComponent(product.name || 'Item'); }}
                    loading="lazy"
                />

                {/* Wishlist Button */}
                <button
                    className={`qc-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                    onClick={() => {
                        if (isWishlisted) removeFromWishlist(product.id);
                        else addToWishlist(product);
                    }}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    aria-label="Wishlist toggle"
                >
                    <Heart
                        size={16}
                        fill={isWishlisted ? '#ef4444' : 'none'}
                        color={isWishlisted ? '#ef4444' : '#64748b'}
                    />
                </button>

                {/* Offer / Festive Badge */}
                {discountPercent > 0 && (
                    <span className="qc-discount-badge">
                        {discountPercent}% OFF
                    </span>
                )}

                {product.offerTag && (
                    <span className="qc-offer-tag-badge">
                        {product.offerTag}
                    </span>
                )}

                {/* Stock Badges */}
                {stock === 0 ? (
                    <div className="qc-stock-overlay out-of-stock">
                        <span>Out of Stock</span>
                    </div>
                ) : stock <= 5 ? (
                    <span className="qc-low-stock-chip">
                        Only {stock} Left
                    </span>
                ) : null}
            </div>

            {/* Content & Metadata */}
            <div className="qc-prod-content">
                {/* Delivery Time & Rating Row */}
                <div className="qc-prod-meta-row">
                    <span className="qc-delivery-chip">
                        <Zap size={11} /> 10 MINS
                    </span>
                    <span className="qc-rating-chip">
                        <Star size={11} fill="#f59e0b" color="#f59e0b" />
                        <span>{product.rating || '4.4'}</span>
                        <small>({product.ratingsCount || '120+'})</small>
                    </span>
                </div>

                {/* Title */}
                <h4 className="qc-prod-title" title={product.name}>
                    {product.name}
                </h4>

                {/* Category / Subcategory Chip */}
                <div className="qc-prod-subcat-row">
                    <span className="qc-subcat-badge">
                        {product.subcategory || product.category || 'Essential'}
                    </span>
                    {limitPerOrder > 0 && (
                        <span className="qc-limit-badge">Max 1/order</span>
                    )}
                </div>

                {/* Price & Action Row */}
                <div className="qc-prod-bottom-row">
                    <div className="qc-price-block">
                        <div className="qc-price-main">
                            <span className="qc-current-price">₹{price}</span>
                            {mrp > price && (
                                <span className="qc-mrp-price">₹{mrp}</span>
                            )}
                        </div>
                        {savings > 0 && (
                            <span className="qc-savings-text">Save ₹{savings}</span>
                        )}
                    </div>

                    <div className="qc-action-block">
                        {stock === 0 ? (
                            <button className="qc-add-btn disabled" disabled>
                                Sold Out
                            </button>
                        ) : inCartQty === 0 ? (
                            <button
                                className="qc-add-btn"
                                onClick={() => increaseCart(product)}
                            >
                                <Plus size={14} /> ADD
                            </button>
                        ) : (
                            <div className="qc-qty-stepper">
                                <button
                                    className="qc-stepper-btn"
                                    onClick={() => decreaseCart(product)}
                                    aria-label="Decrease quantity"
                                >
                                    <Minus size={14} />
                                </button>
                                <span className="qc-stepper-val">{inCartQty}</span>
                                <button
                                    className={`qc-stepper-btn ${isLimitReached ? 'disabled' : ''}`}
                                    onClick={() => {
                                        if (isLimitReached) {
                                            showToast(`"${product.name}" is limited to 1 unit per order`);
                                        } else {
                                            increaseCart(product);
                                        }
                                    }}
                                    aria-label="Increase quantity"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
