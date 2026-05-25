#!/usr/bin/env node
/**
 * SkyGrid Endpoint Auto-Drill Matrix
 *
 * Generates: skygrid-endpoint-matrix-west01.json
 *
 * Usage:
 *   SKYGRID_BASE_URL="https://your-service.example.com" node node-javascript/skygrid-endpoint-matrix.js
 *
 * Optional:
 *   SKYGRID_TIMEOUT_MS=8000
 *   SKYGRID_OUTPUT=skygrid-endpoint-matrix-west01.json
 *   SKYGRID_AUTH_TOKEN="Bearer ..."
 */

const fs = require("fs");
const { performance } = require("perf_hooks");

const BASE_URL =
  process.env.SKYGRID_BASE_URL ||
  process.env.BASE_URL ||
  process.env.SITE_URL ||
  process.env.AWS_SERVICE_URL ||
  "";

const OUTPUT = process.env.SKYGRID_OUTPUT || "skygrid-endpoint-matrix-west01.json";
const TIMEOUT_MS = Number(process.env.SKYGRID_TIMEOUT_MS || 8000);
const AUTH_TOKEN = process.env.SKYGRID_AUTH_TOKEN || "";

const ROUTES = [
  { method: "POST", path: "/api/iot/ingest", auth_expected: false, body: { source: "skygrid-auto-drill", type: "iot_probe" } },
  { method: "POST", path: "/ingest/receipt", auth_expected: false, body: { source: "skygrid-auto-drill", receipt_id: "probe" } },
  { method: "POST", path: "/validators/heartbeat", auth_expected: false, body: { validator_id: "west01-probe", status: "probe" } },
  { method: "POST", path: "/security/events", auth_expected: false, body: { event_type: "probe", severity: "info" } },
  { method: "GET", path: "/route/state", auth_expected: false },
  { method: "POST", path: "/return/access", auth_expected: true, body: { request_id: "probe", mode: "health_check" } },
  { method: "GET", path: "/health", auth_expected: false }
];

function gradeLatency(totalResponseMs) {
  if (totalResponseMs <= 500) return "Gold";
  if (totalResponseMs <= 1500) return "Silver";
  if (totalResponseMs <= 3000) return "Bronze";
  return "Fail";
}

function classifyStatus(status, authExpected = false) {
  if ([200, 201, 202, 204].includes(status)) return "live";
  if ([401, 403].includes(status)) return authExpected ? "protected" : "unauthorized";
  if ([301, 302, 307, 308].includes(status)) return "redirect";
  if (status === 404) return "missing_fail";
  if (status === 0) return "network_fail";
  if (status >= 500 && status <= 599) return "server_fail";
  return "unexpected";
}

function isFail(status, totalResponseMs, authExpected = false) {
  if (totalResponseMs > 3000) return true;
  if (status === 0 || status === 404) return true;
  if (status >= 500 && status <= 599) return true;
  if ([401, 403].includes(status) && authExpected) return false;
  if ([200, 201, 202, 204, 301, 302, 307, 308].includes(status)) return false;
  return ![401, 403].includes(status);
}

function joinUrl(baseUrl, path) {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function probeRoute(route) {
  const url = joinUrl(BASE_URL, route.path);
  const headers = { "content-type": "application/json", "user-agent": "SkyGridEndpointMatrix/1.0" };
  if (AUTH_TOKEN) headers.authorization = AUTH_TOKEN;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();

  try {
    const response = await fetch(url, {
      method: route.method,
      headers,
      body: route.method === "GET" ? undefined : JSON.stringify(route.body || {}),
      redirect: "manual",
      signal: controller.signal
    });

    const total = Math.round(performance.now() - started);
    const classification = classifyStatus(response.status, route.auth_expected);
    const fail = isFail(response.status, total, route.auth_expected);

    return {
      method: route.method,
      path: route.path,
      url,
      auth_expected: route.auth_expected,
      status: response.status,
      total_response_ms: total,
      grade: fail ? "Fail" : gradeLatency(total),
      classification,
      pass: !fail
    };
  } catch (error) {
    const total = Math.round(performance.now() - started);
    return {
      method: route.method,
      path: route.path,
      url,
      auth_expected: route.auth_expected,
      status: 0,
      total_response_ms: total,
      grade: "Fail",
      classification: "network_fail",
      pass: false,
      error: error && error.name ? error.name : String(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  if (!BASE_URL) {
    console.error("Missing SKYGRID_BASE_URL, BASE_URL, SITE_URL, or AWS_SERVICE_URL.");
    process.exit(2);
  }

  const generatedAt = new Date().toISOString();
  const results = [];
  for (const route of ROUTES) {
    results.push(await probeRoute(route));
  }

  const summary = {
    total: results.length,
    pass: results.filter((r) => r.pass).length,
    fail: results.filter((r) => !r.pass).length,
    gold: results.filter((r) => r.grade === "Gold").length,
    silver: results.filter((r) => r.grade === "Silver").length,
    bronze: results.filter((r) => r.grade === "Bronze").length
  };

  const report = {
    report_name: "skygrid-endpoint-matrix-west01",
    generated_at: generatedAt,
    base_url: BASE_URL,
    timeout_ms: TIMEOUT_MS,
    summary,
    routes: results
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  process.exit(summary.fail > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = {
  ROUTES,
  gradeLatency,
  classifyStatus,
  isFail,
  probeRoute
};
