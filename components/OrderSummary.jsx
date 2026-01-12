import { useAppContext } from "@/context/AppContext";
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import LoadingButton from "./LoadingButton";
import LoadingOverlay from "./LoadingOverlay";

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

  const fetchUserAddresses = async () => {
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
  };

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

      const totalAmount = getCartAmount() + Math.floor(getCartAmount() * 0.02);
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
              // Place order in DB with Razorpay payment info
              const orderPayload = {
                address: selectedAddress._id,
                items: cartItemsArray,
                paymentMethod: 'Razorpay',
                paymentStatus: 'Paid'
              };

              // Place order in DB with Razorpay payment info
              const orderRes = await axios.post('/api/order/create', orderPayload);

              if (orderRes.data.success) {
                toast.success('Payment successful! Order placed.');
                setCartItems({});
                router.push('/order-placed');
              } else {
                console.error('Order creation failed with response:', orderRes.data);

                // Create more detailed error message
                let errorMsg = `Payment succeeded but order failed: ${orderRes.data.message || 'Unknown error'}`;

                // Add details if available
                if (orderRes.data.details) {
                  console.error('Order validation details:', orderRes.data.details);
                }

                toast.error(errorMsg, { duration: 6000 });

                // Show a second toast with recovery instructions
                setTimeout(() => {
                  toast.error('Please contact support with your payment ID. Your payment was successful.',
                    { duration: 8000 });
                }, 1000);
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
  }, [user]);

  return (
    <div className="w-full md:w-96 bg-gray-500/5 p-5 relative">
      <LoadingOverlay isLoading={loadingStates.addressFetching}>
        <div>
          <h2 className="text-xl md:text-2xl font-medium text-gray-700">
            Order Summary
          </h2>
          <hr className="border-gray-500/30 my-5" />
          <div className="space-y-6">
            <div>
              <label className="text-base font-medium uppercase text-gray-600 block mb-2">
                Select Address
              </label>
              <div className="relative inline-block w-full text-sm border">
                <button
                  className="peer w-full text-left px-4 pr-2 py-2 bg-white text-gray-700 focus:outline-none"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>
                    {selectedAddress
                      ? `${selectedAddress.fullName}, ${selectedAddress.area}, ${selectedAddress.city}, ${selectedAddress.state}`
                      : "Select Address"}
                  </span>
                  <svg className={`w-5 h-5 inline float-right transition-transform duration-200 ${isDropdownOpen ? "rotate-0" : "-rotate-90"}`}
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#6B7280"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <ul className="absolute w-full bg-white border shadow-md mt-1 z-10 py-1.5">
                    {userAddresses.map((address, index) => (
                      <li
                        key={index}
                        className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer"
                        onClick={() => handleAddressSelect(address)}
                      >
                        {address.fullName}, {address.area}, {address.city}, {address.state}
                      </li>
                    ))}
                    <li
                      onClick={() => router.push("/add-address")}
                      className="px-4 py-2 hover:bg-gray-500/10 cursor-pointer text-center"
                    >
                      + Add New Address
                    </li>
                  </ul>
                )}
              </div>
            </div>

            <div>
              <label className="text-base font-medium uppercase text-gray-600 block mb-2">
                Promo Code
              </label>
              <div className="flex flex-col items-start gap-3">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  className="flex-grow w-full outline-none p-2.5 text-gray-600 border"
                />
                <button className="bg-orange-600 text-white px-9 py-2 hover:bg-orange-700">
                  Apply
                </button>
              </div>
            </div>

            <hr className="border-gray-500/30 my-5" />

            <div className="space-y-4">
              <div className="flex justify-between text-base font-medium">
                <p className="uppercase text-gray-600">Items {getCartCount()}</p>
                <p className="text-gray-800">{currency}{getCartAmount()}</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Shipping Fee</p>
                <p className="font-medium text-gray-800">Free</p>
              </div>
              <div className="flex justify-between">
                <p className="text-gray-600">Tax (2%)</p>
                <p className="font-medium text-gray-800">{currency}{Math.floor(getCartAmount() * 0.02)}</p>
              </div>
              <div className="flex justify-between text-lg md:text-xl font-medium border-t pt-3">
                <p>Total</p>
                <p>{currency}{getCartAmount() + Math.floor(getCartAmount() * 0.02)}</p>
              </div>
            </div>
          </div>

          <LoadingButton
            onClick={handleRazorpayPayment}
            isLoading={loadingStates.payment}
            className="w-full bg-orange-600 text-white py-3 mt-5 hover:bg-orange-700"
            loadingText="Preparing Payment..."
          >
            Proceed to Payment
          </LoadingButton>
        </div>
      </LoadingOverlay>
    </div>
  );
};

export default OrderSummary;
