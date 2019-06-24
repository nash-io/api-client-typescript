// Endpoint of the central account service.
export const CAS_URL = process.env.CAS_URL || 'http://localhost:4001';

// Endpoint of the GQL server.
export const GQL_URL =
  process.env.GQL_URL || 'http://localhost:4000/api/graphql/explore';

// Log additional debug information when set to true.
export const DEBUG = true;

// Salt which is empty for now. Changing this will cause issues DO NOT TOUCH.
export const SALT = '';
