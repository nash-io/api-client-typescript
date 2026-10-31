'use strict';

const Nash = require('../../../build/main');

// Failing step name is attached by rails-kyc.js `step`.
module.exports = (label, error) => {
  const where = error && error.step ? ` at step "${error.step}"` : '';
  if (error instanceof Nash.RailsApiError) {
    return `${label} failed${where}: Rails HTTP ${error.status} (${error.code ||
      'no code'})\n  message: ${error.backendMessage ||
      '(none)'}\n  details: ${JSON.stringify(error.details, null, 2)}\n${
      error.stack
    }`;
  }
  return `${label} failed${where}: ${
    error instanceof Error ? error.stack : String(error)
  }`;
};
