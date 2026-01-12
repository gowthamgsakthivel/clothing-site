'use client'
import { assets } from '@/assets/assets'
import { useAppContext } from '@/context/AppContext'
import Image from 'next/image'
import { useEffect } from 'react'
import SEOMetadata from '@/components/SEOMetadata'

const OrderPlaced = () => {

  const { router } = useAppContext();

  useEffect(() => {
    setTimeout(() => {
      router.push('/my-orders')
    }, 5000)
  }, [])

  return (
    <div className='min-h-screen flex flex-col justify-center items-center gap-5 pt-20 md:pt-24'>
      <SEOMetadata
        title="Order Placed Successfully | Sparrow Sports"
        description="Your order has been placed successfully. Thank you for shopping with Sparrow Sports!"
        keywords="order confirmation, purchase successful, order complete, sports equipment, sparrow sports"
        url="/order-placed"
        noindex={true} // This page should not be indexed by search engines
      />
      <div className="flex justify-center items-center relative">
        <Image className="absolute p-5" src={assets.checkmark} alt='' />
        <div className="animate-spin rounded-full h-24 w-24 border-4 border-t-green-300 border-gray-200"></div>
      </div>
      <div className="text-center text-2xl font-semibold">Order Placed Successfully</div>
    </div>
  )
}

export default OrderPlaced