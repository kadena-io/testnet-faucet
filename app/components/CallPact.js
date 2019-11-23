import React from 'react';
import { Button, Grid, Input, Icon, Form, List, Modal, Header, Message, Popup, Dropdown } from 'semantic-ui-react';
import axios from "axios"
import Pact from 'pact-lang-api';
import Fingerprint2 from "fingerprintjs2"
import HaveAccount from "./have-account.js"
import CreateAccount from "./create-account.js"
import Welcome from "./welcome.js"
import RequestStatus from "./request-status.js"
import ShowStatus from "./show-status.js"
import {faucetAcct, faucetOpKP, faucetOpAcct} from "./../../src-acct.js"
import getHost from "./getHosts.js"
const hosts = ["us1","us2","eu1","eu2","ap1","ap2"]
const chainIds = ["0"]
const createAPIHost = (network, chainId) => `https://${network}.testnet.chainweb.com/chainweb/0.0/testnet03/chain/${chainId}/pact`
const dumKeyPair = Pact.crypto.genKeyPair();
const createTime = () => Math.round((new Date).getTime()/1000)-15;

class CallPact extends React.Component {

  state = {
    publicKey: "",
    accountName: "",
    chainId: "0",
    host: 0,
    haveAccount: undefined,
    status: "notStarted",
    reqKey: "",
    modalOpen: false,
    modalMsg: "",
    modalHeader: "",
    modalError: "",
    lastVisit: null,
    fingerprint: null,
    signing: false,
    history: [],
    keysetPredicate: "keys-all",
    publicKeys: [],
    workingHosts: []
  }

  async componentWillMount() {
    await this.getWorkingHosts();
    this.fetchFingerprint();
  }

  onChangeAccountName = e => this.setState({accountName: e.target.value})

  onChangePublicKey = e => this.setState({publicKey: e.target.value})

  onChangeKeysetPredicate = (e, v) => {
    this.setState({keysetPredicate: v.value})
  }

  onChangeChainId = (e, v) => this.setState({chainId: v.value})

  handleOpen = () => this.setState({ modalOpen: true })

  handleClose = () => this.setState({ modalOpen: false, modalError: "" })

  changeStatus = status => {
    this.setState({
      publicKey: "",
      accountName: "",
      chainId: "0",
      host: 1,
      haveAccount: status,
      status: "notStarted",
      reqKey: "",
      publicKeys: []
    })
  }

  getWorkingHosts = async () => {
    const hosts = await getHost();
    console.log(hosts)
    this.setState({ workingHosts: hosts });
    if (hosts.length === 0) {
      alert("All nodes currently unavailable")
      window.location.reload();
    }
  }

  fetchAccountBalance = (acctName, apiHost) => {
    return Pact.fetch.local({
      pactCode: `(coin.get-balance ${JSON.stringify(acctName)})`,
      keyPairs: dumKeyPair,
    }, apiHost)
  }

  fundCreateAccount = async () => {
    const accountCheck = await this.fetchAccountBalance(this.state.accountName, createAPIHost(hosts[0], this.state.chainId))
    const timePassed = (new Date() - this.state.lastRequest)/60000;
    if (this.state.lastRequest !== null && timePassed < 30) {
      this.setState({ modalMsg: `You've received coin ${Math.round(timePassed)} minutes ago. Try again in ${Math.round(30-timePassed)} minutes`, modalHeader: 'WAIT'})
      this.handleOpen();
    }
    else if (accountCheck.status==="success") {
      this.setState({ modalMsg: `Account ${this.state.accountName} already exists on chain ${this.state.chainId}`, modalHeader: 'EXISTING ACCOUNT'})
      this.handleOpen();
    }
    else {
      this.setState({status: "started"});
      const reqKey = await Pact.fetch.send({
        networkId: "testnet03",
        pactCode:`(user.coin-faucet.create-and-request-coin ${JSON.stringify(this.state.accountName)} (read-keyset 'fund-keyset) 10.0)`,
        keyPairs: [{...faucetOpKP, clist: {name: "coin.GAS", args: []}}, {...Pact.crypto.genKeyPair(), clist: {name: "coin.TRANSFER", args: [faucetAcct, this.state.accountName, 10.0]}}],
        envData: {"fund-keyset": {"pred": this.state.keysetPredicate, "keys": this.state.publicKeys}},
        meta: Pact.lang.mkMeta(faucetOpAcct,this.state.chainId,0.00000001,10000,createTime(),28800)}, createAPIHost(hosts[0], this.state.chainId))
      if (reqKey) {
        this.saveFingerprint();
        this.fetchFingerprint();
        this.setState({status: "waiting"})
        this.setState({reqKey: reqKey.requestKeys[0]})
      }
    }
  }

