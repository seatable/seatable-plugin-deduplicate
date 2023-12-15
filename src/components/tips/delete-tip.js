import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { FormGroup, Label, Input } from 'reactstrap';
import styles from '../../css/plugin-layout.module.css';

const propTypes = {
  onDelete: PropTypes.func.isRequired,
  toggle: PropTypes.func.isRequired
};

class DeleteTip extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      checked: 'first' // 'first', 'last'
    };
  }

  onInputChange = (e) => {
    this.setState({
      checked: e.target.value
    });
  };

  onDelete = () => {
    this.props.onDelete(this.state.checked);
  };

  render() {
    const { checked } = this.state;
    return (
      <div className={styles['delete-tip-container']}>
        <FormGroup check>
          <Label check>
            <Input type="radio" name="kept" value="first" checked={checked == 'first'} onChange={this.onInputChange} />
            <span>{intl.get('keep_first')}</span>
          </Label>
        </FormGroup>
        <FormGroup check>
          <Label check>
            <Input type="radio" name="kept" value="last" checked={checked == 'last'} onChange={this.onInputChange} />
            <span>{intl.get('keep_last')}</span>
          </Label>
        </FormGroup>
        <div className={styles['delete-tip-footer']}>
          <button className="btn btn-secondary mr-2" onClick={this.props.toggle}>{intl.get('Cancel')}</button>
          <button className="btn btn-primary" onClick={this.onDelete}>{intl.get('Delete')}</button>
        </div>
      </div>
    );
  }
}

DeleteTip.propTypes = propTypes;

export default DeleteTip;
