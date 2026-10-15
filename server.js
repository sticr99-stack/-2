import { createServer } from 'node:http';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const maxBodyBytes = 1024 * 1024;
const services = new Set(['flights', 'hotels', 'visas', 'insurance', 'esim']);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new ApiError(413, 'BODY_TOO_LARGE', 'Request body is too large.');
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object.');
    return value;
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Send a valid JSON object.');
  }
}

function providerSetting(service) {
  return `${service.toUpperCase()}_PROVIDER`;
}

async function getAdapter(service) {
  if (!services.has(service)) throw new ApiError(404, 'UNKNOWN_SERVICE', 'This travel service is not supported.');
  const provider = process.env[providerSetting(service)]?.trim().toLowerCase();
  if (!provider || !/^[a-z0-9-]+$/.test(provider)) {
    throw new ApiError(503, 'PROVIDER_NOT_CONFIGURED', 'لم يتم ربط مزوّد هذه الخدمة بعد.');
  }
  const adapterPath = path.join(root, 'server', 'providers', service, `${provider}.js`);
  try {
    await access(adapterPath);
  } catch {
    throw new ApiError(503, 'PROVIDER_ADAPTER_MISSING', 'إعداد المزوّد غير مكتمل بعد.');
  }
  return import(pathToFileURL(adapterPath).href);
}

async function serveStatic(request, response, pathname) {
  const decoded = decodeURIComponent(pathname);
  const relative = decoded === '/' ? 'index.html' : decoded.replace(/^\/+/, '');
  if (!['index.html', 'info.html', 'styles.css', 'app.js', 'info-page.js', 'social-links.js', 'favicon.ico'].includes(relative) && !relative.startsWith('assets/')) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  const filePath = path.resolve(root, relative);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  let content;
  try {
    content = await readFile(filePath);
  } catch {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  const contentType = mimeTypes[path.extname(filePath).toLowerCase()];
  if (!contentType) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }
  response.writeHead(200, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin'
  });
  response.end(content);
}

const server = createServer(async (request, response) => {
  let url;
  try {
    url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/api/health' && request.method === 'GET') {
      const integrations = {};
      for (const service of services) {
        const provider = process.env[providerSetting(service)]?.trim() || '';
        integrations[service] = provider ? 'adapter_required' : 'not_configured';
      }
      sendJson(response, 200, { status: 'ok', bookingMode: 'demo_only', integrations });
      return;
    }

    const apiMatch = url.pathname.match(/^\/api\/(search|bookings)\/([a-z]+)$/);
    if (apiMatch && request.method === 'POST') {
      const [, operation, service] = apiMatch;
      if (!services.has(service)) throw new ApiError(404, 'UNKNOWN_SERVICE', 'This travel service is not supported.');
      if (operation === 'bookings') {
        throw new ApiError(503, 'REAL_BOOKING_DISABLED', 'الحجز الفعلي غير مفعّل في هذه النسخة. استخدم الطلب المبدئي وملخص PDF.');
      }
      const payload = await readJson(request);
      const adapter = await getAdapter(service);
      const action = 'search';
      if (typeof adapter[action] !== 'function') {
        throw new ApiError(503, 'PROVIDER_ACTION_UNAVAILABLE', 'This operation is not available from the configured provider.');
      }
      const result = await adapter[action](payload, { requestId: crypto.randomUUID() });
      sendJson(response, 200, { data: result });
      return;
    }

    if (url.pathname.startsWith('/api/')) {
      sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'API route not found.' } });
      return;
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } });
      return;
    }
    await serveStatic(request, response, url.pathname);
  } catch (error) {
    if (error instanceof ApiError) {
      sendJson(response, error.status, { error: { code: error.code, message: error.message } });
      return;
    }
    sendJson(response, 502, { error: { code: 'PROVIDER_ERROR', message: 'تعذر إكمال الطلب مع مزوّد الخدمة.' } });
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Al-Yamani Travel server listening on port ${port}`);
});
