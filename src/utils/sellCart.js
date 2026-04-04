const STORAGE_KEY = "sell-cart";

function sanitizeCart(input) {
  if (!input || typeof input !== "object") return {};

  return Object.entries(input).reduce((acc, [id, qty]) => {
    const parsed = Number.parseInt(qty, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      acc[id] = parsed;
    }
    return acc;
  }, {});
}

export function getSellCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return sanitizeCart(JSON.parse(raw));
  } catch (error) {
    console.error("Failed to read sell cart", error);
    return {};
  }
}

export function setSellCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeCart(cart)));
  } catch (error) {
    console.error("Failed to write sell cart", error);
  }
}

export function clearSellCart() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear sell cart", error);
  }
}
