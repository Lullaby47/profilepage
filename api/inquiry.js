const inquiries = globalThis.__portfolioInquiries ?? [];

if (!globalThis.__portfolioInquiries) {
  globalThis.__portfolioInquiries = inquiries;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "unknown";
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "POST") {
    const record = {
      id: crypto.randomUUID(),
      source: req.body?.source || "unknown",
      clickedAt: req.body?.clickedAt || new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
    };

    inquiries.push(record);

    return res.status(201).json({
      ok: true,
      inquiry: record,
      note: "Stored in temporary function memory. Use a database for persistent tracking.",
    });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      inquiries,
      note: "This list is temporary in serverless memory and may reset between invocations.",
    });
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
