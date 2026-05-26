function sendJson(res, statusCode, payload) {
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'HEAD') return resolve(null);

    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) req.destroy();
    });
    req.on('end', () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (_) {
        resolve({ raw: data });
      }
    });
    req.on('error', () => resolve(null));
  });
}

async function skygridHandler(req, res, config) {
  const now = new Date().toISOString();
  const body = await readBody(req);
  const allowed = config.methods || ['GET'];

  if (!allowed.includes(req.method)) {
    res.setHeader('allow', allowed.join(', '));
    return sendJson(res, 405, {
      ok: false,
      service: 'skygrid',
      route: config.route,
      error: 'method_not_allowed',
      allowed_methods: allowed,
      observed_method: req.method,
      generated_at: now
    });
  }

  return sendJson(res, config.statusCode || 200, {
    ok: true,
    service: 'skygrid',
    route: config.route,
    classification: config.classification || 'live',
    region: process.env.VERCEL_REGION || process.env.AWS_REGION || 'unknown',
    generated_at: now,
    received: body
  });
}

module.exports = { skygridHandler };
