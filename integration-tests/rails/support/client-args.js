'use strict';

const { EnvironmentConfiguration } = require('../../../build/main');

module.exports = function getClientArgs() {
  const envName = process.env.NASH_ENV || 'sandbox';
  const environment = EnvironmentConfiguration[envName];
  if (!environment) throw new Error(`Unknown NASH_ENV '${envName}'`);

  const railsApiUrl =
    process.env.NASH_RAILS_API_URL || 'https://rails.sandbox.nash.io/api/v1';
  return [
    {
      ...environment,
      host: process.env.NASH_HOST || 'app.arm-dev1.nash.io',
      railsApiUrl,
      isLocal:
        environment.isLocal ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/.test(railsApiUrl)
    },
    { runRequestsOverWebsockets: false }
  ];
};
