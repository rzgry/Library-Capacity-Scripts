const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const apCountSchema = new Schema({
  timestamp: Date,
  weldon: {
    totalCount: Number,
    floors: [
      {
        _id: false,
        name: String,
        count: Number
      }
    ]
  },
  taylor: {
    totalCount: Number,
    floors: [
      {
        _id: false,
        name: String,
        count: Number
      }
    ]
  }
});

const APCount = mongoose.model("APCount", apCountSchema);

module.exports = APCount;
