'use strict';

const https = require ('https');
const fs = require('fs')
const gql = require ('graphql/utilities');


const abort = err => {
  process.stderr.write (err.message + '\n');
  process.exit (1);
};

const opts = {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
};

https.request (process.argv[2], opts, res => {
  let body = '';
  res
  .setEncoding ('utf8')
  .on ('data', chunk => { body += chunk; })
  .on ('end', () => {
    try {
      process.stdout.write (
        gql.printSchema (
          gql.lexicographicSortSchema (
            gql.buildClientSchema (
              (JSON.parse (body)).data
            )
          )
        )
      );
    } catch (err) {
      abort (err);
    }
  });
})
.on ('error', abort)
.end (JSON.stringify ({query: gql.introspectionQuery}));
