import "dotenv/config";
import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import puppeteer from "puppeteer";
import archiver from "archiver";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 5050;

// Read SMTP config from .env
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = String(process.env.SMTP_SECURE || "true") === "true";
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

console.log("SMTP config:", {
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  user: SMTP_USER,
});

// Pool / rate settings (reduced load)
const POOL_MAX_CONNECTIONS = 2;
const POOL_RATE_LIMIT = 5; // ~5 emails/sec
const POOL_RATE_DELTA_MS = 1000;

// Retry settings
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 15000; // 15s between retries for retryable errors

app.use(cors());
app.use(express.json({ limit: "5mb" }));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 454 temporary auth failure
function isTemporaryAuthError(err) {
  if (!err) return false;
  if (err.responseCode === 454) return true;

  const m = String(err.message || "").toLowerCase();
  const r = String(err.response || "").toLowerCase();

  return (
    m.includes("454 4.7.0") ||
    r.includes("454 4.7.0") ||
    m.includes("temporary authentication failure") ||
    r.includes("temporary authentication failure")
  );
}

// Network-type errors (connection lost, reset, timeout, DNS, etc.)
function isNetworkError(err) {
  if (!err) return false;

  const code = String(err.code || "").toUpperCase();

  if (
    [
      "ECONNECTION", // nodemailer connection error
      "ECONNRESET",
      "ETIMEDOUT",
      "ESOCKET",
      "EAI_AGAIN", // DNS lookup timeout
      "ENOTFOUND", // host not found
    ].includes(code)
  ) {
    return true;
  }

  const msg = String(err.message || "").toLowerCase();
  const resp = String(err.response || "").toLowerCase();
  const text = msg + " " + resp;

  return (
    text.includes("network error") ||
    text.includes("connection lost") ||
    text.includes("connection closed") ||
    text.includes("connection reset") ||
    text.includes("socket hang up") ||
    text.includes("timed out") ||
    text.includes("timeout")
  );
}

// Utility: escape for RegExp
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Get a field from recipient row by name (case-insensitive)
function getField(recipient, fieldName, defaultValue = "") {
  if (!recipient) return defaultValue;
  const key = Object.keys(recipient).find(
    (k) => k.toLowerCase() === fieldName.toLowerCase(),
  );
  if (!key) return defaultValue;
  const value = recipient[key];
  return value == null ? defaultValue : String(value);
}

// Apply {ColumnName} placeholders using all columns from recipient
function applyTemplate(template, recipient) {
  if (!template) return "";

  let result = template;
  if (!recipient) return result;

  for (const [key, rawValue] of Object.entries(recipient)) {
    if (!key) continue;
    const value = rawValue == null ? "" : String(rawValue);
    const pattern = new RegExp(`\\{${escapeRegExp(key)}\\}`, "g");
    result = result.replace(pattern, value);
  }

  return result;
}

// Verify SMTP connection, with retries for 454 / network errors
async function verifySmtpWithRetry(transporter) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await transporter.verify();
      console.log("SMTP verify successful.");
      return;
    } catch (err) {
      const tempAuth = isTemporaryAuthError(err);
      const netErr = isNetworkError(err);

      if ((tempAuth || netErr) && attempt < MAX_RETRIES) {
        console.warn(
          `Retryable SMTP verify error (attempt ${attempt}/${MAX_RETRIES}): ${
            err.message || err
          }`,
        );
        console.warn(
          `Type: ${tempAuth ? "temporary auth" : ""}${
            tempAuth && netErr ? " + " : ""
          }${netErr ? "network" : ""}`,
        );
        console.warn(
          `Waiting ${RETRY_DELAY_MS / 1000}s before retrying verify...`,
        );
        await sleep(RETRY_DELAY_MS);
      } else {
        throw err;
      }
    }
  }
}

