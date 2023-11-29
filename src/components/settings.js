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
  render() {
    const { configSettings, onSelectChange } = this.props;
    const firstColumnSetting = configSettings && configSettings[2];
    const hasSelectedFirstColumn = !!(firstColumnSetting && firstColumnSetting.active);
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
                  readonly={!hasSelectedFirstColumn}
                  onSelectChange={onSelectChange}
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
                  onSelectChange={onSelectChange}
                  configSetting={configSetting}
                />
              );
            }
            return (
              <SettingItem
                key={configSetting.type}
                configSetting={configSetting}
                onSelectChange={onSelectChange}
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
