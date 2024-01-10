import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { CellType } from 'dtable-utils';
import { getSelectColumnOptionMap } from '../utils';
import Formatter from './formatter';

import styles from '../css/plugin-layout.module.css';

class TableView extends React.Component {

  componentDidMount() {
    this.setTableHeight();
  }

  componentDidUpdate(prevProps) {
    const prevDuplicationRows = prevProps.duplicationRows || [];
    const currDuplicationRows = this.props.duplicationRows || [];
    if (currDuplicationRows.length !== prevDuplicationRows.length) {
      this.props.setExpandedRowIndex(-1);
    }
    this.setTableHeight();
  }

  setTableHeight = () => {
    if (!this.tableContainer) return;
    const tableHeight = this.tableContainer.offsetHeight;
    setTimeout(() => {
      this.props.setTableHeight(tableHeight);
    }, 0);
  };

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
  };

  renderBody = () => {
    const { duplicationRows, allDeDuplicationColumns } = this.props;
    if (!Array.isArray(duplicationRows)) {
      return null;
    }

    let singleSelectsOptionsMap = {};
    allDeDuplicationColumns.forEach(column => {
      const { type } = column;
      if (type === CellType.SINGLE_SELECT) {
        singleSelectsOptionsMap[column.key] = getSelectColumnOptionMap(column);
      }
    });

    return duplicationRows.map((duplicationRow, rowIndex) => {
      const { item, rows } = duplicationRow;
      return (
        <tr key={`line-${rowIndex}`}>
          {allDeDuplicationColumns.map((column) => {
            const { key } = column;

            return (
              <td key={`cell-${key}`}>
                <Formatter
                  column={column}
                  row={item}
                  collaborators={this.props.collaborators}
                  formulaRows={this.props.formulaRows}
                  getUserCommonInfo={this.props.getUserCommonInfo}
                />
              </td>
            );
          })}
          <td
            onClick={this.onExpandDuplicationRow.bind(this, rowIndex)}
            className={styles['value-cell']}
          >
            <span>{rows.length}</span>
          </td>
        </tr>
      );
    });
  };

  onExpandDuplicationRow = (rowIndex) => {
    this.props.setExpandedRowIndex(rowIndex);
  };

  render() {
    const { duplicationRows } = this.props;
    if (!Array.isArray(duplicationRows) ||  duplicationRows.length === 0) {
      return <div className={styles['error-description']}>{intl.get('No_duplication')}</div>;
    } else {
      return (
        <table ref={(ref) => this.tableContainer = ref} className="deduplicate-table-container">
          {this.renderHeader()}
          <tbody>
            {this.renderBody()}
          </tbody>
        </table>
      );
    }
  }
}

TableView.propTypes = {
  formulaRows: PropTypes.object,
  duplicationRows: PropTypes.array,
  allDeDuplicationColumns: PropTypes.array,
  collaborators: PropTypes.array,
  setTableHeight: PropTypes.func,
  getUserCommonInfo: PropTypes.func,
  setExpandedRowIndex: PropTypes.func,
};

export default TableView;
