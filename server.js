require("dotenv").config();
const express = require("express");
const url_model = require("./models/shorturl.js");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const app = express();

// constant
const LOCALHOST_IP = "127.0.0.1";

// mongo connection
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// support method override for HTML forms (hidden `_method` field)
app.use(methodOverride("_method"));
// serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// small helpers
function isValidUrl(input) {
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (e) {
    return false;
  }
}

function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

// Routes
app.get("/", async (req, res) => {
  const urlLists = await url_model.find();
  res.render("index", { shorturls: urlLists });
});

app.post("/shorturls", async (req, res) => {
  const full = req.body.fullUrl;
  const code = req.body.code;

  console.log("Form submission received:", { full, code });

  if (!full || !isValidUrl(full))
    return res.status(400).send("Invalid full URL");

  const createData = { full };

  if (code && code.trim()) {
    console.log("Custom code provided:", code);
    if (!isValidCode(code))
      return res
        .status(400)
        .send("Invalid short code. Must be 6-8 alphanumeric characters.");

    const exists = await url_model.findOne({ short: code });
    if (exists)
      return res
        .status(409)
        .send("Short code already exists. Please choose a different one.");

    createData.short = code;
    console.log("Using custom code:", code);
  } else {
    console.log("No custom code provided, will auto-generate");
  }

  const created = await url_model.create(createData);
  console.log("Link created:", created);
  res.redirect("/");
});

// Health check - must come before the catch-all /:shorturl route
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Health check with any prefix - also matches pattern like /hero56/healthz
app.get("/:prefix/healthz", async (req, res) => {
  console.log("Health check requested with prefix:", req.params.prefix);
  try {
    const prefix = req.params.prefix;

    // Check if the prefix is a valid short code
    const link = await url_model.findOne({ short: prefix });

    if (!link) {
      // Link not found
      console.log(`Link not found for prefix: ${prefix}`);
      return res.status(404).json({
        status: "not_found",
        code: 404,
        message: `Link with code '${prefix}' not found`,
      });
    }

    // Link exists and service is working
    console.log(`Health check passed for link: ${prefix}`);
    return res.status(200).json({
      status: "ok",
      code: 200,
      message: "Service is running and link exists",
      link: {
        short: link.short,
        full: link.full,
        clicks: link.clicks,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(500).json({
      status: "error",
      code: 500,
      message: "Internal server error",
    });
  }
});

app.get("/:shorturl", async (req, res) => {
  const shorturl = await url_model.findOne({ short: req.params.shorturl });
  if (shorturl == null) return res.sendStatus(404);

  shorturl.clicks++;
  shorturl.lastClicked = new Date();
  shorturl.save();

  return res.redirect(302, shorturl.full);
});

// support HTML form delete (method-override) and a POST fallback
app.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const deleteAction = await url_model.findOneAndDelete({ _id: id });
  if (deleteAction == null) return res.sendStatus(404);
  res.redirect("/");
});

app.post("/:id", async (req, res) => {
  // fallback if method override is not supported by client
  const id = req.params.id;
  const deleteAction = await url_model.findOneAndDelete({ _id: id });
  if (deleteAction == null) return res.sendStatus(404);
  res.redirect("/");
});

// REST API for links
// List all links
app.get("/api/links", async (req, res) => {
  try {
    const urlLists = await url_model.find();
    return res.json(urlLists);
  } catch (err) {
    return res.status(500).json({ error: "internal_error" });
  }
});

// Create a link. If client provides `code`, return 409 when it already exists.
app.post("/api/links", async (req, res) => {
  try {
    const { full, code } = req.body || {};
    if (!full) return res.status(400).json({ error: "missing_full_url" });
    if (!isValidUrl(full))
      return res.status(400).json({ error: "invalid_full_url" });

    if (code) {
      if (!isValidCode(code))
        return res.status(400).json({ error: "invalid_short_code" });
      const exists = await url_model.findOne({ short: code });
      if (exists) return res.sendStatus(409);
    }

    const createData = { full };
    if (code) createData.short = code;

    const created = await url_model.create(createData);
    return res.status(201).json(created);
  } catch (err) {
    return res.status(500).json({ error: "internal_error" });
  }
});

// Stats for one code
app.get("/api/links/:code", async (req, res) => {
  try {
    const code = req.params.code;
    console.log(`Fetching stats for code: ${code}`);
    const doc = await url_model.findOne({ short: code });
    if (!doc) {
      console.log(`Code not found: ${code}`);
      return res.sendStatus(404);
    }
    console.log(`Found stats for: ${code}, clicks: ${doc.clicks}`);
    return res.json({
      id: doc._id,
      short: doc.short,
      full: doc.full,
      clicks: doc.clicks,
      lastClicked: doc.lastClicked,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// Delete by code
app.delete("/api/links/:code", async (req, res) => {
  try {
    const code = req.params.code;
    const deleted = await url_model.findOneAndDelete({ short: code });
    if (!deleted) return res.sendStatus(404);
    return res.sendStatus(204);
  } catch (err) {
    return res.status(500).json({ error: "internal_error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
