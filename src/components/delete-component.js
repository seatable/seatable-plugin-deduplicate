import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap';
import intl from 'react-intl-universal';
import { IconButton } from 'dtable-ui-component';

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
          <IconButton icon='dtable-icon-more-level' title={intl.get('Close')} />
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

DeleteRowDropdownMenu.propTypes = {
  style: PropTypes.object,
  onDeleteRow: PropTypes.func,
};

export default DeleteRowDropdownMenu;
