const { createSchema } = require('../utils/mongoose')
const { Schema } = require('mongoose')
const baseSchema = require('./base')

const messageSchema = {
    ...baseSchema,
    chat: String,
    seenAt: { type: Date, default: null }, // if not null recipient has seen message
    messageBody: String,
    messageStatus:{type: String, default: 'pending'}, // pending, sent, delivered, seen
    sender: { type: Schema.Types.ObjectId, ref: 'User' }
}

module.exports = createSchema(messageSchema)