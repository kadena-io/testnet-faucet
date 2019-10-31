import React from 'react';
import { Modal, Header, Icon, Button } from 'semantic-ui-react';

const RequestStatus = (props) => {
  return (
    <Modal
      open={props.modalOpen}
      onClose={props.handleClose}
      basic
      size='small'
    >
      <Header icon="exchange" content={props.modalHeader} />
      <Modal.Content>
        <h3>{props.modalMsg}</h3>
        <h3>{props.modalError}</h3>
        <Button
          color="green"
          onClick={props.handleClose}
          inverted
        >
          <Icon name="checkmark" /> Got it
        </Button>
      </Modal.Content>
      <Modal.Actions>
      </Modal.Actions>
    </Modal>
  )}

export default RequestStatus;
