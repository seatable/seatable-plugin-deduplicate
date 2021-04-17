
import React, { Fragment } from 'react';
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
      <Fragment>
        <div onClick={this.addColumn} className={styles['add-column'] + ' ' + (this.isActive() ? styles['active'] : '')}><span className={styles['column-item'] + ' dtable-font dtable-icon-add-table'}></span><span>{intl.get('Add_new_column')}</span></div>
      </Fragment>
    );
  }
}

export default AddColumn;
