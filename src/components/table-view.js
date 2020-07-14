import React from 'react';
import intl from 'react-intl-universal';
import styles from '../css/plugin-layout.module.css';

class TableView extends React.Component {
  
  renderHeader = () => {
    return (
      <thead>
        <tr>
          <th>{intl.get('Name')}</th>
          <th>{intl.get('Count')}</th>
        </tr>
      </thead>
    );
  }

  renderBody = () => {
    let { duplicationData, selectedItem } = this.props;
    const keys = Object.keys(duplicationData);
    return keys.map((key, index) => {
      if (duplicationData[key].value > 1) {
        const currentItem = Object.assign({key: key}, duplicationData[key]);
        let content = key;
        if (key === 'null' || key === 'undefined') {
          content = intl.get('Empty');
        }
        return (
          <tr key={'line-' + index}>
            <td>
              {content}
            </td>
            <td onClick={(event) => this.props.clickCallback(event, currentItem)} className={styles['value-cell'] + " " + (currentItem.key === selectedItem.key ? styles['selected-cell'] : '')}><span>{currentItem.value}</span></td>
          </tr>
        )
      }
    });
  }

  renderDedupication = () => {
    return (
      <table>
        {this.renderHeader()}
        <tbody>
          {this.renderBody()}
        </tbody>
      </table>
    )
  }

  render() {
    const { duplicationData } = this.props;
    if (Object.keys(duplicationData).length === 0) {
      return <div className={styles['error-description']}>{intl.get('No_duplication')}</div>;
    } else {
      return this.renderDedupication();
    }
  }
}

export default TableView;