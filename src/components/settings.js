import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SettingItem from './setting-item';
import intl from 'react-intl-universal';
import styles from '../css/plugin-layout.module.css';

const propTypes = {
  configSettings: PropTypes.array,
  onSelectChange: PropTypes.func,
};

class Settings extends Component {

  onSelectChange = (option, type) => {
    this.props.onSelectChange(option, type);
  }

  render() {
    const { configSettings, } = this.props;
    return (
      <div className={styles['dtable-plugin-settings']}>
        <div className={styles['dtable-plugin-settings-header']}>
          <span>{intl.get('Settings')}</span>
        </div>
        <div className={styles['dtable-plugin-settings-parameter']}>
          {configSettings && configSettings.map(configSetting => {
            return (
              <SettingItem
                key={configSetting.type}
                configSetting={configSetting}
                onSelectChange={this.onSelectChange}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

Settings.propTypes = propTypes;

export default Settings;