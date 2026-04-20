const USER_CODE_KEY = "userCode";

const normalizeUserCode = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return "";
  }
  return trimmed;
};

const getCodeFromHash = () => {
  const hash = window.location.hash || "";
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return "";

  const hashParams = new URLSearchParams(hash.slice(queryIndex + 1));
  return normalizeUserCode(hashParams.get("uc"));
};

const isValidBase64 = (value) => {
  if (!value) return false;
  const base64Pattern = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!base64Pattern.test(value) || value.length % 4 !== 0) return false;

  try {
    const decoded = atob(value);
    return Boolean(decoded && decoded.trim());
  } catch {
    return false;
  }
};

export const isValidUserCode = (value) => {
  const normalized = normalizeUserCode(value);
  if (!normalized) return false;
  return isValidBase64(normalized);
};

export const resolveUserCode = (searchParams) => {
  const fromRouterSearch = normalizeUserCode(searchParams?.get?.("uc"));
  if (isValidUserCode(fromRouterSearch)) return fromRouterSearch;

  const fromWindowSearch = normalizeUserCode(
    new URL(window.location.href).searchParams.get("uc")
  );
  if (isValidUserCode(fromWindowSearch)) return fromWindowSearch;

  const fromHash = getCodeFromHash();
  if (isValidUserCode(fromHash)) return fromHash;

  return "";
};

export const persistUserCode = (code) => {
  const normalized = normalizeUserCode(code);
  if (!isValidUserCode(normalized)) return "";
  localStorage.setItem(USER_CODE_KEY, normalized);
  return normalized;
};

export const repair404HashIfUserCodeExists = () => {
  const hash = window.location.hash || "";
  if (!hash.startsWith("#/404")) return;

  const code = resolveUserCode();
  if (!code) return;

  const nextUrl = new URL(window.location.href);
  nextUrl.pathname = "/";
  nextUrl.search = `?uc=${encodeURIComponent(code)}`;
  nextUrl.hash = "";

  window.history.replaceState({}, "", `${nextUrl.pathname}${nextUrl.search}`);
};
