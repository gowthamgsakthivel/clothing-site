/**
 * API Request Batching Utility
 * Groups multiple API requests into batches to reduce HTTP overhead
 */

const batchQueues = new Map();
const DEFAULT_BATCH_DELAY = 50; // ms

/**
 * Add a request to a batch queue and return a promise
 * 
 * @param {string} batchKey - Unique key for this batch type
 * @param {any} requestData - Individual request data
 * @param {function} batchProcessor - Function to process the entire batch
 * @param {number} delayMs - How long to wait before processing the batch
 * @returns {Promise<any>} - Result for this specific request
 */
export function batchRequest(batchKey, requestData, batchProcessor, delayMs = DEFAULT_BATCH_DELAY) {
  // Create a new promise for this individual request
  return new Promise((resolve, reject) => {
    // Get or create the batch for this key
    if (!batchQueues.has(batchKey)) {
      batchQueues.set(batchKey, {
        items: [],
        promises: [],
        timer: null
      });
      
      // Set timer to process this batch
      const timer = setTimeout(async () => {
        const batch = batchQueues.get(batchKey);
        batchQueues.delete(batchKey);
        
        try {
          // Process the entire batch at once
          const batchResults = await batchProcessor(batch.items);
          
          // Resolve each individual promise with its result
          batch.promises.forEach((promisePair, index) => {
            promisePair.resolve(batchResults[index]);
          });
        } catch (error) {
          // Reject all promises on batch failure
          batch.promises.forEach(promisePair => {
            promisePair.reject(error);
          });
        }
      }, delayMs);
      
      // Store the timer in the batch
      batchQueues.get(batchKey).timer = timer;
    }
    
    // Get the batch and add this request
    const batch = batchQueues.get(batchKey);
    batch.items.push(requestData);
    batch.promises.push({ resolve, reject });
  });
}
