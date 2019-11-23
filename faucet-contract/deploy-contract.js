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
    publicKey: "",
    secretKey: ""
  },
  faucetOpAcct: "faucet-operation",
  faucetAcct: "coin-faucet"
}

var faucetModule = fs.readFileSync("./faucet-contract/testnet-faucet.pact", 'utf-8')
var node = "us1"
var chainId = "0";
const apiHost = `https://${node}.testnet.chainweb.com/chainweb/0.0/testnet03/chain/${chainId}/pact`
const creationTime = () => Math.round((new Date).getTime()/1000)-15

const createAdmins = {
  pactCode: `(coin.create-account 'contract-admins (read-keyset "contract-admins"))`,
  keyPairs: srcKp,
  envData: {
    "contract-admins": {
      "pred": "keys-any",
      "keys": [
          "",
          "",
          ""
      ]
    }
  },
  meta: Pact.lang.mkMeta(srcAcct, "0", 0.000001, 10000, creationTime(), 28800),
  nonce: "Create contract-admins",
  networkId: "testnet03"
}

//Create Contract Admins
const deployAdmins = async () => {
  Pact.fetch.send(createAdmins, apiHost).then(result => {
    console.log(result)
    Pact.fetch.listen({listen: result.requestKeys[0]}, apiHost).then(console.log)
  })
}

const deployFaucet = {
  pactCode: faucetModule,
  keyPairs: srcKp,
  meta: Pact.lang.mkMeta(srcAcct, "0", 0.000001, 100000, creationTime(), 28800),
  nonce: "Deploy Coin Faucet",
  networkId: "testnet03"
}

//DEPLOY FAUCET CONTRACT
const deployFaucet = async () => {
  Pact.fetch.send(deployFaucet, apiHost).then(result => {
    console.log(result)
    Pact.fetch.listen({listen: result.requestKeys[0]}, apiHost).then(console.log)
  })
}
//Fund Faucet and Faucet-operation commdand
const fundFaucet = {
  pactCode: `(use coin) \n(transfer-create 'contract-admins 'coin-faucet (user.coin-faucet.faucet-guard) 80000.0) \n(transfer-create 'contract-admins '${faucetOpAcct} (read-keyset 'operation-keyset) 20.0)`,
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
  networkId: "testnet03"
  }

//TRANSFER TO COIN FAUCET AND OPERATION
const deployFundFaucet = async () => {
  Pact.fetch.send(fundFaucet, apiHost)
    .then(result => {
    console.log(result)
    Pact.fetch.listen({listen: result.requestKeys[0]}, apiHost).then(console.log)
  })
}

const deployInOrder = async () => {
  await deployAdmins();
  await deployFaucet();
  await deployFundFaucet();
}

deployInOrder();
