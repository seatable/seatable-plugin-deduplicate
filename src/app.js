import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { Modal, ModalBody } from 'reactstrap';
import { DTableModalHeader } from 'dtable-ui-component';
import {
  CellType, FORMULA_RESULT_TYPE, SORT_TYPE, getTableByName, getViewByName,
  getTableColumnByName, getNonArchiveViews, getNonPrivateViews, getViewShownColumns,
  sortFormula, compareString,
} from 'dtable-utils';
import Settings from './components/settings';
import TableView from './components/table-view';
import DetailDuplicationDialog from './components/detail-duplication-dialog';
import DeleteTip from './components/tips/delete-tip';
import { throttle, getSelectColumnOptionMap } from './utils';
import CellValueUtils from './utils/cell-value-utils';

import './locale/index.js';

import logo from './image/logo.png';
import './css/app.css';
import styles from './css/plugin-layout.module.css';

const DEDUPLICATION_LIST = [
  CellType.TEXT,
  CellType.STRING,
  CellType.DATE,
  CellType.NUMBER,
  CellType.SINGLE_SELECT,
  CellType.EMAIL,
  CellType.FORMULA,
  CellType.LINK_FORMULA,
  CellType.LINK,
  CellType.CREATOR
];

const FORMULA_COLUMN_TYPES = [
  CellType.FORMULA,
  CellType.LINK_FORMULA
];

