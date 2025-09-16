'use client'
import { productsDummyData, userDummyData } from "@/assets/assets";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

export const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext)
}

export const AppContextProvider = (props) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY
    const router = useRouter()

    const { user } = useUser();
    const { getToken } = useAuth();

    const [products, setProducts] = useState([])
    const [userData, setUserData] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const [cartItems, setCartItems] = useState({})
    const [favorites, setFavorites] = useState([])

    const fetchProductData = async () => {
        try {
            const { data } = await axios.get('/api/product/list');
            if (data.success) {
                setProducts(data.products)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message);
        }
    }

    const fetchUserData = async () => {
        try {
            if (user.publicMetadata.role === "seller") {
                setIsSeller(true);
            }
            const token = await getToken();
            const { data } = await axios.get('/api/user/data', { headers: { Authorization: `Bearer ${token}` } });

            if (data.success) {
                setUserData(data.user);
                setCartItems(data.user.cartItems);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // Favorite management
    const fetchFavorites = async () => {
        if (!user) return;
        try {
            const token = await getToken();
            const { data } = await axios.get('/api/user/favorite', { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) {
                setFavorites(data.favorites);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const addFavorite = async (productId) => {
        if (!user) return;
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/user/favorite', { productId, action: 'add' }, { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) {
                setFavorites(data.favorites);
                toast.success('Added to favorites');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    const removeFavorite = async (productId) => {
        if (!user) return;
        try {
            const token = await getToken();
            const { data } = await axios.post('/api/user/favorite', { productId, action: 'remove' }, { headers: { Authorization: `Bearer ${token}` } });
            if (data.success) {
                setFavorites(data.favorites);
                toast.success('Removed from favorites');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    }

    // Add to cart with color and size support
    const addToCart = async (itemId, options = {}) => {
        // options: { color, size }
        let cartData = structuredClone(cartItems);
        let key = itemId;
        if (options.color && options.size) {
            key = `${itemId}_${options.color}_${options.size}`;
        } else if (options.color) {
            key = `${itemId}_${options.color}`;
        } else if (options.size) {
            key = `${itemId}_${options.size}`;
        }
        if (cartData[key]) {
            cartData[key] += 1;
        } else {
            cartData[key] = 1;
        }
        setCartItems(cartData);

        if (user) {
            try {
                const token = await getToken();
                await axios.post('/api/cart/update', { cartData }, { headers: { Authorization: `Bearer ${token}` } })
                toast.success('Item added to cart')
            } catch (error) {
                toast.error(error.message);
            }
        }
    }

    // Update cart quantity with color support
    const updateCartQuantity = async (itemKey, quantity) => {
        let cartData = structuredClone(cartItems);
        if (quantity === 0) {
            delete cartData[itemKey];
        } else {
            cartData[itemKey] = quantity;
        }
        setCartItems(cartData)
        if (user) {
            try {
                const token = await getToken();
                await axios.post('/api/cart/update', { cartData }, { headers: { Authorization: `Bearer ${token}` } })
                toast.success('Cart Updated');
            } catch (error) {
                toast.error(error.message);
            }
        }
    }

    const getCartCount = () => {
        let totalCount = 0;
        for (const key in cartItems) {
            if (cartItems[key] > 0) {
                totalCount += cartItems[key];
            }
        }
        return totalCount;
    }

    const getCartAmount = () => {
        let totalAmount = 0;
        for (const key in cartItems) {
            // key: productId or productId_color
            const [productId] = key.split('_');
            let itemInfo = products.find((product) => product._id === productId);
            if (cartItems[key] > 0 && itemInfo) {
                totalAmount += itemInfo.offerPrice * cartItems[key];
            }
        }
        return Math.floor(totalAmount * 100) / 100;
    }

    useEffect(() => {
        fetchProductData()
    }, [])

    useEffect(() => {
        if (user) {
            fetchUserData()
            fetchFavorites()
        }
    }, [user])

    const value = {
        user, getToken,
        currency, router,
        isSeller, setIsSeller,
        userData, fetchUserData,
        products, fetchProductData,
        cartItems, setCartItems,
        addToCart, updateCartQuantity,
        getCartCount, getCartAmount,
        favorites, fetchFavorites, addFavorite, removeFavorite
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}