// Send one email with retry logic; subject & html come from UI
// Returns { email, status: 'sent' | 'error', attempt, error?, reason? }
async function sendToRecipientWithRetry(
  transporter,
  recipient,
  subjectTemplate,
  htmlBodyTemplate,
) {
  const email = getField(recipient, "Email", "");
  const name = getField(recipient, "Name", "Candidate");

  if (!email) {
    return {
      email: "",
      status: "error",
      attempt: 0,
      error: "Missing Email field in recipient row",
      reason: "OTHER",
    };
  }

  const vars = { Name: name, ...recipient };

  const personalizedSubject = applyTemplate(subjectTemplate, vars);
  const personalizedHtml = applyTemplate(htmlBodyTemplate, vars);

  const mailOptions = {
    from: SMTP_USER,
    to: email,
    subject: personalizedSubject || "No subject",
    html: personalizedHtml || `<p>Dear ${name},</p>`,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Sent to ${email} (attempt ${attempt})`);
      return { email, status: "sent", attempt };
    } catch (err) {
      const tempAuth = isTemporaryAuthError(err);
      const netErr = isNetworkError(err);

      const retryable = (tempAuth || netErr) && attempt < MAX_RETRIES;

      if (retryable) {
        console.warn(
          `Retryable error for ${email} (attempt ${attempt}/${MAX_RETRIES}): ${
            err.message || err
          }`,
        );
        console.warn(
          `Type: ${tempAuth ? "temporary auth" : ""}${
            tempAuth && netErr ? " + " : ""
          }${netErr ? "network" : ""}`,
        );
        console.warn(`Waiting ${RETRY_DELAY_MS / 1000}s before retrying...`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      const reason = tempAuth ? "TEMP_AUTH" : netErr ? "NETWORK" : "OTHER";

      console.error(
        `Final error for ${email}: ${err.message || String(err)} (reason=${reason})`,
      );

      return {
        email,
        status: "error",
        attempt,
        error: err.message || String(err),
        reason,
      };
    }
  }
}

// --- API: send emails ---
app.post("/api/send-emails", async (req, res) => {
  const { recipients, subject, htmlBody, csvName } = req.body;

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res
      .status(400)
      .json({ error: "recipients must be a non-empty array" });
  }

  if (!subject || !htmlBody) {
    return res.status(400).json({ error: "subject and htmlBody are required" });
  }

  console.log(
    `Received /api/send-emails for ${recipients.length} recipient(s).`,
  );

  // 1) Create batch record in DB
  const insertBatch = db.prepare(`
  INSERT INTO batches (subject, html_body, total, csv_name, status)
  VALUES (?, ?, ?, ?, 'in_progress')
`);
  const batchResult = insertBatch.run(
    subject,
    htmlBody,
    recipients.length,
    csvName || null,
  );
  const batchId = batchResult.lastInsertRowid;

  // 2) Insert recipients into DB as 'pending'
  const insertRec = db.prepare(`
    INSERT INTO batch_recipients (batch_id, idx, email, name, data_json, status, attempt)
    VALUES (?, ?, ?, ?, ?, 'pending', 0)
  `);

  recipients.forEach((rec, idx) => {
    const email = getField(rec, "Email", "");
    const name = getField(rec, "Name", "");
    insertRec.run(batchId, idx, email, name, JSON.stringify(rec ?? {}));
  });

  const updateBatch = db.prepare(`
    UPDATE batches
       SET sent = ?,
           failed = ?,
           processed = ?,
           status = ?,
           stopped_at = ?,
           error = ?
     WHERE id = ?
  `);

  const updateRec = db.prepare(`
    UPDATE batch_recipients
       SET status = ?,
           attempt = ?,
           error = ?,
           updated_at = datetime('now')
     WHERE batch_id = ? AND idx = ?
  `);

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    pool: true,
    maxConnections: POOL_MAX_CONNECTIONS,
    maxMessages: Infinity,
    rateDelta: POOL_RATE_DELTA_MS,
    rateLimit: POOL_RATE_LIMIT,
  });

  try {
    await verifySmtpWithRetry(transporter);
  } catch (err) {
    console.error("SMTP verify failed after retries:", err);
    updateBatch.run(
      0,
      0,
      0,
      "stopped",
      null,
      `SMTP verify failed: ${err.message || String(err)}`,
      batchId,
    );
    return res.status(500).json({
      error: "SMTP connection failed",
      details: err.message,
      code: err.code,
    });
  }

  const total = recipients.length;
  const results = [];
  let stoppedAt = null;

  let sentCount = 0;
  let failedCount = 0;

  // 3) Process recipients SEQUENTIALLY so we can stop on fatal network/auth errors
  for (let i = 0; i < recipients.length; i++) {
    const r = await sendToRecipientWithRetry(
      transporter,
      recipients[i],
      subject,
      htmlBody,
    );
    results.push(r);

    const statusForDb = r.status === "sent" ? "sent" : "error";
    if (r.status === "sent") sentCount++;
    if (r.status === "error") failedCount++;

    updateRec.run(statusForDb, r.attempt ?? 0, r.error ?? null, batchId, i);

    if (
      r.status === "error" &&
      (r.reason === "NETWORK" || r.reason === "TEMP_AUTH")
    ) {
      stoppedAt = i;
      console.warn(
        `Stopping send at index ${i} due to ${r.reason} error for ${r.email}`,
      );
      break;
    }
  }

  const processed = results.length;
  const finalStatus =
    processed === total && !stoppedAt ? "completed" : "stopped";

  updateBatch.run(
    sentCount,
    failedCount,
    processed,
    finalStatus,
    stoppedAt,
    null,
    batchId,
  );

  console.log(
    `Finished /api/send-emails. Batch ${batchId}. Total: ${total}, Processed: ${processed}, Sent: ${sentCount}, Failed: ${failedCount}, StoppedAt: ${stoppedAt}`,
  );

  return res.json({
    sent: sentCount,
    failed: failedCount,
    total,
    processed,
    stoppedAt,
    results,
    batchId,
  });
});

// --- API: generate one PDF per recipient and return ZIP ---
app.post("/api/email-pdfs", async (req, res) => {
  const { recipients, subject, htmlBody } = req.body;

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return res
      .status(400)
      .json({ error: "recipients must be a non-empty array" });
  }

  if (!subject || !htmlBody) {
    return res.status(400).json({ error: "subject and htmlBody are required" });
  }

  console.log(
    `Received /api/email-pdfs for ${recipients.length} recipient(s).`,
  );

  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    page.setDefaultTimeout(0);

    const pdfFiles = []; // { filename, buffer }

    for (const recipient of recipients) {
      const email = getField(recipient, "Email", "unknown");
      const name = getField(recipient, "Name", "Candidate");
      const vars = { Name: name, ...recipient };

      const personalizedSubject = applyTemplate(subject, vars);
      const personalizedHtml = applyTemplate(htmlBody, vars);

      const fullHtml = personalizedHtml.toLowerCase().includes("<html")
        ? personalizedHtml
        : `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${personalizedSubject}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        margin: 24px;
      }
    </style>
  </head>
  <body>
    ${personalizedHtml}
  </body>
</html>`;

      await page.setContent(fullHtml, {
        waitUntil: "domcontentloaded",
        timeout: 0,
      });

      const pdfData = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      const pdfBuffer = Buffer.isBuffer(pdfData)
        ? pdfData
        : Buffer.from(pdfData);

      const safeEmail = String(email).replace(/[^a-z0-9@._-]/gi, "_");
      const filename = `${safeEmail || "recipient"}.pdf`;

      pdfFiles.push({ filename, buffer: pdfBuffer });
    }

    await browser.close();
    browser = null;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="emails-pdf.zip"',
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "ZIP archive error", details: err.message });
      } else {
        try {
          res.end();
        } catch (e) {
          // ignore
        }
      }
    });

    archive.pipe(res);

    for (const file of pdfFiles) {
      archive.append(file.buffer, { name: file.filename });
    }

    await archive.finalize();
  } catch (err) {
    console.error("PDF generation ZIP error:", err);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // ignore
      }
    }
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: "PDF generation failed", details: err.message });
    } else {
      try {
        res.end();
      } catch (e) {
        // ignore
      }
    }
  }
});
// --- API: search recipients by email ---
app.get("/api/recipients", (req, res) => {
  const { email } = req.query;

  if (!email || !email.trim()) {
    return res.status(400).json({ error: "email query is required" });
  }

  const q = db.prepare(`
    SELECT
      br.id AS recipient_id,
      br.email,
      br.name,
      br.status,
      br.attempt,
      br.error,
      br.idx,
      b.id AS batch_id,
      b.created_at,
      b.subject
    FROM batch_recipients br
    JOIN batches b ON br.batch_id = b.id
    WHERE LOWER(br.email) = LOWER(?)
    ORDER BY b.created_at DESC, br.idx ASC
  `);

  try {
    const rows = q.all(email.trim());
    return res.json({ email: email.trim(), results: rows });
  } catch (err) {
    console.error("DB error in /api/recipients:", err);
    return res
      .status(500)
      .json({ error: "DB error", details: err.message || String(err) });
  }
});

// --- API: generate PDF for a single recipient (by batch_recipients.id) ---
app.get("/api/recipient-pdf/:id", async (req, res) => {
  const recipientId = Number(req.params.id);
  if (!recipientId) {
    return res.status(400).json({ error: "invalid recipient id" });
  }

  const q = db.prepare(`
    SELECT
      br.id AS recipient_id,
      br.email,
      br.name,
      br.data_json,
      b.subject,
      b.html_body
    FROM batch_recipients br
    JOIN batches b ON br.batch_id = b.id
    WHERE br.id = ?
  `);

  let row;
  try {
    row = q.get(recipientId);
  } catch (err) {
    console.error("DB error in /api/recipient-pdf:", err);
    return res
      .status(500)
      .json({ error: "DB error", details: err.message || String(err) });
  }

  if (!row) {
    return res.status(404).json({ error: "recipient not found" });
  }

  const email = row.email || "unknown@example.com";
  const name = row.name || "Candidate";

  let data;
  try {
    data = row.data_json ? JSON.parse(row.data_json) : {};
  } catch {
    data = {};
  }

  const vars = { Name: name, Email: email, ...data };

  const personalizedSubject = applyTemplate(row.subject || "No subject", vars);
  const personalizedHtml = applyTemplate(row.html_body || "", vars);

  const fullHtml = personalizedHtml.toLowerCase().includes("<html")
    ? personalizedHtml
    : `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${personalizedSubject}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        margin: 24px;
      }
    </style>
  </head>
  <body>
    ${personalizedHtml}
  </body>
