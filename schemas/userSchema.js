//username
//dob
//profileImage
//QR code
const { Schema } = require('mongoose')
const { createSchema } = require('../utils/mongoose')
const baseSchema = require('./base')

const userSchema = {
    ...baseSchema,
    username: String,
    dob: String,
    profileImage: String,
    QrCode: String,
    email: { type: String, lowercase: true, unique: true },
    password: String,
    isActive: { type: Boolean, default: false },
    contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    lastSeen: { type: Date, default: new Date() }
}

module.exports = createSchema(userSchema)