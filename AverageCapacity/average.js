const mongoose = require("mongoose");
const APCount = require("./models/APCount");
const Taylor = require("./ap_layouts/Taylor.json");
const Weldon = require("./ap_layouts/Weldon.json");
const capacityAvg = require("./models/capacityAvg");

function movingAverage(currentAvg, newVal, alpha) {
  //let alpha = 0.5; // the larger the more important new values are

  return alpha * newVal + (1 - alpha) * currentAvg;
}

function getTimeSlot(date) {
  let hour = date.getHours();
  let min = date.getMinutes() - (date.getMinutes() % 15);
  return { index: hour * 4 + min / 15, time: `${hour}:${min}` };
  //return hour * 4 + min / 15;
}

function createPredictiveDayDoc(day, currentAPCount) {
  let timesWeldon = [24 * 4];
  let timesTaylor = [24 * 4];
  let time = "";
  for (let i = 0; i < 24 * 4; i++) {
    time = Math.floor(i / 4) + ":" + (i % 4) * 15;
    timesWeldon[i] = {};
    timesWeldon[i].time = time;
    timesWeldon[i].totalCount = 0;
    timesWeldon[i].floors = currentAPCount.weldon.floors;

    timesTaylor[i] = {};
    timesTaylor[i].time = time;
    timesTaylor[i].totalCount = 0;
    timesTaylor[i].floors = currentAPCount.taylor.floors;
  }

  let avgVal = new capacityAvg({
    _id: day,
    weldon: {
      times: timesWeldon
    },
    taylor: {
      times: timesTaylor
    }
  });
  return avgVal;
}

async function UpdatePredictiveTable(currentAPCount, alpha) {
  const weekday = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];
  try {
    let date = currentAPCount.timestamp;

    // could be affected by daylight savings time.
    // might need to be handled more properly
    date.setHours(date.getUTCHours() - 4);

    let day = weekday[date.getDay()];
    let timeSlot = getTimeSlot(date);

    let avgVal = await capacityAvg.findById(day);

    if (avgVal == null) {
      avgVal = createPredictiveDayDoc(day, currentAPCount);
    }

    avgVal.weldon.times[timeSlot.index].totalCount = movingAverage(
      avgVal.weldon.times[timeSlot.index].totalCount,
      currentAPCount.weldon.totalCount,
      alpha
    );

    //calculate weldon average per floor for this timeslot
    avgVal.weldon.times[timeSlot.index].floors.forEach(function(
      curAvgPerFloor,
      index
    ) {
      curAvgPerFloor.count = movingAverage(
        curAvgPerFloor.count,
        currentAPCount.weldon.floors[index].count,
        alpha
      );
    });

    avgVal.taylor.times[timeSlot.index].totalCount = movingAverage(
      avgVal.taylor.times[timeSlot.index].totalCount,
      currentAPCount.taylor.totalCount,
      alpha
    );

    //calculate taylor average per floor for this timeslot
    avgVal.taylor.times[timeSlot.index].floors.forEach(function(
      curAvgPerFloor,
      index
    ) {
      curAvgPerFloor.count = movingAverage(
        curAvgPerFloor.count,
        currentAPCount.taylor.floors[index].count,
        alpha
      );
    });

    await avgVal.save();
  } catch (e) {
    console.error(e);
  }
}

async function main(params) {
  try {
    mongoose.connect(params.mongo_connection_string, { useNewUrlParser: true });

    const currentAPCountsPromise = await APCount.find({})
      .sort({ timestamp: -1 })
      .limit(1);

    await UpdatePredictiveTable(currentAPCountsPromise[0], params.alpha);
  } catch (e) {
    console.error(e);
  } finally {
    mongoose.connection.close();
  }
}

exports.main = main;
