import React, { useState, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  TextField,
  Button,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Chip,
  CssBaseline,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import Papa from "papaparse";
import axios from "axios";

const DEFAULT_SUBJECT = "SUBJECT";

const DEFAULT_BODY = `Dear {Name},


MESSAGE BODY
`;

// Convert plain text (with newlines) to styled HTML, preserving {Name} etc.
function plainTextToHtml(text) {
  if (!text) {
    return "<html><body><p></p></body></html>";
  }

  // Escape HTML-reserved chars but NOT { or }
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Split on blank lines into paragraphs
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const htmlParagraphs = paragraphs
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Email</title>
  </head>
  <body style="font-family:Arial, sans-serif; font-size:14px; line-height:1.5;">
    ${htmlParagraphs || "<p></p>"}
  </body>
</html>`;
}

// Split an array into chunks of given size
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Use current host so other machines can talk to backend
const API_BASE = `http://${window.location.hostname}:5050`;

function App() {
  const [recipients, setRecipients] = useState([]);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);
  const [log, setLog] = useState([]);

  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY); // plain text
  const [csvFileName, setCsvFileName] = useState("");

  // Search by email
  const [searchEmail, setSearchEmail] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Search/download by CSV name
  const [csvSearchName, setCsvSearchName] = useState("");

  const fileInputRef = useRef(null);

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Load ALL columns from CSV, keep them as properties on each recipient row
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name); // track CSV name for DB

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data
          .map((raw) => {
            const row = {};
            Object.keys(raw).forEach((key) => {
              const cleanKey = key.trim();
              const value = raw[key];
              row[cleanKey] = typeof value === "string" ? value.trim() : value;
            });
            return row;
          })
          .filter((row) => {
            const emailKey = Object.keys(row).find(
              (k) => k.toLowerCase() === "email",
            );
            return emailKey && row[emailKey];
          });

        setRecipients(rows);
        setLog((prev) => [
          ...prev,
          `Loaded ${rows.length} recipients from CSV "${file.name}".`,
        ]);
      },
      error: (error) => {
        setLog((prev) => [...prev, `Error parsing CSV: ${error.message}`]);
      },
    });
  };

  // Send emails in batches so UI sees progress
  const handleSend = async () => {
    if (!recipients.length) {
      setLog((prev) => [...prev, "No recipients loaded."]);
      return;
    }

    if (!subject.trim() || !body.trim()) {
      setLog((prev) => [...prev, "Subject and body cannot be empty."]);
      return;
    }

    const htmlBody = plainTextToHtml(body);

    const BATCH_SIZE = 500; // adjust as needed
    const batches = chunkArray(recipients, BATCH_SIZE);

    setSending(true);
    setResults(null);
    setLog((prev) => [
      ...prev,
      `Starting send in ${batches.length} batch(es)...`,
    ]);

    const allResults = [];

    try {
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        setLog((prev) => [
          ...prev,
          `Sending batch ${i + 1}/${batches.length} (${batch.length} recipients)...`,
        ]);

        const response = await axios.post(`${API_BASE}/api/send-emails`, {
          recipients: batch,
          subject,
          htmlBody,
          csvName: csvFileName || null,
        });

        allResults.push(...response.data.results);

        setLog((prev) => [
          ...prev,
          `Batch ${i + 1}/${batches.length} done. Sent: ${
            response.data.sent
          }, Failed: ${response.data.failed}${
            response.data.stoppedAt != null
              ? `, StoppedAt index: ${response.data.stoppedAt}`
              : ""
          }`,
        ]);
      }

      const total = allResults.length;
      const sent = allResults.filter((r) => r.status === "sent").length;
      const failed = allResults.filter((r) => r.status === "error").length;

      setResults({ total, sent, failed, results: allResults });
      setLog((prev) => [
        ...prev,
        `All batches finished. Sent: ${sent}, Failed: ${failed}`,
      ]);
    } catch (err) {
      const backend = err.response?.data;
      const msg = backend?.details || backend?.error || err.message;
      setLog((prev) => [...prev, `Request error: ${msg}`]);
    } finally {
      setSending(false);
    }
  };

  const handleDownloadAllPdfs = async () => {
    if (!recipients.length) {
      setLog((prev) => [...prev, "No recipients loaded for PDFs."]);
      return;
    }

    if (!subject.trim() || !body.trim()) {
      setLog((prev) => [
        ...prev,
        "Subject and body cannot be empty for PDF generation.",
      ]);
      return;
    }

    const htmlBody = plainTextToHtml(body);

    try {
      setLog((prev) => [
        ...prev,
        "Starting PDF generation for all recipients...",
      ]);

      const response = await axios.post(
        `${API_BASE}/api/email-pdfs`,
        {
          recipients,
          subject,
          htmlBody,
        },
        { responseType: "blob" },
      );

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "emails-pdf.zip");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setLog((prev) => [...prev, "PDF ZIP downloaded."]);
    } catch (err) {
      const backend = err.response?.data;
      const msg = backend?.details || backend?.error || err.message;
      setLog((prev) => [...prev, `PDF ZIP error: ${msg}`]);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setLog((prev) => [...prev, "Enter an email to search."]);
      return;
    }

    setSearchLoading(true);
    setSearchResults([]);

    try {
      const response = await axios.get(`${API_BASE}/api/recipients`, {
        params: { email: searchEmail.trim() },
      });

      setSearchResults(response.data.results || []);
      setLog((prev) => [
        ...prev,
        `Search for ${searchEmail.trim()}: ${
          (response.data.results || []).length
        } record(s) found.`,
      ]);
    } catch (err) {
      const backend = err.response?.data;
      const msg = backend?.details || backend?.error || err.message;
      setLog((prev) => [...prev, `Search error: ${msg}`]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDownloadSinglePdf = async (recipientId, email) => {
    try {
      const response = await axios.get(
        `${API_BASE}/api/recipient-pdf/${recipientId}`,
        { responseType: "blob" },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const safeEmail = String(email || "recipient").replace(
        /[^a-z0-9@._-]/gi,
        "_",
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${safeEmail}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setLog((prev) => [
        ...prev,
        `Downloaded PDF for ${email} (id=${recipientId}).`,
      ]);
    } catch (err) {
      const backend = err.response?.data;
      const msg = backend?.details || backend?.error || err.message;
      setLog((prev) => [
        ...prev,
        `Download PDF error for id=${recipientId}: ${msg}`,
      ]);
    }
  };

  const handleDownloadByCsvName = async () => {
    if (!csvSearchName.trim()) {
      setLog((prev) => [...prev, "Enter a CSV file name to download by CSV."]);
      return;
    }

    try {
      setLog((prev) => [
        ...prev,
        `Requesting ZIP for CSV name: ${csvSearchName.trim()}...`,
      ]);

      const response = await axios.get(`${API_BASE}/api/csv-pdfs`, {
        params: { csvName: csvSearchName.trim() },
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);

      const safe = csvSearchName.trim().replace(/[^a-z0-9@._-]/gi, "_");
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${safe || "emails"}_csv.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setLog((prev) => [
        ...prev,
        `CSV ZIP downloaded for ${csvSearchName.trim()}.`,
      ]);
    } catch (err) {
      const backend = err.response?.data;
      const msg = backend?.details || backend?.error || err.message;
      setLog((prev) => [...prev, `CSV ZIP error: ${msg}`]);
    }
  };

  return (
    <>
      <CssBaseline />
      <AppBar position="static" color="primary" elevation={3}>
        <Toolbar>
          <Typography variant="h6" component="div">
            JAMB Bulk Mail Sender
          </Typography>
          {csvFileName && (
            <Box ml={2}>
              <Chip
                size="small"
                label={`CSV: ${csvFileName}`}
                color="secondary"
                variant="outlined"
              />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left side: Send & PDF generation */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={3}>
              {/* CSV Upload */}
              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  1. Upload Recipients CSV
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CSV must include at least <strong>Email</strong>. Optional
                  columns like <strong>Name</strong>,{" "}
                  <strong>Institution</strong>, <strong>Score</strong>, etc. can
                  be used as {"{Variables}"} in the message.
                </Typography>
                <input
                  type="file"
                  accept=".csv"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <Box mt={1} display="flex" alignItems="center" gap={1}>
                  <Button variant="outlined" onClick={handleChooseFile}>
                    Choose CSV File
                  </Button>
                  <Typography variant="body2">
                    Loaded recipients: {recipients.length}
                  </Typography>
                </Box>
                {csvFileName && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Current CSV: {csvFileName}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Subject & Body */}
              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>
                  2. Email Subject & Message
                </Typography>

                <TextField
                  label="Subject"
                  fullWidth
                  margin="normal"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />

                <TextField
                  label="Message (plain text)"
                  fullWidth
                  margin="normal"
                  multiline
                  minRows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  helperText="Write plain text. Use {Name}, {Email}, {Institution}, {Score}, etc. Blank line = new paragraph."
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Actions */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  3. Actions
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSend}
                  disabled={sending || !recipients.length}
                  sx={{ mr: 2 }}
                >
                  {sending ? "Sending..." : "Send Emails (batched)"}
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleDownloadAllPdfs}
                  disabled={
                    !recipients.length || !subject.trim() || !body.trim()
                  }
                >
                  Download PDFs for all recipients
                </Button>

                {sending && (
                  <Box mt={2}>
                    <LinearProgress />
                  </Box>
                )}
              </Box>
            </Paper>

            {/* Results Summary */}
            <Paper sx={{ p: 3, borderRadius: 2 }} elevation={3}>
              <Typography variant="subtitle1" gutterBottom>
                Results Summary
              </Typography>
              {results ? (
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Total: {results.total} | Sent:{" "}
                    <strong>{results.sent}</strong> | Failed:{" "}
                    <strong>{results.failed}</strong>
                  </Typography>
                  <List dense sx={{ maxHeight: 200, overflow: "auto", mt: 1 }}>
                    {results.results.map((r, idx) => (
                      <ListItem key={idx}>
                        <ListItemText
                          primary={`${r.email} - ${r.status}`}
                          secondary={r.error ? `Error: ${r.error}` : undefined}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No results yet.
                </Typography>
              )}
            </Paper>
          </Grid>

          {/* Right side: Search & Log */}
          <Grid item xs={12} md={5}>
            {/* Search & Download section */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={3}>
              <Typography variant="subtitle1" gutterBottom>
                Search & Download Sent Mail
              </Typography>

              {/* Search by Email */}
              <Box display="flex" gap={1} alignItems="flex-end" mb={2}>
                <TextField
                  label="Search by Email"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={searchLoading || !searchEmail.trim()}
                >
                  {searchLoading ? "Searching..." : "Search"}
                </Button>
              </Box>

              {searchResults.length ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Subject</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Download</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResults.map((r) => (
                      <TableRow key={r.recipient_id}>
                        <TableCell>{r.created_at}</TableCell>
                        <TableCell>{r.subject}</TableCell>
                        <TableCell>{r.status}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDownloadSinglePdf(r.recipient_id, r.email)
                            }
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No search results.
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Download by CSV name */}
              <Typography variant="subtitle1" gutterBottom>
                Download ZIP by CSV file name
              </Typography>
              <Box display="flex" gap={1} alignItems="flex-end" mb={1}>
                <TextField
                  label="CSV file name"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={csvSearchName}
                  onChange={(e) => setCsvSearchName(e.target.value)}
                  placeholder="e.g. town_update_feb3.csv"
                />
                <Button variant="outlined" onClick={handleDownloadByCsvName}>
                  Download ZIP
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Searches the latest batch sent with that CSV name and generates
                a ZIP with one PDF per recipient.
              </Typography>
            </Paper>

            {/* Log */}
            <Paper
              sx={{ p: 3, maxHeight: 300, overflow: "auto", borderRadius: 2 }}
              elevation={3}
            >
              <Typography variant="subtitle1" gutterBottom>
                Log
              </Typography>
              <List dense>
                {log.map((line, idx) => (
                  <ListItem key={idx}>
                    <ListItemText primary={line} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

export default App;