const propTypes = {
  isDevelopment: PropTypes.bool,
  showDialog: PropTypes.bool,
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
    this.cellValueUtils = new CellValueUtils();
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
    if (this.props.isDevelopment) {
      // local develop
      window.dtableSDK.subscribe('dtable-connect', this.onDTableConnect);
    } else {
      this.onDTableConnect();
    }
    this.collaborators = window.app.state.collaborators;
    this.unsubscribeLocalDtableChanged = window.dtableSDK.subscribe('local-dtable-changed', () => { this.onDTableChanged(); });
    this.unsubscribeRemoteDtableChanged = window.dtableSDK.subscribe('remote-dtable-changed', () => { this.onDTableChanged(); });
    this.resetData();
  }

  onDTableConnect = () => {
    const { tableName, viewName, columnName } = this.initPluginSettings();
    const configSettings = this.initSelectedSettings(tableName, viewName, columnName);
    this.setState({ configSettings });
  };

  initPluginSettings = () => {
    const activeTable = window.dtableSDK.getActiveTable();
    const activeView = window.dtableSDK.getActiveView();
    return {
      tableName: activeTable.name,
      viewName: activeView.name,
      columnName: null,
    };
  };

  getCurrentTable = () => {
    const { configSettings } = this.state;
    const tables = window.dtableSDK.getTables();
    const tableName = configSettings[0].active;
    return getTableByName(tables, tableName);
  };

  initSelectedSettings = (tableName, viewName, columnName) => {
    const tables = window.dtableSDK.getTables();
    const activeTable = getTableByName(tables, tableName) || tables[0];
    const tableSettings = this.getTableSettings(activeTable);
    let configSettings = [];
    configSettings.push(tableSettings);


    const activeView = getViewByName(activeTable.views, viewName);
    const viewSettings = this.getViewSettings(activeTable, activeView);
    configSettings.push(viewSettings);

    const activeColumn = getTableColumnByName(activeTable, columnName);
    const columnSettings = this.getColumnSettings(activeTable, activeView, activeColumn);
    let multiColumnSettings = this.initMultiDeduplicationColumnSetting(activeTable, activeView, activeColumn);
    let addColumnSetting = this.getAddColumnSetting();
    configSettings.push(columnSettings, multiColumnSettings, addColumnSetting);
    return configSettings;
  };

  updateSelectedSettings = (type, option, multiColumnIndex) => {
    const tables = window.dtableSDK.getTables();
    if (type === 'table') {
      const currentTable = getTableByName(tables, option.name);
      const currentView = getNonPrivateViews(getNonArchiveViews(currentTable.views))[0];

      const tableSettings = this.getTableSettings(currentTable);
      const viewSettings = this.getViewSettings(currentTable);
      const columnSettings = this.getColumnSettings(currentTable, currentView);
      const multiColumnSettings = this.initMultiDeduplicationColumnSetting(currentTable, currentView);
      const addColumnSetting = this.getAddColumnSetting();
      return [tableSettings, viewSettings, columnSettings, multiColumnSettings, addColumnSetting];
    }

    const { configSettings } = this.state;
    const tableName = configSettings[0].active;
    const currentTable = getTableByName(tables, tableName);
    let updatedConfigSettings = [...configSettings];

    if (type === 'view') {
      const currentView = getViewByName(currentTable.views, option.name);
      const viewSettings = this.getViewSettings(currentTable, currentView);
      const columnSettings = this.getColumnSettings(currentTable, currentView);
      const multiColumnSettings = this.initMultiDeduplicationColumnSetting(currentTable, currentView, );
      const addColumnSetting = this.getAddColumnSetting();
      updatedConfigSettings.splice(1, 4, viewSettings, columnSettings, multiColumnSettings, addColumnSetting);
      return updatedConfigSettings;
    }

    const viewName = configSettings[1].active;
    const currentView = getViewByName(currentTable.views, viewName);
    const selectedColumns = configSettings[3];
    if (type === 'column') {
      const currentColumn = getTableColumnByName(currentTable, option.name);
      const columnSettings = this.getColumnSettings(currentTable, currentView, currentColumn);
      const columnSelections = this.getMultiDeduplicationColumnSelections(currentTable, currentView, currentColumn);
      const activeColumns = selectedColumns.active.filter((column) => column !== option.name);
      selectedColumns.active = activeColumns;
      selectedColumns.settings = columnSelections;
      updatedConfigSettings.splice(2, 2, columnSettings, selectedColumns);
      return updatedConfigSettings;
    }

    if (type === 'add_column') {
      const columnName = configSettings[2].active;
      const currentColumn = getTableColumnByName(currentTable, columnName);
      const activeDeduplicationColumns = selectedColumns.active;
      const newDeduplicationColumnSetting = this.getMultiDeduplicationColumnSetting(currentTable, currentView, currentColumn, activeDeduplicationColumns);
      updatedConfigSettings.splice(3, 1, newDeduplicationColumnSetting);
      return updatedConfigSettings;
    }

    if (type === 'multi_deduplication_column') {
      const multiDeduplicationColumns = selectedColumns.active;
      if (!option) {
        // delete the column
        multiDeduplicationColumns.splice(multiColumnIndex, 1);
      } else {
        multiDeduplicationColumns.splice(multiColumnIndex, 1, option.name);
      }
      updatedConfigSettings[3].active = multiDeduplicationColumns;
      return updatedConfigSettings;
    }
  };

  getTableSettings = (activeTable = null) => {
    const tables = window.dtableSDK.getTables();
    const tableSettings = tables.map((table) => {
      return { id: table._id, name: table.name };
    });
    return {
      type: 'table',
      name: intl.get('Table'),
      active: activeTable.name,
      settings: tableSettings,
    };
  };

  getViewSettings = (currentTable, activeView = null) => {
    const views = getNonPrivateViews(getNonArchiveViews(currentTable.views));
    const viewSettings = views.map(view => {
      return { id: view._id, name: view.name };
    });

    const active = activeView ? activeView.name : views[0].name;
    return {
      type: 'view',
      name: intl.get('View'),
      settings: viewSettings,
      active,
    };
  };

  getColumnSettings = (currentTable, currentView, activeColumn = null) => {
    let columns = getViewShownColumns(currentView, currentTable.columns);

    // need options: checkout map column
    columns = columns.filter(column => {
      const { type } = column;
      if (FORMULA_COLUMN_TYPES.includes(type) || type === CellType.LINK) {
        const { data } = column;
        const { array_type, result_type } = data;
        return DEDUPLICATION_LIST.includes(result_type) ||
        (result_type === FORMULA_RESULT_TYPE.ARRAY && DEDUPLICATION_LIST.includes(array_type));
      }

      return DEDUPLICATION_LIST.includes(type);
    });

    const columnSettings = columns.map(column => {
      return {id: column.key, name: column.name};
    });

    // need options: checkout map column
    const active = activeColumn ? activeColumn.name : null;

    // need options: checkout map column
    return {
      type: 'column',
      name: intl.get('Column'),
      settings: columnSettings,
      placeholder: intl.get('Select_a_column'),
      active,
    };
  };

  getAddColumnSetting = () => {
    return { type: 'add_column' };
  };

  getMultiDeduplicationColumnSetting = (currentTable, currentView, currentColumn = {}, activeColumns = []) => {
    let columnSettings = this.getMultiDeduplicationColumnSelections(currentTable, currentView, currentColumn);

    const currentActiveColumns = [...activeColumns];

    const option = columnSettings.find((column) => {
      return !currentActiveColumns.includes(column.name);
    });
    if (!option) return {type: 'multi_deduplication_column', active: currentActiveColumns, settings: columnSettings};
    currentActiveColumns.push(option.name);
    return {type: 'multi_deduplication_column', active: currentActiveColumns, settings: columnSettings};
  };

  getMultiDeduplicationColumnSelections = (currentTable, currentView, currentColumn = {}) => {
    const columns = getViewShownColumns(currentView, currentTable.columns);

    // need options: checkout map column
    return columns.filter(column => { //eslint-disable-line
      if (DEDUPLICATION_LIST.includes(column.type) && currentColumn.key !== column.key) {
        return {id: column.key, name: column.name};
      }
    });
  };

  initMultiDeduplicationColumnSetting = (currentTable, currentView, currentColumn = {}) => {
    const columnSettings = this.getMultiDeduplicationColumnSelections(currentTable, currentView, currentColumn = {});
    return { type: 'multi_deduplication_column', active: [], settings: columnSettings };
  };

  onSelectChange = (type, option, multiColumnIndex) => {
    let configSettings = [];
    configSettings = this.updateSelectedSettings(type, option, multiColumnIndex);
    this.getDeduplicationData(configSettings);
    this.setState({
      configSettings: configSettings
    });
  };

  getCellValueDisplayString = (cellValue, column, {tables = [], collaborators = []} = {}) => {
    return this.cellValueUtils.getCellValueDisplayString(cellValue, column, { tables, collaborators });
  };

  getUserCommonInfo = (email, avatar_size) => {
    return window.dtableWebAPI.getUserCommonInfo(email, avatar_size);
  };

  getColumnsByName = (table, columnsNames) => {
    return columnsNames.map((columnName) => getTableColumnByName(table, columnName)).filter(Boolean);
  };

  getDeduplicationData = (configSettings) => {
    const tables = window.dtableSDK.getTables();
    const table = getTableByName(tables, configSettings[0].active);
    const view = getViewByName(table.views, configSettings[1].active);
    const selectedColumn = getTableColumnByName(table, configSettings[2].active);
    if (!selectedColumn) {
      this.setState({
        duplicationRows: [],
        allDeDuplicationColumns: [],
        pageSize: 1,
      });
      return;
    }
    const rows = window.dtableSDK.getViewRows(view, table);
    const formulaRows = window.dtableSDK.getTableFormulaResults(table, rows);
    const deDuplicationColumnNames = [...configSettings[3].active];
    const deDuplicationColumns = this.getColumnsByName(table, deDuplicationColumnNames);
    const allDeDuplicationColumns = [selectedColumn, ...deDuplicationColumns];
    let duplicationRows = [];
    let rowValueMap = {};
    let selectColumnKey2OptionMap = {};
    allDeDuplicationColumns.forEach(column => {
      if (column.type === CellType.SINGLE_SELECT) {
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
        } else if (type === CellType.LINK) {
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
  };

  sortDuplicationRows = (duplicationRows, column, formulaRows) => {
    const { type, key, data = {} } = column;
    const optionsMap = {};
    if (type === CellType.SINGLE_SELECT) {
      const { options } = column.data;
      options.forEach(option => {
        optionsMap[option.id] = option.name;
      });
    }
    // DEDUPLICATION_LIST support five types: CellType.TEXT, CellType.DATE, CellType.NUMBER, CellType.SINGLE_SELECT, CellType.EMAIL
    switch (type) {
      case CellType.NUMBER:
        duplicationRows.sort((currRow, nextRow) => {
          const currCellValue = currRow.item[key];
          const nextCellValue = nextRow.item[key];
          if (currCellValue === nextCellValue) return 0;
          return currCellValue > nextCellValue ? 1 : -1;
        });
        break;
      case CellType.SINGLE_SELECT:
        duplicationRows.sort((currRow, nextRow) => {
          const currCellValue = currRow.item[key];
          const nextCellValue = nextRow.item[key];
          if (currCellValue === nextCellValue) return 0;
          return compareString(optionsMap[currCellValue], optionsMap[nextCellValue]);
        });
        break;
      case CellType.LINK_FORMULA:
      case CellType.FORMULA: {
        duplicationRows.sort((currRow, nextRow) => {
          const currCellValue = formulaRows[currRow.item._id] ? formulaRows[currRow.item._id][key] : null;
          const nextCellValue = formulaRows[nextRow.item._id] ? formulaRows[nextRow.item._id][key] : null;
          return sortFormula(currCellValue, nextCellValue, SORT_TYPE.UP, { columnData: data, value: {} });
        });
        break;
      }
      case CellType.LINK: {
        duplicationRows.sort((currRow, nextRow) => {
          const currCellVal = formulaRows[currRow.item._id] ? formulaRows[currRow.item._id][key] : null;
          const nextCellVal = formulaRows[nextRow.item._id] ? formulaRows[nextRow.item._id][key] : null;
          let currDisplayValues = Array.isArray(currCellVal) ? currCellVal.map(link => link.display_value) : null;
          let nextDisplayValues = Array.isArray(nextCellVal) ? nextCellVal.map(link => link.display_value) : null;
          return sortFormula(currDisplayValues, nextDisplayValues, 'up', {columnData: data, value: {}});
        });
        break;
      }
      // Text and date column values are all string
      case CellType.DATE:
      case CellType.TEXT:
      case CellType.EMAIL:
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
  };

  onDTableChanged = () => {
    this.resetData();
  };

  resetData = () => {
    if (this.state.configSettings) {
      this.getDeduplicationData(this.state.configSettings);
    }
  };

  onPluginToggle = () => {
    this.setState({showDialog: false});
    if (window.app.onClosePlugin) {
      window.app.onClosePlugin();
    }
  };

  onDeleteRow = (rowId) => {
    const currentTable = this.getCurrentTable();
    window.dtableSDK.deleteRowById(currentTable, rowId);
  };

  deleteRowsByIds = (all_row_ids) => {
    const currentTable = this.getCurrentTable();
    window.dtableSDK.deleteRowsByIds(currentTable, all_row_ids);
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
  };

  openDeleteTip = () => {
    this.setState({ isDeleteTipShow: true });
  };

  closeDeleteTip = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ isDeleteTipShow: false });
  };

  onScroll = () => {
    const deleteContainerHeight = 41;
    const marginTop = 20;
    const { offsetHeight, scrollTop } = this.scrollContainer;
    if ((offsetHeight + scrollTop) >= (this.innerTableHeight + deleteContainerHeight + marginTop)) {
      this.setState({ pageSize: this.state.pageSize + 1 });
    }
  };

  setTableHeight = (height) => {
    this.innerTableHeight = height;
  };

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
  };

  onHideExpandRow = () => {
    this.setState({expandedRowIndex: -1});
  };

  setExpandedRowIndex = (index) => {
    this.setState({expandedRowIndex: index});
  };

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
          <DTableModalHeader className={styles['deduplication-plugin-header']} toggle={this.onPluginToggle}>
            <div className="d-flex align-items-center">
              <img src={logo} width="24" alt="logo"/>
              <span className={styles['deduplication-plugin-title']}>{intl.get('Deduplication')}</span>
            </div>
          </DTableModalHeader>
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
                        <div className={styles['delete-all-containers']}>
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
                onDeleteRow={this.onDeleteRow}
                onDeleteSelectedRows={this.deleteRowsByIds}
                setTableHeight={this.setTableHeight}
                formulaRows={this.state.formulaRows}
                getUserCommonInfo={this.getUserCommonInfo}
                getCellValueDisplayString={this.getCellValueDisplayString}
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
