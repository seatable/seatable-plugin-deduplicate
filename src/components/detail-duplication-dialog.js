import React from 'react';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import TableView from './table-view';
import intl from 'react-intl-universal';
import moment from 'moment';
import DeleteRowDropdownMenu from './delete-component';
import styles from '../css/plugin-layout.module.css';
import CollaboratorFormatter from '../components/formatter/collaborator-formatter';

const UnShowColumnKeyList = ['0000', ''];
const UNSHOW_COLUME_TYPE = ['image', 'file', 'mutiple-select', 'long-text', 'geolocation', 'link']

class DetailDuplicationDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      showDialog: false,
    }
  }

  toggle = () => {
    this.setState({
      showDialog: !this.state.showDialog
    });
  }

  showDetailData = (e, selectedItem) => {
    this.props.setDetailData(selectedItem);
  }

  onRowDelete = (rowId) => {
    this.props.onRowDelete(rowId);
  }

  renderDetailData = () => {
    const { dtable, configSettings, selectedItem } = this.props;
    const table = dtable.getTableByName(configSettings[0].active);
    if (selectedItem.rows) {
      return selectedItem.rows.map((row, index, rows) => {
        return (
          <div key={'deduplication-record-' + index} className={styles["deduplication-record"]}>
            <div className={styles["deduplication-record-title"]}><div className={styles["deduplication-record-name"]}>{this.getRowName(row, table, index)}</div> <DeleteRowDropdownMenu row={row} onRowDelete={() => this.onRowDelete(row)}/></div>
            <div className={styles["deduplication-record-value"]}>{this.getRecord(row, table)}</div>
          </div>
        );
      });
    }

    return null;
  }

  getRowName = (rowId, table, index) => {
    const row = table['id_row_map'][rowId];
    let rowName = row['0000'] || '';
    return `${(index + 1) + '. '}${rowName}`;
  }

  getRecord = (rowIdx, table) => {
    let { columns } = table;
    const row = table['id_row_map'][rowIdx];
    return this.getRowRecord(row, columns, UnShowColumnKeyList);
  }

  getRowRecord = (row, columns, unShowColumnKeyList) => {
    let displayRow = [];
    columns.forEach((column) => {
      displayRow.push(
        this.getFormattedCell(column, row, unShowColumnKeyList)
      );
    });
    return displayRow;
  };

  getFormattedCell = (column, row, unShowColumnKeyList) => {
    let { key, name, type, data } = column;
    let { _id: rowId } = row;
    let value = row[key];
    let displayValue;
    let isNonEmptyArray = Array.isArray(value) && value.length > 0;
    if (!unShowColumnKeyList.includes(key) && !UNSHOW_COLUME_TYPE.includes(type)) {
      switch(type) {
        case 'text': { 
          if (value && typeof value === 'string') {
            displayValue = <span className={styles["cell-value-ellipsis"]}>{value}</span>;
          }
          break;
        }
        case 'date': {
          if (value && typeof value === 'string') {
            let format = 'YYYY-MM-DD';
            displayValue = moment(value).format(format);
          }
          break;
        }
        case 'ctime': 
        case 'mtime': {
          if (value && typeof value === 'string') {
            displayValue = moment(value).format('YYYY-MM-DD HH:mm:ss');
          }
          break;
        }
        case 'number': {
          if (Object.prototype.toString.call(value) === '[object Number]') {
            displayValue = <div className={styles["number-formatter"]}>
              {value}
            </div>;
          }
          break;
        }
        
        case 'collaborator': {
          if (value && isNonEmptyArray) {
            let { collaborators } = this.props;
            let validValue = value.filter(item => {
              return collaborators.find(collaborator => collaborator.email === item);
            });
            displayValue = validValue.length > 0 ? <CollaboratorFormatter collaborators={collaborators} value={validValue} /> : '';
          }
          break;
        }
        case 'single-select': {
          if (value && typeof value === 'string') {
            let options = data && data.options ? data.options : [];
            let option = options.find(option => option.id === value);
            displayValue = option ? <span className={styles['deduplication-single-select']} style={{backgroundColor: option.color}}>{option.name}</span> : '';
          }
          break;
        }
       
        case 'checkbox': {
          displayValue = <input className={styles['"checkbox"']} type='checkbox' readOnly checked={value ? true : false}/>;
          break;
        }
        
        case 'creator':
        case 'modifier': {
          if (value) {
            const { collaborators } = this.props;
            const collaborator = collaborators.find((item) => {
              return item.email === value;
            });
            displayValue = <div className={styles["collaborators-formatter"]}>
              <div className={styles["formatter-show"]}>
                <div className={styles["collaborator"]}>
                  <span className={styles["collaborator-avatar-container"]}>
                    <img className={styles["collaborator-avatar"]} alt={collaborator.name} src={collaborator.avatar_url} />
                  </span>
                  <span className={styles["collaborator-name"]}>{collaborator.name}</span>
                </div>
              </div>
            </div>;
          }
          break;
        }
        default:
          if (value && typeof value === 'string') {
            displayValue = <span className={styles["cell-value-ellipsis"]}>{value}</span>;
          }
          break;
      }
      return this.getCellRecord(displayValue, rowId, column);
    }
  };

  getCellRecord = (displayValue, rowId, column) => {
    let { key } = column;
    let width = this.getCellRecordWidth(column);
    return (
      <div className={styles["row-cell-value"]} key={rowId + '_' + key} style={{width}}>
        {displayValue ? displayValue : <span className={styles["row-cell-value-empty"]}></span>}
      </div>
    );
  };

  getCellRecordWidth = (column) => {
    let { type, data } = column;
    switch (type) {
      case 'date': {
        let isShowHourAndMinute = data && data.format && data.format.indexOf('HH:mm') > -1;
        return isShowHourAndMinute ? 160 : 100;
      }
      case 'ctime':
      case 'mtime':
      case 'link':
      case 'geolocation': {
        return 160;
      }
      case 'collaborator': {
        return 100;
      }
      case 'checkbox': {
        return 40;
      }
      case 'number': {
        return 120;
      }
      default: {
        return 100;
      }
    }
  };

  render() {
    const { showDialog, duplicationData, selectedItem, configSettings } = this.props;
    return (
      <Modal contentClassName={styles['modal-content']} isOpen={showDialog} toggle={this.props.toggleDetailDialog} className={styles['deduplication-plugin']}  zIndex={2000}>
        <ModalHeader className={styles['deduplication-plugin-header']} toggle={this.props.toggleDetailDialog}>{intl.get('Deduplication')}</ModalHeader>
        <ModalBody className={styles['deduplication-plugin-content']}>
          <div className={styles['deduplication-plugin-wrapper']}>
            {
              <div className={styles['deduplication-plugin-show']}>
                <div className={styles['table-wrapper']}>
                  <TableView
                    duplicationData={duplicationData}
                    selectedItem={selectedItem}
                    configSettings={configSettings}
                    clickCallback={this.showDetailData}
                  />
                </div>
              </div>
            }
            {
              <div className={styles['detail-view-settings']}>
                {this.renderDetailData()}
              </div>
            }
          </div>
        </ModalBody>
      </Modal>
    );
  }
}

export default DetailDuplicationDialog;
