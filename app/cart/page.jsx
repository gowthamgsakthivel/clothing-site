'use client'
import React from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useAppContext } from "@/context/AppContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import Footer from "@/components/Footer";
import SEOMetadata from "@/components/SEOMetadata";

const Cart = () => {
  const {
    products,
    router,
    cartItems,
    addToCart,
    updateCartQuantity,
    getCartCount,
    loadingStates,
    userData
  } = useAppContext();

  return (
    <>
      <Navbar />
      <SEOMetadata
        title="Shopping Cart | Sparrow Sports"
        description="View and manage the items in your shopping cart at Sparrow Sports. Proceed to checkout, update quantities, or continue shopping."
        keywords="shopping cart, checkout, sports products, order summary"
        url="/cart"
      />
      <div className="flex flex-col md:flex-row gap-10 px-6 md:px-16 lg:px-32 pt-14 mb-20">
        <div className="flex-1">
          <LoadingOverlay isLoading={loadingStates.cart}>
            <div className="flex items-center justify-between mb-8 border-b border-gray-500/30 pb-6">
              <p className="text-2xl md:text-3xl text-gray-500">
                Your <span className="font-medium text-orange-600">Cart</span>
              </p>
              <p className="text-lg md:text-xl text-gray-500/80">{getCartCount()} Items</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="text-left">
                  <tr>
                    <th className="text-nowrap pb-6 md:px-4 px-1 text-gray-600 font-medium">
                      Product Details
                    </th>
                    <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                      Price
                    </th>
                    <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                      Quantity
                    </th>
                    <th className="pb-6 md:px-4 px-1 text-gray-600 font-medium">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(cartItems).map((itemKey) => {
                    // Check if it's a custom design item
                    if (itemKey.startsWith('custom_')) {
                      // Extract designId from the key
                      const designId = itemKey.replace('custom_', '');

                      // Get the custom design from userData.customDesigns (from database)
                      let customDesignData = null;
                      console.log(`Looking for custom design with ID: ${designId}`);
                      console.log('userData:', userData);
                      if (userData && userData.customDesigns && userData.customDesigns[designId]) {
                        console.log('Found design in userData.customDesigns:', userData.customDesigns[designId]);
                        customDesignData = userData.customDesigns[designId];
                      } else {
                        console.log('Design not found in userData.customDesigns, checking localStorage');
                        // Fallback to localStorage for backward compatibility
                        try {
                          const storedDesign = localStorage.getItem(`design_${designId}`);
                          if (storedDesign) {
                            customDesignData = JSON.parse(storedDesign);
                            console.log('Found design in localStorage:', customDesignData);
                          } else {
                            console.log('Design not found in localStorage either');
                          }
                        } catch (err) {
                          console.error("Error parsing custom design data:", err);
                        }
                      }

                      // Render custom design cart item
                      return (
                        <tr key={itemKey}>
                          <td className="flex items-center gap-4 py-4 md:px-4 px-1">
                            <div>
                              <div className="rounded-lg overflow-hidden bg-gray-500/10 p-2">
                                {customDesignData?.designImage ? (
                                  <Image
                                    src={customDesignData.designImage}
                                    alt="Custom Design"
                                    className="w-16 h-auto object-cover"
                                    width={1280}
                                    height={720}
                                  />
                                ) : (
                                  <div className="w-16 h-16 bg-orange-100 flex items-center justify-center">
                                    <span className="text-orange-600 text-xs">Custom</span>
                                  </div>
                                )}
                                <button
                                  className="md:hidden text-xs text-orange-600 mt-1"
                                  onClick={() => updateCartQuantity(itemKey, 0)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <div className="text-sm hidden md:block">
                              <p className="text-gray-800">Custom Design {customDesignData?.designName ? `- ${customDesignData.designName}` : ''}</p>
                              <p className="text-xs text-gray-500">Custom T-shirt Design</p>
                              {customDesignData?.color && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-gray-500">Color:</span>
                                  <span>{customDesignData.color}</span>
                                </div>
                              )}
                              {customDesignData?.size && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-gray-500">Size:</span>
                                  <span>{customDesignData.size}</span>
                                </div>
                              )}
                              <button
                                className="text-xs text-orange-600 mt-1"
                                onClick={() => updateCartQuantity(itemKey, 0)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                          <td className="py-4 md:px-4 px-1 text-gray-600">
                            ₹{customDesignData?.quote?.amount
                              ? (customDesignData.quote.amount / 100).toFixed(2)
                              : '11000.00'}
                          </td>
                          <td className="py-4 md:px-4 px-1">
                            <div className="flex items-center md:gap-2 gap-1">
                              <button onClick={() => updateCartQuantity(itemKey, cartItems[itemKey] - 1)}>
                                <Image
                                  src={assets.decrease_arrow}
                                  alt="decrease_arrow"
                                  className="w-4 h-4"
                                />
                              </button>
                              <input
                                onChange={e => updateCartQuantity(itemKey, Number(e.target.value))}
                                type="number"
                                value={cartItems[itemKey]}
                                className="w-8 border text-center appearance-none"
                              />
                              <button onClick={() => updateCartQuantity(itemKey, cartItems[itemKey] + 1)}>
                                <Image
                                  src={assets.increase_arrow}
                                  alt="increase_arrow"
                                  className="w-4 h-4"
                                />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 md:px-4 px-1 text-gray-600">
                            ₹{customDesignData?.quote?.amount
                              ? ((customDesignData.quote.amount / 100) * cartItems[itemKey]).toFixed(2)
                              : (11000 * cartItems[itemKey]).toFixed(2)}
                          </td>
                        </tr>
                      );
                    } else {
                      // Regular product item
                      const [productId, color] = itemKey.split('_');
                      const product = products.find(product => product._id === productId);
                      if (!product || cartItems[itemKey] <= 0) return null;
                      return (
                        <tr key={itemKey}>
                          <td className="flex items-center gap-4 py-4 md:px-4 px-1">
                            <div>
                              <div className="rounded-lg overflow-hidden bg-gray-500/10 p-2">
                                <Image
                                  src={product.image[0]}
                                  alt={product.name}
                                  className="w-16 h-auto object-cover mix-blend-multiply"
                                  width={1280}
                                  height={720}
                                />
                              </div>
                              <button
                                className="md:hidden text-xs text-orange-600 mt-1"
                                onClick={() => updateCartQuantity(itemKey, 0)}
                              >
                                Remove
                              </button>
                            </div>
                            <div className="text-sm hidden md:block">
                              <p className="text-gray-800">{product.name}</p>
                              {color && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-gray-500">Color:</span>
                                  <span style={{ backgroundColor: `#${color.replace('#', '')}`, border: '1px solid #ccc', display: 'inline-block', width: 16, height: 16, borderRadius: '50%' }}></span>
                                </div>
                              )}
                              <button
                                className="text-xs text-orange-600 mt-1"
                                onClick={() => updateCartQuantity(itemKey, 0)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                          <td className="py-4 md:px-4 px-1 text-gray-600">₹{product.offerPrice}</td>
                          <td className="py-4 md:px-4 px-1">
                            <div className="flex items-center md:gap-2 gap-1">
                              <button onClick={() => updateCartQuantity(itemKey, cartItems[itemKey] - 1)}>
                                <Image
                                  src={assets.decrease_arrow}
                                  alt="decrease_arrow"
                                  className="w-4 h-4"
                                />
                              </button>
                              <input onChange={e => updateCartQuantity(itemKey, Number(e.target.value))} type="number" value={cartItems[itemKey]} className="w-8 border text-center appearance-none"></input>
                              <button onClick={() => addToCart(productId, { color })}>
                                <Image
                                  src={assets.increase_arrow}
                                  alt="increase_arrow"
                                  className="w-4 h-4"
                                />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 md:px-4 px-1 text-gray-600">₹{(product.offerPrice * cartItems[itemKey]).toFixed(2)}</td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
            <button onClick={() => router.push('/all-products ')} className="group flex items-center mt-6 gap-2 text-orange-600">
              <Image
                className="group-hover:-translate-x-1 transition"
                src={assets.arrow_right_icon_colored}
                alt="arrow_right_icon_colored"
              />
              Continue Shopping
            </button>
          </LoadingOverlay>
        </div>
        <OrderSummary />
      </div>
      <Footer />
    </>
  );
};

export default Cart;
