export const ENV = {
  appId: process.env.VITE_APP_ID ?? "pbw-dropshipper-portal",
  cookieSecret: process.env.JWT_SECRET ?? "pbw-dropship-secret-key-2026-secure",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};
