import React from 'react';
import intl from 'react-intl-universal';
import PropTypes from 'prop-types';
import { DTableSelect } from 'dtable-ui-component';
import styles from '../css/plugin-layout.module.css';

class DeDuplicationColumns extends React.Component {

  renderColumns() {
    let { configSetting } = this.props;
    const settings = configSetting.settings;

    return configSetting.active.map((columnName, index) => {
      let activeOption = settings.find(setting => setting.name === columnName);
      return (
        <div key={'deduplication-' + index} className={`${styles['deduplication-columns-select-item']} d-flex`}>
          <div className='w-100'>
            <DTableSelect
              classNamePrefix="deduplicate-column"
              value={this.createOption(activeOption)}
              options={this.createOptions()}
              onChange={(option) => this.onSelectChange(option, index)}
            />
          </div>
          <button type="button"
            aria-label={intl.get('Delete')}
            title={intl.get('Delete')}
            onClick={() => this.deleteColumn(index)}
            className={`border-0 p-0 ml-2 dtable-font dtable-icon-fork-number ${styles['column-delete-icon']}`}></button>
        </div>
      );
    });
  }

  createOptions = () => {
    let { configSetting } = this.props;
    const { settings } = configSetting;
    return Array.isArray(settings) ? settings.map(item => this.createOption(item)) : [];
  };

  createOption = (option) => {
    return ({
      label: (<span className='select-option-name'>{option.name}</span>),
      value: option.name,
    });
  };

  onSelectChange = (option, index) => {
    let { configSetting } = this.props;
    const { type, active } = configSetting;
    const selectedOption = { name: option.value };
    // If the column is already in the de-duplication column, do not add
    if (active.includes(option.value)) return;
    this.props.onSelectChange(type, selectedOption, index);
  };

  deleteColumn = (index) => {
    let { configSetting } = this.props;
    this.props.onSelectChange(configSetting.type, '', index);
  };

  render() {
    return(
      this.renderColumns()
    );
  }
}

DeDuplicationColumns.propTypes = {
  configSetting: PropTypes.object,
  onSelectChange: PropTypes.func,
};

export default DeDuplicationColumns;
