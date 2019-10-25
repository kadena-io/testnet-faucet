import React from 'react';
import { Button, Grid, Input, Icon, Form, List, Modal, Header, Message, Popup, Dropdown } from 'semantic-ui-react';
import axios from "axios"
import Pact from "./../../pact-lang-api.js";
import Fingerprint2 from "fingerprintjs2"
import {faucetAcct, faucetOpKP, faucetOpAcct, devnetKp} from "./../../src-acct.js"

const hosts = ["us1","us2","eu1","eu2","ap1","ap2"]
const chainIds = ["0"]
const createAPIHost = (network, chainId) => `https://${network}.testnet.chainweb.com/chainweb/0.0/testnet02/chain/${chainId}/pact`
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
    this.readHistory();
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
    const hosts = await Pact.network.host();
    console.log(hosts)
    this.setState({ workingHosts: hosts });
    if (hosts.length === 0) {
      alert("All nodes currently unavailable")
      window.location.reload();
    }
  }

  fetchAccountBalance = (acctName, apiHost) => {
    return Pact.fetch.local({
      networkId: "testnet02",
      pactCode: `(coin.get-balance ${JSON.stringify(acctName)})`,
      keyPairs: dumKeyPair,
    }, apiHost)
  }

  fundCreateAccount = async () => {
    const accountCheck = await this.fetchAccountBalance(this.state.accountName, createAPIHost(this.state.workingHosts[this.state.host], this.state.chainId))
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
        networkId: "testnet02",
        pactCode:`(coin-faucet.create-and-request-coin ${JSON.stringify(this.state.accountName)} (read-keyset 'fund-keyset) 10.0)`,
        keyPairs: [{...faucetOpKP, clist: {name: "coin.GAS", args: []}}, {...devnetKp, clist: {name: "coin.TRANSFER", args: [faucetAcct, this.state.accountName, 10.0]}}],
        envData: {"fund-keyset": {"pred": this.state.keysetPredicate, "keys": this.state.publicKeys}},
        meta: Pact.lang.mkMeta(faucetOpAcct,this.state.chainId,0.00000001,10000,createTime(),28800)}, createAPIHost(this.state.workingHosts[this.state.host], this.state.chainId))
      if (reqKey) {
        this.saveFingerprint();
        this.fetchFingerprint();
        this.setState({status: "waiting"})
        this.setState({reqKey: reqKey.requestKeys[0]})
      }
    }
  }

  fundAccount = async () => {
      const accountCheck = await this.fetchAccountBalance(this.state.accountName, createAPIHost(this.state.workingHosts[this.state.host], this.state.chainId));
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
          networkId: "testnet02",
          pactCode:`(coin-faucet.request-coin ${JSON.stringify(this.state.accountName)} 10.0)`,
          keyPairs: [{...faucetOpKP, clist: {name: "coin.GAS", args: []}}, {...devnetKp, clist: {name: "coin.TRANSFER", args: [faucetAcct, this.state.accountName, 10.0]}}],
          meta: Pact.lang.mkMeta(faucetOpAcct,this.state.chainId, 0.0000000001,10000,createTime(),28800)
        }, createAPIHost(this.state.workingHosts[this.state.host], this.state.chainId))
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

    Pact.fetch.poll({requestKeys: [reqKey]}, createAPIHost(this.state.workingHosts[this.state.host], this.state.chainId))
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
    this.fetchAccountBalance(this.state.accountName, createAPIHost(this.state.workingHosts[this.state.host], this.state.chainId))
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
    const result = await Pact.wallet.sign(`(coin-faucet.return-coin ${JSON.stringify(this.state.accountName)} 1.0)`)
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
      pactCode: '(coin-faucet.read-history)',
      keyPairs: dumKeyPair,
    }, createAPIHost(this.state.workingHosts[this.state.host], 0))
    this.setState({history: faucetHistory})
  }

  addPublicKey = () => {
    this.setState({publicKeys: [...this.state.publicKeys, this.state.publicKey]})
    this.setState({publicKey: ""})
  }


  showContent = (hosts) => {
    if (hosts.length > 0) {
      return (
        <div style={{ marginTop: 20 }}>
          <Grid textAlign='center'>
          {this.state.haveAccount===undefined
           ?
            <div  className = "login-conainer">
              <h1 style={{fontSize: "4rem", marginBottom: "15px"}}> <br/>Kadena Testnet Faucet</h1>

              <Button
                className="welcome-button"
                size='big'
                onClick={() => this.changeStatus(false)}
              >
               Create Account
              </Button>

              <Button
                className="welcome-button"
                size='big'
                onClick={() => this.changeStatus(true)}
              >
               Fund Account
              </Button>
              </div>
           :
            <div className = "login-contaner">
             <h1 style={{fontSize: "4rem", marginBottom: "10px"}}> Kadena Testnet Faucet</h1>
              <Form>
                {this.state.haveAccount===true ?
                <div>
                <h4 className="ui header">
                  <a id="arrow" onClick={() => this.changeStatus(undefined)} style={{color: "#B54FA3"}}>
                    <Icon name='arrow left'/>
                  </a>
                    Enter your Account Name and the Chain ID on which your Account was created
                </h4>

                 <Form.Field style={{width:"240px", margin: "0 auto", marginTop: "10px"}}>
                   <label>Account Name
                     <Popup
                      trigger={
                        <Icon name='help circle' style={{"marginLeft": "2px"}}/>
                      }
                      position='top center'
                     >
                       <Popup.Header>What is an Account Name? </Popup.Header>
                       <Popup.Content>Account name is how you identify yourself in testnet. You'll be asked to sign with associated key/keys when you make transactions. Keep this in a safe place to play games, transfer coins, or make any other transactions!</Popup.Content>
                     </Popup>
                   </label>
                   <Form.Input icon='user' iconPosition='left' placeholder='Account Name' onChange={this.onChangeAccountName} />
                 </Form.Field>
                 <Form.Field position="right" style={{width:"240px", margin: "0 auto", marginTop: 10}} >
                   <label>Chain ID
                   <Popup
                     trigger={
                       <Icon name='help circle' style={{"marginLeft": "2px"}}/>
                     }
                     position='top center'
                     style={{width: "400px"}}
                    >
                     <Popup.Header>What is Chain ID?</Popup.Header>
                      <Popup.Content>It is the ID for the chain you want to transact with on Chainweb. Having multiple chains is an integral part of Chainweb's design</Popup.Content>
                    </Popup>
                   </label>
                   <Input
                     value={this.state.chainId}
                     placeholder='0'
                     onChange={(event) => {this.setState({ chainId: event.target.value })}}
                   />
                 </Form.Field>
                  <Button
                    className="welcome-button"
                    disabled={this.state.chainId==="" || this.state.status !== "notStarted" || this.state.accountName===""}
                    style={{
                      marginBottom: 10,
                      marginTop: 20,
                      width: "240px"
                   }}
                    onClick={() => {
                      this.fundAccount();
                    }}
                  >
                   Fund Account 10 Coins
                  </Button><br/>
                    <Button
                      className="welcome-button"
                      disabled={this.state.chainId==="" || this.state.status !== "notStarted" || this.state.accountName===""}
                      variant="contained"
                      style={{
                        marginBottom: 10,
                        marginTop: 10,
                        width: "240px"
                      }}
                      onClick={() => {
                        this.accountBalance();
                      }}
                    >
                      Check Account Balance
                    </Button>
                  </div>
              :
                <div>
                  <h4 className="ui header">
                    <a id="arrow" onClick={() => this.changeStatus(undefined)} style={{color: "#B54FA3"}}>
                      <Icon name='arrow left'/>
                    </a>
                      Back
                  </h4>
                  <h4>
                    1. Download the wallet from our <a href="http://testnet.chainweb.com">homepage</a>
                  </h4>
                  <h4>
                    2. Install the .dmg file and open the app
                  </h4>
                  <h4>
                    3. Go to the bottom of the right panel under "Accounts"
                  </h4>
                  <h4>
                    4. Select the Chain ID and a unique account name, then press "Create"
                  </h4>
                  <div>
                  <Form.Field style={{width:"240px", margin: "0 auto", marginTop: "10px"}}>
                    <label>Account Name
                      <Popup
                       trigger={
                         <Icon name='help circle' style={{"marginLeft": "2px"}}/>
                       }
                       position='top center'
                      >
                        <Popup.Header>What is an Account Name? </Popup.Header>
                        <Popup.Content>Account name is how you identify yourself in testnet. You'll be asked to sign with associated key/keys when you make transactions. Keep this in a safe place to play games, transfer coins, or make any other transactions!</Popup.Content>
                      </Popup>
                    </label>
                    <Form.Input icon='user' iconPosition='left' placeholder='Account Name' onChange={this.onChangeAccountName} />
                  </Form.Field>
                  <Form.Field style={{width:"240px", margin: "0 auto", marginTop: "10px"}}>
                   <Form.Field>
                    <label>Public Key
                      <Popup
                        trigger={
                          <Icon name='help circle' style={{"marginLeft": "2px"}}/>
                        }
                        position='top center'
                        style={{width: "400px"}}
                       >
                        <Popup.Header>What is a Public Key?</Popup.Header>
                         <Popup.Content>A keypair is composed of a public key and a private key. This public key will be associated your account. When you make transactions with this account, you'll need to sign with both public and private key in your Wallet. If you don't have a keypair, generate one in Kadena Wallet. </Popup.Content>
                       </Popup>
                     </label>
                     <Input
                       placeholder='Public Key'
                       icon="key"
                       iconPosition="left"
                       value={this.state.publicKey}
                       onChange={this.onChangePublicKey}
                        action={
                          <Button
                          icon="add"
                          onClick={() => this.addPublicKey()}
                          disabled={this.state.publicKey.length !== 64 || this.state.publicKeys.indexOf(this.state.publicKey)!==-1}
                        />}
                      />
                   </Form.Field>

                    <List celled style={{overflowX: "auto"}}>
                    {this.state.publicKeys.map(item => <List.Item icon='key' content={item} key={item}/>)}
                    </List>
                    {this.state.publicKeys.length>1?
                      <Form.Field>
                        <label>Keyset Predicate
                          <Popup
                           trigger={
                             <Icon name='help circle' style={{"marginLeft": "2px"}}/>
                           }
                           position='top center'
                           style={{width: "400px"}}
                          >
                           <Popup.Header>What is a Keyset Predicate?</Popup.Header>
                            <Popup.Content>If you would like to use a multi-sig keyset, you need to choose a keyset predicate. A single-sig keyset defaults to the predicate, "keys-all".
                             <List style={{marginTop: "0.5px"}}>
                               <List.Item as="a">
                                 <List.Content>
                                   <List.Header>keys-all</List.Header>
                                   <List.Description>all keys are required to sign the account</List.Description>
                                 </List.Content>
                               </List.Item>
                               <List.Item as="a">
                                 <List.Content>
                                 <List.Header>keys-any</List.Header>
                                 <List.Description>any of the keys can sign the account</List.Description>
                                 </List.Content>
                               </List.Item>
                               <List.Item as="a">
                                 <List.Content>
                                 <List.Header>keys-2</List.Header>
                                 <List.Description>more than 2 keys are required to sign the account</List.Description>
                                 </List.Content>
                               </List.Item>
                             </List>
                           </Popup.Content>
                          </Popup>
                        </label>
                        <Dropdown
                           selection
                           value={this.state.keysetPredicate}
                           onChange={this.onChangeKeysetPredicate}
                           options={["keys-all", "keys-any", "keys-2"].map(pred => ({key: pred, text: pred, value:pred}))}
                         />
                       </Form.Field>
                       :""}
                  </Form.Field>

                  <Button
                    className="welcome-button"
                    disabled={this.state.chainId==="" || this.state.publicKeys.length===0 || this.state.status !== "notStarted" || this.state.accountName === ""}
                    style={{
                      marginBottom: 10,
                      marginTop: 30,
                      width: "240px",
                      }}
                    onClick={() => {
                      this.fundCreateAccount();
                    }}
                  >
                   Create and Fund Account
                  </Button>

                  </div>
              </div>

             }
            </Form>
             {this.state.status==="notStarted"
               ? ""
               : this.state.status==="started"
                 ?
                 <Message style={{overflow: "auto", width: "240px", margin: "0 auto" }}>
                   {this.state.signing ? <Message.Header>Please sign with your wallet</Message.Header> : <Message.Header>Waiting for Request Key</Message.Header>}
                 </Message>
                 : <div style={{ marginTop: 10}}>
                      <Message style={{overflow: "auto", width: "240px", margin: "0 auto"}}>
                        <Message.Header >Your Request Key</Message.Header>
                        <p style={{fontSize: "10px"}}>
                          {this.state.reqKey}
                        </p>
                      </Message>

                      <Button
                        className="status-button"
                        onClick={() => this.checkSuccess(this.state.reqKey)}
                        style={{marginTop: "10px"}}>
                       Check Request Status
                      </Button>
                   </div>
               }
            </div>
          }
          </Grid>
          {this.state.modalOpen === false
          ? <div></div>
          :
          <div>
          <Modal
            open={this.state.modalOpen}
            onClose={this.handleClose}
            basic
            size='small'
          >
            <Header icon="exchange" content={this.state.modalHeader} />
            <Modal.Content>
              <h3>{this.state.modalMsg}</h3>
              <h3>{this.state.modalError}</h3>
              <Button
                color="green"
                onClick={this.handleClose}
                inverted
              >
                <Icon name="checkmark" /> Got it
              </Button>
            </Modal.Content>
            <Modal.Actions>

            </Modal.Actions>
          </Modal>
          </div>
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
