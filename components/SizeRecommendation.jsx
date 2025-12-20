'use client';
import React, { useState } from 'react';

const SizeRecommendation = ({ sizeChart }) => {
  const [measurements, setMeasurements] = useState({
    chest: '',
    bust: '',
    waist: '',
    hip: '',
    inseam: '',
    footLength: '',
  });
  const [recommendedSize, setRecommendedSize] = useState(null);
  const [fitPreference, setFitPreference] = useState('regular'); // slim, regular, relaxed

  const handleInputChange = (field, value) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const calculateRecommendedSize = () => {
    if (!sizeChart) return;

    // Get relevant measurement fields based on the chart
    const relevantMeasurements = sizeChart.measurements.map(m => m.toLowerCase().replace(' ', ''));

    // Check if user has entered at least one measurement
    const hasInput = relevantMeasurements.some(field => measurements[field]);
    if (!hasInput) {
      alert('Please enter at least one measurement');
      return;
    }

    // Score each size based on how well it matches the user's measurements
    const sizeScores = sizeChart.sizes.map(size => {
      let totalScore = 0;
      let measurementCount = 0;

      relevantMeasurements.forEach(field => {
        const userValue = parseFloat(measurements[field]);
        if (!userValue || !size[field]) return;

        const sizeRange = size[field];

        // Parse range (e.g., "32-34" or "24.1")
        let min, max;
        if (sizeRange.includes('-')) {
          [min, max] = sizeRange.split('-').map(v => parseFloat(v.trim()));
        } else {
          min = max = parseFloat(sizeRange);
        }

        // Calculate score based on how close the measurement is to the range
        let score;
        if (userValue >= min && userValue <= max) {
          // Perfect fit within range
          score = 100;
        } else if (userValue < min) {
          // Below range - penalize based on distance
          const distance = min - userValue;
          score = Math.max(0, 100 - (distance * 10));
        } else {
          // Above range - penalize based on distance
          const distance = userValue - max;
          score = Math.max(0, 100 - (distance * 10));
        }

        totalScore += score;
        measurementCount++;
      });

      return {
        size: size.size,
        score: measurementCount > 0 ? totalScore / measurementCount : 0,
        us: size.us,
        uk: size.uk,
        eu: size.eu
      };
    });

    // Sort by score and get the best match
    sizeScores.sort((a, b) => b.score - a.score);
    const bestMatch = sizeScores[0];

    // Adjust recommendation based on fit preference
    let finalRecommendation = bestMatch;
    const currentIndex = sizeChart.sizes.findIndex(s => s.size === bestMatch.size);

    if (fitPreference === 'slim' && currentIndex > 0) {
      // Recommend one size smaller for slim fit
      const smallerSize = sizeChart.sizes[currentIndex - 1];
      if (bestMatch.score > 70) { // Only size down if current size is a good match
        finalRecommendation = {
          size: smallerSize.size,
          score: bestMatch.score - 10,
          us: smallerSize.us,
          uk: smallerSize.uk,
          eu: smallerSize.eu,
          note: 'Sized down for slim fit preference'
        };
      }
    } else if (fitPreference === 'relaxed' && currentIndex < sizeChart.sizes.length - 1) {
      // Recommend one size larger for relaxed fit
      const largerSize = sizeChart.sizes[currentIndex + 1];
      if (bestMatch.score > 70) {
        finalRecommendation = {
          size: largerSize.size,
          score: bestMatch.score - 10,
          us: largerSize.us,
          uk: largerSize.uk,
          eu: largerSize.eu,
          note: 'Sized up for relaxed fit preference'
        };
      }
    }

    setRecommendedSize(finalRecommendation);
  };

  const getConfidenceLevel = (score) => {
    if (score >= 90) return { text: 'Excellent Match', color: 'text-green-600', bg: 'bg-green-50' };
    if (score >= 70) return { text: 'Good Match', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 50) return { text: 'Fair Match', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { text: 'Low Confidence', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const resetForm = () => {
    setMeasurements({
      chest: '',
      bust: '',
      waist: '',
      hip: '',
      inseam: '',
      footLength: '',
    });
    setRecommendedSize(null);
    setFitPreference('regular');
  };

  if (!sizeChart) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">Size recommendation not available for this product.</p>
      </div>
    );
  }

  const relevantFields = sizeChart.measurements.map(m => ({
    key: m.toLowerCase().replace(' ', ''),
    label: m
  }));

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Your Size</h3>
        <p className="text-sm text-gray-600">
          Enter your measurements to get a personalized size recommendation
        </p>
      </div>

      {/* Fit Preference */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How do you prefer your fit?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['slim', 'regular', 'relaxed'].map(fit => (
            <button
              key={fit}
              onClick={() => setFitPreference(fit)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${fitPreference === fit
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {fit.charAt(0).toUpperCase() + fit.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Measurement Inputs */}
      <div className="space-y-4 mb-6">
        {relevantFields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label} ({sizeChart.unit})
            </label>
            <input
              type="number"
              step="0.1"
              value={measurements[field.key]}
              onChange={(e) => handleInputChange(field.key, e.target.value)}
              placeholder={`Enter your ${field.label.toLowerCase()}`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={calculateRecommendedSize}
          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition font-medium"
        >
          Get Recommendation
        </button>
        <button
          onClick={resetForm}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Reset
        </button>
      </div>

      {/* Recommendation Result */}
      {recommendedSize && (
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-lg font-semibold text-gray-900">Recommended Size</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceLevel(recommendedSize.score).bg} ${getConfidenceLevel(recommendedSize.score).color}`}>
              {getConfidenceLevel(recommendedSize.score).text}
            </span>
          </div>

          <div className="bg-white p-4 rounded-lg mb-3">
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 mb-2">
                {recommendedSize.size}
              </div>
              <div className="text-sm text-gray-600">
                US: {recommendedSize.us} | UK: {recommendedSize.uk} | EU: {recommendedSize.eu}
              </div>
            </div>
          </div>

          {recommendedSize.note && (
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Note:</span> {recommendedSize.note}
            </p>
          )}

          <div className="text-xs text-gray-600">
            <p className="mb-1">
              💡 This recommendation is based on your measurements and fit preference.
            </p>
            <p>
              If you're between sizes or unsure, we recommend trying both sizes or contacting customer service.
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <svg className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-blue-700">
            For best results, enter all available measurements. Not sure how to measure? Check the "How to Measure" tab in the size guide.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SizeRecommendation;
