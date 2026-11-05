export const categoryMap = {
    'Electronics': ['Mobile', 'Headset', 'Accessories', 'Speakers'],
    'Fashion': ['Tshirts', 'Jeans', 'Shoes'],
    'Groceries': ['Vegetables', 'Fruits', 'Chocolates', 'Non Veg', 'Dairy', 'Ready to eat', 'Oil & Ghee', 'Snacks', 'Biscuits'],
};

export const categories = [
    {
        name: 'Electronics',
        icon: '📱',
        description: 'Chargers, earbuds, headsets and smart accessories.',
        subcategories: ['Mobile', 'Headset', 'Accessories', 'Speakers'],
        products: [
            { id: 'c1', name: 'Dual Port Adapter', price: 199, image: '/assets/charger1.jpg', subcategory: 'Accessories', stock: 10 },
            { id: 'c2', name: 'Samsung Adapter', price: 249, image: '/assets/charger2.jpg', subcategory: 'Accessories', stock: 5 },
            { id: 'c3', name: 'Apple Adapter', price: 1499, image: '/assets/charger3.jpg', subcategory: 'Accessories', stock: 3 },
        ],
    },
    {
        name: 'Fashion',
        icon: '👕',
        description: 'T-shirts, shoes and everyday style essentials.',
        subcategories: ['Tshirts', 'Jeans', 'Shoes'],
        products: [
            { id: 'f1', name: 'Classic Black Tee', price: 399, image: '/assets/blacktee.jpg', subcategory: 'Tshirts', stock: 15 },
        ],
    },
    {
        name: 'Groceries',
        icon: '🛒',
        description: 'Fresh picks and daily household staples.',
        subcategories: ['Vegetables', 'Fruits', 'Chocolates', 'Non Veg', 'Dairy', 'Ready to eat', 'Oil & Ghee', 'Snacks', 'Biscuits'],
        products: [
            { id: 'grocery1', name: 'Organic Potato (1000 g.)', price: 30, image: '/assets/potatoes.jpg', subcategory: 'Vegetables', stock: 50 },
            { id: 'grocery2', name: 'Organic Tomato (500 g.)', price: 30, image: '/assets/tomato.jpg', subcategory: 'Vegetables', stock: 30 },
            { id: 'grocery3', name: 'Organic Tomato (1000 g.)', price: 50, image: '/assets/tomato.jpg', subcategory: 'Vegetables', stock: 20 },
            { id: 'grocery4', name: 'Organic Parwal (500 g.)', price: 30, image: '/assets/parwal.jpg', subcategory: 'Vegetables', stock: 25 },
            { id: 'grocery5', name: 'Pumpkin (500 g.)', price: 30, image: '/assets/pumpkin.jpg', subcategory: 'Vegetables', stock: 20 },
            { id: 'grocery6', name: 'Organic Green Chilli (100 g.)', price: 10, image: '/assets/chilli1.jpg', subcategory: 'Vegetables', stock: 30 },
            { id: 'grocery7', name: 'Bullet Chilli (100 g.)', price: 15, image: '/assets/chilli2.jpg', subcategory: 'Vegetables', stock: 25 },
            { id: 'grocery8', name: 'Ginger (200 g.)', price: 40, image: '/assets/ginger.jpg', subcategory: 'Vegetables', stock: 20 },
            { id: 'grocery9', name: 'Garlic (100 g.)', price: 20, image: '/assets/garlic.jpg', subcategory: 'Vegetables', stock: 10 },
            { id: 'grocery10', name: 'Brinjal (500 g.)', price: 30, image: '/assets/brinjal.jpg', subcategory: 'Vegetables', stock: 25 },
            { id: 'fruits1', name: 'Daily Fresh Banana (500 g.)', price: 30, image: '/assets/banana.jpg', subcategory: 'Fruits', stock: 30 },
            { id: 'fruits2', name: 'Apple (250 g.)', price: 40, image: '/assets/apple.jpg', subcategory: 'Fruits', stock: 20 },
            { id: 'fruits3', name: 'Mango (500 g.)', price: 50, image: '/assets/mango.jpg', subcategory: 'Fruits', stock: 25 },
        ],
    },
];
