/**
 * Build a string appropriate for a `Set-Cookie` header.
 * @param {string} key     Key-name for the cookie.
 * @param {string} value   Value to assign to the cookie.
 * @param {object} options Optional parameter that can be use to define additional option for the cookie.
 * ```
 * {
 *     secure: boolean // Watever to output the secure flag. Defaults to true.
 *     httpOnly: boolean // Watever to ouput the HttpOnly flag. Defaults to true.
 *     domain: string // Domain to which the limit the cookie. Default to not being outputted.
 *     path: string // Path to which to limit the cookie. Defaults to '/'
 *     expires: UTC string or Date // When this cookie should expire.  Default to not being outputted.
 *     maxAge: integer // Max age of the cookie in seconds. For compatibility with IE, this will be converted to a
 *          `expires` flag. If both the expires and maxAge flags are set, maxAge will be ignores. Default to not being
 *           outputted.
 * }
 * ```
 * @return string
 */

enum CookieSameSite {
  Strict = "Strict",
  Lax = "Lax",
  None = "None",
}

type CookieOptions = {
  secure?: boolean;
  httpOnly?: boolean;
  domain?: string | null;
  path?: string;
  expires?: string | Date | null;
  maxAge?: number | null;
  sameSite?: CookieSameSite;
};

export function setCookieString(key: string, value: string, options?: CookieOptions) {
  var defaults = {
    secure: true,
    httpOnly: true,
    domain: null,
    path: "/",
    expires: null,
    maxAge: null,
    sameSite: CookieSameSite.Lax,
  };
  if (typeof options == "object") {
    options = Object.assign({}, defaults, options);
  } else {
    options = defaults;
  }

  var cookie = key + "=" + value;

  if (options.domain) {
    cookie = cookie + "; domain=" + options.domain;
  }

  if (options.path) {
    cookie = cookie + "; path=" + options.path;
  }

  if (!options.expires && options.maxAge) {
    options.expires = new Date(new Date().getTime() + options.maxAge * 1000); // JS operate in Milli-seconds
  }

  if (options.expires && typeof options.expires == "object" && typeof options.expires.toUTCString) {
    options.expires = options.expires.toUTCString();
  }

  if (options.expires) {
    cookie = cookie + "; expires=" + options.expires.toString();
  }

  if (options.secure) {
    cookie = cookie + "; Secure";
  }

  if (options.httpOnly) {
    cookie = cookie + "; HttpOnly";
  }

  if (options.sameSite) {
    cookie = cookie + "; SameSite=" + options.sameSite;
  }

  return cookie;
}

export function parseCookie(cookie_str: string) {
  const cookie_arr = cookie_str.split(";");
  const cookies: Record<string, string> = {};

  cookie_arr.forEach((data) => {
    const [key, value] = data.split("=");
    cookies[key] = value;
  });

  return cookies;
}
