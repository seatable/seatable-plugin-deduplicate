import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styles from '../css/plugin-layout.module.css';
import DeleteRowDropdownMenu from './delete-component';

const propTypes = {
  rowName: PropTypes.string.isRequired,
  row: PropTypes.string.isRequired,
  onDeleteRow: PropTypes.func.isRequired,
  rowIdx: PropTypes.number.isRequired,
  values: PropTypes.array.isRequired,
  onRef: PropTypes.func.isRequired
};

class RecordItem extends PureComponent {

  constructor(props) {
    super(props);
    this.recordValue = React.createRef();
  }

  componentDidMount() {
    this.props.onRef(this, this.props.rowIdx);
  }

  scrollLeftItem = (scrollLeft) => {
    let el = this.recordValue.current;
    if (el) {
      el.scrollLeft = scrollLeft;
    }
  }

  handleHorizontalScroll = (e) => {
    this.scrollLeft = e.target.scrollLeft;
    this.props.scrollLeftAll(this.scrollLeft);
  }

  expandRecord = () => {
    if (window.app.expandRow) {
      const { table, dtable, row: rowID } = this.props;
      const targetRow = dtable.getRowById(table, rowID)
      window.app.expandRow(targetRow, table);
    }
  }

  render() {
    return (
      <div className={styles['deduplication-record']} style={{'width': this.props.width}} onClick={this.expandRecord}>
        <div className="d-flex justify-content-between w-100">
          <div className={styles['deduplication-record-name']}>{this.props.rowName}</div>
          <DeleteRowDropdownMenu row={this.props.row} onDeleteRow={this.props.onDeleteRow} />
        </div>
        <div className={styles['deduplication-record-value']} ref={this.recordValue} onScroll={this.handleHorizontalScroll}>{this.props.values}</div>
      </div>
    );
  }
}

RecordItem.propTypes = propTypes;
export default RecordItem;
