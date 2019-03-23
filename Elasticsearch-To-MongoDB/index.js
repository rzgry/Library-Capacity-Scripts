const es = require('./elasticsearch');
const mongoose = require('mongoose');
const APCount = require('./models/APCount');
const Taylor = require('./ap_layouts/Taylor.json');
const Weldon = require('./ap_layouts/Weldon.json');

function sumCountByFloor(floorAPNames, sources) {
  return sources
    .filter(record => floorAPNames.includes(record.apname))
    .sort((a, b) => new Date(b['@timestamp']) - new Date(a['@timestamp']))
    .reduce((arr, curr) => {
      if (!arr.map(r => r.apname).includes(curr.apname)) {
        arr.push(curr);
      }
      return arr;
    }, [])
    .reduce((total, curr) => total + curr['User-count'], 0);
}

async function main(params) {
  try {
    mongoose.connect(params.mongo_connection_string, { useNewUrlParser: true });

    const latestEsRecords = await es.fetchLatestESData(params);

    const sources = latestEsRecords.map(record => record._source);

    const taylorCounts = {
      'Level 1': sumCountByFloor(Taylor['Level 1'], sources),
      'Level 2': sumCountByFloor(Taylor['Level 2'], sources),
      'Level 3': sumCountByFloor(Taylor['Level 3'], sources),
      'Stacks 1': sumCountByFloor(Taylor['Stacks 1'], sources),
      'Stacks 2': sumCountByFloor(Taylor['Stacks 2'], sources),
      'Stacks 3': sumCountByFloor(Taylor['Stacks 3'], sources),
      'Stacks 4': sumCountByFloor(Taylor['Stacks 4'], sources),
      'Stacks 5': sumCountByFloor(Taylor['Stacks 5'], sources),
      'Stacks 6': sumCountByFloor(Taylor['Stacks 6'], sources)
    };

    const weldonCounts = {
      'Level G': sumCountByFloor(Weldon['Level G'], sources),
      'Level 1': sumCountByFloor(Weldon['Level 1'], sources),
      'Level 2': sumCountByFloor(Weldon['Level 2'], sources),
      'Level 3': sumCountByFloor(Weldon['Level 3'], sources),
      'Level 4': sumCountByFloor(Weldon['Level 4'], sources),
      'Level 5': sumCountByFloor(Weldon['Level 5'], sources)
    };

    console.log('Taylor Library');
    Object.entries(taylorCounts).forEach(([name, count]) => {
      console.log(`${name}: ${count}`);
    });

    console.log('\nWeldon Library');
    Object.entries(weldonCounts).forEach(([name, count]) => {
      console.log(`${name}: ${count}`);
    });

    const taylor_total = Object.values(taylorCounts).reduce((t, c) => t + c, 0);
    const weldon_total = Object.values(weldonCounts).reduce((t, c) => t + c, 0);

    const currentAPCount = new APCount({
      timestamp: new Date(),
      taylor: {
        totalCount: taylor_total,
        floors: Object.entries(taylorCounts).map(([name, count]) => ({
          name,
          count
        }))
      },
      weldon: {
        totalCount: weldon_total,
        floors: Object.entries(weldonCounts).map(([name, count]) => ({
          name,
          count
        }))
      }
    });

    await currentAPCount.save();
  } catch (e) {
    console.error(e);
  } finally {
    mongoose.connection.close();
  }
}

exports.main = main;
