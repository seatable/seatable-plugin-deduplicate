import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import DTable from 'dtable-sdk';
import Settings from './components/settings';
import TableView from './components/table-view';
import { compareString } from  './utils';

import './locale/index.js';

import styles from './css/plugin-layout.module.css';

const DEDUPLICATION_LIST = ['text', 'date', 'number'];

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
      selectedItem: {},
      duplicationData: {}
    };
    this.dtable = new DTable();
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
    let multiColumnSettings = this.initMuiltiDeduplicationColumnSetting(activeTable, activeView, activeColumn);
    let addColumnSetting = this.getAddColumnSetting();
    configSettings.push(columnSettings, multiColumnSettings, addColumnSetting);
    return configSettings;
  }

  updateSelectedSettings = (type, option, multiColumnIndex) => {
    if (type === 'table') {
      let currentTable = this.dtable.getTableByName(option.name);
      let currentView = this.dtable.getViews(currentTable)[0];

      let tableSettings = this.getTableSettings(currentTable);
      let viewSettings = this.getViewSettings(currentTable);
      let columnSettings = this.getColumnSettings(currentTable, currentView);
      let multiColumnSettings = this.initMuiltiDeduplicationColumnSetting(currentTable, currentView);
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
      let multiColumnSettings = this.initMuiltiDeduplicationColumnSetting(currentTable, currentView, );
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
      const columnSelections = this.getMuiltiDeduplicationColumnSelections(currentTable, currentView, currentColumn);
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
      const newDeduplicationColumnSetting = this.getMuiltiDeduplicationColumnSetting(currentTable, currentView, currentColumn, activeDeduplicationColumns);
      configSettings.splice(3, 1, newDeduplicationColumnSetting);
      return configSettings;
    }

    if (type === 'multi_deduplication_column') {
      let { configSettings } = this.state;
      const multiDeduplicationColumns = configSettings[3].active;
      multiDeduplicationColumns.splice(multiColumnIndex, 1, option.name);
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
    let views = this.dtable.getViews(currentTable);
    let viewSettings = views.map(view => {
      return {id: view._id, name: view.name};
    });

    let active = activeView ? activeView.name : views[0].name;
    return {type: 'view', name: intl.get('View'), active: active, settings: viewSettings};
  }

  getColumnSettings = (currentTable, currentView, activeColumn = null) => {
    let columns = this.dtable.getShownColumns(currentTable, currentView);
    // need options: checkout map column
    columns = columns.filter(column => {
      return DEDUPLICATION_LIST.includes(column.type);
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

  getMuiltiDeduplicationColumnSetting = (currentTable, currentView, currentColumn = {}, activeColumns = []) => {
    let columnSettings = this.getMuiltiDeduplicationColumnSelections(currentTable, currentView, currentColumn);

    const currentActiveColumns = [...activeColumns];

    const option = columnSettings.find((column) => {
      return !currentActiveColumns.includes(column.name);
    });
    if (!option) return {type: 'multi_deduplication_column', active: currentActiveColumns, settings: columnSettings};
    currentActiveColumns.push(option.name);
    return {type: 'multi_deduplication_column', active: currentActiveColumns, settings: columnSettings};
  }

  getMuiltiDeduplicationColumnSelections = (currentTable, currentView, currentColumn = {}) => {
    let columns = this.dtable.getShownColumns(currentTable, currentView);
    // need options: checkout map column
    return columns.filter(column => { //eslint-disable-line
      if (DEDUPLICATION_LIST.includes(column.type) && currentColumn.key !== column.key) {
        return {id: column.key, name: column.name};
      }
    });
  }

  initMuiltiDeduplicationColumnSetting = (currentTable, currentView, currentColumn = {}) => {
    let columnSettings = this.getMuiltiDeduplicationColumnSelections(currentTable, currentView, currentColumn = {});
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

  getColumnsByName = (table, columns) => {
    return columns.map((column) => {
      return this.dtable.getColumnByName(table, column);
    });
  }

  getDeduplicationData = (configSettings) => {
    const table = this.dtable.getTableByName(configSettings[0].active);
    const view = this.dtable.getViewByName(table, configSettings[1].active);
    const selectedColumn = this.dtable.getColumnByName(table, configSettings[2].active);
    if (!selectedColumn) {
      this.setState({
        duplicationRows: [],
        allDeDuplicationColumns: [],
      });
      return;
    }

    const rows = this.dtable.getViewRows(view, table);
    const deDuplicationColumnNames = [...configSettings[3].active];
    const deDuplicationColumns = this.getColumnsByName(table, deDuplicationColumnNames);
    const allDeDuplicationColumns = [selectedColumn, ...deDuplicationColumns];
    let duplicationRows = [];
    rows.forEach((item) => {
      const statRowIndex = this.findExistStatRowIndex(item, duplicationRows, allDeDuplicationColumns);
      if (statRowIndex > -1) {
        duplicationRows[statRowIndex].count = duplicationRows[statRowIndex].count + 1;
        duplicationRows[statRowIndex].rows.push(item._id);
      } else {
        const cells = {};
        allDeDuplicationColumns.forEach((column) => cells[column.key] = item[column.key]);
        duplicationRows.push({
          count: 1,
          rows: [item._id],
          cells
        });
      }
    });
    duplicationRows = duplicationRows.filter((statRow) => statRow.count > 1);
    this.sortDuplicationRows(duplicationRows, selectedColumn);
    this.setState({
      duplicationRows,
      allDeDuplicationColumns,
    });
  }

  findExistStatRowIndex(rawRow, duplicationRows, columns) {
    return duplicationRows.findIndex((statRow) => {
      return columns.every((column) => statRow.cells[column.key] === rawRow[column.key]);
    });
  }

  sortDuplicationRows = (duplicationRows, selectedColumn) => {
    duplicationRows.sort((currRow, nextRow) => {
      const currCellValue = currRow.cells[selectedColumn.key];
      const nextCellValue = nextRow.cells[selectedColumn.key];
      if (!currCellValue && currCellValue !== 0) {
        return -1;
      }
      if (!nextCellValue && nextCellValue !== 0) {
        return 1;
      }
      if (currCellValue === nextCellValue) return 0;
      return compareString(currCellValue, nextCellValue);
    });
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

  deleteSelectedRows = (rowIds) => {
    const { configSettings } = this.state;
    const tableName = configSettings[0].active;
    const currentTable = this.dtable.getTableByName(tableName);
    this.dtable.deleteRowsByIds(currentTable, rowIds);
  }

  render() {
    let { showDialog, configSettings, duplicationRows, allDeDuplicationColumns } = this.state;
    return (
      <Fragment>
        <Modal contentClassName={styles['modal-content']} isOpen={showDialog} toggle={this.onPluginToggle} className={styles['deduplication-plugin']} size="lg">
          <ModalHeader className={styles['deduplication-plugin-header']} toggle={this.onPluginToggle}>{intl.get('Deduplication')}</ModalHeader>
          <ModalBody className={styles['deduplication-plugin-content']}>
            {(window.dtable && window.dtable.permission === 'r') ?
              <p className="h-100 d-flex align-items-center justify-content-center text-red">{intl.get('This_plugin_is_not_available_now')}</p> : (
                <div className={styles['deduplication-plugin-wrapper']}>
                  <div className={styles['deduplication-plugin-show']}>
                    <div className={styles['table-wrapper']}>
                      <TableView
                        duplicationRows={duplicationRows}
                        allDeDuplicationColumns={allDeDuplicationColumns}
                        configSettings={configSettings}
                        collaborators={this.collaborators}
                        dtable={this.dtable}
                        onDeleteRow={this.onDeleteRow}
                        onDeleteSelectedRows={this.deleteSelectedRows}
                      />
                    </div>
                  </div>
                  <Settings
                    configSettings={configSettings}
                    onSelectChange={this.onSelectChange}
                  />
                </div>
              )}
          </ModalBody>
        </Modal>
      </Fragment>
    );
  }
}

App.propTypes = propTypes;

export default App;
