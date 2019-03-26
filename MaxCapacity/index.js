require('dotenv').config();
const mongoose = require('mongoose');
const { APCount, MaximumAPCount } = require('./models/APCount');

const NUMBER_OF_DOCS_TO_USE =
  Number.parseInt(process.env.NUMBER_OF_DOCS_TO_USE) || 20;

async function calculateMaximumForLibrary(libraryName, docStructure) {
  // find the X number of documents with the largest total count of people in the library
  const largestDocuments = await APCount.find({})
    .sort({ [`${libraryName}.totalCount`]: 'desc' })
    .limit(NUMBER_OF_DOCS_TO_USE);

  // We want to just look at the given librarys capacity not the other librarys
  const libraryMaximums = largestDocuments.map(doc => doc[libraryName]);

  // Sum the total people count and the count by each floor for all the largest documents
  const libMaximumCapacity = libraryMaximums.reduce((acc, curr) => {
    acc.totalCount += curr.totalCount;
    curr.floors.forEach((floor, i) => {
      acc.floors[i].count += floor.count;
    });

    return acc;
  }, docStructure);

  // divide by the number of documents to find the average and then round
  //  to find an estimate of the total maximum capacity of a library
  libMaximumCapacity.totalCount /= NUMBER_OF_DOCS_TO_USE;
  libMaximumCapacity.totalCount = Math.ceil(libMaximumCapacity.totalCount);

  libMaximumCapacity.floors.forEach(floor => {
    floor.count /= NUMBER_OF_DOCS_TO_USE;
    floor.count = Math.ceil(floor.count);
    floor.count = Math.max(floor.count, 5); // set capacity to at least 5
  });

  return libMaximumCapacity;
}

async function main() {
  mongoose.connect(process.env.MONGO_DB_CONNECTION, {
    useNewUrlParser: true
  });

  const taylorMaximumCapacityPromise = calculateMaximumForLibrary('taylor', {
    totalCount: 0,
    floors: [
      { name: 'Level 1', count: 0 },
      { name: 'Level 2', count: 0 },
      { name: 'Level 3', count: 0 },
      { name: 'Stacks 1', count: 0 },
      { name: 'Stacks 2', count: 0 },
      { name: 'Stacks 3', count: 0 },
      { name: 'Stacks 4', count: 0 },
      { name: 'Stacks 5', count: 0 },
      { name: 'Stacks 6', count: 0 }
    ]
  });

  const weldonMaximumCapacityPromise = calculateMaximumForLibrary('weldon', {
    totalCount: 0,
    floors: [
      { name: 'Level G', count: 0 },
      { name: 'Level 1', count: 0 },
      { name: 'Level 2', count: 0 },
      { name: 'Level 3', count: 0 },
      { name: 'Level 4', count: 0 },
      { name: 'Level 5', count: 0 }
    ]
  });

  const [taylorMaximumCapacity, weldonMaximumCapacity] = await Promise.all([
    taylorMaximumCapacityPromise,
    weldonMaximumCapacityPromise
  ]);

  const query = {};

  await MaximumAPCount.findOneAndUpdate(
    query,
    {
      timestamp: new Date(),
      taylor: taylorMaximumCapacity,
      weldon: weldonMaximumCapacity
    },
    { upsert: true }
  );

  mongoose.connection.close();
}

main();
