const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pageSchema = new Schema({
  id: Number,
  title: String,
  body: String,
  hasAttachment: Boolean,
  createdDate: Date,
  updatedDate: Date,
});

const page = mongoose.model('page', pageSchema);

module.exports = page;
