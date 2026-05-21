const mongoose = require("mongoose");

const urlSchema = mongoose.Schema(
  {
    shortId: {
      type: String,
      required: true,
      unique: true,
    },
    redirectURL: {
      type: String,
      required: true,
    },
    visitorHistory: [
      {
        timestamp: { type: String },
        device: {
          browser: { type: String },
          os: { type: String },
          devicetype: { type: String },
        },
        ip: { type: String },
      },
    ],
    expiresAt: {
      type: Date,
      default: null,
      expires: 0
    },
    isExpired: Boolean
  },
  { timestamps: true },
);

const URL = mongoose.model("URL", urlSchema);

module.exports = { URL };
