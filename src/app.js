import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import Settings from './components/settings';
import TableView from './components/table-view';
import DTable from 'dtable-sdk';
import intl from 'react-intl-universal';
import './locale/index.js'

import styles from './css/plugin-layout.module.css';

import DetailDuplicationDialog from './components/detail-duplication-dialog';

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
    this.getDeduplicationData(configSettings);
    this.setState({
      configSettings: configSettings,
    });
  }

  initPluginSettings = () => {
    let activeTable = this.dtable.getActiveTable();
    let activeView = this.dtable.getActiveView();
    let columns = this.dtable.getShownColumns(activeTable, activeView);
    return  {tableName: activeTable.name, viewName: activeView.name, columnName: columns[0].name};
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
    configSettings.push(columnSettings);

    return configSettings;
  }

  updateSelectedSettings = (type, option) => {
    if (type === 'table') {
      let currentTable = this.dtable.getTableByName(option.name);
      let currentView = this.dtable.getViews(currentTable)[0];

      let tableSettings = this.getTableSettings(currentTable);
      let viewSettings = this.getViewSettings(currentTable);
      let columnSettings = this.getColumnSettings(currentTable, currentView);
      let configSettings = [tableSettings, viewSettings, columnSettings];
      return configSettings;
    }

    if (type === 'view') {
      let { configSettings } = this.state;
      const tableName = configSettings[0].active;
      let currentTable = this.dtable.getTableByName(tableName);
      let currentView = this.dtable.getViewByName(currentTable, option.name);
      let viewSettings = this.getViewSettings(currentTable, currentView);
      let columnSettings = this.getColumnSettings(currentTable, currentView);
      configSettings.splice(1, 2, viewSettings, columnSettings);
      return configSettings;
    }
    
    if (type === 'column') {
      let { configSettings } = this.state;
      const tableName = configSettings[0].active;
      const viewName = configSettings[1].active;
      let currentTable = this.dtable.getTableByName(tableName);
      let currentView = this.dtable.getViewByName(currentTable, viewName);
      let currentColumn = this.dtable.getColumnByName(currentTable, option.name);
      let columnSettings = this.getColumnSettings(currentTable, currentView, currentColumn);
      configSettings.splice(2, 1, columnSettings);
      return configSettings;
    }
  }

  getTableSettings = (activeTable = null) => {
    let tables = this.dtable.getTables();
    let tableSettings = tables.map(table => {
      return {id: table._id, name: table.name};
    });
    let active = activeTable ? activeTable.name : tables[0].name;
    return {type: 'table', name: intl.get('Table'), active: active, settings: tableSettings}
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
    
    // need options: checkout map column
    let active = activeColumn ? activeColumn.name : columns[0].name;
    return {type: 'column', name: intl.get('Column'), active: active, settings: columnSettings};
  }

  onSelectChange = (type, option) => {
    let configSettings = [];
    configSettings = this.updateSelectedSettings(type, option);

    this.getDeduplicationData(configSettings);

    this.setState({
      configSettings: configSettings
    });
  }

  onRowDelete = (rowId) => {
    const { configSettings } = this.state;
    const tableName = configSettings[0].active;
    let currentTable = this.dtable.getTableByName(tableName);
    this.dtable.deleteRowById(currentTable, rowId);
  }

  getDeduplicationData = (configSettings) => {
    const table = this.dtable.getTableByName(configSettings[0].active);
    const view = this.dtable.getViewByName(table, configSettings[1].active);
    const rows = this.dtable.getViewRows(view, table);
    const selectedColumn = this.dtable.getColumnByName(table, configSettings[2].active);
    const columnKey = selectedColumn.key;
    let statData = {};

    rows.map((item) => {
      const value = item[columnKey];
      if (!statData[value]) {
        statData[value] = {};
        statData[value].value = 1;
        statData[value].rows = [];
        statData[value].rows.push(item._id);
        return;
      };
      const count = statData[value].value;
      statData[value].value = count + 1;
      statData[value].rows.push(item._id);
    });

    const duplicationData = {};

    const keys = Object.keys(statData).sort();
    
    keys.forEach((key) => {
      if (statData[key].value > 1) {
        duplicationData[key] = statData[key];
      }
    });

    let selectedItem = this.state.selectedItem;
    if (selectedItem) {
      if (duplicationData[selectedItem.key]) {
        selectedItem = Object.assign(selectedItem, duplicationData[selectedItem.key]);
      } else {
        selectedItem = {};
      }
    }
    
    this.setState({
      duplicationData,
      selectedItem
    });
  }

  showDetailDialog = (e, selectedItem) => {
    this.setState({
      isShowDetailDialog: true,
      selectedItem
    })
  }

  toggleDetailDialog = () => {
    this.setState({
      isShowDetailDialog: !this.state.isShowDetailDialog
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
  }

  setDetailData = (selectedItem) => {
    this.setState({
      selectedItem: selectedItem
    });
  }

  render() {
    let { showDialog, configSettings, isShowDetailDialog, duplicationData, selectedItem } = this.state;
    return (
      <Fragment>
        <Modal contentClassName={styles['modal-content']} isOpen={showDialog} toggle={this.onPluginToggle} className={styles['deduplication-plugin']} size="lg">
          <ModalHeader className={styles['deduplication-plugin-header']} toggle={this.onPluginToggle}>{intl.get('Deduplication_plugin')}</ModalHeader>
          <ModalBody className={styles['deduplication-plugin-content']}>
            <div className={styles['deduplication-plugin-wrapper']}>
              {
                <div className={styles['deduplication-plugin-show']}>
                  <div className={styles['table-wrapper']}>                
                    <TableView
                      duplicationData={duplicationData}
                      clickCallback={this.showDetailDialog}
                      selectedItem={selectedItem}
                    />
                  </div>
                </div>
              }
              {
                <Settings
                  configSettings={configSettings}
                  onSelectChange={this.onSelectChange}
                />
              }
            </div>
          </ModalBody>
        </Modal>
        {
          isShowDetailDialog && <DetailDuplicationDialog
            toggleDetailDialog={this.toggleDetailDialog}
            showDialog={isShowDetailDialog}
            duplicationData={duplicationData}
            selectedItem={selectedItem}
            configSettings={configSettings}
            dtable={this.dtable}
            setDetailData={this.setDetailData}
            collaborators={this.collaborators}
            onRowDelete={this.onRowDelete}
          />
        }
      </Fragment>
    );
  }
}

App.propTypes = propTypes;

export default App;
