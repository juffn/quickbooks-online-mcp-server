#!/usr/bin/env node

import { quickbooksClient } from "./clients/quickbooks-client.js";

console.log("Starting QuickBooks OAuth flow...");
console.log("Your browser will open automatically.");
console.log("Log in and authorize the app, then return here.\n");

quickbooksClient
  .authenticate()
  .then(() => {
    console.log("\nAuthentication successful! Tokens saved to .env");
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error("\nAuthentication failed:", error.message);
    process.exit(1);
  });
