import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DtableSelect from 'dtable-ui-component/lib/DTableSelect';
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
      label: (<span className='select-option-name' style={(option && option.style) || {}}>{option && option.name}</span>),
      value: option && option.name,
    });
  }

  onSelectChange = (option) => {
    let { configSetting } = this.props;
    const selectedOption = { name: option.value };
    this.props.onSelectChange(configSetting.type, selectedOption);
  }

  render() {
    let { configSetting } = this.props;
    let { name, active, settings, placeholder } = configSetting;
    let activeOption = settings.find(setting => setting.name === active);
    return (
      <>
        <div className={styles['dtable-plugin-settings-option']}>
          <div className={styles['dtable-plugin-settings-title']}>{name}</div>
          <DtableSelect
            classNamePrefix="dtable-plugin-select"
            value={active ? this.createOption(activeOption) : null}
            options={this.createOptions()}
            onChange={this.onSelectChange}
            placeholder={placeholder || ''}
          />
        </div>
        {configSetting.type === 'view' && (
          <div className={styles['split-line']}></div>
        )}
      </>
    );
  }
}

SettingItem.propTypes = propTypes;

export default SettingItem;
