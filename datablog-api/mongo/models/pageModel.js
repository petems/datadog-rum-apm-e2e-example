const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pageSchema = new Schema({
  id: Number,
  title: String,
  body: String,
  hasAttachment: Boolean,
  createdDate: Date,
  updatedDate: Date,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const page = mongoose.model('page', pageSchema);

module.exports = page;
