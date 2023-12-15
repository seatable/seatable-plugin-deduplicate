import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { CellType, SELECT_OPTION_COLORS } from 'dtable-utils';
import {
  TextFormatter,
  NumberFormatter,
  CheckboxFormatter,
  DateFormatter,
  SingleSelectFormatter,
  MultipleSelectFormatter,
  CollaboratorFormatter,
  ImageFormatter,
  FileFormatter,
  SimpleLongTextFormatter,
  GeolocationFormatter,
  FormulaFormatter,
  CTimeFormatter,
  CreatorFormatter,
  LastModifierFormatter,
  MTimeFormatter,
  AutoNumberFormatter,
  UrlFormatter,
  EmailFormatter,
  DurationFormatter,
  RateFormatter,
  ButtonFormatter
} from 'dtable-ui-component';
import LinkFormatter from './link-formatter';
import { isValidEmail } from '../../utils/common-utils';

import styles from '../../css/plugin-layout.module.css';
import '../../css/formatter.css';

const propTypes = {
  type: PropTypes.string,
  column: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
  collaborators: PropTypes.array,
  getLinkCellValue: PropTypes.func,
  getRowsByID: PropTypes.func,
  getTableById: PropTypes.func,
  getUserCommonInfo: PropTypes.func,
  getCellValueDisplayString: PropTypes.func,
};

