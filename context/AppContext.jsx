'use client'
import { productsDummyData, userDummyData } from "@/assets/assets";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
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
    const [isAdmin, setIsAdmin] = useState(false)
    const [cartItems, setCartItems] = useState({})
    const [favorites, setFavorites] = useState([])

    // Loading states for different operations
    const [loadingStates, setLoadingStates] = useState({
        products: false,
        userData: false,
        cart: false,
        favorites: false,
        order: false,
        productDetails: false,
        checkout: false,
        orderPlacement: false,
        payment: false,
        addressFetching: false,
        search: false
    })

    // Use useCallback to memoize the fetchProductData function
    const fetchProductData = useCallback(async (page = 1, limit = 10) => {
        try {
            // Set loading state
            setLoadingStates(prev => ({ ...prev, products: true }));

            const { data } = await axios.get(`/api/product/list?page=${page}&limit=${limit}`);

            if (data.success) {
                setProducts(data.products);
                return {
                    products: data.products,
                    pagination: data.pagination
                };
            } else {
                toast.error(data.message || "Failed to fetch products");
                return null;
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            toast.error(error.message || "An error occurred while fetching products");
            return null;
        } finally {
            // Clear loading state when done
            setLoadingStates(prev => ({ ...prev, products: false }));
        }
    }, []); // Empty dependency array since this function shouldn't depend on any props/state

    const fetchUserData = async () => {
        try {
            setLoadingStates(prev => ({ ...prev, userData: true }));

            // Check role and set flags accordingly (reset to false if not matching)
            const userRole = user?.publicMetadata?.role;
            setIsSeller(userRole === "seller");
            setIsAdmin(userRole === "admin");

            const token = await getToken();
            const { data } = await axios.get('/api/user/data', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setUserData(data.user);
                setCartItems(data.user.cartItems);
            } else {
                toast.error(data.message || "Failed to load user data");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            toast.error(error.message || "An error occurred while loading user data");
        } finally {
            setLoadingStates(prev => ({ ...prev, userData: false }));
        }
    }

    // Favorite management
    const fetchFavorites = async () => {
        if (!user) return;
        try {
            setLoadingStates(prev => ({ ...prev, favorites: true }));

            const token = await getToken();
            const { data } = await axios.get('/api/user/favorite', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (data.success) {
                setFavorites(data.favorites);
            } else {
                toast.error(data.message || "Failed to fetch favorites");
            }
        } catch (error) {
            console.error("Error fetching favorites:", error);
            toast.error(error.message || "An error occurred while loading favorites");
        } finally {
            setLoadingStates(prev => ({ ...prev, favorites: false }));
        }
    }

    const addFavorite = async (productId) => {
        if (!user) {
            toast.error("Please sign in to add favorites");
            return;
        }

        try {
            // Update UI immediately for better experience
            setFavorites(prev => [...prev, productId]);

            const token = await getToken();
            const { data } = await axios.post('/api/user/favorite',
                { productId, action: 'add' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setFavorites(data.favorites);
                toast.success('Added to favorites');
            } else {
                // Restore previous state if there's an error
                fetchFavorites();
                toast.error(data.message || "Failed to add to favorites");
            }
        } catch (error) {
            // Restore previous state if there's an error
            fetchFavorites();
            console.error("Error adding favorite:", error);
            toast.error(error.message || "An error occurred while adding favorite");
        }
    }

    const removeFavorite = async (productId) => {
        if (!user) return;

        try {
            // Update UI immediately for better experience
            setFavorites(prev => prev.filter(id => id !== productId));

            const token = await getToken();
            const { data } = await axios.post('/api/user/favorite',
                { productId, action: 'remove' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                setFavorites(data.favorites);
                toast.success('Removed from favorites');
            } else {
                // Restore previous state if there's an error
                fetchFavorites();
                toast.error(data.message || "Failed to remove from favorites");
            }
        } catch (error) {
            // Restore previous state if there's an error
            fetchFavorites();
            console.error("Error removing favorite:", error);
            toast.error(error.message || "An error occurred while removing favorite");
        }
    }

    // Add to cart with color and size support
    const addToCart = async (itemId, options = {}) => {
        try {
            if (!user) {
                toast.error('Please sign in to add items to cart');
                router.push('/sign-in');
                return;
            }

            setLoadingStates(prev => ({ ...prev, cart: true }));

            // options: { color, size, quantity }
            const quantity = options.quantity || 1;
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
                cartData[key] += quantity;
            } else {
                cartData[key] = quantity;
            }

            // Update local state immediately for responsive UI
            setCartItems(cartData);

            const token = await getToken();
            const response = await axios.post('/api/cart/update',
                { cartData },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success(quantity > 1 ? `${quantity} items added to cart` : 'Item added to cart');
            } else {
                toast.error(response.data.message || 'Failed to update cart');
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            toast.error(error.message || 'An error occurred while adding to cart');
        } finally {
            setLoadingStates(prev => ({ ...prev, cart: false }));
        }
    }

    // Update cart quantity with color support
    const updateCartQuantity = async (itemKey, quantity) => {
        try {
            if (!user) {
                toast.error('Please sign in to update your cart');
                router.push('/sign-in');
                return;
            }

            setLoadingStates(prev => ({ ...prev, cart: true }));

            let cartData = structuredClone(cartItems);
            if (quantity === 0) {
                delete cartData[itemKey];
            } else {
                cartData[itemKey] = quantity;
            }

            // Update local state immediately for responsive UI
            setCartItems(cartData);

            const token = await getToken();
            const response = await axios.post('/api/cart/update',
                { cartData },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                toast.success('Cart updated');
            } else {
                toast.error(response.data.message || 'Failed to update cart');
            }
        } catch (error) {
            console.error("Error updating cart:", error);
            toast.error(error.message || 'An error occurred while updating cart');
        } finally {
            setLoadingStates(prev => ({ ...prev, cart: false }));
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
            // Check if it's a custom design
            if (key.startsWith('custom_')) {
                // Get the design ID from the cart key
                const designId = key.replace('custom_', '');

                // First check if we have the design in userData.customDesigns (from database)
                if (userData && userData.customDesigns && userData.customDesigns[designId]) {
                    const designData = userData.customDesigns[designId];
                    // Price is stored in amount field as cents/paisa
                    if (designData.quote && designData.quote.amount) {
                        totalAmount += designData.quote.amount * cartItems[key];
                    } else {
                        // Skip items without quotes - don't add anything to total
                        console.warn(`Custom design ${key} has no quote, skipping from total calculation`);
                        // Don't add anything - let the item exist in cart but don't count toward total
                    }
                } else {
                    // Fallback to localStorage for backward compatibility
                    try {
                        const storedDesign = localStorage.getItem(`design_${designId}`);
                        if (storedDesign) {
                            const designData = JSON.parse(storedDesign);
                            // Price is stored in amount field as cents/paisa
                            if (designData.quote && designData.quote.amount) {
                                totalAmount += designData.quote.amount * cartItems[key];
                            } else {
                                // Skip items without quotes - don't add anything to total
                                console.warn(`Custom design ${key} localStorage data has no quote, skipping from total calculation`);
                                // Don't add anything - let the item exist in cart but don't count toward total
                            }
                        } else {
                            // Skip items without design data - don't add anything to total
                            console.warn(`Custom design ${key} not found, skipping from total calculation`);
                            // Don't add anything - let the item exist in cart but don't count toward total
                        }
                    } catch (err) {
                        console.error("Error calculating custom design price:", err);
                        // Skip items with errors - don't add anything to total
                        // Don't add anything - let the item exist in cart but don't count toward total
                    }
                }
            } else {
                // Regular product
                const [productId] = key.split('_');
                let itemInfo = products.find((product) => product._id === productId);
                if (cartItems[key] > 0 && itemInfo) {
                    totalAmount += itemInfo.offerPrice * cartItems[key];
                }
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

    // Add search function using the new API endpoint
    const searchProducts = useCallback(async (searchQuery, options = {}) => {
        try {
            setLoadingStates(prev => ({ ...prev, search: true }));

            // Build query parameters
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);
            if (options.category) params.append('category', options.category);
            if (options.gender) params.append('gender', options.gender);
            if (options.minPrice) params.append('minPrice', options.minPrice);
            if (options.maxPrice) params.append('maxPrice', options.maxPrice);
            if (options.sortBy) params.append('sortBy', options.sortBy);
            if (options.sortOrder) params.append('sortOrder', options.sortOrder);

            const { data } = await axios.get(`/api/product/search?${params.toString()}`);

            if (data.success) {
                return {
                    products: data.products,
                    pagination: data.pagination
                };
            } else {
                toast.error(data.message || "Search failed");
                return null;
            }
        } catch (error) {
            console.error("Error searching products:", error);
            toast.error(error.message || "An error occurred while searching");
            return null;
        } finally {
            setLoadingStates(prev => ({ ...prev, search: false }));
        }
    }, []);

    const value = {
        user, getToken,
        currency, router,
        isSeller, setIsSeller,
        isAdmin, setIsAdmin,
        userData, fetchUserData,
        products, fetchProductData,
        searchProducts, // Add the search function
        cartItems, setCartItems,
        addToCart, updateCartQuantity,
        getCartCount, getCartAmount,
        favorites, fetchFavorites, addFavorite, removeFavorite,
        loadingStates, setLoadingStates
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}