const shortid = require("shortid");
const { URL } = require("../model/url.model");
const UAParser = require("ua-parser-js");
const validUrl = require("valid-url");

async function handleGenerateNewShortURL(req, res) {
  const { url, customCode, expiresIn } = req.body;
  console.log(req.body);

  if (!url || !validUrl.isUri(url)) {
    return res.status(400).json({ err: "Valid url is required" });
  }

  let generatedShortId = customCode;
  if (!generatedShortId) {
    generatedShortId = shortid();
  } else {
    const existing = await URL.findOne({ shortId: customCode });
    if (existing) {
      return res.status(400).json({ err: "Custom code already in use" });
    }
  }

  let expiresAt = null;
  if (expiresIn) {
    expiresAt = new Date(Date.now() + expiresIn * 1000);
  }

  const result = await URL.create({
    shortId: generatedShortId,
    redirectURL: url,
    visitorHistory: [],
    expiresAt
  });
  console.log(result);

  const shortUrl = `${req.protocol}://${req.get('host')}/${generatedShortId}`;
  return res.json({ id: generatedShortId, shortId: generatedShortId, shortUrl });
}

async function handleGetNewShortURL(req, res) {
  const shortId = req.params.shortId;
  const ua = req.headers["user-agent"] || "";
  const uaInfo = new UAParser(ua).getResult();

  const entry = await URL.findOneAndUpdate(
    { shortId },
    {
      $push: {
        visitorHistory: {
          timestamp: new Date().toISOString(),
          device: {
            browser: uaInfo.browser?.name || "Unknown",
            os: uaInfo.os?.name || "Unknown",
            devicetype: uaInfo.device?.type || "desktop",
          },
          ip: req.ip
        },
      },
    },
    { returnDocument: 'after'}
  );

  if (!entry) {
    return res.status(404).json({ error: "Short URL not found" });
  }

  if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
    return res.status(410).json({ error: "Short URL has expired" });
  }

  return res.redirect(entry.redirectURL);
}

async function handleGetAnalytics(req, res) {
  const shortId = req.params.shortId;
  const result = await URL.findOne({ shortId });
  
  if (!result) {
    return res.status(404).json({ error: "Analytics not found for shortId" });
  }
  
  console.log(result);
  return res.json({
    totalClicks: result.visitorHistory.length,
    visitHistory: result.visitorHistory,
  });
}

module.exports = {
  handleGenerateNewShortURL,
  handleGetNewShortURL,
  handleGetAnalytics,
};