  fundAccount = async () => {
      const accountCheck = await this.fetchAccountBalance(this.state.accountName, createAPIHost(hosts[0], this.state.chainId));
      const timePassed = (new Date() - this.state.lastRequest)/60000;
      if (this.state.lastRequest !== null && timePassed < 30) {
          this.setState({ modalMsg: `You've received coin ${Math.round(timePassed)} minutes ago. Try again in ${Math.round(30-timePassed)} minutes`, modalHeader: 'WAIT'})
          this.handleOpen();
      }
      else if (accountCheck.status==="failure") {
        this.setState({ modalMsg: `Account ${this.state.accountName} does not exist on chain ${this.state.chainId}`, modalHeader: 'NO ACCOUNT'})
        this.handleOpen();
      }
      else {
        this.setState({status: "started"})
        const reqKey = await Pact.fetch.send({
          networkId: "testnet03",
          pactCode:`(user.coin-faucet.request-coin ${JSON.stringify(this.state.accountName)} 10.0)`,
          keyPairs: [{...faucetOpKP, clist: {name: "coin.GAS", args: []}}, {...Pact.crypto.genKeyPair, clist: {name: "coin.TRANSFER", args: [faucetAcct, this.state.accountName, 10.0]}}],
          meta: Pact.lang.mkMeta(faucetOpAcct,this.state.chainId, 0.0000000001,10000,createTime(),28800)
        }, createAPIHost(hosts[0], this.state.chainId))
        if (reqKey) {
          this.saveFingerprint();
          this.fetchFingerprint();
          this.setState({status: "waiting"})
          this.setState({reqKey: reqKey.requestKeys[0]})
        }
      }
    }

  checkSuccess = reqKey => {
    let prepareMsg, successMsg, failureMsg;
    if (this.state.haveAccount==="donate") {
      prepareMsg = "We're receiving your donation...";
      successMsg = "Thank you for your donation!";
      failureMsg = "We had trouble receiving your donation. Please try again!";
    } else {
      prepareMsg = "We're preparing the coin...";
      successMsg = `10 coins are funded to ${this.state.accountName}!`;
      failureMsg = "Sorry, we couldn't fund your account";
    }

    Pact.fetch.poll({requestKeys: [reqKey]}, createAPIHost(hosts[0], this.state.chainId))
    .then(res => {
      if (!res[0]) {
        this.setState({ modalMsg: prepareMsg, modalHeader: 'TX PENDING'})
        this.handleOpen();
      }
      else if (res[0].result.status==="success") {
        this.setState({ modalMsg: successMsg, modalHeader: 'TX SUCCESS'})
        this.handleOpen();
        this.setState({status: ""})}
      else if (res[0].result.status==="failure") {
        this.setState({ modalMsg: failureMsg, modalHeader: 'TX FAILURE', modalError: `ERROR: ${res[0].result.error.message}` })
        this.handleOpen();
        this.setState({status: ""})
      }
    })
  }

  accountBalance = () => {
    this.fetchAccountBalance(this.state.accountName, createAPIHost(hosts[0], this.state.chainId))
    .then(res => {
      if (res.status==="failure") {
        this.setState({ modalMsg: `Account ${this.state.accountName} does not exist on chain ${this.state.chainId}`, modalHeader: 'NO ACCOUNT'})
        this.handleOpen();
      }
      else{
        const balance =  typeof res.data==="object" ? res.data.hasOwnProperty("decimal") ? res.data["decimal"] : res.data["int"] : res.data;
        res.data.hasOwnProperty("decimal") ? res.data["decimal"] : res.data["int"];
        this.setState({ modalMsg: `${this.state.accountName} has ${balance} Faucet Coins on chain ${this.state.chainId}`, modalHeader: 'USER EXISTS'})
        this.handleOpen();
      }
    })
  }

  saveFingerprint = () => {
    const options = {canvas: true}
    Fingerprint2.get( options, function (components) {
        var values = components.map(function (component) { return component.value })
        const murmur = Fingerprint2.x64hash128(values.join(''), 31)
        axios.post('/api/fingerprint', {fingerprint: murmur, date: new Date().toISOString()})
    })
  }

