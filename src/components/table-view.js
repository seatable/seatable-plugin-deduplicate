import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import { CELL_TYPE } from 'dtable-sdk';
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
      const { type } = column;
      if (type === CELL_TYPE.SINGLE_SELECT) {
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
                  CellType={CELL_TYPE}
                  collaborators={this.props.collaborators}
                  formulaRows={this.props.formulaRows}
                  getUserCommonInfo={this.props.getUserCommonInfo}
                  getMediaUrl={this.props.getMediaUrl}
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
  }

  onExpandDuplicationRow = (rowIndex) => {
    this.props.setExpandedRowIndex(rowIndex);
  }

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
  getMediaUrl: PropTypes.func
};

export default TableView;
