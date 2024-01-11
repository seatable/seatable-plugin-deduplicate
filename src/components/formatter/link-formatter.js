import React from 'react';
import PropTypes from 'prop-types';
import { CellType, FORMULA_RESULT_TYPE } from 'dtable-utils';
import {
  MultipleSelectFormatter,
  NumberFormatter,
  DateFormatter,
  CTimeFormatter,
  MTimeFormatter,
  CheckboxFormatter,
  SimpleLongTextFormatter,
  CollaboratorFormatter
} from 'dtable-ui-component';
import { getFormulaArrayValue, isArrayFormalColumn } from '../../utils/common-utils';

function LinkFormatter(props) {
  const { column, value, containerClassName, collaborators, tables } = props;
  const { data } = column;

  if (!Array.isArray(value) || value.length === 0) return props.renderEmptyFormatter();

  const { display_column_key, array_type, array_data } = data;
  const displayColumn = {
    key: display_column_key || '0000',
    type: array_type || CellType.TEXT,
    data: array_data || null
  };
  const { type: displayColumnType , data: displayColumnData } = displayColumn;
  const cellValue = getFormulaArrayValue(value, !isArrayFormalColumn(displayColumnType));
  if (!Array.isArray(cellValue) || cellValue.length === 0) return props.renderEmptyFormatter();
  switch(displayColumnType) {
    case CellType.TEXT:
    case CellType.AUTO_NUMBER:
    case CellType.EMAIL:
    case CellType.URL: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return (
              <div key={`link-${displayColumnType}-${index}`} className="deduplicate-link-item">
                {value}
              </div>
            );
          })}
        </div>
      );
    }
    case CellType.NUMBER: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value && value !== 0) return null;
            return <NumberFormatter
              key={`link-${displayColumnType}-${index}`}
              containerClassName="deduplicate-link-item"
              data={displayColumnData || {}}
              value={value}
            />;
          })}
        </div>
      );
    }
    case CellType.DATE: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value || typeof value !== 'string') return null;
            const { format } = displayColumnData || {};
            return <DateFormatter
              key={`link-${displayColumnType}-${index}`}
              value={value.replace('T', ' ').replace('Z', '')}
              format={format}
              containerClassName="deduplicate-link-item"
            />;
          })}
        </div>
      );
    }
    case CellType.CTIME: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return <CTimeFormatter
              key={`link-${displayColumnType}-${index}`}
              value={value}
              containerClassName="deduplicate-link-item"
            />;
          })}
        </div>
      );
    }
    case CellType.MTIME: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return <MTimeFormatter
              key={`link-${displayColumnType}-${index}`}
              value={value}
              containerClassName="deduplicate-link-item"
            />;
          })}
        </div>
      );
    }
    case CellType.DURATION: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return <div key={`link-${displayColumnType}-${index}`} className="deduplicate-link-item">
              {props.getCellValueDisplayString(value, displayColumn)}
            </div>;
          })}
        </div>
      );
    }
    case CellType.CREATOR:
    case CellType.LAST_MODIFIER: {
      return (
        <div className="dtable-ui cell-formatter-container collaborator-formatter deduplicate-collaborator-formatter">
          {cellValue.map((value, index) => {
            if (!value) return null;
            return <CollaboratorFormatter
              key={`link-${displayColumnType}-${index}`}
              value={value}
              collaborators={collaborators}
            />;
          })}
        </div>
      );
    }
    case CellType.SINGLE_SELECT: {
      if (!cellValue || cellValue.length === 0) return props.renderEmptyFormatter();
      const options = displayColumnData && Array.isArray(displayColumnData.options) ? displayColumnData.options : [];
      return <MultipleSelectFormatter value={cellValue} options={options || []} containerClassName={`deduplicate-${displayColumnType}-formatter`} />;
    }
    case CellType.MULTIPLE_SELECT: {
      if (!cellValue || cellValue.length === 0) return props.renderEmptyFormatter();
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            const valueDisplayString = Array.isArray(value) ?
              props.getCellValueDisplayString(value, displayColumn)
              :
              props.getCellValueDisplayString([value], displayColumn);
            return (
              <div key={`link-${displayColumnType}-${index}`} className="deduplicate-link-item">
                {valueDisplayString}
              </div>
            );
          })}
        </div>
      );
    }
    case CellType.COLLABORATOR: {
      if (!cellValue || cellValue.length === 0) return props.renderEmptyFormatter();
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            const valueDisplayString = Array.isArray(value) ?
              props.getCellValueDisplayString(value, displayColumn, { collaborators })
              :
              props.getCellValueDisplayString([value], displayColumn, { collaborators });
            return (
              <div key={`link-${displayColumnType}-${index}`} className="deduplicate-link-item">
                {valueDisplayString}
              </div>
            );
          })}
        </div>
      );
    }
    case CellType.CHECKBOX: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            return <CheckboxFormatter
              key={`link-${displayColumnType}-${index}`}
              value={Boolean(value)}
              containerClassName={`deduplicate-${displayColumnType}-item`}
            />;
          })}
        </div>
      );
    }
    case CellType.GEOLOCATION: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return (
              <div key={`link-${displayColumnType}-${index}`} className="deduplicate-link-item">
                {props.getCellValueDisplayString(value, displayColumn)}
              </div>
            );
          })}
        </div>
      );
    }
    case CellType.LONG_TEXT: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return (
              <SimpleLongTextFormatter
                key={`link-${displayColumnType}-${index}`}
                value={value}
                containerClassName={`deduplicate-${displayColumnType}-item`}
              />
            );
          })}
        </div>
      );
    }
    case CellType.FORMULA:
    case CellType.LINK_FORMULA: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return (
              <div key={`link-${displayColumnType}-${index}`} className="deduplicate-link-item">
                {props.getCellValueDisplayString(value, displayColumn, { collaborators, tables })}
              </div>
            );
          })}
        </div>
      );
    }
    case FORMULA_RESULT_TYPE.BOOL: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            return (
              <div key={`link-${displayColumnType}-${index}`} className="deduplicate-link-item">
                {value + ''}
              </div>
            );
          })}
        </div>
      );
    }
    case FORMULA_RESULT_TYPE.STRING: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return (
              <div key={`link-${displayColumnType}-${index}`} className="deduplicate-link-item">
                {value}
              </div>
            );
          })}
        </div>
      );
    }
    default: {
      return props.renderEmptyFormatter();
    }
  }
}

LinkFormatter.propTypes = {
  column: PropTypes.object.isRequired,
  value: PropTypes.any,
  collaborators: PropTypes.array,
  tables: PropTypes.array,
  containerClassName: PropTypes.string,
  renderEmptyFormatter: PropTypes.func,
  getCellValueDisplayString: PropTypes.func,
};

export default LinkFormatter;
