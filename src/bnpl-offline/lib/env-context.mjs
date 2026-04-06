/**
 * Resolve config for a logical environment (from Kinesis stream routing).
 */

/** @typedef {'staging' | 'production'} Environment */

/**
 * OAuth 1.0a + base URL for Adobe Commerce REST (same model as maruti-aio getCommerceOauthClient).
 * Staging: prefer *_STAGING suffixed env vars, then fall back to unsuffixed.
 *
 * @param {Environment} environment
 */
function getCommerceConfig(environment) {
  if (environment === "staging") {
    return {
      environment,
      baseUrl: process.env.COMMERCE_BASE_URL_STAGING ?? process.env.COMMERCE_BASE_URL ?? "",
      consumerKey: process.env.COMMERCE_CONSUMER_KEY_STAGING ?? process.env.COMMERCE_CONSUMER_KEY ?? "",
      consumerSecret: process.env.COMMERCE_CONSUMER_SECRET_STAGING ?? process.env.COMMERCE_CONSUMER_SECRET ?? "",
      accessToken: process.env.COMMERCE_ACCESS_TOKEN_STAGING ?? process.env.COMMERCE_ACCESS_TOKEN ?? "",
      accessTokenSecret:
        process.env.COMMERCE_ACCESS_TOKEN_SECRET_STAGING ?? process.env.COMMERCE_ACCESS_TOKEN_SECRET ?? ""
    };
  }
  return {
    environment,
    baseUrl: process.env.COMMERCE_BASE_URL ?? "",
    consumerKey: process.env.COMMERCE_CONSUMER_KEY ?? "",
    consumerSecret: process.env.COMMERCE_CONSUMER_SECRET ?? "",
    accessToken: process.env.COMMERCE_ACCESS_TOKEN ?? "",
    accessTokenSecret: process.env.COMMERCE_ACCESS_TOKEN_SECRET ?? ""
  };
}

/**
 * DMS APIs (token + booked cars). Staging: *_STAGING then fallback.
 *
 * @param {Environment} environment
 */
function getDmsConfig(environment) {
  if (environment === "staging") {
    return {
      environment,
      tokenUrl: process.env.DMS_TOKEN_URL_STAGING ?? process.env.DMS_TOKEN_URL ?? "",
      clientId: process.env.DMS_CLIENT_ID_STAGING ?? process.env.DMS_CLIENT_ID ?? "",
      clientSecret: process.env.DMS_CLIENT_SECRET_STAGING ?? process.env.DMS_CLIENT_SECRET ?? "",
      bookedCarsApiUrl:
        process.env.DMS_BOOKED_CARS_API_URL_STAGING ?? process.env.DMS_BOOKED_CARS_API_URL ?? "",
      xApiKey: process.env.DMS_X_API_KEY_STAGING ?? process.env.DMS_X_API_KEY ?? ""
    };
  }
  return {
    environment,
    tokenUrl: process.env.DMS_TOKEN_URL ?? "",
    clientId: process.env.DMS_CLIENT_ID ?? "",
    clientSecret: process.env.DMS_CLIENT_SECRET ?? "",
    bookedCarsApiUrl: process.env.DMS_BOOKED_CARS_API_URL ?? "",
    xApiKey: process.env.DMS_X_API_KEY ?? ""
  };
}

export { getCommerceConfig, getDmsConfig };