  fetchFingerprint = () => {
    const options = {canvas: true}
    const self=this;
    //Get Fingerprint
    Fingerprint2.get( options, function (components) {
      var values = components.map(function (component) { return component.value })
      const murmur = Fingerprint2.x64hash128(values.join(''), 31)
      self.setState({fingerprint: murmur});
      //Get last Request Date
      axios.get(`/api/fingerprint/${murmur}`)
        .then(res => {
          return res.data
        })
        .then(data => {
          if (data.date) self.setState({lastRequest: new Date(data.date)})
          else self.setState({lastRequest: null})
      })
    })
  }

  returnCoins = async (amount) => {
    this.setState({status: "started", signing: true})
    const result = await Pact.wallet.sign(`(user.coin-faucet.return-coin ${JSON.stringify(this.state.accountName)} 1.0)`)
    if (result) {
      this.setState({signing:false})
    }
    const reqKey = await Pact.wallet.sendSigned(result, createAPIHost(this.state.workingHosts[this.state.host],this.state.chainId))
    if (reqKey) {
      this.setState({status: "waiting"})
      this.setState({reqKey: reqKey.requestKeys[0]})
    }
  }

  readHistory = async () => {
    const faucetHistory = await Pact.fetch.local({
      pactCode: '(user.coin-faucet.read-history)',
      keyPairs: dumKeyPair,
    }, createAPIHost(this.state.workingHosts[this.state.host], 0))
    this.setState({history: faucetHistory})
  }

  addPublicKey = () => {
    this.setState({publicKeys: [...this.state.publicKeys, this.state.publicKey]})
    this.setState({publicKey: ""})
  }


  showContent = (hosts) => {
    console.log(this.state)
    if (hosts.length > 0) {
      return (
        <div style={{ marginTop: 20 }}>
          <Grid textAlign='center'>
            {this.state.haveAccount===undefined
             ?
              <Welcome changeStatus = {this.changeStatus} />
             :
              <div className = "login-contaner">
               <h1 style={{fontSize: "4rem", marginBottom: "20px"}}> Kadena Testnet Faucet</h1>
                  {(this.state.haveAccount==="fund" || this.state.haveAccount==="balance")
                    ?
                    <HaveAccount
                      haveAccount={this.state.haveAccount}
                      changeStatus = {this.changeStatus}
                      accountName = {this.state.accountName}
                      chainId = {this.state.chainId}
                      status = {this.state.status}
                      onChangeAccountName = {this.onChangeAccountName}
                      setState = {this.setState}
                      fundAccount = {this.fundAccount}
                      accountBalance = {this.accountBalance}
                    />
                    :
                    <CreateAccount
                      changeStatus = {this.changeStatus}
                      onChangeAccountName= {this.onChangeAccountName}
                      onChangePublicKey = {this.onChangePublicKey}
                      onChangeKeysetPredicate = {this.onChangeKeysetPredicate}
                      accountName = {this.state.accountName}
                      publicKey = {this.state.publicKey}
                      publicKeys = {this.state.publicKeys}
                      chainId = {this.state.chainId}
                      status = {this.state.status}
                      keysetPredicate = {this.state.keysetPredicate}
                      addPublicKey = {this.addPublicKey}
                      fundCreateAccount = {this.fundCreateAccount}
                    />
                  }
               {this.state.status==="notStarted"
                 ? ""
                 : <ShowStatus
                     status={this.state.status}
                     signing={this.state.signing}
                     reqKey={this.state.reqKey}
                     checkSuccess = {this.checkSuccess}
                  />
                 }
              </div>
            }
          </Grid>
          {this.state.modalOpen === false
            ? <div/>
            : <RequestStatus
                modalOpen = {this.state.modalOpen}
                modalHeader = {this.state.modalHeader}
                modalMsg= {this.state.modalMsg}
                modalError = {this.state.modalError}
                handleClose= {this.handleClose}
                />
          }
        </div>
      );
    } else {
      return (
        <div>
          <h1 style={{fontSize: "4rem", marginBottom: "10px"}}>Connecting to an available node...</h1>
        </div>
      )
    }
  }

  render() {
   return (
     <div>
     {this.showContent(this.state.workingHosts)}
     </div>
  )
 }

}
export default CallPact;
