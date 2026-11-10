import React from 'react';
import { ShieldCheck, Zap, Headphones, Heart, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export default function Footer() {
    const { setCurrentView, setSelectedCategoryName, setSelectedSubcategory, currentThemeConfig } = useApp();

    return (
        <footer className="qc-footer">
            <div className="qc-footer-top-strip">
                <div className="qc-footer-container">
                    <div className="qc-footer-usp-item">
                        <Zap size={20} className="qc-usp-icon" />
                        <div>
                            <strong>10-Minute Express Delivery</strong>
                            <p>Fresh groceries & tech delivered directly to your doorstep.</p>
                        </div>
                    </div>
                    <div className="qc-footer-usp-item">
                        <ShieldCheck size={20} className="qc-usp-icon" />
                        <div>
                            <strong>100% Genuine Products</strong>
                            <p>Verified authentic items with easy 7-day hassle-free replacement.</p>
                        </div>
                    </div>
                    <div className="qc-footer-usp-item">
                        <Headphones size={20} className="qc-usp-icon" />
                        <div>
                            <strong>24x7 AI & Human Support</strong>
                            <p>Instant conversational assistance with automatic admin escalation.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="qc-footer-main">
                <div className="qc-footer-container qc-footer-grid">
                    <div className="qc-footer-col brand">
                        <div className="qc-footer-logo-row">
                            <span className="qc-footer-logo-badge">{currentThemeConfig.icon}</span>
                            <h3>Quick<span>Cart</span></h3>
                        </div>
                        <p className="qc-footer-brand-desc">
                         10-minute instant eCommerce destination. Delivering farm fresh vegetables, fruits, genuine fast chargers, audio and trendsetting fashion.
                        </p>
                        <div className="qc-footer-payment-tags">
                            <span>UPI</span>
                            <span>Google Pay</span>
                            <span>PhonePe</span>
                            <span>Razorpay</span>
                            <span>RuPay</span>
                            <span>Visa</span>
                            <span>COD</span>
                        </div>
                    </div>

                    <div className="qc-footer-col">
                        <h4>Shop Categories</h4>
                        <ul>
                            <li>
                                <a href="/categories?cat=Groceries" onClick={(e) => { e.preventDefault(); setSelectedCategoryName('Groceries'); setSelectedSubcategory(null); setCurrentView('categories'); }}>
                                    Farm Fresh Groceries
                                </a>
                            </li>
                            <li>
                                <a href="/categories?cat=Electronics" onClick={(e) => { e.preventDefault(); setSelectedCategoryName('Electronics'); setSelectedSubcategory(null); setCurrentView('categories'); }}>
                                    Chargers & Tech Accessories
                                </a>
                            </li>
                            <li>
                                <a href="/categories?cat=Fashion" onClick={(e) => { e.preventDefault(); setSelectedCategoryName('Fashion'); setSelectedSubcategory(null); setCurrentView('categories'); }}>
                                    Trending Fashion & Footwear
                                </a>
                            </li>
                            <li>
                                <a href="/categories?cat=Groceries&sub=Vegetables" onClick={(e) => { e.preventDefault(); setSelectedCategoryName('Groceries'); setSelectedSubcategory('Vegetables'); setCurrentView('categories'); }}>
                                    Organic Vegetables
                                </a>
                            </li>
                            <li>
                                <a href="/categories?cat=Groceries&sub=Fruits" onClick={(e) => { e.preventDefault(); setSelectedCategoryName('Groceries'); setSelectedSubcategory('Fruits'); setCurrentView('categories'); }}>
                                    Daily Fresh Fruits
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="qc-footer-col">
                        <h4>Customer Care & Services</h4>
                        <ul>
                            <li><a href="/orders" onClick={(e) => { e.preventDefault(); setCurrentView('orders'); }}>My Orders & Live Tracking</a></li>
                            <li><a href="/profile" onClick={(e) => { e.preventDefault(); setCurrentView('profile'); }}>Saved Delivery Addresses</a></li>
                            <li><a href="/profile" onClick={(e) => { e.preventDefault(); setCurrentView('profile'); }}>Free Cash Wallet & Vouchers</a></li>
                            <li><a href="/profile" onClick={(e) => { e.preventDefault(); setCurrentView('profile'); }}>24x7 AI Chatbot Support</a></li>
                            <li><a href="/profile" onClick={(e) => { e.preventDefault(); setCurrentView('profile'); }}>Privacy Center & Security</a></li>
                        </ul>
                    </div>

                    <div className="qc-footer-col">
                        <h4>Admin & Management</h4>
                        <ul>
                            <li><a href="/admin" onClick={(e) => { e.preventDefault(); setCurrentView('admin'); }}>Restricted Admin Console</a></li>
                            <li><a href="/admin" onClick={(e) => { e.preventDefault(); setCurrentView('admin'); }}>Inventory Stock Management</a></li>
                            <li><a href="/admin" onClick={(e) => { e.preventDefault(); setCurrentView('admin'); }}>Apply Festive Offer Tags</a></li>
                            <li><a href="/admin" onClick={(e) => { e.preventDefault(); setCurrentView('admin'); }}>5-Step Order Dispatch</a></li>
                            <li><a href="/admin" onClick={(e) => { e.preventDefault(); setCurrentView('admin'); }}>Support Incident Tickets</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="qc-footer-bottom">
                <div className="qc-footer-container qc-footer-bottom-flex">
                    <p>© 2026 QuickCart. All rights reserved.</p>
                    <p className="qc-footer-made-with">
                        Crafted by <a style={{ color: 'white' ,    textDecoration: 'none'}} href="https://subhasish713.netlify.app/" target="_blank" rel="noopener noreferrer">SN</a> <Heart size={14} color="#ef4444" fill="#ef4444" /> for lightning-fast Indian eCommerce.
                    </p>
                </div>
            </div>
        </footer>
    );
}
