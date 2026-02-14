import React, { createContext, useState, useContext, useEffect } from 'react';

import { parsePrice } from '../utils/helpers';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('gelar_cart');
        if (savedCart) {
            try {
                return JSON.parse(savedCart);
            } catch (e) {
                console.error("Failed to parse cart", e);
            }
        }
        return [];
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [lastAddedTime, setLastAddedTime] = useState(0);


    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('gelar_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product, priceItem) => {
        setCart((prevCart) => {
            // Create a unique ID for the cart item (product ID + price label)
            const cartItemId = `${product.id}-${priceItem.label}`;

            const existingItem = prevCart.find(item => item.cartItemId === cartItemId);

            if (existingItem) {
                return prevCart.map(item =>
                    item.cartItemId === cartItemId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevCart, {
                    cartItemId,
                    productName: product.name,
                    productImage: product.image_url,
                    priceLabel: priceItem.label,
                    priceValue: priceItem.value,
                    quantity: 1
                }];
            }
        });

        // Removed auto-open: setIsCartOpen(true);
        setLastAddedTime(Date.now()); // Signal for animation
    };

    const removeFromCart = (cartItemId) => {
        setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(cartItemId);
            return;
        }
        setCart(prev => prev.map(item =>
            item.cartItemId === cartItemId
                ? { ...item, quantity: newQuantity }
                : item
        ));
    };

    const clearCart = () => {
        setCart([]);
    };

    const cartTotal = cart.reduce((total, item) => {
        const val = parsePrice(item.priceValue);
        return total + (val * item.quantity);
    }, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            cartTotal,
            lastAddedTime
        }}>
            {children}
        </CartContext.Provider>
    );
};
