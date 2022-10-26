import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import DTable, { CELL_TYPE, FORMULA_RESULT_TYPE } from 'dtable-sdk';
import Settings from './components/settings';
import TableView from './components/table-view';
import DetailDuplicationDialog from './components/detail-duplication-dialog';
import DeleteTip from './components/tips/delete-tip';
import { compareString, throttle, getSelectColumnOptionMap } from './utils';
import CellValueUtils from './utils/cell-value-utils';

import './locale/index.js';

import styles from './css/plugin-layout.module.css';

const DEDUPLICATION_LIST = [
  CELL_TYPE.TEXT,
  CELL_TYPE.STRING,
  CELL_TYPE.DATE,
  CELL_TYPE.NUMBER,
  CELL_TYPE.SINGLE_SELECT,
  CELL_TYPE.EMAIL,
  CELL_TYPE.FORMULA,
  CELL_TYPE.LINK_FORMULA,
  CELL_TYPE.LINK,
  CELL_TYPE.CREATOR
];

const FORMULA_COLUMN_TYPES = [
  CELL_TYPE.FORMULA,
  CELL_TYPE.LINK_FORMULA
];

const propTypes = {
  showDialog: PropTypes.bool
};

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      showDialog: true,
      configSettings: null,
      isShowDetailDialog: false,
      isDeleteTipShow: false,
      duplicationRows: [],
      allDeDuplicationColumns: [],
      pageSize: 1,
      selectedItem: {},
      duplicationData: {},
      expandedRowIndex: -1
    };
    this.dtable = new DTable();
    this.cellValueUtils = new CellValueUtils({ dtable: this.dtable });
  }

  componentDidMount() {
    this.initPluginDTableData();
  }

  componentWillReceiveProps(nextProps) {
    this.setState({showDialog: nextProps.showDialog});
  }

  componentWillUnmount() {
    this.unsubscribeLocalDtableChanged();
    this.unsubscribeRemoteDtableChanged();
  }

  async initPluginDTableData() {
    if (window.app === undefined) {
      // local develop
      window.app = {};
      await this.dtable.init(window.dtablePluginConfig);
      await this.dtable.syncWithServer();
      this.dtable.subscribe('dtable-connect', () => { this.onDTableConnect(); });
    } else {
      this.dtable.initInBrowser(window.app.dtableStore);
      this.onDTableConnect();
    }
    this.collaborators = this.dtable.getRelatedUsers();
    this.unsubscribeLocalDtableChanged = this.dtable.subscribe('local-dtable-changed', () => { this.onDTableChanged(); });
    this.unsubscribeRemoteDtableChanged = this.dtable.subscribe('remote-dtable-changed', () => { this.onDTableChanged(); });
    this.resetData();
  }

  onDTableConnect = () => {
    const { tableName, viewName, columnName } = this.initPluginSettings();
    const configSettings = this.initSelectedSettings(tableName, viewName, columnName);
    this.setState({
      configSettings: configSettings,
    });
  }

  initPluginSettings = () => {
    let activeTable = this.dtable.getActiveTable();
    let activeView = this.dtable.getActiveView();
    return  {tableName: activeTable.name, viewName: activeView.name, columnName: null};
  }

  initSelectedSettings = (tableName, viewName, columnName) => {
    let configSettings = [];
    let activeTable = this.dtable.getTableByName(tableName);
    let tableSettings = this.getTableSettings(activeTable);
    configSettings.push(tableSettings);

    let activeView = this.dtable.getViewByName(activeTable, viewName);
    let viewSettings = this.getViewSettings(activeTable, activeView);
    configSettings.push(viewSettings);

    let activeColumn = this.dtable.getColumnByName(activeTable, columnName);
    let columnSettings = this.getColumnSettings(activeTable, activeView, activeColumn);
    let multiColumnSettings = this.initMultiDeduplicationColumnSetting(activeTable, activeView, activeColumn);
    let addColumnSetting = this.getAddColumnSetting();
    configSettings.push(columnSettings, multiColumnSettings, addColumnSetting);
    return configSettings;
  }

  updateSelectedSettings = (type, option, multiColumnIndex) => {
    if (type === 'table') {
      let currentTable = this.dtable.getTableByName(option.name);
      let currentView = this.dtable.getNonArchiveViews(currentTable)[0];

      let tableSettings = this.getTableSettings(currentTable);
      let viewSettings = this.getViewSettings(currentTable);
      let columnSettings = this.getColumnSettings(currentTable, currentView);
      let multiColumnSettings = this.initMultiDeduplicationColumnSetting(currentTable, currentView);
      let addColumnSetting = this.getAddColumnSetting();
      let configSettings = [tableSettings, viewSettings, columnSettings, multiColumnSettings, addColumnSetting];
      return configSettings;
    }

    if (type === 'view') {
      let { configSettings } = this.state;
      const tableName = configSettings[0].active;
      let currentTable = this.dtable.getTableByName(tableName);
      let currentView = this.dtable.getViewByName(currentTable, option.name);
      let viewSettings = this.getViewSettings(currentTable, currentView);
      let columnSettings = this.getColumnSettings(currentTable, currentView);
      let multiColumnSettings = this.initMultiDeduplicationColumnSetting(currentTable, currentView, );
      let addColumnSetting = this.getAddColumnSetting();
      configSettings.splice(1, 4, viewSettings, columnSettings, multiColumnSettings, addColumnSetting);
      return configSettings;
    }

    if (type === 'column') {
      let { configSettings } = this.state;
      const tableName = configSettings[0].active;
      const viewName = configSettings[1].active;
      const selectedColumns = configSettings[3];
      let currentTable = this.dtable.getTableByName(tableName);
      let currentView = this.dtable.getViewByName(currentTable, viewName);
      let currentColumn = this.dtable.getColumnByName(currentTable, option.name);
      let columnSettings = this.getColumnSettings(currentTable, currentView, currentColumn);
      const columnSelections = this.getMultiDeduplicationColumnSelections(currentTable, currentView, currentColumn);
      let activeColumns = selectedColumns.active;
      if (option.name === intl.get('Select_a_column')) {
        activeColumns = [];
      } else {
        activeColumns = activeColumns.filter((column) => {
          return column !== option.name;
        });
      }
      selectedColumns.active = activeColumns;
      selectedColumns.settings = columnSelections;
      configSettings.splice(2, 2, columnSettings, selectedColumns);
      return configSettings;
    }

    if (type === 'add_column') {
      let { configSettings } = this.state;
      const tableName = configSettings[0].active;
      const viewName = configSettings[1].active;
      const columnName = configSettings[2].active;
      let currentTable = this.dtable.getTableByName(tableName);
      let currentView = this.dtable.getViewByName(currentTable, viewName);
      let currentColumn = this.dtable.getColumnByName(currentTable, columnName);
      const deduplicationColumnSetting = configSettings[3];
      const activeDeduplicationColumns = deduplicationColumnSetting.active;
      const newDeduplicationColumnSetting = this.getMultiDeduplicationColumnSetting(currentTable, currentView, currentColumn, activeDeduplicationColumns);
      configSettings.splice(3, 1, newDeduplicationColumnSetting);
      return configSettings;
    }

    if (type === 'multi_deduplication_column') {
      let { configSettings } = this.state;
      const multiDeduplicationColumns = configSettings[3].active;
      if (!option) {
        // delete the column
        multiDeduplicationColumns.splice(multiColumnIndex, 1);
      } else {
        multiDeduplicationColumns.splice(multiColumnIndex, 1, option.name);
      }
      configSettings[3].active = multiDeduplicationColumns;
      return configSettings;
    }
  }

  getTableSettings = (activeTable = null) => {
    let tables = this.dtable.getTables();
    let tableSettings = tables.map(table => {
      return {id: table._id, name: table.name};
    });
    let active = activeTable ? activeTable.name : tables[0].name;
    return {type: 'table', name: intl.get('Table'), active: active, settings: tableSettings};
  }

  getViewSettings = (currentTable, activeView = null) => {
    let views = this.dtable.getNonArchiveViews(currentTable);
    let viewSettings = views.map(view => {
      return {id: view._id, name: view.name};
    });

    let active = activeView ? activeView.name : views[0].name;
    return {type: 'view', name: intl.get('View'), active: active, settings: viewSettings};
  }

  getColumnSettings = (currentTable, currentView, activeColumn = null) => {
    let columns = this.dtable.getViewShownColumns(currentView, currentTable);
    // need options: checkout map column
    columns = columns.filter(column => {
      const { type } = column;
      if (FORMULA_COLUMN_TYPES.includes(type) || type === CELL_TYPE.LINK) {
        const { data } = column;
        const { array_type, result_type } = data;
        return DEDUPLICATION_LIST.includes(result_type) ||
        (result_type === FORMULA_RESULT_TYPE.ARRAY && DEDUPLICATION_LIST.includes(array_type));
      }

      return DEDUPLICATION_LIST.includes(type);
    });

    let columnSettings = columns.map(column => {
      return {id: column.key, name: column.name};
    });

    columnSettings.unshift({
      id: '',
      name: intl.get('Select_a_column'),
      style: { color: 'rgba(0, 0, 0, .25)'}
    });
    // need options: checkout map column
    let active = activeColumn ? activeColumn.name : columnSettings[0].name;
    // need options: checkout map column
    return {type: 'column', name: intl.get('Column'), active: active, settings: columnSettings};
  }

  getAddColumnSetting = () => {
    return { type: 'add_column' };
  }

  getMultiDeduplicationColumnSetting = (currentTable, currentView, currentColumn = {}, activeColumns = []) => {
    let columnSettings = this.getMultiDeduplicationColumnSelections(currentTable, currentView, currentColumn);

    const currentActiveColumns = [...activeColumns];

    const option = columnSettings.find((column) => {
      return !currentActiveColumns.includes(column.name);
    });
    if (!option) return {type: 'multi_deduplication_column', active: currentActiveColumns, settings: columnSettings};
    currentActiveColumns.push(option.name);
    return {type: 'multi_deduplication_column', active: currentActiveColumns, settings: columnSettings};
  }

  getMultiDeduplicationColumnSelections = (currentTable, currentView, currentColumn = {}) => {
    let columns = this.dtable.getViewShownColumns(currentView, currentTable);
    // need options: checkout map column
    return columns.filter(column => { //eslint-disable-line
      if (DEDUPLICATION_LIST.includes(column.type) && currentColumn.key !== column.key) {
        return {id: column.key, name: column.name};
      }
    });
  }

  initMultiDeduplicationColumnSetting = (currentTable, currentView, currentColumn = {}) => {
    let columnSettings = this.getMultiDeduplicationColumnSelections(currentTable, currentView, currentColumn = {});
    return {type: 'multi_deduplication_column', active: [], settings: columnSettings};
  }

  onSelectChange = (type, option, multiColumnIndex) => {
    let configSettings = [];
    configSettings = this.updateSelectedSettings(type, option, multiColumnIndex);
    this.getDeduplicationData(configSettings);
    this.setState({
      configSettings: configSettings
    });
  }

  getOptionColors = () => {
    return this.dtable.getOptionColors();
  }

  getCellValueDisplayString = (cellValue, column, {tables = [], collaborators = []} = {}) => {
    return this.cellValueUtils.getCellValueDisplayString(cellValue, column, { tables, collaborators });
  }

  getUserCommonInfo = (email, avatar_size) => {
    const dtableWebAPI = window.dtableWebAPI || this.dtable.dtableWebAPI;
    return dtableWebAPI.getUserCommonInfo(email, avatar_size);
  }

  getColumnsByName = (table, columns) => {
    return columns.map((column) => {
      return this.dtable.getColumnByName(table, column);
    });
  }

  getMediaUrl = () => {
    return window.dtable ? window.dtable.mediaUrl : window.dtablePluginConfig.mediaUrl;
  }

  getDeduplicationData = (configSettings) => {
    const table = this.dtable.getTableByName(configSettings[0].active);
    const view = this.dtable.getViewByName(table, configSettings[1].active);
    const selectedColumn = this.dtable.getColumnByName(table, configSettings[2].active);
    if (!selectedColumn) {
      this.setState({
        duplicationRows: [],
        allDeDuplicationColumns: [],
        pageSize: 1,
      });
      return;
    }
    const rows = this.dtable.getViewRows(view, table);
    const formulaRows = this.dtable.getTableFormulaResults(table, rows);
    const deDuplicationColumnNames = [...configSettings[3].active];
    const deDuplicationColumns = this.getColumnsByName(table, deDuplicationColumnNames);
    const allDeDuplicationColumns = [selectedColumn, ...deDuplicationColumns];
    let duplicationRows = [];
    let rowValueMap = {};
    let selectColumnKey2OptionMap = {};
    allDeDuplicationColumns.forEach(column => {
      if (column.type === CELL_TYPE.SINGLE_SELECT) {
        selectColumnKey2OptionMap[column.key] = getSelectColumnOptionMap(column);
      }
    });
    rows.forEach((item) => {
      let rowValueKey = '';
      allDeDuplicationColumns.forEach(column => {
        const { key, type } = column;
        let cellValue = item[key];
        if (FORMULA_COLUMN_TYPES.includes(type)) {
          cellValue = formulaRows[item._id] ? formulaRows[item._id][key] : null;
          if (cellValue === null || typeof cellValue === 'undefined') {
            cellValue = '';
          }
          rowValueKey += String(cellValue);
        } else if (type === CELL_TYPE.LINK) {
          const linkCellItem = formulaRows[item._id] ? formulaRows[item._id][key] : null;

          cellValue = Array.isArray(linkCellItem) ? linkCellItem.map(link => link.display_value) : null;
          if (cellValue === null || typeof cellValue === 'undefined') {
            cellValue = '';
          }
          rowValueKey += String(cellValue);
        } else {
          if (cellValue === null || typeof cellValue === 'undefined') {
            cellValue = '';
          }
          // If single select column, check value ID is valid
          if (cellValue && selectColumnKey2OptionMap[key]) {
            if (selectColumnKey2OptionMap[key][cellValue]) {
              rowValueKey += String(cellValue);
            }
          } else {
            rowValueKey += String(cellValue);
          }
        }
        rowValueKey += key;
      });
      let statRowIndex = rowValueMap[rowValueKey];
      if (statRowIndex > -1) {
        duplicationRows[statRowIndex].rows.push(item._id);
      } else {
        rowValueMap[rowValueKey] = duplicationRows.length;
        duplicationRows.push({ rows: [item._id], item });
      }
    });
    duplicationRows = duplicationRows.filter((statRow) => statRow.rows.length > 1);
    this.sortDuplicationRows(duplicationRows, selectedColumn, formulaRows);
    this.setState({
      duplicationRows,
      allDeDuplicationColumns,
      pageSize: 1,
      formulaRows
    });
  }

  sortDuplicationRows = (duplicationRows, column, formulaRows) => {
    const { type, key, data = {} } = column;
    const optionsMap = {};
    if (type === CELL_TYPE.SINGLE_SELECT) {
      const { options } = column.data;
      options.forEach(option => {
        optionsMap[option.id] = option.name;
      });
    }
    // DEDUPLICATION_LIST support five types: CELL_TYPE.TEXT, CELL_TYPE.DATE, CELL_TYPE.NUMBER, CELL_TYPE.SINGLE_SELECT, CELL_TYPE.EMAIL
    switch (type) {
      case CELL_TYPE.NUMBER:
        duplicationRows.sort((currRow, nextRow) => {
          const currCellValue = currRow.item[key];
          const nextCellValue = nextRow.item[key];
          if (currCellValue === nextCellValue) return 0;
          return currCellValue > nextCellValue ? 1 : -1;
        });
        break;
      case CELL_TYPE.SINGLE_SELECT:
        duplicationRows.sort((currRow, nextRow) => {
          const currCellValue = currRow.item[key];
          const nextCellValue = nextRow.item[key];
          if (currCellValue === nextCellValue) return 0;
          return compareString(optionsMap[currCellValue], optionsMap[nextCellValue]);
        });
        break;
      case CELL_TYPE.LINK_FORMULA:
      case CELL_TYPE.FORMULA: {
        duplicationRows.sort((currRow, nextRow) => {
          const currCellValue = formulaRows[currRow.item._id] ? formulaRows[currRow.item._id][key] : null;
          const nextCellValue = formulaRows[nextRow.item._id] ? formulaRows[nextRow.item._id][key] : null;
          return this.dtable.sortFormula(currCellValue, nextCellValue, 'up', {columnData: data, value: {}});
        });
        break;
      }
      case CELL_TYPE.LINK: {
        duplicationRows.sort((currRow, nextRow) => {
          const currCellVal = formulaRows[currRow.item._id] ? formulaRows[currRow.item._id][key] : null;
          const nextCellVal = formulaRows[nextRow.item._id] ? formulaRows[nextRow.item._id][key] : null;
          let currDisplayValues = Array.isArray(currCellVal) ? currCellVal.map(link => link.display_value) : null;
          let nextDisplayValues = Array.isArray(nextCellVal) ? nextCellVal.map(link => link.display_value) : null;
          return this.dtable.sortFormula(currDisplayValues, nextDisplayValues, 'up', {columnData: data, value: {}});
        });
        break;
      }
      // Text and date column values are all string
      case CELL_TYPE.DATE:
      case CELL_TYPE.TEXT:
      case CELL_TYPE.EMAIL:
        duplicationRows.sort((currRow, nextRow) => {
          const currCellValue = currRow.item[key];
          const nextCellValue = nextRow.item[key];
          if (currCellValue === nextCellValue) {
            return 0;
          }
          if (!currCellValue && currCellValue !== 0) {
            return -1;
          }
          if (!nextCellValue && nextCellValue !== 0) {
            return 1;
          }
          return compareString(currCellValue, nextCellValue);
        });
        break;
      default:
        break;
    }
  }

  onDTableChanged = () => {
    this.resetData();
  }

  resetData = () => {
    if (this.state.configSettings) {
      this.getDeduplicationData(this.state.configSettings);
    }
  }

  onPluginToggle = () => {
    this.setState({showDialog: false});
    if (window.app.onClosePlugin) {
      window.app.onClosePlugin();
    }
  }

  onDeleteRow = (rowId) => {
    const { configSettings } = this.state;
    const tableName = configSettings[0].active;
    const currentTable = this.dtable.getTableByName(tableName);
    this.dtable.deleteRowById(currentTable, rowId);
  }

  deleteRowsByIds = (all_row_ids) => {
    const { configSettings } = this.state;
    const tableName = configSettings[0].active;
    const currentTable = this.dtable.getTableByName(tableName);
    this.dtable.deleteRowsByIds(currentTable, all_row_ids);
  };

  deleteAllDuplicationRows = (kept) => {
    this.setState({ isDeleteTipShow: false });
    const { duplicationRows } = this.state;
    let all_row_ids = [];
    if (kept == 'first') { // keep the first one
      duplicationRows.forEach(duplicationItem => {
        all_row_ids.push(...duplicationItem.rows.slice(1));
      });
    } else { // keep the last one
      duplicationRows.forEach(duplicationItem => {
        all_row_ids.push(...duplicationItem.rows.slice(0, -1));
      });
    }
    this.deleteRowsByIds(all_row_ids);
  }

  openDeleteTip = () => {
    this.setState({ isDeleteTipShow: true });
  }

  closeDeleteTip = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ isDeleteTipShow: false });
  }

  onScroll = () => {
    const deleteContainerHeight = 41;
    const marginTop = 20;
    const { offsetHeight, scrollTop } = this.scrollContainer;
    if ((offsetHeight + scrollTop) >= (this.innerTableHeight + deleteContainerHeight + marginTop)) {
      this.setState({ pageSize: this.state.pageSize + 1 });
    }
  }

  setTableHeight = (height) => {
    this.innerTableHeight = height;
  }

  getExpandRowItem = () => {
    const { expandedRowIndex, duplicationRows } = this.state;
    const duplicationRow = duplicationRows[expandedRowIndex];
    const { rows = [] } = duplicationRow || {};
    const rowsSelected = rows.map(item => false);
    return {
      rows,
      rowsSelected,
      value: rows.length,
      isAllSelected: false,
    };
  }

  onHideExpandRow = () => {
    this.setState({expandedRowIndex: -1});
  }

  setExpandedRowIndex = (index) => {
    this.setState({expandedRowIndex: index});
  }

  render() {
    let { expandedRowIndex, showDialog, configSettings, duplicationRows, allDeDuplicationColumns, isDeleteTipShow, pageSize } = this.state;
    return (
      <Fragment>
        <Modal
          contentClassName={styles['modal-content']}
          isOpen={showDialog}
          toggle={this.onPluginToggle}
          className={`${styles['deduplication-plugin']} deduplicate-plugin`}
          size="lg"
          zIndex="1048"
        >
          <ModalHeader className={styles['deduplication-plugin-header']} toggle={this.onPluginToggle}>{intl.get('Deduplication')}</ModalHeader>
          <ModalBody className={styles['deduplication-plugin-content']}>
            {(window.dtable && window.dtable.permission === 'r') ?
              <p className="h-100 d-flex align-items-center justify-content-center text-red">{intl.get('This_plugin_is_not_available_now')}</p> : (
                <div className={styles['deduplication-plugin-wrapper']}>
                  <div className={styles['deduplication-plugin-show']}
                    onScroll={throttle(this.onScroll, 100)}
                    ref={(ref) => this.scrollContainer = ref}
                  >
                    <div className={styles['table-wrapper']}>
                      {(Array.isArray(duplicationRows) && duplicationRows.length > 0) &&
                        <div className={styles['delete-all-container']}>
                          <div className={styles['delete-all-button']}>
                            <span className={styles['delete-all-highlight-msg']} onClick={this.openDeleteTip}>
                              {intl.get('Delete_all_duplicated_items')}
                            </span>
                            <span>{intl.get('keep_only_one')}</span>
                          </div>
                        </div>
                      }
                      {isDeleteTipShow &&
                        <DeleteTip onDelete={this.deleteAllDuplicationRows} toggle={this.closeDeleteTip} />
                      }
                      <TableView
                        duplicationRows={duplicationRows.slice(0, pageSize * 50)}
                        allDeDuplicationColumns={allDeDuplicationColumns}
                        setExpandedRowIndex={this.setExpandedRowIndex}
                        collaborators={this.collaborators}
                        setTableHeight={this.setTableHeight}
                        formulaRows={this.state.formulaRows}
                        getUserCommonInfo={this.getUserCommonInfo}
                        getMediaUrl={this.getMediaUrl}
                      />
                    </div>
                  </div>
                  <Settings
                    configSettings={configSettings}
                    onSelectChange={this.onSelectChange}
                  />
                </div>
              )}
            {expandedRowIndex > -1 && (
              <DetailDuplicationDialog
                selectedItem={this.getExpandRowItem()}
                onHideExpandRow={this.onHideExpandRow}
                configSettings={configSettings}
                collaborators={this.collaborators}
                dtable={this.dtable}
                onDeleteRow={this.onDeleteRow}
                onDeleteSelectedRows={this.deleteRowsByIds}
                setTableHeight={this.setTableHeight}
                formulaRows={this.state.formulaRows}
                getUserCommonInfo={this.getUserCommonInfo}
                getOptionColors={this.getOptionColors}
                getCellValueDisplayString={this.getCellValueDisplayString}
                getMediaUrl={this.getMediaUrl}
              />
            )}
          </ModalBody>
        </Modal>
      </Fragment>
    );
  }
}

App.propTypes = propTypes;

export default App;
