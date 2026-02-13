'use client'
import React, { useState, useEffect, useCallback } from "react";
import { assets } from "@/assets/assets";
import OrderSummary from "@/components/OrderSummary";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useAppContext } from "@/context/AppContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import Footer from "@/components/Footer";
import SEOMetadata from "@/components/SEOMetadata";
import { toast } from "react-hot-toast";
import axios from "axios";

const Cart = () => {
  const {
    products,
    router,
    cartItems,
    addToCart,
    updateCartQuantity,
    getCartCount,
    loadingStates,
    userData,
    fetchUserData
  } = useAppContext();

  // State to store fetched design data
  const [designData, setDesignData] = React.useState({});

  // Function to fetch actual design data from database
  const fetchDesignData = useCallback(async (designId) => {
    try {
      const response = await axios.get('/api/custom-design/list');
      if (response.data.success && response.data.designRequests) {
        const design = response.data.designRequests.find(d => d._id === designId);
        if (design) {
          setDesignData(prev => ({
            ...prev,
            [designId]: design
          }));
          return design;
        }
      }
    } catch (error) {
      console.error('Error fetching design data:', error);
    }
    return null;
  }, []);

  // Effect to fetch design data for all custom designs in cart
  const fetchAllDesignData = useCallback(async () => {
    const customDesignKeys = Object.keys(cartItems).filter(key => key.startsWith('custom_'));
    for (const key of customDesignKeys) {
      const designId = key.replace('custom_', '');
      if (!designData[designId]) {
        await fetchDesignData(designId);
      }
    }
  }, [cartItems, designData, fetchDesignData]);

  useEffect(() => {
    if (Object.keys(cartItems).length > 0) {
      fetchAllDesignData();
    }
  }, [cartItems, fetchAllDesignData]);

  // Function to refresh custom design price
  const refreshDesignPrice = async (designId, itemKey) => {
    try {
      toast.loading('Refreshing price...', { id: 'refresh-price' });
      console.log('Attempting to refresh price for design:', designId);

      // First, remove the item from cart
      updateCartQuantity(itemKey, 0);

      // Try to fetch the design data first to check if it exists and has quote
      const designCheckResponse = await axios.get(`/api/custom-design/list`);
      console.log('Design list response:', designCheckResponse.data);

      let targetDesign = null;
      if (designCheckResponse.data.success && designCheckResponse.data.designRequests) {
        targetDesign = designCheckResponse.data.designRequests.find(d => d._id === designId);
        console.log('Found target design:', targetDesign);
      }

      if (!targetDesign) {
        toast.error('Design not found. It may have been deleted.', { id: 'refresh-price' });
        return;
      }

      if (!targetDesign.quote || !targetDesign.quote.amount) {
        toast.error('This design does not have a quote yet. Please wait for seller to provide pricing.', { id: 'refresh-price' });
        return;
      }

      console.log('Design has quote:', targetDesign.quote);

      // Create design object with the data we found
      const designData = {
        _id: designId,
        designName: targetDesign.designName || 'Custom Design',
        designImage: targetDesign.designImage || '',
        size: targetDesign.size || 'M',
        color: targetDesign.color || 'As specified',
        quote: targetDesign.quote,
        status: targetDesign.status
      };

      console.log('Attempting to add design to cart with data:', designData);

      // Call the add-custom-design API which will fetch the latest data
      const response = await axios.post('/api/cart/add-custom-design', {
        design: designData
      });

      console.log('Add to cart response:', response.data);

      if (response.data.success) {
        // Refresh user data to get the updated cart
        if (fetchUserData) {
          await fetchUserData();
        }
        toast.success(`Price updated to ₹${targetDesign.quote.amount}!`, { id: 'refresh-price' });
        // Force a page refresh to show the updated cart
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        const errorMsg = response.data.message || 'Failed to refresh price';
        toast.error(`API Error: ${errorMsg}`, { id: 'refresh-price' });
        console.error('API error details:', response.data);
        console.error('Full response:', response);

        // Show detailed error to user
        toast.error(`Debug: Status ${response.status}. Please check console for details.`, { duration: 8000 });

        // Re-add the item with quantity 1 if the refresh failed
        updateCartQuantity(itemKey, 1);
      }
    } catch (error) {
      console.error('Error refreshing design price:', error);
      console.error('Error response:', error.response);

      let errorMessage = 'Unknown error';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(`Failed to refresh price: ${errorMessage}`, { id: 'refresh-price', duration: 8000 });

      // Also show HTTP status if available
      if (error.response?.status) {
        toast.error(`HTTP ${error.response.status}: Check console for details`, { duration: 6000 });
      }

      // Re-add the item with quantity 1 if the refresh failed
      updateCartQuantity(itemKey, 1);
    }
  };

  return (
    <>
      <Navbar />
      <SEOMetadata
        title="Shopping Cart | Sparrow Sports"
        description="View and manage the items in your shopping cart at Sparrow Sports. Proceed to checkout, update quantities, or continue shopping."
        keywords="shopping cart, checkout, sports products, order summary"
        url="/cart"
      />
      <div className="flex flex-col lg:flex-row gap-6 md:gap-10 px-4 sm:px-6 md:px-16 lg:px-32 pt-20 md:pt-24 mb-16 md:mb-20">
        <div className="flex-1 w-full overflow-x-auto">
          <LoadingOverlay isLoading={loadingStates.cart}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 border-b border-gray-500/30 pb-4 sm:pb-6 gap-3">
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

                      // Get the custom design data - priority: fetched data > userData > localStorage > fallback
                      let customDesignData = null;
                      console.log(`Looking for custom design with ID: ${designId}`);

                      // First priority: Use freshly fetched design data
                      if (designData[designId]) {
                        console.log('Found design in fetched data:', designData[designId]);
                        customDesignData = {
                          designId: designData[designId]._id,
                          designName: designData[designId].designName || 'Custom Design',
                          designImage: designData[designId].designImage || '',
                          size: designData[designId].size || 'M',
                          color: designData[designId].color || 'As specified',
                          quote: designData[designId].quote,
                          status: designData[designId].status
                        };
                      }
                      // Second priority: userData.customDesigns
                      else if (userData && userData.customDesigns && userData.customDesigns[designId]) {
                        console.log('Found design in userData.customDesigns:', userData.customDesigns[designId]);
                        customDesignData = userData.customDesigns[designId];
                      }
                      // Third priority: localStorage fallback
                      else {
                        console.log('Design not found in fetched data or userData, checking localStorage');
                        try {
                          const storedDesign = localStorage.getItem(`design_${designId}`);
                          if (storedDesign) {
                            const localDesign = JSON.parse(storedDesign);
                            console.log('Found design in localStorage:', localDesign);
                            if (localDesign.quote && localDesign.quote.amount) {
                              customDesignData = localDesign;
                            }
                          }
                        } catch (err) {
                          console.error("Error parsing custom design data:", err);
                        }
                      }

                      // Last resort: Create minimal fallback and trigger fetch
                      if (!customDesignData) {
                        console.warn(`Custom design ${designId} not found anywhere, triggering fetch...`);
                        // Trigger fetch for this specific design
                        fetchDesignData(designId);

                        customDesignData = {
                          designId: designId,
                          designName: 'Custom Design',
                          designImage: '',
                          quote: { amount: 0 }, // Use 0 to indicate loading/unknown
                          color: 'As specified',
                          size: 'M',
                          status: 'loading'
                        };
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

                              {/* Debug button always visible for custom designs */}
                              <button
                                onClick={async () => {
                                  try {
                                    const response = await axios.get('/api/custom-design/list');
                                    const design = response.data.designRequests?.find(d => d._id === designId);
                                    console.log('Current design data:', design);
                                    if (design) {
                                      toast.success(`Found design "${design.designName || 'Unnamed'}" with status: ${design.status}. Quote: ${design.quote?.amount ? '₹' + design.quote.amount : 'No quote'}`, { duration: 5000 });
                                    } else {
                                      toast.error('Design not found in database');
                                    }
                                  } catch (error) {
                                    toast.error('Failed to check design data');
                                    console.error('Debug error:', error);
                                  }
                                }}
                                className="text-xs text-purple-600 mt-1 hover:text-purple-800 underline"
                              >
                                🔍 Check Price Data
                              </button>

                              {(customDesignData?.status === 'fallback' || customDesignData?.status === 'loading' || !customDesignData?.quote?.amount) && (
                                <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                  <p className="text-yellow-800 font-medium">⚠️ Price may be outdated</p>
                                  <p className="text-yellow-700">This item is showing default pricing. Try refreshing the price or go to My Designs to re-add with correct pricing.</p>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    <button
                                      onClick={() => refreshDesignPrice(designId, itemKey)}
                                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                    >
                                      Refresh Price
                                    </button>
                                    <button
                                      onClick={() => {
                                        updateCartQuantity(itemKey, 0);
                                        router.push('/my-designs');
                                        toast.success('Redirecting to My Designs. Please re-add your design from there.');
                                      }}
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                    >
                                      Go to My Designs
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          const response = await axios.get('/api/custom-design/list');
                                          const design = response.data.designRequests?.find(d => d._id === designId);
                                          console.log('Current design data:', design);
                                          if (design) {
                                            toast.success(`Found design "${design.designName || 'Unnamed'}" with status: ${design.status}. Quote: ${design.quote?.amount ? '₹' + design.quote.amount : 'No quote'}`, { duration: 5000 });
                                          } else {
                                            toast.error('Design not found in database');
                                          }
                                        } catch (error) {
                                          toast.error('Failed to check design data');
                                          console.error('Debug error:', error);
                                        }
                                      }}
                                      className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                                    >
                                      Debug
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          // Get the actual design data
                                          const response = await axios.get('/api/custom-design/list');
                                          const design = response.data.designRequests?.find(d => d._id === designId);

                                          if (design && design.quote && design.quote.amount) {
                                            // Manually update the userData.customDesigns with correct data
                                            if (userData && userData.customDesigns) {
                                              userData.customDesigns[designId] = {
                                                designId: design._id,
                                                designName: design.designName || 'Custom Design',
                                                designImage: design.designImage || '',
                                                size: design.size || 'M',
                                                color: design.color || 'As specified',
                                                quote: design.quote,
                                                status: design.status
                                              };
                                              toast.success(`Price manually updated to ₹${design.quote.amount}!`);
                                              window.location.reload();
                                            }
                                          } else {
                                            toast.error('Could not find design quote data');
                                          }
                                        } catch (error) {
                                          toast.error('Manual fix failed');
                                          console.error('Manual fix error:', error);
                                        }
                                      }}
                                      className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                                    >
                                      Manual Fix
                                    </button>
                                    <button
                                      onClick={() => {
                                        // Simply remove the incorrect item and provide clear instructions
                                        updateCartQuantity(itemKey, 0);
                                        toast.success('Incorrect item removed!', { duration: 3000 });

                                        // Show instructions
                                        setTimeout(() => {
                                          toast.success('Now go to My Designs → Find your approved design → Add to Cart', {
                                            duration: 8000
                                          });
                                        }, 1000);

                                        // Auto redirect after showing message
                                        setTimeout(() => {
                                          router.push('/my-designs');
                                        }, 3000);
                                      }}
                                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                    >
                                      Fix & Go to My Designs
                                    </button>
                                    <button
                                      onClick={() => {
                                        updateCartQuantity(itemKey, 0);
                                        toast.error('Item removed.');
                                      }}
                                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                    >
                                      Just Remove
                                    </button>
                                  </div>
                                </div>
                              )}
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
                            {customDesignData?.quote?.amount ? (
                              `₹${customDesignData.quote.amount.toFixed(2)}`
                            ) : customDesignData?.status === 'loading' ? (
                              <span className="text-gray-400">Loading...</span>
                            ) : (
                              <span className="text-red-500">No Quote</span>
                            )}
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
                            {customDesignData?.quote?.amount ? (
                              `₹${(customDesignData.quote.amount * cartItems[itemKey]).toFixed(2)}`
                            ) : customDesignData?.status === 'loading' ? (
                              <span className="text-gray-400">Loading...</span>
                            ) : (
                              <span className="text-red-500">No Quote</span>
                            )}
                          </td>
                        </tr>
                      );
                    } else {
                      // Regular product item
                      // Parse cart key - could be: productId, productId_color, or productId_color_size
                      const keyParts = itemKey.split('_');
                      const productId = keyParts[0];
                      const color = keyParts[1] || null;
                      const size = keyParts[2] || null;
                      const product = products.find(product => product._id === productId);
                      if (!product || cartItems[itemKey] <= 0) return null;
                      return (
                        <tr key={itemKey}>
                          <td className="flex items-center gap-4 py-4 md:px-4 px-1">
                            <div>
                              <div className="rounded-lg overflow-hidden bg-gray-500/10 p-2">
                                {product.image?.[0] ? (
                                  <Image
                                    src={product.image[0]}
                                    alt={product.name}
                                    className="w-16 h-auto object-cover mix-blend-multiply"
                                    width={1280}
                                    height={720}
                                  />
                                ) : (
                                  <div className="w-16 h-16 flex items-center justify-center text-gray-400 text-xs">
                                    No Image
                                  </div>
                                )}
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
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Color:</span>
                                  {/* Display color circle only if it looks like a hex code or common color */}
                                  {(color.startsWith('#') || ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'orange', 'brown', 'gray', 'grey'].includes(color.toLowerCase())) && (
                                    <span
                                      style={{
                                        backgroundColor: color.startsWith('#') ? color : color.toLowerCase(),
                                        border: '1px solid #ccc',
                                        display: 'inline-block',
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%'
                                      }}
                                    ></span>
                                  )}
                                  <span className="text-xs text-gray-600 ml-1">{color}</span>
                                </div>
                              )}
                              {size && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Size:</span>
                                  <span className="text-xs text-gray-600">{size}</span>
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
                              <button onClick={() => addToCart(productId, { color, size })}>
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
