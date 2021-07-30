import React from 'react';
import intl from 'react-intl-universal';
import styles from '../css/plugin-layout.module.css';

class AddColumn extends React.Component {

  addColumn = () => {
    let { configSetting } = this.props;
    if (this.isActive()) {
      this.props.onSelectChange(configSetting.type);
    }
  }

  isActive = () => {
    const activeColumn = this.props.configSettings[2].active;
    return activeColumn !== intl.get('Select_a_column');
  }

  render() {
    return (
      <button onClick={this.addColumn} disabled={!this.isActive()} className={`border-0 p-0 ${styles['add-column']}`}>
        <span className={`dtable-font dtable-icon-add-table mr-1 ${styles['add-column-icon']}`}></span>
        <span>{intl.get('Add_new_column')}</span>
      </button>
    );
  }
}

export default AddColumn;
