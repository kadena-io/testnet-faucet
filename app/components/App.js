import React from 'react';
import CallPact from "./CallPact";
import { Grid, Image } from "semantic-ui-react";

function App() {
  return (
    <div className="App">
      <Grid columns={2} verticalAlign='middle'>
        <Grid.Column style={{backgroundColor: "#B74FA4"}}>
          <div className="App-header" onClick={() => window.location.href = "http://testnet.chainweb.com"}>
            <Image src={"/logo_blurred.jpg"} fluid={true} />
          </div>
        </Grid.Column>
        <Grid.Column>
          <CallPact />
        </Grid.Column>
      </Grid>

    </div>
  );
}

export default App;
