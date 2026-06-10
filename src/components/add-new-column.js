import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { Button } from 'reactstrap';

class AddColumn extends React.Component {

  static defaultProps = {
    readonly: false,
  };

  addColumn = () => {
    const { readonly, configSetting } = this.props;
    if (readonly) {
      return;
    }
    this.props.onSelectChange(configSetting.type);
  };

  render() {
    const {readonly} = this.props;

    return (
      <Button onClick={this.addColumn} color='filled' disabled={readonly}>
        <span className='dtable-font dtable-icon-add-table'></span>
        <span>{intl.get('Add_new_column')}</span>
      </Button>
    );
  }
}

AddColumn.propTypes = {
  readonly: PropTypes.bool,
  configSetting: PropTypes.object,
  onSelectChange: PropTypes.func,
};

export default AddColumn;
