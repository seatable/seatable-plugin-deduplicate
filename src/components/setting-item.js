import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from './select';
import styles from '../css/plugin-layout.module.css';

const propTypes = {
  configSetting: PropTypes.object,
  onSelectChange: PropTypes.func,
};

class SettingItem extends Component {

  createOptions = () => {
    let { configSetting } = this.props;
    return configSetting.settings.map(option => {
      return this.createOption(option);
    });
  }

  createOption = (option) => {
    return ({
      label: (<span className='select-option-name'>{option.name}</span>),
      value: { name: option.name },
    });
  }

  onSelectChange = (option) => {
    let { configSetting } = this.props;
    this.props.onSelectChange(configSetting.type, option);
  }

  render() {
    let { configSetting } = this.props;
    let { name, active, settings } = configSetting;
    let activeOption = settings.find(setting => setting.name === active);
    return (
      <div className={styles['dtable-plugin-settings-item']}>
        <div className={styles['dtable-plugin-settings-title']}>{name}</div>
        <Select
          className="dtable-plugin-select"
          value={this.createOption(activeOption)}
          options={this.createOptions()}
          onSelectOption={this.onSelectChange}
        />
      </div>
    );
  }
}

SettingItem.propTypes = propTypes;

export default SettingItem;
