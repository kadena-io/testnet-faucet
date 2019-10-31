import React from 'react';
import { Form, Popup, Icon, Input, List, Dropdown, Button } from 'semantic-ui-react';

const CreateAccount = (props) => {
  return (
    <div>
      <h4 className="ui header">
        <a id="arrow" onClick={() => props.changeStatus(undefined)} style={{color: "#B54FA3"}}>
          <Icon name='arrow left'/>
        </a>
          Back
      </h4>
      <Form>
        <h4>
          1. Open the Chainweaver Testnet desktop application
        </h4>
        <h4>
          2. Under the Wallet section, enter a unique Key Name name then select "Generate"
        </h4>
        <h4>
          3. Copy the public key generated for this new Key Name and paste below
        </h4>
        <Form.Field style={{width:"240px", margin: "0 auto", marginTop: 10}}>
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
              value={props.publicKey}
              onChange={props.onChangePublicKey}
              action={
                 <Button
                 icon="add"
                 onClick={() => props.addPublicKey()}
                 disabled={props.publicKey.length !== 64 || props.publicKeys.indexOf(props.publicKey)!==-1}
                 />
               }
            />
          </Form.Field>

          <List celled style={{overflowX: "auto"}}>
           {props.publicKeys.map(item => <List.Item icon='key' content={item} key={item}/>)}
          </List>

          {props.publicKeys.length > 1
          ?
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
               value={props.keysetPredicate}
               onChange={props.onChangeKeysetPredicate}
               options={["keys-all", "keys-any", "keys-2"].map(pred => ({key: pred, text: pred, value:pred}))}
             />
          </Form.Field>
           : ""}
        </Form.Field>
        <h4 style={{marginTop: 10}}>
          4. Give this public key a unique Account Name below<br/>(this can be the same as your Key Name, but it is not required)
        </h4>
        <Form.Field style={{width:"240px", margin: "0 auto", marginTop: 10}}>
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
          <Form.Input icon='user' iconPosition='left' placeholder='Account Name' onChange={props.onChangeAccountName} />
        </Form.Field>
      </Form>
      <Button
        className="welcome-button"
        disabled={props.chainId==="" || props.publicKeys.length===0 || props.status !== "notStarted" || props.accountName === ""}
        style={{
          marginBottom: 10,
          marginTop: 30,
          width: "240px",
          }}
        onClick={() => {
          props.fundCreateAccount();
        }}
      >
      Create and Fund Account
      </Button>
    </div>
  )
}
export default CreateAccount;
