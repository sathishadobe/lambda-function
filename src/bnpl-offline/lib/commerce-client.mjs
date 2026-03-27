/**
 * Adobe Commerce REST via OAuth 1.0a (HMAC-SHA256), aligned with maruti-aio oauth1a.js.
 * All processors obtain a client via getCommerceClient(environment) and call request().
 */

import { createRequire } from "module";
import crypto from "crypto";
import { getCommerceConfig } from "./env-context.mjs";

const require = createRequire(import.meta.url);
const OAuth = require("oauth-1.0a");

/** @type {Map<string, CommerceRestClient>} */
const clients = new Map();

/**
 * @param {import('./env-context.mjs').Environment} environment
 * @returns {CommerceRestClient}
 */
export function getCommerceClient(environment) {
  const key = environment;
  let client = clients.get(key);
  if (!client) {
    const cfg = getCommerceConfig(environment);
    client = new CommerceRestClient(cfg);
    clients.set(key, client);
  }
  return client;
}

/**
 * @typedef {object} CommerceOAuthConfig
 * @property {string} baseUrl  Origin + path prefix, e.g. https://shop.example.com/
 * @property {string} consumerKey
 * @property {string} consumerSecret
 * @property {string} accessToken
 * @property {string} accessTokenSecret
 */

export class CommerceRestClient {
  /**
   * @param {CommerceOAuthConfig} config
   */
  constructor(config) {
    this._validate(config);
    const base = config.baseUrl.endsWith("/") ? config.baseUrl : `${config.baseUrl}/`;
    /** …/rest/ (matches maruti-aio getCommerceOauthClient) */
    this._restRoot = `${base}rest/`;

    this._oauth = OAuth({
      consumer: {
        key: config.consumerKey,
        secret: config.consumerSecret
      },
      signature_method: "HMAC-SHA256",
      hash_function: (baseString, key) =>
        crypto.createHmac("sha256", key).update(baseString).digest("base64")
    });

    this._token = {
      key: config.accessToken,
      secret: config.accessTokenSecret
    };
  }

  _validate(config) {
    const missing = ["baseUrl", "consumerKey", "consumerSecret", "accessToken", "accessTokenSecret"].filter(
      (k) => !config[k]
    );
    if (missing.length) {
      throw new Error(
        `Commerce OAuth config incomplete (missing: ${missing.join(", ")}). Set COMMERCE_* env vars.`
      );
    }
  }

  /**
   * @param {string} resourcePath  Relative to V1/, e.g. enquirynum/update
   * @param {boolean} [asyncRoute]  If true, use …/rest/async/V1/… (see maruti-aio)
   */
  resolveUrl(resourcePath, asyncRoute = false) {
    const path = resourcePath.replace(/^\//, "");
    if (asyncRoute) {
      return `${this._restRoot}async/V1/${path}`;
    }
    return `${this._restRoot}V1/${path}`;
  }

  /**
   * Signed REST call (OAuth 1.0a). Body is JSON string or serializable object.
   *
   * @param {string} method  GET, POST, PUT, PATCH, DELETE
   * @param {string} resourcePath  e.g. enquirynum/update
   * @param {string | object | undefined} body
   * @param {{ async?: boolean, headers?: Record<string, string> }} [options]
   * @returns {Promise<Response>}
   */
  async request(method, resourcePath, body, options = {}) {
    const url = this.resolveUrl(resourcePath, options.async === true);
    const bodyStr =
      body === undefined || body === null
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body);

    /** @type {{ url: string, method: string, body?: string }} */
    const requestData = {
      url,
      method: method.toUpperCase()
    };
    if (bodyStr !== undefined) {
      requestData.body = bodyStr;
    }

    const authHeader = this._oauth.toHeader(this._oauth.authorize(requestData, this._token));

    const headers = {
      ...authHeader,
      ...options.headers
    };
    if (bodyStr !== undefined) {
      headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    }

    return fetch(url, {
      method: requestData.method,
      headers,
      body: bodyStr
    });
  }

  /**
   * @param {string} resourcePath
   * @param {string | object} body
   * @param {{ async?: boolean }} [options]
   */
  post(resourcePath, body, options) {
    return this.request("POST", resourcePath, body, options);
  }

  /**
   * @param {string} resourcePath
   * @param {{ async?: boolean }} [options]
   */
  get(resourcePath, options) {
    return this.request("GET", resourcePath, undefined, options);
  }

  /**
   * @param {string} resourcePath
   * @param {string | object} body
   * @param {{ async?: boolean }} [options]
   */
  put(resourcePath, body, options) {
    return this.request("PUT", resourcePath, body, options);
  }
}
