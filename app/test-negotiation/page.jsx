'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAppContext } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOMetadata from '@/components/SEOMetadata';
import NegotiationHistory from '@/components/NegotiationHistory';

const TestNegotiation = () => {
    const { user, getToken } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [formData, setFormData] = useState({
        designId: '',
        response: 'negotiate',
        counterOffer: 500,
        message: 'This is a test counter-offer.'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await getToken();

            const { data } = await axios.post(
                '/api/custom-design/respond-to-quote',
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setTestResult(data);
            toast.success('Test completed');
        } catch (error) {
            console.error('Error testing API:', error);
            setTestResult({
                success: false,
                error: error.response?.data || error.message || 'Unknown error'
            });
            toast.error('Test failed');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'counterOffer' ? parseFloat(value) : value
        }));
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please log in to use this test page.</p>
            </div>
        );
    }

    return (
        <>
            <SEOMetadata
                title="Test Negotiation API | Sparrow Sports (DEV ONLY)"
                description="Test page for the negotiation API"
                keywords="test, api, negotiation"
                url="/test-negotiation"
            />
            <Navbar />

            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h1 className="text-2xl font-bold mb-6">Test Negotiation API</h1>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="designId" className="block text-sm font-medium text-gray-700 mb-1">
                                    Design ID (must be a valid design ID in quoted status)
                                </label>
                                <input
                                    type="text"
                                    id="designId"
                                    name="designId"
                                    value={formData.designId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            <div>
                                <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-1">
                                    Response Type
                                </label>
                                <select
                                    id="response"
                                    name="response"
                                    value={formData.response}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="negotiate">Negotiate</option>
                                    <option value="accepted">Accept</option>
                                    <option value="rejected">Reject</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="counterOffer" className="block text-sm font-medium text-gray-700 mb-1">
                                    Counter Offer Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    id="counterOffer"
                                    name="counterOffer"
                                    value={formData.counterOffer}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Only required for negotiate response
                                </p>
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2 px-4 rounded-md text-white font-medium ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {loading ? 'Testing...' : 'Run Test'}
                            </button>
                        </form>

                        {testResult && (
                            <div className="mt-8">
                                <h2 className="text-lg font-medium mb-2">Test Results</h2>
                                <div className={`p-4 rounded-md ${testResult.success
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-red-50 border border-red-200'
                                    }`}>
                                    <pre className="whitespace-pre-wrap text-sm">
                                        {JSON.stringify(testResult, null, 2)}
                                    </pre>
                                </div>

                                {testResult.success && testResult.designRequest && testResult.designRequest.negotiationHistory && (
                                    <div className="mt-4">
                                        <h3 className="text-md font-medium mb-2">Negotiation History</h3>
                                        <NegotiationHistory
                                            negotiationHistory={testResult.designRequest.negotiationHistory}
                                            initialQuote={{
                                                amount: testResult.designRequest.quote?.amount || 0,
                                                message: testResult.designRequest.quote?.message || '',
                                                timestamp: testResult.designRequest.quote?.timestamp || new Date()
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default TestNegotiation;