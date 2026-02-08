const mongoose = require('mongoose');
const fraudReportSchema = new mongoose.Schema({
    companyName: String,
    reportedBy: String,
    issue: String,
    severity: { type: String, default: 'Medium' },
    status: { type: String, default: 'Pending' },
    reportDate: { type: Date, default: Date.now }
});
module.exports = mongoose.model('FraudReport', fraudReportSchema);
