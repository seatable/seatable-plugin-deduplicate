import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import DetailDuplicationDialog from './detail-duplication-dialog';

import styles from '../css/plugin-layout.module.css';
import { Fragment } from 'react';

const EMPTY_CELL_CONTENT = intl.get('Empty');

class TableView extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      expandRowIndex: -1,
    };
  }

  componentDidUpdate(prevProps) {
    const prevDuplicationRows = prevProps.duplicationRows || [];
    const currDuplicationRows = this.props.duplicationRows || [];
    if (currDuplicationRows.length !== prevDuplicationRows.length) {
      this.setState({expandRowIndex: -1});
    }
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
    return Array.isArray(duplicationRows) && duplicationRows.map((duplicationRow, rowIndex) => {
      const { cells, count } = duplicationRow;
      return (
        <tr key={`line-${rowIndex}`}>
          {allDeDuplicationColumns.map((column) => {
            const { key } = column;
            let cellValue = cells[key];
            if ((cellValue === 'null' || cellValue === 'undefined') && cellValue !== 0) {
              cellValue = EMPTY_CELL_CONTENT;
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
          <table>
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
};

export default TableView;
