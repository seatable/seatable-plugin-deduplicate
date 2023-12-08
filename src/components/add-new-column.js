import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import styles from '../css/plugin-layout.module.css';

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
  }

  render() {
    const {readonly} = this.props;

    return (
      <button onClick={this.addColumn} className={`border-0 p-0 ${styles['add-column']} plugin-deduplicate-btn-add-column ${readonly ? 'readonly' : ''}`}>
        <span className={`dtable-font dtable-icon-add-table mr-1 ${styles['add-column-icon']}`}></span>
        <span>{intl.get('Add_column')}</span>
      </button>
    );
  }
}

AddColumn.propTypes = {
  readonly: PropTypes.bool,
};

export default AddColumn;
