module.exports = {
	id: Number,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }, //if createdAt == updatedAt then its clean (never been updated)
    isClean: { type: Boolean, default: true },
    hidden: Boolean,
    meta: {
        // votes: Number,
        // favs:  Number
        //any additional info we may want to store
    }
};
