import React from 'react';
import { Button } from 'semantic-ui-react';

const Welcome = (props) => {
  return (
    <div  className = "login-conainer">
      <h1 style={{fontSize: "4rem", marginBottom: "15px"}}> <br/>Kadena Testnet Faucet</h1>
      <Button
        className="welcome-page-button"
        size='big'
        onClick={() => props.changeStatus(false)}
      >
       Create Account
      </Button>
      <br/>
      <Button
        className="welcome-page-button"
        size='big'
        onClick={() => props.changeStatus("fund")}
      >
       Fund Account
      </Button>
      <br/>
      <Button
        className="welcome-page-button"
        size='big'
        onClick={() => props.changeStatus("balance")}
      >
       Check Balance
      </Button>
    </div>
  )
}

export default Welcome;
