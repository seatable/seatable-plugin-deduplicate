import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { CELL_TYPE } from 'dtable-sdk';
import { SingleSelectFormatter } from 'dtable-ui-component';
import DetailDuplicationDialog from './detail-duplication-dialog';

import styles from '../css/plugin-layout.module.css';

const EMPTY_CELL_CONTENT = intl.get('Empty');

class TableView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      expandRowIndex: -1,
    };
  }

  componentDidMount() {
    this.setTableHeight();
  }

  componentDidUpdate(prevProps) {
    const prevDuplicationRows = prevProps.duplicationRows || [];
    const currDuplicationRows = this.props.duplicationRows || [];
    if (currDuplicationRows.length !== prevDuplicationRows.length) {
      this.setState({expandRowIndex: -1});
    }
    this.setTableHeight();
  }

  setTableHeight = () => {
    if (!this.tableContainer) return;
    setTimeout(() => {
      this.props.setTableHeight(this.tableContainer.offsetHeight);
    }, 0);
  }

  renderHeader = () => {
    const { allDeDuplicationColumns } = this.props;
    if (!allDeDuplicationColumns) return;
    return (
      <thead>
        <tr>
          {allDeDuplicationColumns.map((column) => {
            const { key, name } = column;
            return <th key={`head-${key}`}>{name}</th>;
          })}
          <th>{intl.get('Count')}</th>
        </tr>
      </thead>
    );
  }

  renderBody = () => {
    const { duplicationRows, allDeDuplicationColumns } = this.props;
    if (!Array.isArray(duplicationRows)) {
      return null;
    }

    let singleSelectsOptionsMap = {};
    allDeDuplicationColumns.forEach(column => {
      const { type, data } = column;
      if (type === CELL_TYPE.SINGLE_SELECT) {
        let options = data && data.options ? data.options : [];
        let optionIdMap = {};
        options.forEach(option => optionIdMap[option.id] = true);
        singleSelectsOptionsMap[column.key] = optionIdMap;
      }
    });

    return duplicationRows.map((duplicationRow, rowIndex) => {
      const { cells, count } = duplicationRow;
      return (
        <tr key={`line-${rowIndex}`}>
          {allDeDuplicationColumns.map((column) => {
            const { key, type, data } = column;
            let cellValue = cells[key];
            if ((cellValue === 'null' || cellValue === 'undefined') && cellValue !== 0) {
              cellValue = EMPTY_CELL_CONTENT;
            }

            // for 'single-select'
            if (type === CELL_TYPE.SINGLE_SELECT && cellValue && typeof cellValue === 'string') {
              let options = data && data.options ? data.options : [];
              let option = (singleSelectsOptionsMap[key] || {})[cellValue];
              cellValue = option ? <SingleSelectFormatter options={options} value={cellValue} /> : '';
            }

            return (
              <td key={`cell-${key}`}>
                {cellValue}
              </td>
            );
          })}
          <td
            onClick={this.onExpandDuplicationRow.bind(this, rowIndex)}
            className={styles['value-cell']}
          >
            <span>{count}</span>
          </td>
        </tr>
      );
    });
  }

  onExpandDuplicationRow = (rowIndex) => {
    this.setState({expandRowIndex: rowIndex});
  }

  getExpandRowItem = () => {
    const { expandRowIndex } = this.state;
    const duplicationRow = this.props.duplicationRows[expandRowIndex];
    const { rows = [], count = 0 } = duplicationRow || {};
    const rowsSelected = rows.map(item => false);
    return {
      rows,
      rowsSelected,
      value: count,
      isAllSelected: false,
    };
  }

  onHideExpandRow = () => {
    this.setState({expandRowIndex: -1});
  }

  render() {
    const { expandRowIndex } = this.state;
    const { duplicationRows, configSettings } = this.props;
    if (!Array.isArray(duplicationRows) ||  duplicationRows.length === 0) {
      return <div className={styles['error-description']}>{intl.get('No_duplication')}</div>;
    } else {
      return (
        <Fragment>
          <table ref={(ref) => this.tableContainer = ref}>
            {this.renderHeader()}
            <tbody>
              {this.renderBody()}
            </tbody>
          </table>
          {expandRowIndex > -1 && (
            <DetailDuplicationDialog
              selectedItem={this.getExpandRowItem()}
              configSettings={configSettings}
              collaborators={this.props.collaborators}
              dtable={this.props.dtable}
              onDeleteRow={this.props.onDeleteRow}
              onDeleteSelectedRows={this.props.onDeleteSelectedRows}
              onHideExpandRow={this.onHideExpandRow}
            />
          )}
        </Fragment>
      );
    }
  }
}

TableView.propTypes = {
  duplicationRows: PropTypes.array,
  allDeDuplicationColumns: PropTypes.array,
  configSettings: PropTypes.array,
  collaborators: PropTypes.array,
  dtable: PropTypes.object,
  onDeleteRow: PropTypes.func,
  onDeleteSelectedRows: PropTypes.func,
  setTableHeight: PropTypes.func,
};

export default TableView;
