import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import LoadingButton from "./LoadingButton";
import LoadingOverlay from "./LoadingOverlay";
import { PAYMENT_RECOVERY_MESSAGE, recordPaymentRecoveryFallback } from "@/lib/paymentRecovery";

// Razorpay script loader
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (document.getElementById('razorpay-script')) return resolve(true);
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const OrderSummary = () => {
  const {
    currency,
    router,
    getCartCount,
    getCartAmount,
    getToken,
    user,
    cartItems,
    setCartItems,
    loadingStates,
    setLoadingStates
  } = useAppContext();

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userAddresses, setUserAddresses] = useState([]);

  const fetchUserAddresses = useCallback(async () => {
    try {
      setLoadingStates(prev => ({ ...prev, addressFetching: true }));
      const { data } = await axios.get('/api/user/get-address');

      if (data.success) {
        setUserAddresses(data.addresses);
        if (data.addresses.length > 0) {
          setSelectedAddress(data.addresses[0]);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingStates(prev => ({ ...prev, addressFetching: false }));
    }
  }, [setLoadingStates]);

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  const createOrder = async () => {
    // COD payment has been disabled - only Razorpay is accepted
    toast.error('Please use online payment (Razorpay) to complete your order');
  };

  // Razorpay payment handler
  const handleRazorpayPayment = async () => {
    if (!selectedAddress) {
      return toast.error('Please select an address');
    }
    let cartItemsArray = Object.keys(cartItems).map((key) => ({ product: key, quantity: cartItems[key] }));
    cartItemsArray = cartItemsArray.filter(item => item.quantity > 0);
    if (cartItemsArray.length === 0) {
      return toast.error('Cart is empty');
    }

    try {
      setLoadingStates(prev => ({ ...prev, payment: true }));

      const subtotal = getCartAmount();
      const taxTotal = Math.round(subtotal - (subtotal / 1.05));
      const shippingTotal = 0;
      const totalAmount = subtotal; // GST is already included in displayed product price

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load Razorpay SDK');
        return;
      }

      // Create Razorpay order on backend
      const { data } = await axios.post('/api/razorpay/order', {
        amount: totalAmount,
        currency: 'INR',
      });

      if (!data.success) {
        toast.error('Failed to create payment order');
        return;
      }

      const order = data.order;
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
        amount: order.amount,
        currency: order.currency,
        name: 'Sparrow Sports',
        description: 'Order Payment',
        order_id: order.id,
        handler: async function (response) {
          try {
            setLoadingStates(prev => ({ ...prev, orderPlacement: true }));

            // Verify payment on backend
            const verifyRes = await axios.post('/api/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              const paymentDetails = {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature
              };

              // Place order in DB with Razorpay payment info
              const orderPayload = {
                address: selectedAddress._id,
                items: cartItemsArray,
                paymentMethod: 'Razorpay',
                paymentStatus: 'Paid',
                paymentDetails
              };

              // Place order in DB with Razorpay payment info
              try {
                const orderRes = await axios.post('/api/orders/create', orderPayload);

                if (orderRes.data.success) {
                  toast.success('Payment successful! Order placed.');
                  setCartItems({});
                  if (typeof fetchUserData === 'function') {
                    await fetchUserData().catch(() => {});
                  }
                  const orderId = orderRes.data?.data?.orderId || orderRes.data?.orderId;
                  router.push(orderId ? `/order-placed?orderId=${orderId}` : '/order-placed');
                } else {
                  console.error('Order creation failed with response:', orderRes.data);

                  const errorMessage = orderRes.data.message || 'Unknown error';
                  await recordPaymentRecoveryFallback({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    amount: totalAmount,
                    userId: user?.id || user?._id || null,
                    errorMessage
                  });

                  console.error('razorpay.payment.order_creation_failed_after_verification', {
                    paymentId: response.razorpay_payment_id,
                    razorpayOrderId: response.razorpay_order_id,
                    amount: totalAmount,
                    userId: user?.id || user?._id || null,
                    errorMessage
                  });

                  toast.error(PAYMENT_RECOVERY_MESSAGE, { duration: 8000 });
                }
              } catch (orderError) {
                const errorMessage = orderError?.response?.data?.message || orderError?.message || 'Order creation failed';

                await recordPaymentRecoveryFallback({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  amount: totalAmount,
                  userId: user?.id || user?._id || null,
                  errorMessage
                });

                console.error('razorpay.payment.order_creation_failed_after_verification', {
                  paymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  amount: totalAmount,
                  userId: user?.id || user?._id || null,
                  errorMessage,
                  stack: orderError?.stack
                });

                toast.error(PAYMENT_RECOVERY_MESSAGE, { duration: 8000 });
              }
            } else {
              toast.error('Payment verification failed.');
            }
          } catch (error) {
            toast.error('Error processing payment: ' + error.message);
          } finally {
            setLoadingStates(prev => ({ ...prev, orderPlacement: false }));
          }
        },
        prefill: {
          name: user?.fullName || '',
          email: user?.email || '',
        },
        theme: {
          color: '#F97316',
        },
        modal: {
          ondismiss: function () {
            setLoadingStates(prev => ({ ...prev, payment: false }));
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error(error.message);
    } finally {
      // Payment will be handled by Razorpay modal, so we set loading to false
      // only in case of errors. Success case is handled in the handler.
      if (loadingStates.payment) {
        setLoadingStates(prev => ({ ...prev, payment: false }));
      }
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserAddresses();
    }
  }, [user, fetchUserAddresses]);

  return (
    <div className="w-full md:w-96 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl p-6 relative border border-gray-100">
      <LoadingOverlay isLoading={loadingStates.addressFetching}>
        <div>
          <h2 className="text-xl md:text-2xl font-medium text-gray-700">
            Order Summary
          </h2>
          <hr className="border-gray-500/30 my-5" />
          <div className="space-y-6">
            {/* Address Selection */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                Shipping Destination
              </label>
              <div className="relative w-full">
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-semibold focus:outline-none flex items-center justify-between transition cursor-pointer"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className="truncate pr-2">
                    {selectedAddress
                      ? `📍 ${selectedAddress.fullName}, ${selectedAddress.city} - ${selectedAddress.pincode}`
                      : "Select delivery address"}
                  </span>
                  <svg className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute w-full bg-white border border-slate-200 shadow-xl rounded-2xl mt-1.5 z-20 overflow-hidden py-1">
                    {userAddresses.map((address, index) => (
                      <div
                        key={index}
                        className="px-4 py-2.5 hover:bg-orange-50/60 cursor-pointer text-xs font-medium text-slate-700 transition"
                        onClick={() => handleAddressSelect(address)}
                      >
                        <p className="font-bold text-slate-900">{address.fullName} {address.isDefault && <span className="text-[10px] text-emerald-600 font-bold ml-1 bg-emerald-50 px-1.5 py-0.5 rounded">Default</span>}</p>
                        <p className="text-[11px] text-slate-500 truncate">{address.area}, {address.city} - {address.pincode}</p>
                      </div>
                    ))}
                    <div
                      onClick={() => router.push("/add-address")}
                      className="px-4 py-2.5 bg-slate-50 hover:bg-orange-100/60 cursor-pointer text-xs font-bold text-orange-600 text-center border-t border-slate-100"
                    >
                      + Add New Delivery Address
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Promo Code Input */}
            <div>
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                Coupon / Promo Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter discount code"
                  className="flex-1 w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-orange-600 text-white text-xs font-extrabold rounded-xl transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            <hr className="border-slate-100 my-4" />

            {/* Free Shipping Highlight */}
            <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 font-bold">
                ✓
              </div>
              <div>
                <span className="text-xs font-black text-emerald-900 block">FREE Express Delivery Applied</span>
                <span className="text-[11px] text-emerald-700 font-medium">Fast 24-48h dispatch across India</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Items Subtotal ({getCartCount()})</span>
                <span className="font-bold text-slate-900">{currency}{getCartAmount()}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>GST Tax (5% included)</span>
                <span>{currency}{Math.round(getCartAmount() - (getCartAmount() / 1.05))}</span>
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">Free</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-black text-slate-900 border-t border-slate-100 pt-3 mt-2">
                <span>Total Amount</span>
                <span>{currency}{getCartAmount()}</span>
              </div>
            </div>
          </div>

          <LoadingButton
            onClick={handleRazorpayPayment}
            isLoading={loadingStates.payment}
            className="w-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white py-4 mt-6 rounded-2xl font-black text-sm shadow-xl shadow-orange-600/30 transition-all active:scale-[0.98] cursor-pointer"
            loadingText="Securing Payment..."
          >
            🔒 Pay {currency}{getCartAmount()} Securely
          </LoadingButton>

          <p className="text-center text-[10px] text-slate-400 font-medium mt-3 flex items-center justify-center gap-1">
            <span>🛡️ 256-Bit SSL Encrypted Razorpay Checkout</span>
          </p>
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default OrderSummary;
