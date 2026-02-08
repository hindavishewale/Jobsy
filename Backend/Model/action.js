const mongoose = require('mongoose');
const actionSchema = new mongoose.Schema({
    companyName: String,
    action: String,
    reason: String,
    status: { type: String, default: 'Active' },
    actionDate: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Action', actionSchema);
