import React from 'react';
import PropTypes from 'prop-types';
import intl from 'react-intl-universal';
import styles from '../../css/plugin-layout.module.css';

const propTypes = {
  onDelect: PropTypes.func.isRequired,
  toggle: PropTypes.func.isRequired,
};

class DeleteTip extends React.Component {
  render() {
    const { toggle, onDelect } = this.props;
    return (
      <div className={styles['delete-tip-container']}>
        <div className={styles['delete-tip-header']}>
          {intl.get('Are_you_sure_you_want_to_delete_duplicated_records')}
        </div>
        <div className={styles['delete-tip-footer']}>
          <button className="btn btn-secondary mr-2" onClick={toggle}>{intl.get('Cancel')}</button>
          <button className="btn btn-primary" onClick={onDelect}>{intl.get('Delete')}</button>
        </div>
      </div>
    );
  }
}

DeleteTip.propTypes = propTypes;

export default DeleteTip;