class Formatter extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      isDataLoaded: false,
      collaborator: null
    };
  }

  componentDidMount() {
    this.calculateCollaboratorData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.calculateCollaboratorData(nextProps);
  }

  calculateCollaboratorData = (props) => {
    const { row, column } = props;
    if (column.type === CellType.LAST_MODIFIER) {
      this.getCollaborator(row._last_modifier);
    } else if (column.type === CellType.CREATOR) {
      this.getCollaborator(row._creator);
    }
  };

  getCollaborator = (value) => {
    if (!value) {
      this.setState({isDataLoaded: true, collaborator: null});
      return;
    }
    this.setState({isDataLoaded: false, collaborator: null});
    let { collaborators } = this.props;
    let collaborator = collaborators && collaborators.find(c => c.email === value);
    if (collaborator) {
      this.setState({isDataLoaded: true, collaborator: collaborator});
      return;
    }
    if (!isValidEmail(value)) {
      let defaultAvatarUrl = `${window.dtable.mediaUrl}/avatars/default.png`;
      collaborator = {
        name: value,
        avatar_url: defaultAvatarUrl,
      };
      this.setState({isDataLoaded: true, collaborator: collaborator});
      return;
    }

    this.props.getUserCommonInfo(value).then(res => {
      collaborator = res.data;
      this.setState({isDataLoaded: true, collaborator: collaborator});
    }).catch(() => {
      const defaultAvatarUrl = `${window.dtable.mediaUrl}/avatars/default.png`;
      collaborator = {
        name: value,
        avatar_url: defaultAvatarUrl,
      };
      this.setState({isDataLoaded: true, collaborator: collaborator});
    });
  };

  renderEmptyFormatter = () => {
    return <span className={styles['row-cell-value-empty']}></span>;
  };

  renderFormatter = () => {
    const { column, row, collaborators } = this.props;
    const { type: columnType, key: columnKey } = column;
    const { isDataLoaded, collaborator } = this.state;
    const containerClassName = `deduplicate-${columnType}-formatter`;
    switch(columnType) {
      case CellType.TEXT: {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        return <TextFormatter value={row[columnKey]} containerClassName={containerClassName} />;
      }
      case CellType.COLLABORATOR: {
        if (!row[columnKey] || row[columnKey].length === 0) return this.renderEmptyFormatter();
        return <CollaboratorFormatter value={row[columnKey]} collaborators={collaborators} containerClassName={containerClassName} />;
      }
      case CellType.LONG_TEXT: {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        return <SimpleLongTextFormatter value={row[columnKey]} />;
      }
      case CellType.IMAGE: {
        if (!row[columnKey] || row[columnKey].length === 0) return this.renderEmptyFormatter();
        return <ImageFormatter value={row[columnKey]} isSample />;
      }
      case CellType.GEOLOCATION : {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        return <GeolocationFormatter value={row[columnKey]} containerClassName={containerClassName} />;
      }
      case CellType.NUMBER: {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        return <NumberFormatter value={row[columnKey]} data={column.data} />;
      }
      case CellType.DATE: {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        return <DateFormatter value={row[columnKey]} format={column.data.format} />;
      }
      case CellType.MULTIPLE_SELECT: {
        if (!row[columnKey] || row[columnKey].length === 0) return this.renderEmptyFormatter();
        const options = (column.data && column.data.options) || [];
        return <MultipleSelectFormatter value={row[columnKey]} options={options} />;
      }
      case CellType.SINGLE_SELECT: {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        const options = (column.data && column.data.options) || [];
        return <SingleSelectFormatter value={row[columnKey]} options={options} />;
      }
      case CellType.FILE: {
        if (!row[columnKey] || row[columnKey].length === 0) return this.renderEmptyFormatter();
        return <FileFormatter value={row[columnKey]} isSample />;
      }
      case CellType.CHECKBOX: {
        let checkboxFormatter = <CheckboxFormatter value={row[columnKey]} />;
        return checkboxFormatter;
      }
      case CellType.CTIME: {
        let cTimeFormatter = <CTimeFormatter value={row._ctime} />;
        if (!row._ctime) {
          cTimeFormatter = this.renderEmptyFormatter();
        }
        return cTimeFormatter;
      }
      case CellType.MTIME: {
        let mTimeFormatter = <MTimeFormatter value={row._mtime} />;
        if (!row._mtime) {
          mTimeFormatter = this.renderEmptyFormatter();
        }
        return mTimeFormatter;
      }
      case CellType.CREATOR: {
        if (!row._creator || !collaborator) return this.renderEmptyFormatter();
        if (isDataLoaded) {
          let creatorFormatter = <CreatorFormatter collaborators={[collaborator]} value={row._creator} />;

          return creatorFormatter;
        }
        return null;
      }
      case CellType.LAST_MODIFIER: {
        if (!row._last_modifier || !collaborator) return this.renderEmptyFormatter();
        if (isDataLoaded) {
          let lastModifierFormatter = <LastModifierFormatter collaborators={[collaborator]} value={row._last_modifier} />;

          return lastModifierFormatter;
        }
        return null;
      }
      case CellType.FORMULA:
      case CellType.LINK_FORMULA: {
        let formulaRows = this.props.formulaRows ? {...this.props.formulaRows} : {};
        let formulaValue = formulaRows[row._id] ? formulaRows[row._id][columnKey] : '';
        if (!formulaValue) return this.renderEmptyFormatter();
        return <FormulaFormatter value={formulaValue} column={column} collaborators={collaborators} containerClassName={containerClassName} />;
      }
      case CellType.LINK: {
        let formulaRows = this.props.formulaRows ? {...this.props.formulaRows} : {};
        let cellValue =  formulaRows[row._id] ?  formulaRows[row._id][columnKey] : '';
        if (!Array.isArray(cellValue) || cellValue.length === 0) return null;
        return (
          <LinkFormatter
            value={cellValue}
            column={column}
            collaborators={collaborators}
            renderEmptyFormatter={this.renderEmptyFormatter}
            getCellValueDisplayString={this.props.getCellValueDisplayString}
            containerClassName={containerClassName}
          />
        );
      }
      case CellType.AUTO_NUMBER: {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        return <AutoNumberFormatter value={row[columnKey]} containerClassName={containerClassName} />;
      }
      case CellType.URL: {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        return <UrlFormatter value={row[columnKey]} containerClassName={containerClassName} />;
      }
      case CellType.EMAIL: {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        return <EmailFormatter value={row[columnKey]} containerClassName={containerClassName} />;
      }
      case CellType.DURATION: {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        return <DurationFormatter value={row[columnKey]} format={column.data.duration_format} containerClassName={containerClassName} />;
      }
      case CellType.RATE: {
        if (!row[columnKey]) return this.renderEmptyFormatter();
        return <RateFormatter value={row[columnKey]} data={column.data} containerClassName={containerClassName} />;
      }
      case CellType.BUTTON: {
        const { data = {} } = column;
        if (!data.button_name) return this.renderEmptyFormatter();
        return <ButtonFormatter data={data} optionColors={SELECT_OPTION_COLORS} containerClassName={containerClassName} />;
      }
      default:
        return null;
    }
  };

  render() {
    return(
      <Fragment>
        {this.renderFormatter()}
      </Fragment>
    );
  }
}

Formatter.propTypes = propTypes;

export default Formatter;
