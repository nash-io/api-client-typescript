'use strict';

// Rails-only auth is the default; set NASH_RAILS_ONLY=0 to initialize GraphQL (client.login()).
module.exports = () => process.env.NASH_RAILS_ONLY !== '0';
