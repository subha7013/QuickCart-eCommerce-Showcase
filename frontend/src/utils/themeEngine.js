/**
 * QuickCart Festival Theme Engine
 * Inspired by Flipkart & Swiggy festival campaigns (Diwali, Big Billion Days, Holi, New Year)
 */

export const FESTIVAL_THEMES = {
    default: {
        id: 'default',
        name: 'QuickCart Pro',
        tagline: '⚡ 10-Minute Lightning Superstore',
        announcement: '⚡ Instamart 10-Minute Delivery | 🇮🇳 Flipkart Mega Savings | Free Shipping > ₹199 | Use Code FIRST50',
        heroHeadline: 'India\'s Favorite 10-Min Superstore',
        heroSub: 'Fresh farm vegetables, tech gadgets & fashion essentials delivered in 10 minutes with assured quality.',
        badge: '⚡ Instamart Express',
        primaryColor: '#2874f0', // Flipkart Blue
        secondaryColor: '#ff9f00', // Flipkart Yellow
        accentColor: '#0c831f', // Instamart Green
        navBg: '#2874f0',
        announcementBg: '#1e3a8a',
        bgPage: '#f1f3f6',
        gradientHero: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0284c7 100%)',
        bannerImg: '/bannerquickcart.png',
        icon: '🛒',
        festiveTag: 'Flipkart Assured'
    },
    diwali: {
        id: 'diwali',
        name: 'Diwali Mega Dhamaka',
        tagline: '🪔 Shubh Deepavali Grand Savings',
        announcement: '🪔 The Grand Diwali Sale Is Live! Extra 10% Instant Discount + ₹150 Free Cash on all orders!',
        heroHeadline: 'Diwali Mega Dhamaka | Up To 80% OFF',
        heroSub: 'Celebrate the Festival of Lights with unmissable deals on gadgets, festive fashion & fresh sweets!',
        badge: '🪔 Diwali Special',
        primaryColor: '#991b1b', // Festive Deep Maroon
        secondaryColor: '#f59e0b', // Radiant Gold
        accentColor: '#d97706', // Warm Amber
        navBg: '#991b1b',
        announcementBg: '#7f1d1d',
        bgPage: '#fffbeb',
        gradientHero: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 45%, #b45309 100%)',
        bannerImg: '/bannerdiwali.png',
        icon: '🪔',
        festiveTag: 'Diwali Dhamaka Offer'
    },
    bbd: {
        id: 'bsd',
        name: 'The Big Saving Days',
        tagline: '🔥 India\'s Biggest Festival Sale',
        announcement: '🔥 THE BIG Saving DAYS ARE LIVE! Lowest Prices of the Year + Instant UPI Cashback!',
        heroHeadline: 'The Big Saving Days | Mega Price Crash',
        heroSub: 'Massive festive discounts across Smartphones, Earbuds, Grocery Bundles & Top Brand Fashion.',
        badge: '🔥 BSD Mega Deal',
        primaryColor: '#1d4ed8', // Electric Cobalt Blue
        secondaryColor: '#eab308', // Brilliant Gold
        accentColor: '#ef4444', // Hot Deal Red
        gradientHero: 'linear-gradient(135deg, #172554 0%, #1e40af 50%, #eab308 100%)',
        bannerImg: null,
        icon: '🔥',
        festiveTag: 'BSD Exclusive'
    },
    holi: {
        id: 'holi',
        name: 'Colors Carnival',
        tagline: '🎨 Rang Barse Grand Bonanza',
        announcement: '🎨 Rang Barse Festive Celebration! Colorful Discounts & Instant Free Cash on Every Order!',
        heroHeadline: 'Colors Carnival Sale',
        heroSub: 'Splash in festival savings! Fresh dry fruits, organic sweets, tech gear & festive outfits.',
        badge: '🎨 Colors Splash',
        primaryColor: '#be185d', // Gulal Pink
        secondaryColor: '#f59e0b', // Kesari Yellow
        accentColor: '#059669', // Mint Green
        gradientHero: 'linear-gradient(135deg, #831843 0%, #be185d 50%, #f59e0b 100%)',
        bannerImg: null,
        icon: '🎨',
        festiveTag: 'Holi Special Pick'
    },
    newyear: {
        id: 'newyear',
        name: 'New Year Mega Bonanza',
        tagline: '🎉 Happy New Year Grand Sale',
        announcement: '🎉 Ring in the New Year with Super Savings! Up to 75% OFF + Double Free Cash Wallet Credits!',
        heroHeadline: 'Grand New Year Mega Bonanza',
        heroSub: 'Upgrade your tech & restock your pantry with guaranteed 10-minute doorstep delivery.',
        badge: '🎉 New Year Bonanza',
        primaryColor: '#581c87', // Midnight Purple
        secondaryColor: '#38bdf8', // Neon Cyan
        accentColor: '#fbbf24', // Champagne Gold
        gradientHero: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #0369a1 100%)',
        bannerImg: null,
        icon: '🎉',
        festiveTag: 'New Year Special'
    }
};

export function getActiveTheme(themeId = 'default', customThemes = []) {
    if (customThemes && Array.isArray(customThemes)) {
        const custom = customThemes.find(t => t.id === themeId);
        if (custom) return custom;
    }
    return FESTIVAL_THEMES[themeId] || FESTIVAL_THEMES.default;
}
