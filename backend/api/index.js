const app = require('../src/app')

// Export the Express app for Vercel serverless deployment
module.exports = (req, res) => {
  app(req, res)
}
