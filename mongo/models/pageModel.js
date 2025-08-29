var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var pageSchema = new Schema({
    id:            Number,
    title:         String,
    body:          String,
    hasAttachment: Boolean,
    createdDate:   Date,
    updatedDate:   Date
});

var page = mongoose.model('page', pageSchema);

module.exports = page;

