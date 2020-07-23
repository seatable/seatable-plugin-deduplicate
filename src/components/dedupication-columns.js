import React from 'react'
import Select from './select';
import styles from '../css/plugin-layout.module.css';

class DeDuplicationColumns extends React.Component {
  
  renderColumns() {
    
    let { configSetting } = this.props;
    const settings = configSetting.settings;

    return configSetting.active.map((columnName, index) => {
      let activeOption = settings.find(setting => setting.name === columnName);
      return (
        <div key={'deduplication-' + index} className={styles['deduplication-columns-select']}>
          <Select
            className="dtable-plugin-select"
            value={this.createOption(activeOption)}
            options={this.createOptions()}
            onSelectOption={(option) => this.onSelectChange(option, index)}
          />
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

  render() {
    return(
      this.renderColumns()
    );
  }
}

export default DeDuplicationColumns;