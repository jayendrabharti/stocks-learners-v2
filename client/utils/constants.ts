/**
 * Application Constants
 */

// UI Constants
export const LOW_SPOTS_THRESHOLD = 10;
export const PAGINATION_DEFAULT_LIMIT = 10;
export const RECENT_ACTIVITY_LIMIT = 20;
export const SKELETON_LOADER_COUNT = 10;

// Animation Constants
export const ANIMATION_BLUR_AMOUNT = 4; // px
export const ANIMATION_Y_OFFSET = 10; // px
export const ANIMATION_Y_OFFSET_LARGE = 100; // px

// Chart Margins
export const CHART_MARGIN = {
  top: 10,
  right: 10,
  left: 10,
  bottom: 10,
};

// Payment Constants
export const RAZORPAY_AMOUNT_MULTIPLIER = 100; // Razorpay uses paise

// Timestamp Constants
export const MILLISECONDS_THRESHOLD = 1e12; // 1 trillion - used to determine if timestamp is in ms or seconds
export const SECONDS_TO_MS_MULTIPLIER = 1000;

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL_SHORT = 30000; // 30 seconds
export const CACHE_TTL_MEDIUM = 60000; // 1 minute
export const CACHE_TTL_LONG = 300000; // 5 minutes
