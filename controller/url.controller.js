const shortid = require("shortid");
const { URL } = require("../model/url.model");

async function handleGenerateNewShortURL(req, res) {
  const body = req.body;
  console.log(body);

  if (!body.url) {
    return res.status(400).json({ err: "url is required" });
  }
  const generatedShortId = shortid();
  const result = await URL.create({
    shortId: generatedShortId,
    redirectURL: body.url,
    visitorHistory: [],
  });
  console.log(result);
  
  return res.json({ id: generatedShortId });
}

async function handleGetNewShortURL(req, res) {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate(
    {
      shortId,
    },
    {
      $push: {
        visitorHistory: {
          timestamp: new Date().toISOString(),
        },
      },
    },
    { returnDocument: true },
  );
  if (!entry) {
    return res.status(404).json({ error: "Short URL not found" });
  }
  return res.redirect(entry.redirectURL);
}

async function handleGetAnalytics(req, res) {
  const shortId = req.params.shortId;
  const result = await URL.findOne({shortId});
  console.log(result);
  return res.json({
    clickedHistory: result.visitorHistory.length,
    analytics: result.visitorHistory,
  });
}

module.exports = {
  handleGenerateNewShortURL,
  handleGetNewShortURL,
  handleGetAnalytics,
};
