module.exports = function loadAfterAuth() {
  try {
    return require('atempo-sdk').afterAuth
  } catch {
    return require('../dist').afterAuth
  }
}
