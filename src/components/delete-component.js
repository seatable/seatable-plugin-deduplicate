import React from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import intl from 'react-intl-universal';
import styles from '../css/plugin-layout.module.css';

class DeleteRowDropdownMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isItemMenuShow: false
    };
  }

  onDropdownToggleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({isItemMenuShow: !this.state.isItemMenuShow});
  };

  render() {
    return(
      <Dropdown isOpen={this.state.isItemMenuShow} toggle={this.onDropdownToggleClick} style={this.props.style || {}} className="align-middle">
        <DropdownToggle tag="span" data-toggle="dropdown" aria-expanded={this.state.isItemMenuShow}>
          <i className={'dtable-font dtable-icon-more-level delete-row-font ' + styles['more-level-font']}></i>
        </DropdownToggle>
        <DropdownMenu right={true}>
          <DropdownItem onClick={this.props.onDeleteRow}>
            {intl.get('Delete')}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    );
  }
}


export default DeleteRowDropdownMenu;
