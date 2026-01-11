/**
 * utils/sanitizer.js
 * Robust PII removal using a Whitelist approach.
 */

const sanitizeForAI = (data) => {
    if (!data) return null;

    // Handle Arrays
    if (Array.isArray(data)) {
        return data.map(item => sanitizeForAI(item));
    }

    // 1. Deep Clone to prevent mutation of the original DB object
    // For Mongoose objects, use .toObject() or .toJSON() if available
    const rawData = data.toObject ? data.toObject() : JSON.parse(JSON.stringify(data));

    // 2. Whitelist Approach (Only keep what the AI needs)
    // Adjust these fields based on what your SaaS actually analyzes
    const whitelistedFields = {
        tempId: "INV_" + Math.random().toString(36).substring(2, 6).toUpperCase(),
        items: rawData.items?.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            category: item.category
        })),
        totalAmount: rawData.totalAmount,
        currency: rawData.currency,
        date: rawData.createdAt || rawData.date,
        status: rawData.status
    };

    // Remove undefined fields if they didn't exist in the original
    return Object.fromEntries(
        Object.entries(whitelistedFields).filter(([_, v]) => v !== undefined)
    );
};

module.exports = { sanitizeForAI };