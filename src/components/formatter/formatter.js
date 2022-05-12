import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
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
import { isValidEmail } from '../../utils';

import styles from '../../css/plugin-layout.module.css';

const propTypes = {
  type: PropTypes.string,
  column: PropTypes.object.isRequired,
  row: PropTypes.object.isRequired,
  CellType: PropTypes.object,
  collaborators: PropTypes.array,
  getLinkCellValue: PropTypes.func,
  getRowsByID: PropTypes.func,
  getTableById: PropTypes.func,
  getUserCommonInfo: PropTypes.func,
  getMediaUrl: PropTypes.func,
  getOptionColors: PropTypes.func,
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
    const { row, column, CellType } = props;
    if (column.type === CellType.LAST_MODIFIER) {
      this.getCollaborator(row._last_modifier);
    } else if (column.type === CellType.CREATOR) {
      this.getCollaborator(row._creator);
    }
  }

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
      let mediaUrl = this.props.getMediaUrl();
      let defaultAvatarUrl = `${mediaUrl}/avatars/default.png`;
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
      let mediaUrl = this.props.getMediaUrl();
      let defaultAvatarUrl = `${mediaUrl}/avatars/default.png`;
      collaborator = {
        name: value,
        avatar_url: defaultAvatarUrl,
      };
      this.setState({isDataLoaded: true, collaborator: collaborator});
    });
  }

  renderEmptyFormatter = () => {
    return <span className={styles['row-cell-value-empty']}></span>;
  }

  renderFormatter = () => {
    const { column, row, collaborators, CellType } = this.props;
    const { type: columnType, key: columnKey } = column;
    const { isDataLoaded, collaborator } = this.state;

    switch(columnType) {
      case CellType.TEXT: {
        let textFormatter = <TextFormatter value={row[columnKey]} containerClassName="deduplicate-text-editor" />;
        if (!row[columnKey]) {
          textFormatter = this.renderEmptyFormatter();
        }
        return textFormatter;
      }
      case CellType.COLLABORATOR: {
        let collaboratorFormatter = <CollaboratorFormatter value={row[columnKey]} collaborators={collaborators}  containerClassName="deduplicate-text-editor"  />;
        if (!row[columnKey] || row[columnKey].length === 0) {
          collaboratorFormatter = this.renderEmptyFormatter();
        }
        return collaboratorFormatter;
      }
      case CellType.LONG_TEXT: {
        let longTextFormatter = <SimpleLongTextFormatter value={row[columnKey]} />;
        if (!row[columnKey]) {
          longTextFormatter =  this.renderEmptyFormatter();
        }
        return longTextFormatter;
      }
      case CellType.IMAGE: {
        let imageFormatter = <ImageFormatter value={row[columnKey]} isSample />;
        if (!row[columnKey] || row[columnKey].length === 0){
          imageFormatter = this.renderEmptyFormatter();
        }
        return imageFormatter;
      }
      case CellType.GEOLOCATION : {
        let geolocationFormatter = <GeolocationFormatter value={row[columnKey]} containerClassName="deduplicate-text-editor" />;
        if (!row[columnKey]) {
          geolocationFormatter = this.renderEmptyFormatter();
        }
        return geolocationFormatter;
      }
      case CellType.NUMBER: {
        let numberFormatter = <NumberFormatter value={row[columnKey]} data={column.data} />;
        if (!row[columnKey]) {
          numberFormatter = this.renderEmptyFormatter();
        }
        return numberFormatter;
      }
      case CellType.DATE: {
        let dateFormatter = <DateFormatter value={row[columnKey]} format={column.data.format} />;
        if (!row[columnKey]) {
          dateFormatter =  this.renderEmptyFormatter();
        }
        return dateFormatter;
      }
      case CellType.MULTIPLE_SELECT: {
        let multipleSelectFormatter = <MultipleSelectFormatter value={row[columnKey]} options={column.data.options} />;
        if (!row[columnKey] || row[columnKey].length === 0) {
          multipleSelectFormatter = this.renderEmptyFormatter();
        }
        return multipleSelectFormatter;
      }
      case CellType.SINGLE_SELECT: {
        let singleSelectFormatter = <SingleSelectFormatter value={row[columnKey]} options={column.data.options} />;
        if (!row[columnKey]) {
          singleSelectFormatter = this.renderEmptyFormatter();
        }
        return singleSelectFormatter;
      }
      case CellType.FILE: {
        let fileFormatter = <FileFormatter value={row[columnKey]} isSample />;
        if (!row[columnKey] || row[columnKey].length === 0) {
          fileFormatter = this.renderEmptyFormatter();
        }
        return fileFormatter;
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
        let formulaFormatter = <FormulaFormatter value={formulaValue} column={column} collaborators={collaborators} containerClassName="text-center" />;
        if (!formulaValue) {
          formulaFormatter = this.renderEmptyFormatter();
        }
        return formulaFormatter;
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
            getOptionColors={this.props.getOptionColors}
            getCellValueDisplayString={this.props.getCellValueDisplayString}
          />
        );
      }
      case CellType.AUTO_NUMBER: {
        let autoNumberFormatter = <AutoNumberFormatter value={row[columnKey]} containerClassName="deduplicate-text-editor" />;
        if (!row[columnKey]) {
          autoNumberFormatter = this.renderEmptyFormatter();
        }
        return autoNumberFormatter;
      }
      case CellType.URL: {
        let urlFormatter = <UrlFormatter value={row[columnKey]} containerClassName="deduplicate-text-editor" />;
        if (!row[columnKey]) {
          urlFormatter = this.renderEmptyFormatter();
        }
        return urlFormatter;
      }
      case CellType.EMAIL: {
        let emailFormatter = <EmailFormatter value={row[columnKey]} containerClassName="deduplicate-text-editor" />;
        if (!row[columnKey]) {
          emailFormatter = this.renderEmptyFormatter();
        }
        return emailFormatter;
      }
      case CellType.DURATION: {
        let durationFormatter = <DurationFormatter value={row[columnKey]} format={column.data.duration_format} containerClassName="deduplicate-text-editor" />;
        if (!row[columnKey]) {
          durationFormatter = this.renderEmptyFormatter();
        }
        return durationFormatter;
      }
      case CellType.RATE: {
        let rateFormatter = <RateFormatter value={row[columnKey]} data={column.data} containerClassName="deduplicate-text-editor" />;
        if (!row[columnKey]) {
          rateFormatter = this.renderEmptyFormatter();
        }
        return rateFormatter;
      }
      case CellType.BUTTON: {
        const { data = {} } = column;
        const optionColors = this.props.getOptionColors();
        let buttonFormatter = <ButtonFormatter data={data} optionColors={optionColors} containerClassName="text-center" />;
        if (!data.button_name) {
          buttonFormatter = this.renderEmptyFormatter();
        }
        return buttonFormatter;
      }
      default:
        return null;
    }
  }

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
