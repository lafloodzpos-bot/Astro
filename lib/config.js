export const SITE_NAME = "AstroPacks";
export const SITE_TAGLINE = "AstroPacks";
export const SITE_DESCRIPTION = "Private";

export const CATEGORIES = ["All", "Highs", "Mids", "Lows", "Accessories"];

export const SHIPPING_OPTIONS = [
  { id: "free", label: "Free Shipping", price: 0 },
  { id: "express", label: "Express Shipping", price: 25 },
  { id: "overnight", label: "Overnight Shipping", price: 50 },
];

export const PAYMENT_METHODS = [
  { id: "crypto", label: "Crypto", fee: 0 },
  { id: "cashapp", label: "CashApp", fee: 3 },
  { id: "zelle", label: "Zelle", fee: 5 },
];

export const ADMIN_PASSWORD = "changeme123";

export const fmt = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export const genOrderNum = () =>
  "ORD-" +
  Date.now().toString(36).toUpperCase() +
  Math.random().toString(36).substring(2, 6).toUpperCase();

export const PRODUCT_FIELDS = [
  { key: "description", label: "Description", type: "textarea" },
  { key: "smellRating", label: "Smell Rating", type: "select", options: ["1", "2", "3", "4", "5"] },
  { key: "tasteRating", label: "Taste Rating", type: "select", options: ["1", "2", "3", "4", "5"] },
  { key: "potency", label: "Potency", type: "select", options: ["Mild", "Medium", "Strong", "Very Strong"] },
  { key: "strain", label: "Strain Type", type: "select", options: ["Indica", "Sativa", "Hybrid"] },
  { key: "weight", label: "Weight", type: "text" },
  { key: "badge", label: "Badge", type: "select", options: ["", "HOT", "NEW", "SALE", "TOP", "LIMITED"] },
];
