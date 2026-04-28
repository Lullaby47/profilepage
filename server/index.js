import http from "node:http";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "inquiries.json");
const port = process.env.PORT || 3001;

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]", "utf8");
  }
}

async function readInquiries() {
  await ensureDataFile();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw);
}

async function writeInquiries(inquiries) {
  await ensureDataFile();
  await fs.writeFile(dataFile, JSON.stringify(inquiries, null, 2), "utf8");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  return req.socket.remoteAddress || "unknown";
}

const server = http.createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: "Missing URL" });
    return;
  }

  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }

  if (req.url === "/api/inquiry" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        const inquiries = await readInquiries();
        const record = {
          id: randomUUID(),
          source: parsed.source || "unknown",
          clickedAt: parsed.clickedAt || new Date().toISOString(),
          receivedAt: new Date().toISOString(),
          ip: getClientIp(req),
          userAgent: req.headers["user-agent"] || "unknown",
        };

        inquiries.push(record);
        await writeInquiries(inquiries);

        sendJson(res, 201, { ok: true, inquiry: record });
      } catch (error) {
        sendJson(res, 500, { ok: false, error: "Could not save inquiry" });
      }
    });

    return;
  }

  if (req.url === "/api/inquiries" && req.method === "GET") {
    try {
      const inquiries = await readInquiries();
      sendJson(res, 200, { ok: true, inquiries });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: "Could not read inquiries" });
    }

    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(port, () => {
  console.log(`Inquiry server running on http://localhost:${port}`);
});
