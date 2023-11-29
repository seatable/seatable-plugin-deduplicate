import React, { Fragment } from 'react';
import { Button } from 'reactstrap';
import intl from 'react-intl-universal';
import { getTableByName } from 'dtable-utils';
import RecordItem from './record';
import Formatter from './formatter';

import styles from '../css/plugin-layout.module.css';

const UNSHOWN_COLUMN_KEY_LIST = ['0000'];

class DetailDuplicationDialog extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isArrowShown: false,
      canScrollViaClick: false,
      isCheckboxesShown: false,
      selectedRows: [],
      pageSize: 1,
    };
    this.recordItems = [];
    this.scrollLeft = 0;
  }

  componentDidMount() {
    this.checkArrows();
    document.addEventListener('mousedown', this.onHideExpandRow);
  }

  onHideExpandRow = (event) => {
    if (this.detailDuplicationDialog && event && !this.detailDuplicationDialog.contains(event.target)) {
      this.props.onHideExpandRow();
    }
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
    document.removeEventListener('mousedown', this.onHideExpandRow);
  }

  handleVerticalScroll = (e) => {
    // to keep the value of `this.scrollLeft`
    e.stopPropagation(); // important!
    const { offsetHeight, scrollTop } = this.scrollContainer;
    const recordHeight = 98;
    if ((offsetHeight + scrollTop) >= (this.state.pageSize * 20 * recordHeight - recordHeight)) {
      this.setState({ pageSize: this.state.pageSize + 1 });
    }
  }

  onRef = (ref, rowIdx) => {
    this.recordItems[rowIdx] = ref;
  }

  scrollViaClick = (direction) => {
    const { offsetWidth, scrollWidth, scrollLeft } = this.columnNameList;
    const minScrollLeft = 0, // minimum scrollLeft
      maxScrollLeft = scrollWidth - offsetWidth; // maximum scrollLeft
    let targetScrollLeft; // the scrollLeft to achieve
    if (direction === 'left') {
      // already at the leftmost
      if (scrollLeft === 0) {
        return;
      }
      // scroll offset: less than or equal to `offsetWidth`
      targetScrollLeft = scrollLeft > offsetWidth ? scrollLeft - offsetWidth : minScrollLeft;
    }

    if (direction === 'right') {
      // already at the rightmost
      if (scrollLeft + offsetWidth === scrollWidth) {
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
    const { configSettings, selectedItem } = this.props;
    const { isArrowShown, isCheckboxesShown, pageSize } = this.state;
    let rows = (selectedItem.rows || []).slice(0, pageSize * 20);
    const tables = window.dtableSDK.getTables();
    const table = getTableByName(tables, configSettings[0].active);
    return (
      <Fragment>
        <div className={`${styles['column-names-container']} position-relative`}>
          {isArrowShown &&
            <span
              className={`dtable-font dtable-icon-left position-absolute ${styles['scroll-arrow']} ${styles['scroll-left']} ${this.columnNameList.scrollLeft > 0 ? styles['scroll-arrow-active'] : ''}`}
              onClick={this.scrollViaClick.bind(this, 'left')}>
            </span>
          }
          <ol className={`${styles['column-name-list']} d-flex align-items-center m-0 p-0`}
            onScroll={this.handleHorizontalScroll}
            ref={ref => this.columnNameList = ref}
          >
            {isCheckboxesShown &&
              <li className="mr-3">
                <input type="checkbox"
                  checked={this.isAllRowsSelected()}
                  onChange={this.toggleAllSelected}
                />
              </li>
            }
            {table.columns.map((item, index) => {
              if (!UNSHOWN_COLUMN_KEY_LIST.includes(item.key)) {
                return (
                  <li key={`column-name-${index}`}
                    className={`${styles['column-name']} text-truncate`}
                    style={{'width': this.getCellRecordWidth(item)}}
                    title={item.name}
                  >
                    {item.name}
                  </li>
                );
              }
              return null;
            })}
          </ol>
          {isArrowShown && <span className={`dtable-font dtable-icon-right position-absolute ${styles['scroll-arrow']} ${styles['scroll-right']} ${this.columnNameList.scrollLeft + this.columnNameList.offsetWidth < this.columnNameList.scrollWidth ? styles['scroll-arrow-active'] : ''}`} onClick={this.scrollViaClick.bind(this, 'right')}></span>}
        </div>
        <div
          className={`${styles['record-list']} flex-fill`}
          onScroll={this.handleVerticalScroll}
          ref={(ref) => this.scrollContainer = ref}
        >
          {rows.length > 0 && rows.map((rowId, index) => {
            return (
              <div
                className={`${styles['record-container']} d-flex align-items-center`}
                key={'deduplication-record-' + index}
              >
                {isCheckboxesShown &&
                  <input type="checkbox" className="mr-2"
                    checked={this.state.selectedRows.includes(rowId)}
                    onChange={this.toggleRowSelected.bind(this, rowId)}
                  />
                }
                <RecordItem
                  width={isCheckboxesShown ? 'calc(100% - 21px)' : '100%'}
                  rowName={this.getRowName(rowId, table)}
                  row={rowId}
                  onDeleteRow={this.onDeleteRow.bind(this, rowId)}
                  values={this.getRecord(rowId, table)}
                  onRef={this.onRef}
                  rowIdx={index}
                  scrollLeftAll={this.scrollLeftAll}
                  table={table}
                />
              </div>
            );
          })}
        </div>
      </Fragment>
    );
  }

  isAllRowsSelected = () => {
    const { selectedItem } = this.props;
    const { selectedRows } = this.state;
    return selectedItem.rows.every((rowId) => selectedRows.includes(rowId));
  }

  toggleRowSelected = (rowId) => {
    const { selectedRows } = this.state;
    const rowIndex = selectedRows.indexOf(rowId);
    if (rowIndex > -1) {
      selectedRows.splice(rowIndex, 1);
    } else {
      selectedRows.push(rowId);
    }
    this.setState({ selectedRows });
  }

  toggleAllSelected = () => {
    const { selectedItem } = this.props;
    const { selectedRows } = this.state;
    let newSelectedRows = [];
    if (selectedRows.length < selectedItem.rows.length) {
      newSelectedRows = [...selectedItem.rows];
    }
    this.setState({ selectedRows: newSelectedRows });
  }

  onDeleteRow = (rowId) => {
    const { selectedRows } = this.state;
    const rowIndex = selectedRows.indexOf(rowId);
    if (rowIndex > -1) {
      selectedRows.splice(rowIndex, 1);
      this.setState({ selectedRows });
    }
    this.props.onDeleteRow(rowId);
  }

  onDeleteSelectedRows = () => {
    this.props.onDeleteSelectedRows(this.state.selectedRows);
    this.setState({selectedRows: []});
  }

  getRowName = (rowId, table) => {
    const row = table['id_row_map'][rowId];
    return row['0000'] || '';
  }

  getRecord = (rowIdx, table) => {
    let { columns } = table;
    const row = table['id_row_map'][rowIdx];
    return this.getRowRecord(row, columns, UNSHOWN_COLUMN_KEY_LIST);
  }

  getRowRecord = (row, columns, unShownColumnKeyList) => {
    let displayRow = [];
    columns.forEach((column) => {
      displayRow.push(
        this.getFormattedCell(column, row, unShownColumnKeyList)
      );
    });
    return displayRow;
  };

  getFormattedCell = (column, row, unShownColumnKeyList) => {
    const { key } = column;
    const { _id: rowId } = row;
    let displayValue;
    if (!unShownColumnKeyList.includes(key)) {
      displayValue =
      <Formatter
        column={column}
        row={row}
        collaborators={this.props.collaborators}
        formulaRows={this.props.formulaRows}
        getUserCommonInfo={this.props.getUserCommonInfo}
        getCellValueDisplayString={this.props.getCellValueDisplayString}
      />;
      return this.getCellRecord(displayValue, rowId, column);
    }
  }

  getCellRecord = (displayValue, rowId, column) => {
    let { key } = column;
    let width = this.getCellRecordWidth(column);
    return (
      <div className={styles['row-cell-value']} key={rowId + '_' + key} style={{width}}>
        {displayValue ? displayValue : <span className={styles['row-cell-value-empty']}></span>}
      </div>
    );
  }

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
  }

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
      isCheckboxesShown: !this.state.isCheckboxesShown,
      selectedRows: [],
    }, this.checkArrows);
  }

  render() {
    const { selectedItem } = this.props;
    const { isCheckboxesShown, selectedRows } = this.state;
    return (
      <div className={`${styles['details-container']} d-flex flex-column`} ref={ref => this.detailDuplicationDialog = ref}>
        <div className={`${styles['records-amount']} d-flex justify-content-between align-items-center`}>
          <p className="m-0">{intl.get('amount_records', {amount: selectedItem.rows.length})}</p>
          <div>
            {selectedRows.length > 0 &&
              <Button
                className={`border-0 p-0 text-primary ${styles['records-op-btn']}`}
                onClick={this.onDeleteSelectedRows}
              >
                {intl.get('Delete')}
              </Button>
            }
            {selectedItem.rows.length > 0 &&
              <Button
                className={`border-0 p-0 ml-2 text-primary ${styles['records-op-btn']}`}
                onClick={this.toggleShowCheckboxes}
              >
                {isCheckboxesShown ? intl.get('Cancel') : intl.get('Select')}
              </Button>
            }
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
