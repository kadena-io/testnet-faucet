'use strict';
var fs = require("fs")
var Pact = require("./pact-lang-api.js")

var faucetModule = fs.readFileSync("./faucet-contract/testnet-faucet.pact", 'utf-8')
var {faucetOpKP, devnetAcct, devnetKp, faucetAcct} = require("./src-acct.js")

const creationTime = () => Math.round((new Date).getTime()/1000)-15
const deployFaucet = {
  pactCode: faucetModule,
  keyPairs: {...devnetKp, clist: [{name: "coin.GAS", args: []}, {
    name: "coin.TRANSFER",
    args: [devnetAcct, faucetAcct, 100000]
  }, {
    name: "coin.TRANSFER",
    args: [devnetAcct, faucetOpKP, 20]
  }]},
  envData: {
    "operation-keyset":
      [faucetOpKP.publicKey]
  },
  meta: Pact.lang.mkMeta(devnetAcct, "0", 0.000001, 100000, creationTime(), 28800),
  nonce: "Deploy Faucet and create accounts",
  networkId: "testnet02"
}

//DEPLOY FAUCET CONTRACT
Pact.fetch.send(deployFaucet, apiHost).then(result => {
  console.log(result)
  Pact.fetch.listen({listen: result.requestKeys[0]}, apiHost).then(console.log)
})
