"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDb = void 0;
exports.resetDb = resetDb;
exports.closeDb = closeDb;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const schema = __importStar(require("../../src/db/schema"));
const drizzle_orm_1 = require("drizzle-orm");
const testPool = new pg_1.Pool({
    connectionString: process.env.TEST_DATABASE_URL ??
        "postgresql://test:test@localhost:5433/venlaxiq_test",
});
exports.testDb = (0, node_postgres_1.drizzle)(testPool, { schema });
async function resetDb() {
    await exports.testDb.execute((0, drizzle_orm_1.sql) `
    TRUNCATE TABLE audit_log, forecast_positions, reviews, products,
                   fp_ledger, markets, users RESTART IDENTITY CASCADE
  `);
}
async function closeDb() {
    await testPool.end();
}
