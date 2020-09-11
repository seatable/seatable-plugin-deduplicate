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
    this.state = {
      marginX: 'auto'
    };
  }

  componentDidMount() {
    this.props.onRef(this, this.props.rowIdx);
    this.setState({
      marginX: 258 - this.recordName.current.clientWidth
    });
  }

  updateRowNameStyles = (scrollLeft) => {
    let el = this.recordName.current;
    if (el) {
      el.style.marginLeft = scrollLeft + 'px';
    }
  }

  render() {
    const { marginX } = this.state;
    return (
      <div className={styles["deduplication-record"]}>
        <div className={styles["deduplication-record-title"]}>
          <div className={styles["deduplication-record-name"]} ref={this.recordName}>{this.props.rowName}</div>
          <DeleteRowDropdownMenu style={{marginLeft: marginX}} row={this.props.row} onRowDelete={this.props.onRowDelete} />
        </div>
        <div className={styles["deduplication-record-value"]}>{this.props.values}</div>
      </div>
    );
  }
}

RecordItem.propTypes = propTypes;
export default RecordItem;
