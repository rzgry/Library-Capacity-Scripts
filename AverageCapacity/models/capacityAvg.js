const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const capacityAvgSchema = new Schema({
  _id: String,
  weldon: {
    times: [
      {
        time: String,
        totalCount: Number,
        floors: [
          {
            _id: false,
            name: String,
            count: Number
          }
        ]
      }
    ]
  },
  taylor: {
    times: [
      {
        time: String,
        totalCount: Number,
        floors: [
          {
            _id: false,
            name: String,
            count: Number
          }
        ]
      }
    ]
  }
});

const capacityAvg = mongoose.model('capacityAvg', capacityAvgSchema);

module.exports = capacityAvg;