</html>`;

  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    page.setDefaultTimeout(0);

    await page.setContent(fullHtml, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    const pdfData = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);

    await browser.close();
    browser = null;

    const safeEmail = String(email).replace(/[^a-z0-9@._-]/gi, "_");
    const filename = `${safeEmail || "recipient"}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    return res.send(pdfBuffer);
  } catch (err) {
    console.error("Single PDF generation error:", err);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // ignore
      }
    }
    return res
      .status(500)
      .json({ error: "PDF generation failed", details: err.message });
  }
});

// --- API: generate ZIP of PDFs for the latest batch of a given CSV file ---
app.get("/api/csv-pdfs", async (req, res) => {
  const { csvName } = req.query;

  if (!csvName || !csvName.trim()) {
    return res.status(400).json({ error: "csvName query is required" });
  }

  // Find the latest batch for this csv_name
  const batchRow = db
    .prepare(
      `
      SELECT *
      FROM batches
      WHERE LOWER(csv_name) = LOWER(?)
      ORDER BY datetime(created_at) DESC
      LIMIT 1
    `,
    )
    .get(csvName.trim());

  if (!batchRow) {
    return res.status(404).json({
      error: "No batch found for this csvName",
      csvName: csvName.trim(),
    });
  }

  // Get all recipients for this batch
  const recRows = db
    .prepare(
      `
      SELECT *
      FROM batch_recipients
      WHERE batch_id = ?
      ORDER BY idx
    `,
    )
    .all(batchRow.id);

  console.log(
    `Generating CSV-based ZIP for csv_name="${csvName.trim()}", batch_id=${
      batchRow.id
    }, recipients=${recRows.length}`,
  );

  let browser;
  try {
    browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);
    page.setDefaultTimeout(0);

    const pdfFiles = []; // { filename, buffer }

    for (const rec of recRows) {
      const email =
        rec.email ||
        getField(
          rec.data_json ? JSON.parse(rec.data_json) : {},
          "Email",
          "unknown",
        );
      const name =
        rec.name ||
        getField(
          rec.data_json ? JSON.parse(rec.data_json) : {},
          "Name",
          "Candidate",
        );

      let data = {};
      try {
        data = rec.data_json ? JSON.parse(rec.data_json) : {};
      } catch {
        data = {};
      }

      const vars = { Name: name, Email: email, ...data };

      const personalizedSubject = applyTemplate(batchRow.subject || "", vars);
      const personalizedHtml = applyTemplate(batchRow.html_body || "", vars);

      const fullHtml = personalizedHtml.toLowerCase().includes("<html")
        ? personalizedHtml
        : `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${personalizedSubject}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.5;
        margin: 24px;
      }
    </style>
  </head>
  <body>
    ${personalizedHtml}
  </body>
</html>`;

      await page.setContent(fullHtml, {
        waitUntil: "domcontentloaded",
        timeout: 0,
      });

      const pdfData = await page.pdf({
        format: "A4",
        printBackground: true,
      });

      const pdfBuffer = Buffer.isBuffer(pdfData)
        ? pdfData
        : Buffer.from(pdfData);

      const safeEmail = String(email || "recipient").replace(
        /[^a-z0-9@._-]/gi,
        "_",
      );
      const filename = `${safeEmail}.pdf`;

      pdfFiles.push({ filename, buffer: pdfBuffer });
    }

    await browser.close();
    browser = null;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${csvName.trim()}_emails.zip"`,
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("Archive error (csv-pdfs):", err);
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "ZIP archive error", details: err.message });
      } else {
        try {
          res.end();
        } catch (e) {
          // ignore
        }
      }
    });

    archive.pipe(res);

    for (const file of pdfFiles) {
      archive.append(file.buffer, { name: file.filename });
    }

    await archive.finalize();
  } catch (err) {
    console.error("CSV-based PDF ZIP error:", err);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // ignore
      }
    }
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ error: "PDF generation failed", details: err.message });
    } else {
      try {
        res.end();
      } catch (e) {
        // ignore
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Bulk mail backend listening on http://localhost:${PORT}`);
});

export default app;
