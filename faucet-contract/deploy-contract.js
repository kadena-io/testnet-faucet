'use strict';
var fs = require("fs")
var Pact = require("pact-lang-api")

var srcAcct = ""
var srcKp = {
  publicKey: "",
  secretKey: ""
}
var faucetOpAcct = 'faucet-operation'
var faucetOpKP = {
  publicKey: "",
  secretKey: ""
}

module.exports = {
  faucetOpKP: {
    publicKey: "7ecba83b579a2c9f380011e9404738478b3e3071cb2f35538215d41bc0c4d8b1",
    secretKey: "6f1f0db20a1b47ee8255715d289aa89a84e6b5bd387f4b2f982bf4cf98dc8e29"
  },
  devnetKp : {
    publicKey: '6be2f485a7af75fedb4b7f153a903f7e6000ca4aa501179c91a2450b777bd2a7',
    secretKey: '2beae45b29e850e6b1882ae245b0bab7d0689ebdd0cd777d4314d24d7024b4f7'
  },
  devnetAcct: "sender01",
  faucetOpAcct: "faucet-operation",
  faucetAcct: "coin-faucet"
}

var faucetModule = fs.readFileSync("./faucet-contract/testnet-faucet.pact", 'utf-8')
var node = "us1"
var chainId = "0";
const apiHost = `https://${node}.testnet.chainweb.com/chainweb/0.0/testnet02/chain/${chainId}/pact`
const creationTime = () => Math.round((new Date).getTime()/1000)-15

const deployFaucet = {
  pactCode: faucetModule,
  keyPairs: srcKp,
  meta: Pact.lang.mkMeta(srcAcct, "0", 0.000001, 100000, creationTime(), 28800),
  nonce: "Deploy Faucet",
  networkId: "testnet02"
}

//DEPLOY FAUCET CONTRACT
Pact.fetch.send(deployFaucet, apiHost).then(result => {
  console.log(result)
  Pact.fetch.listen({listen: result.requestKeys[0]}, apiHost).then(console.log)
})

//TRANSFER TO COIN FAUCET AND OPERATION
Pact.fetch.send({
  pactCode: `(use coin) \n(transfer-create '${srcAcct} 'coin-faucet (user.coin-faucet.faucet-guard) 10000.0) \n(transfer-create '${srcAcct} '${faucetOpAcct} (read-keyset 'operation-keyset) 20.0)`,
  keyPairs: {...srcKp, clist: [
    {name: "coin.GAS", args: []},
    {
    name: "coin.TRANSFER",
    args: [srcAcct, "coin-faucet", 10000.0]
    }, {
      name: "coin.TRANSFER",
      args: [srcAcct, faucetOpAcct, 20.0]
    }]},
  envData: {
    "operation-keyset": [faucetOpKP.publicKey]
  },
  meta: Pact.lang.mkMeta(srcAcct, "0", 0.000001, 100000, creationTime(), 28800),
  nonce: "Create accounts for Faucet",
  networkId: "testnet02"
  }, apiHost)
  .then(result => {
  console.log(result)
  Pact.fetch.listen({listen: result.requestKeys[0]}, apiHost).then(console.log)
})
