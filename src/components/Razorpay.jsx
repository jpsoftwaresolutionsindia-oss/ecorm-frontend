import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/api';

const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) {
        resolve(true)
        return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
})

const Razorpay = ({ price, orderId }) => {
    const navigate = useNavigate()
    const [isLoading, setIsLoading] = useState(false)

    const startPayment = async () => {
        setIsLoading(true)
        try {
            const scriptLoaded = await loadRazorpayScript()
            if (!scriptLoaded) {
                toast.error('Could not load payment gateway, check your connection')
                setIsLoading(false)
                return
            }

            const { data } = await api.post('/order/create-payment', { price, orderId })
            const { razorpayOrder, key_id } = data

            const options = {
                key: key_id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                name: 'Order Payment',
                order_id: razorpayOrder.id,
                handler: async (response) => {
                    try {
                        await api.post('/order/verify-payment', {
                            orderId,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                        toast.success('Payment successful')
                        navigate('/dashboard/my-orders')
                    } catch (error) {
                        toast.error('Payment verification failed')
                    }
                },
                modal: {
                    ondismiss: () => setIsLoading(false)
                }
            }

            const razorpayCheckout = new window.Razorpay(options)
            razorpayCheckout.on('payment.failed', () => {
                toast.error('Payment failed, please try again')
                setIsLoading(false)
            })
            razorpayCheckout.open()

        } catch (error) {
            toast.error('Could not start payment')
            setIsLoading(false)
        }
    }

    return (
        <div className='mt-4'>
            <button disabled={isLoading} onClick={startPayment} className='px-10 py-[6px] rounded-sm hover:shadow-green-700/30 hover:shadow-lg bg-green-700 text-white disabled:opacity-60'>
                {isLoading ? 'Processing...' : 'Start Payment'}
            </button>
        </div>
    );
};

export default Razorpay;
