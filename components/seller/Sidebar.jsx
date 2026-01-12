import React, { useState } from 'react';
import Link from 'next/link';
import { assets } from '../../assets/assets';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const SideBar = () => {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false);

    const menuItems = [
        { name: 'Dashboard', path: '/seller/dashboard', icon: assets.redirect_icon },
        { name: 'Add Product', path: '/seller/add-product', icon: assets.add_icon },
        { name: 'Product List', path: '/seller/product-list', icon: assets.product_list_icon },
        { name: 'Manage Stock', path: '/admin/products/manage-stock', icon: assets.box_icon },
        { name: 'Orders', path: '/seller/orders', icon: assets.order_icon },
        { name: 'Custom Designs', path: '/seller/custom-designs', icon: assets.upload_area },
    ];

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-16 left-2 z-50 md:hidden bg-orange-600 text-white p-2 rounded-lg shadow-lg hover:bg-orange-700 transition-colors"
                aria-label="Toggle Menu"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            <aside className={`
            fixed md:static inset-y-0 left-0 z-40
            w-64 md:w-20 lg:w-64 xl:w-72
            flex-shrink-0 border-r min-h-screen text-base border-gray-300 py-2 flex flex-col bg-white
            transform transition-transform duration-300 ease-in-out mt-16 md:mt-0
            ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
                {menuItems.map((item) => {

                    const isActive = pathname === item.path;

                    return (
                        <Link href={item.path} key={item.name} passHref>
                            <div
                                onClick={() => setIsOpen(false)}
                                className={
                                    `flex items-center py-3 px-2 md:px-4 gap-3 transition-colors cursor-pointer ${isActive
                                        ? "border-r-4 md:border-r-[6px] bg-orange-600/10 border-orange-500/90"
                                        : "hover:bg-gray-100/90 border-white"
                                    }`
                                }
                            >
                                {item.icon ? (
                                    <Image
                                        src={item.icon}
                                        alt={`${item.name.toLowerCase()}_icon`}
                                        className="w-7 h-7 flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-7 h-7 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                                        ?
                                    </div>
                                )}
                                <p className='block lg:hidden xl:block text-sm whitespace-nowrap overflow-hidden text-ellipsis'>{item.name}</p>
                            </div>
                        </Link>
                    );
                })}
            </aside>
        </>
    );
};

export default SideBar;
