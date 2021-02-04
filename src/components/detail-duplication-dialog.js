import React, { Fragment } from 'react';
import { Button } from 'reactstrap';
import intl from 'react-intl-universal';
import moment from 'moment';
import { SingleSelectFormatter } from 'dtable-ui-component';
import { getImageThumbnailUrl } from '../utils';
import CollaboratorFormatter from '../components/formatter/collaborator-formatter';
import RecordItem from './record';

import styles from '../css/plugin-layout.module.css';
import fileIcon from '../image/file.png';

const UNSHOWN_COLUMN_KEY_LIST = ['0000'];
const UNSHOWN_COLUMN_TYPE_LIST = ['long-text', 'geolocation', 'link'];

class DetailDuplicationDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isArrowShown: false,
      canScrollViaClick: false,
      isCheckboxesShown: false
    };
    this.recordItems = [];
    this.scrollLeft = 0;
  }

  componentDidMount() {
    this.checkArrows();
  }

  checkArrows = () => {
    const { offsetWidth, scrollWidth } = this.columnNameList;
    const isScrollable = scrollWidth > offsetWidth;
    this.setState({
      isArrowShown: isScrollable,
      canScrollViaClick: isScrollable
    });
  }

  componentWillUnmount() {
    this.recordItems = null;
  }

  onRowDelete = (rowId, index) => {
    this.props.onRowDelete(rowId, index);
  }

  handleVerticalScroll = (e) => {
    // to keep the value of `this.scrollLeft`
    e.stopPropagation(); // important!
  }

  onRef = (ref, rowIdx) => {
    this.recordItems[rowIdx] = ref;
  }

  scrollViaClick = (direction) => {
    const { offsetWidth, scrollWidth, scrollLeft } = this.columnNameList;
    const minScrollLeft = 0, // minimum scrollLeft
      maxScrollLeft = scrollWidth - offsetWidth; // maximum scrollLeft
    let targetScrollLeft; // the scrollLeft to achieve
    if (direction == 'left') {
      // already at the leftmost
      if (scrollLeft == 0) {
        return;
      }
      // scroll offset: less than or equal to `offsetWidth`
      targetScrollLeft = scrollLeft > offsetWidth ? scrollLeft - offsetWidth : minScrollLeft;
    }

    if (direction == 'right') {
      // already at the rightmost
      if (scrollLeft + offsetWidth == scrollWidth) {
        return;
      }
      targetScrollLeft = scrollLeft + offsetWidth;
      targetScrollLeft = targetScrollLeft > maxScrollLeft ? maxScrollLeft : targetScrollLeft;
    }
    if (this.state.canScrollViaClick) {
      this.setState({canScrollViaClick: false});
      let step = (targetScrollLeft - scrollLeft) / 10;
      step = step > 0 ? Math.ceil(step) : Math.floor(step);
      let timer = setInterval(() => {
        this.scrollLeftAll(this.columnNameList.scrollLeft + step);
        if (Math.abs(targetScrollLeft - this.columnNameList.scrollLeft) <= Math.abs(step)) {
          this.scrollLeftAll(targetScrollLeft);
          clearInterval(timer);
          this.setState({canScrollViaClick: true});
        }
      }, 15);
    }
  }

  renderDetailData = () => {
    const { dtable, configSettings, selectedItem } = this.props;
    const { isArrowShown, isCheckboxesShown } = this.state;
    const table = dtable.getTableByName(configSettings[0].active);
    return (
      <Fragment>
        <div className={`${styles['column-names-container']} position-relative`}>
          {isArrowShown && <span className={`dtable-font dtable-icon-left position-absolute ${styles['scroll-arrow']} ${styles['scroll-left']} ${this.columnNameList.scrollLeft > 0 ? styles['scroll-arrow-active'] : ''}`} onClick={this.scrollViaClick.bind(this, 'left')}></span>}
          <ol className={`${styles['column-name-list']} d-flex align-items-center m-0 p-0`}
            onScroll={this.handleHorizontalScroll}
            ref={ref => this.columnNameList = ref}
          >
            {isCheckboxesShown &&
              <li className="mr-3">
                <input type="checkbox"
                  checked={selectedItem.isAllSelected}
                  onChange={this.props.toggleAllSelected}
                />
              </li>
            }
            {table.columns.map((item, index) => {
              if (!UNSHOWN_COLUMN_KEY_LIST.includes(item.key) &&
          !UNSHOWN_COLUMN_TYPE_LIST.includes(item.type)) {
                return <li key={`column-name-${index}`}
                  className={`${styles['column-name']} text-truncate`}
                  style={{'width': this.getCellRecordWidth(item)}}
                  title={item.name}
                >{item.name}</li>;
              }
              return null;
            })}
          </ol>
          {isArrowShown && <span className={`dtable-font dtable-icon-right position-absolute ${styles['scroll-arrow']} ${styles['scroll-right']} ${this.columnNameList.scrollLeft + this.columnNameList.offsetWidth < this.columnNameList.scrollWidth ? styles['scroll-arrow-active'] : ''}`} onClick={this.scrollViaClick.bind(this, 'right')}></span>}
        </div>
        <div className={`${styles['record-list']} flex-fill`} onScroll={this.handleVerticalScroll}>
          {selectedItem.rows.length > 0 && selectedItem.rows.map((row, index) => {
            return (
              <div
                className={`${styles['record-container']} d-flex align-items-center`}
                key={'deduplication-record-' + index}
              >
                {isCheckboxesShown &&
                  <input type="checkbox" className="mr-2"
                    checked={selectedItem.rowsSelected[index]}
                    onChange={this.props.toggleRowSelected.bind(this, index)}
                  />
                }
                <RecordItem
                  width={isCheckboxesShown ? 'calc(100% - 21px)' : '100%'}
                  rowName={this.getRowName(row, table, index)}
                  row={row}
                  onRowDelete={() => this.onRowDelete(row, index)}
                  values={this.getRecord(row, table)}
                  onRef={this.onRef}
                  rowIdx={index}
                  scrollLeftAll={this.scrollLeftAll}
                />
              </div>
            );
          })}
        </div>
      </Fragment>
    );
  }

  getRowName = (rowId, table, index) => {
    const row = table['id_row_map'][rowId];
    let rowName = row['0000'] || '';
    return rowName;
  }

  getRecord = (rowIdx, table) => {
    let { columns } = table;
    const row = table['id_row_map'][rowIdx];
    return this.getRowRecord(row, columns, UNSHOWN_COLUMN_KEY_LIST);
  }

  getRowRecord = (row, columns, unshownColumnKeyList) => {
    let displayRow = [];
    columns.forEach((column) => {
      displayRow.push(
        this.getFormattedCell(column, row, unshownColumnKeyList)
      );
    });
    return displayRow;
  };

  getFormattedCell = (column, row, unshownColumnKeyList) => {
    let { key, type, data } = column;
    let { _id: rowId } = row;
    let value = row[key];
    let displayValue;
    let isNonEmptyArray = Array.isArray(value) && value.length > 0;
    if (!unshownColumnKeyList.includes(key) && !UNSHOWN_COLUMN_TYPE_LIST.includes(type)) {
      switch(type) {
        case 'text': {
          if (value && typeof value === 'string') {
            displayValue = <span className={styles['cell-value-ellipsis']}>{value}</span>;
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
            displayValue = <div className={styles['number-formatter']}>
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
            displayValue = option ? <SingleSelectFormatter options={options} value={value} /> : '';
          }
          break;
        }

        case 'multiple-select': {
          if (value && isNonEmptyArray) {
            let options = data && data.options ? data.options : [];
            let validValue = value.filter((item) => {
              return options.find(option => option.id === item);
            });
            displayValue = validValue.length > 0 ?
              <div className="multiple-select-formatter d-flex">
                {validValue.map((item, index) => {
                  return <SingleSelectFormatter options={options} value={item} key={`row-operation-multiple-select-${index}`} />;
                })}
              </div>
              : '';
          }
          break;
        }

        case 'file': {
          if (value && isNonEmptyArray) {
            let amount = value.length;
            displayValue = <div className="image-cell-value">
              <img alt='' src={fileIcon} width="24" />
              {amount > 1 && <span className="cell-value-size">{`+${amount - 1}`}</span>}
            </div>;
          }
          break;
        }

        case 'image': {
          if (value && isNonEmptyArray) {
            let imgSrc = getImageThumbnailUrl(value[0]);
            let amount = value.length;
            displayValue = <div className="image-cell-value h-100">
              <img alt='' src={imgSrc} className="mh-100" />
              {amount > 1 && <span className="cell-value-size">{`+${amount - 1}`}</span>}
            </div>;
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
            displayValue = <div className={styles['collaborators-formatter']}>
              <div className={styles['formatter-show']}>
                <div className={styles['collaborator']}>
                  <span className={styles['collaborator-avatar-container']}>
                    <img className={styles['collaborator-avatar']} alt={collaborator.name} src={collaborator.avatar_url} />
                  </span>
                  <span className={styles['collaborator-name']}>{collaborator.name}</span>
                </div>
              </div>
            </div>;
          }
          break;
        }
        default:
          if (value && typeof value === 'string') {
            displayValue = <span className={styles['cell-value-ellipsis']}>{value}</span>;
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
      <div className={styles['row-cell-value']} key={rowId + '_' + key} style={{width}}>
        {displayValue ? displayValue : <span className={styles['row-cell-value-empty']}></span>}
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

  handleHorizontalScroll = (e) => {
    let scrollLeft = e.target.scrollLeft;
    this.scrollLeft = scrollLeft;
    this.scrollLeftAllItems(scrollLeft);
  }

  scrollLeftAll = (scrollLeft) => {
    this.columnNameList.scrollLeft = scrollLeft;
    this.scrollLeftAllItems(scrollLeft);
  }

  scrollLeftAllItems = (scrollLeft) => {
    this.recordItems.forEach(item => {
      item.scrollLeftItem(scrollLeft);
    });
  }

  toggleShowCheckboxes = () => {
    this.setState({
      isCheckboxesShown: !this.state.isCheckboxesShown
    }, this.checkArrows);
  }

  render() {
    const { selectedItem } = this.props;
    const { isCheckboxesShown } = this.state;
    return (
      <div className={`${styles['details-container']} d-flex flex-column`}>
        <div className={`${styles['records-amount']} d-flex justify-content-between align-items-center`}>
          <p className="m-0">{intl.get('amount_records', {amount: selectedItem.rows.length})}</p>
          <div>
            {selectedItem.rowsSelected.some(item => item === true) && <Button
              className={`border-0 p-0 text-primary ${styles['records-op-btn']}`}
              onClick={this.props.deleteSelected}
            >{intl.get('Delete')}</Button>}
            {selectedItem.rows.length > 0 && <Button
              className={`border-0 p-0 text-primary ${styles['records-op-btn']}`}
              onClick={this.toggleShowCheckboxes}
            >{isCheckboxesShown ? intl.get('Cancel') : intl.get('Select')}</Button>}
          </div>
        </div>
        <div
          className={`${styles['records-container']} flex-fill d-flex flex-column`}
          ref={(ref) => this.recordsContainer = ref}
        >
          {this.renderDetailData()}
        </div>
      </div>
    );
  }
}

export default DetailDuplicationDialog;
