const { Schema, model } = require("mongoose")

const createSchema = (schemaConfig) => new Schema(schemaConfig);

module.exports = {
    createSchema
}