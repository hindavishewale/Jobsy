const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  candidateEmail: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['Shortlisted', 'Rejected', 'Info'], default: 'Info' },
  internshipTitle: { type: String },
  companyName: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);
