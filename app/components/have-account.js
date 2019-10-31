import React from 'react';
import { Form, Popup, Icon, Input, Button } from 'semantic-ui-react';
const HaveAccount = (props) => {
  return (
    <div>
      <h4 className="ui header">
        <a id="arrow" onClick={() => props.changeStatus(undefined)} style={{color: "#B54FA3"}}>
          <Icon name='arrow left'/>
        </a>Back<br/><br/>
         {props.haveAccount==="balance" ? "Check Your Balance" : "Enter your account name and the chain id on which your account was created"}
      </h4>
      <Form>

        <Form.Field className="fund-input"  style={{width:"240px", margin: "0 auto", marginTop: "10px"}}>
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
          <Form.Input style={{width:"240px"}} icon='user' iconPosition='left' placeholder='Account Name' onChange={props.onChangeAccountName} />
        </Form.Field>
        <Form.Field position="right" style={{width:"240px", margin: "0 auto", marginTop: "10px"}} >
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
            className="fund-input"
            value={props.chainId}
            placeholder='0'
            onChange={(event) => {props.setState({ chainId: event.target.value })}}
          />
        </Form.Field>
      </Form>
      {
        props.haveAccount==="fund"
        ?
        <Button
        className="welcome-button"
        disabled={props.chainId==="" || props.status !== "notStarted" || props.accountName===""}
        onClick={() => {
          props.fundAccount();
        }}
      >
      Fund Account 10 Coins
      </Button>
      :
      <Button
        className="welcome-button"
        disabled={props.chainId==="" || props.status !== "notStarted" || props.accountName===""}
        variant="contained"
        onClick={() => {
          props.accountBalance();
        }}
      >
      Check Account Balance
      </Button>
    }
    </div>
  )
}

export default HaveAccount;
