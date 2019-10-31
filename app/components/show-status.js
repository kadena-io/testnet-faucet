import React from 'react';
import { Modal, Message, Header, Icon, Button } from 'semantic-ui-react';

const ShowStatus = (props) => {
  console.log(props.reqKey)
  return (
    props.status==="started"
      ?
      <Message style={{overflow: "auto", width: "240px", margin: "0 auto" }}>
        {props.signing
          ? <Message.Header>Please sign with your wallet</Message.Header>
          : <Message.Header>Waiting for Request Key</Message.Header>}
      </Message>
      :
      <div style={{ marginTop: 10}}>
       <Message style={{overflow: "auto", width: "240px", margin: "0 auto"}}>
         <Message.Header >Your Request Key</Message.Header>
         <p style={{fontSize: "10px"}}>
           {props.reqKey}
         </p>
       </Message>

       <Button
         className="status-button"
         onClick={() => props.checkSuccess(props.reqKey)}
         style={{marginTop: "10px"}}>
        Check Request Status
       </Button>
     </div>
  )
}

export default ShowStatus;
