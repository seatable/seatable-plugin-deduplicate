import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SettingItem from './setting-item';
import AddColumn from './add-new-column';
import DeDuplicationColumns from './deduplication-columns';
import intl from 'react-intl-universal';
import styles from '../css/plugin-layout.module.css';

const propTypes = {
  configSettings: PropTypes.array,
  onSelectChange: PropTypes.func,
};

class Settings extends Component {

  onSelectChange = (option, type, index) => {
    this.props.onSelectChange(option, type, index);
  }

  render() {
    const { configSettings, } = this.props;
    return (
      <div className={styles['dtable-plugin-settings']} onClick={this.props.hideDetailDialog}>
        <div className={styles['dtable-plugin-settings-header']}>
          <span>{intl.get('Settings')}</span>
        </div>
        <div className={styles['dtable-plugin-settings-parameter']}>
          {configSettings && configSettings.map(configSetting => {
            if (configSetting.type === 'add_column') {
              return (
                <AddColumn
                  onSelectChange={this.onSelectChange}
                  key={configSetting.type}
                  configSettings={configSettings}
                  configSetting={configSetting}
                />
              );
            }
            if (configSetting.type === 'multi_deduplication_column') {
              return (
                <DeDuplicationColumns
                  key={configSetting.type}
                  onSelectChange={this.onSelectChange}
                  configSetting={configSetting}
                />
              );
            }
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
