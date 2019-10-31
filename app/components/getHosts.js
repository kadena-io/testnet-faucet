const getHost = async function() {
  const knownHosts = ["us1", "us2", "eu1", "eu2", "ap1", "ap2"];
  const workingHosts = [];
  async function timeout(ms, promise) {
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        reject(new Error("timeout"))
      }, ms)
      promise.then(resolve, reject)
    })
  }
  for (let i=0; i < knownHosts.length; i++) {
    await timeout(500, fetch(`https://${knownHosts[i]}.testnet.chainweb.com/health-check`)).then(function(response) {
        workingHosts.push(knownHosts[i])
        return workingHosts
      }).catch(function(error) {
      })
  }
  return workingHosts;
}

export default getHost;
