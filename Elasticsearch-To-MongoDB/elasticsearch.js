const elasticsearch = require('elasticsearch');

// fetch data from last 7 minutes
const FETCH_DATA_EVERY = '7m';

// keep scroll open for 10 seconds
const SCROLL_DURATION = '10s';

/**
 * Use the es scroll API to scroll through all documents added in last X min
 * and insert into our mongodb
 */
function fetchLatestESData(params) {
  const es = new elasticsearch.Client({
    host: params.es_host,
    httpAuth: params.es_httpAuth
  });

  return new Promise((resolve, reject) => {
    let allRecords = [];

    es.search(
      {
        scroll: SCROLL_DURATION,
        body: {
          query: {
            range: {
              '@timestamp': {
                gte: `now-${FETCH_DATA_EVERY}`,
                lt: 'now'
              }
            }
          }
        }
      },
      function fetchMoreUntilDone(error, response) {
        if (error) {
          es.close();
          return reject(error);
        }

        response.hits.hits.forEach(function(hit) {
          allRecords.push(hit);
        });

        if (response.hits.total !== allRecords.length) {
          // now we can call scroll over and over
          es.scroll(
            {
              scrollId: response._scroll_id,
              scroll: SCROLL_DURATION
            },
            fetchMoreUntilDone
          );
        } else {
          es.close();
          return resolve(allRecords);
        }
      }
    );
  });
}

module.exports = { fetchLatestESData };
