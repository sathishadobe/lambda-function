/**
 * Resolve config for a logical environment (from Kinesis stream routing).
 */

/** @typedef {'staging' | 'production'} Environment */

/**
 * OAuth 1.0a + base URL for Adobe Commerce REST (same model as maruti-aio getCommerceOauthClient).
 * Staging: prefer *_staging suffixed env vars, then fall back to unsuffixed.
 *
 * @param {Environment} environment
 */
export function getCommerceConfig(environment) {
  if (environment === "staging") {
    return {
      environment,
      baseUrl: process.env.COMMERCE_BASE_URL_staging ?? process.env.COMMERCE_BASE_URL ?? "",
      consumerKey: process.env.COMMERCE_CONSUMER_KEY_staging ?? process.env.COMMERCE_CONSUMER_KEY ?? "",
      consumerSecret: process.env.COMMERCE_CONSUMER_SECRET_staging ?? process.env.COMMERCE_CONSUMER_SECRET ?? "",
      accessToken: process.env.COMMERCE_ACCESS_TOKEN_staging ?? process.env.COMMERCE_ACCESS_TOKEN ?? "",
      accessTokenSecret:
        process.env.COMMERCE_ACCESS_TOKEN_SECRET_staging ?? process.env.COMMERCE_ACCESS_TOKEN_SECRET ?? ""
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
