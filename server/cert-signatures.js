// Compatibility file for newer Node.js versions
module.exports = {
  // Basic empty implementation that should satisfy imports
  verify: () => true,
  generate: () => Buffer.from([])
}; 