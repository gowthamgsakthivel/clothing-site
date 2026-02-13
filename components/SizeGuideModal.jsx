'use client';
import React, { useState } from 'react';
import { measurementTips, fitGuides } from '@/lib/sizeGuideData';

const SizeGuideModal = ({ isOpen, onClose, sizeChart, productName, fitType = 'regular' }) => {
  const [activeTab, setActiveTab] = useState('chart');

  if (!isOpen) return null;

  const fitInfo = fitGuides[fitType] || fitGuides.regular;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn">
      <div className="bg-white w-full md:max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl rounded-t-2xl md:rounded-lg">
        <div className="flex justify-center md:hidden pt-3">
          <span className="h-1.5 w-12 rounded-full bg-gray-300" aria-hidden="true"></span>
        </div>
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Size Guide</h2>
            <p className="text-sm text-gray-600 mt-1">{productName || 'Find your perfect fit'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${activeTab === 'chart'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Size Chart
          </button>
          <button
            onClick={() => setActiveTab('measure')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${activeTab === 'measure'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            How to Measure
          </button>
          <button
            onClick={() => setActiveTab('fit')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition ${activeTab === 'fit'
              ? 'text-orange-600 border-b-2 border-orange-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Fit Guide
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'chart' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">{sizeChart.title}</h3>
              <p className="text-sm text-gray-600 mb-4">
                All measurements are in {sizeChart.unit === 'inches' ? 'inches' : 'centimeters'}
              </p>

              {/* Size Chart Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">Size</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">US</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">UK</th>
                      <th className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">EU</th>
                      {sizeChart.measurements.map((measurement) => (
                        <th key={measurement} className="border border-gray-300 px-4 py-3 text-left text-sm font-semibold">
                          {measurement} ({sizeChart.unit})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeChart.sizes.map((sizeData, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        <td className="border border-gray-300 px-4 py-3 text-sm font-medium">{sizeData.size}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">{sizeData.us}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">{sizeData.uk}</td>
                        <td className="border border-gray-300 px-4 py-3 text-sm">{sizeData.eu}</td>
                        {sizeChart.measurements.map((measurement) => {
                          const key = measurement.toLowerCase().replace(' ', '');
                          return (
                            <td key={key} className="border border-gray-300 px-4 py-3 text-sm">
                              {sizeData[key] || '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Sizing Tip</p>
                    <p className="text-sm text-blue-700 mt-1">
                      If you&apos;re between sizes, we recommend sizing up for a more comfortable fit.
                      Check the fit guide tab for more information about this product&apos;s fit.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'measure' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">How to Measure</h3>
              <p className="text-sm text-gray-600 mb-6">
                For the most accurate measurements, ask someone to help you measure and use a flexible measuring tape.
              </p>

              <div className="space-y-6">
                {sizeChart.measurements.map((measurement) => {
                  const key = measurement.toLowerCase().replace(' ', '');
                  const tip = measurementTips[key];

                  return tip ? (
                    <div key={measurement} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 mb-1">{measurement}</h4>
                        <p className="text-sm text-gray-600">{tip}</p>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">General Tips</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    Measure directly on your skin or over thin clothing
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    Keep the tape measure parallel to the floor
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    Don&apos;t pull the tape too tight - it should be snug but comfortable
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-600 mr-2">•</span>
                    Measure yourself regularly as body measurements can change
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'fit' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Fit Guide</h3>

              {/* Current Product Fit */}
              <div className="mb-8 p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
                <div className="flex items-center mb-3">
                  <svg className="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-lg font-semibold text-gray-900">This Product: {fitInfo.title}</h4>
                </div>
                <p className="text-gray-700 mb-3">{fitInfo.description}</p>
                <p className="text-sm text-gray-600 font-medium">{fitInfo.recommendation}</p>
              </div>

              {/* All Fit Types */}
              <h4 className="text-md font-semibold mb-4 text-gray-900">Understanding Different Fits</h4>
              <div className="space-y-4">
                {Object.entries(fitGuides).map(([key, fit]) => (
                  <div key={key} className={`p-4 rounded-lg border ${key === fitType ? 'bg-white border-orange-300' : 'bg-gray-50 border-gray-200'}`}>
                    <h5 className="text-sm font-semibold text-gray-900 mb-1">{fit.title}</h5>
                    <p className="text-sm text-gray-600">{fit.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">Still unsure?</span> Contact our customer service team for personalized sizing assistance.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
          >
            Close Size Guide
          </button>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;
