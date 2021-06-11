const { createSchema } = require('../utils/mongoose')
const { Schema } = require('mongoose')
const baseSchema = require('./base')

const chatSchema = {
    ...baseSchema,
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: {
        messageBody: { type: String },
        sender: { type: Schema.Types.ObjectId, ref: 'User' },
        sent: { type: Date, default: new Date() },
    }
}


module.exports = createSchema(chatSchema)