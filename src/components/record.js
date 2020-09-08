import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styles from '../css/plugin-layout.module.css';
import DeleteRowDropdownMenu from './delete-component';

const propTypes = {
  rowName: PropTypes.string.isRequired,
  row: PropTypes.string.isRequired,
  onRowDelete: PropTypes.func.isRequired,
  rowIdx: PropTypes.number.isRequired,
  values: PropTypes.array.isRequired,
  onRef: PropTypes.func.isRequired
};

class RecordItem extends PureComponent {

  constructor(props) {
    super(props);
    this.recordName = React.createRef();
  }

  componentDidMount() {
    this.props.onRef(this, this.props.rowIdx);
  }

  updateRowNameStyles = (scrollLeft) => {
    let el = this.recordName.current;
    if (el) {
      el.style.marginLeft = scrollLeft + 'px';
    }
  }

  render() {
    return (
      <div className={styles["deduplication-record"]}>
        <div className={styles["deduplication-record-title"]}>
          <div className={styles["deduplication-record-name"]} ref={this.recordName}>{this.props.rowName}</div>
          <DeleteRowDropdownMenu row={this.props.row} onRowDelete={this.props.onRowDelete} />
        </div>
        <div className={styles["deduplication-record-value"]}>{this.props.values}</div>
      </div>
    );
  }
}

RecordItem.propTypes = propTypes;
export default RecordItem;
