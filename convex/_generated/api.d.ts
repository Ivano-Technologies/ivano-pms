/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as functions_audit from "../functions/audit.js";
import type * as functions_bookings from "../functions/bookings.js";
import type * as functions_channelMessages from "../functions/channelMessages.js";
import type * as functions_dashboard from "../functions/dashboard.js";
import type * as functions_guests from "../functions/guests.js";
import type * as functions_managers from "../functions/managers.js";
import type * as functions_nlp from "../functions/nlp.js";
import type * as functions_occupancy from "../functions/occupancy.js";
import type * as functions_property from "../functions/property.js";
import type * as functions_units from "../functions/units.js";
import type * as functions_webhooks from "../functions/webhooks.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_bookingStates from "../lib/bookingStates.js";
import type * as lib_bookingStats from "../lib/bookingStats.js";
import type * as lib_customFunctions from "../lib/customFunctions.js";
import type * as lib_nlp from "../lib/nlp.js";
import type * as lib_secrets from "../lib/secrets.js";
import type * as lib_seedData from "../lib/seedData.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "functions/audit": typeof functions_audit;
  "functions/bookings": typeof functions_bookings;
  "functions/channelMessages": typeof functions_channelMessages;
  "functions/dashboard": typeof functions_dashboard;
  "functions/guests": typeof functions_guests;
  "functions/managers": typeof functions_managers;
  "functions/nlp": typeof functions_nlp;
  "functions/occupancy": typeof functions_occupancy;
  "functions/property": typeof functions_property;
  "functions/units": typeof functions_units;
  "functions/webhooks": typeof functions_webhooks;
  "lib/auth": typeof lib_auth;
  "lib/bookingStates": typeof lib_bookingStates;
  "lib/bookingStats": typeof lib_bookingStats;
  "lib/customFunctions": typeof lib_customFunctions;
  "lib/nlp": typeof lib_nlp;
  "lib/secrets": typeof lib_secrets;
  "lib/seedData": typeof lib_seedData;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
