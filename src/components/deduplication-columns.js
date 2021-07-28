import React from 'react';
import intl from 'react-intl-universal';
import Select from './select';
import styles from '../css/plugin-layout.module.css';

class DeDuplicationColumns extends React.Component {

  renderColumns() {
    let { configSetting } = this.props;
    const settings = configSetting.settings;

    return configSetting.active.map((columnName, index) => {
      let activeOption = settings.find(setting => setting.name === columnName);
      return (
        <div key={'deduplication-' + index} className={`${styles['deduplication-columns-select']} d-flex`}>
          <Select
            className="dtable-plugin-select"
            value={this.createOption(activeOption)}
            options={this.createOptions()}
            onSelectOption={(option) => this.onSelectChange(option, index)}
          />
          <button type="button"
            aria-label={intl.get('Delete')}
            title={intl.get('Delete')}
            onClick={index => this.deleteColumn(index)}
            className={`border-0 p-0 ml-2 dtable-font dtable-icon-fork-number ${styles['column-delete-icon']}`}></button>
        </div>
      );
    });
  }

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

  onSelectChange = (option, index) => {
    let { configSetting } = this.props;
    this.props.onSelectChange(configSetting.type, option, index);
  }

  deleteColumn = (index) => {
    let { configSetting } = this.props;
    this.props.onSelectChange(configSetting.type, '', index);
  }

  render() {
    return(
      this.renderColumns()
    );
  }
}

export default DeDuplicationColumns;
