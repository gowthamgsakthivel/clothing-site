/**
 * AddressSelection Component
 * 
 * This component allows users to select a shipping address from their saved addresses
 * or add a new one during the checkout process.
 */

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

const AddressSelection = ({ onAddressSelect, selectedAddress }) => {
    const { userData } = useAppContext();
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(
        selectedAddress ? selectedAddress._id : ''
    );

    useEffect(() => {
        if (userData && userData.addresses) {
            setAddresses(userData.addresses);

            // Set default address if available and no address is selected
            if (!selectedAddressId && userData.addresses.length > 0) {
                const defaultAddress = userData.addresses.find(addr => addr.isDefault);
                if (defaultAddress) {
                    setSelectedAddressId(defaultAddress._id);
                    onAddressSelect(defaultAddress);
                } else {
                    setSelectedAddressId(userData.addresses[0]._id);
                    onAddressSelect(userData.addresses[0]);
                }
            }
        }
    }, [userData, selectedAddressId, onAddressSelect]);

    const handleAddressChange = (event) => {
        const addressId = event.target.value;
        setSelectedAddressId(addressId);

        const selectedAddr = addresses.find(addr => addr._id === addressId);
        if (selectedAddr) {
            onAddressSelect(selectedAddr);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Select Delivery Address</h2>

            {addresses.length > 0 ? (
                <div className="space-y-3">
                    {addresses.map(address => (
                        <div key={address._id} className="border rounded p-3">
                            <label className="flex items-start cursor-pointer">
                                <input
                                    type="radio"
                                    name="address"
                                    value={address._id}
                                    checked={selectedAddressId === address._id}
                                    onChange={handleAddressChange}
                                    className="mt-1 mr-2"
                                />
                                <div>
                                    <p className="font-medium">{address.name}</p>
                                    <p className="text-sm text-gray-600">{address.street}</p>
                                    <p className="text-sm text-gray-600">
                                        {address.city}, {address.state} {address.pincode}
                                    </p>
                                    {address.isDefault && (
                                        <span className="text-xs bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                                            Default
                                        </span>
                                    )}
                                </div>
                            </label>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-500">No addresses found. Please add a new address.</p>
            )}

            <button
                className="mt-4 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
                onClick={() => {/* Add new address logic */ }}
            >
                + Add New Address
            </button>
        </div>
    );
};

export default AddressSelection;