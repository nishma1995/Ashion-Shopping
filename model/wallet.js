const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions: [
        {
            transactionType: { type: String, enum: ['credit', 'debit'] },
            amount: { type: Number },
            transactionDate: { type: Date, default: Date.now },
            creditedDate: { type: Date },
            debitedDate: { type: Date },
            description: { type: String }

        }]


});

const wallet = mongoose.model('wallet', walletSchema);

module.exports = wallet;
