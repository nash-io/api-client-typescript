// Endpoint of the central account service.
// Endpoint of the GQL server.
export const GQL_URL =
  process.env.GQL_URL || 'http://localhost:4000/api/graphql'

export const MATCHING_ENGINE_WS_URL =
  process.env.WS_URL || 'http://localhost:4000/api/socket'

// Log additional debug information when set to true.
export const DEBUG = true

// Salt which is empty for now. Changing this will cause issues DO NOT TOUCH.
export const SALT = ''
