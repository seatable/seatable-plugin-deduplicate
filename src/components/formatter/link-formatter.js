import React from 'react';
import PropTypes from 'prop-types';
import { CELL_TYPE, FORMULA_RESULT_TYPE } from 'dtable-sdk';
import {
  MultipleSelectFormatter,
  NumberFormatter,
  DateFormatter,
  CTimeFormatter,
  MTimeFormatter,
  CheckboxFormatter,
  LongTextFormatter,
} from 'dtable-ui-component';
import CollaboratorItemFormatter from './collaborator-formatter';
import { getFormulaArrayValue, isArrayFormalColumn } from '../../utils/common-utils';

function LinkFormatter(props) {
  const { column, value, containerClassName, collaborators, tables } = props;
  const { data } = column;

  if (!Array.isArray(value) || value.length === 0) return props.renderEmptyFormatter();

  const { display_column_key, array_type, array_data } = data;
  const displayColumn = {
    key: display_column_key || '0000',
    type: array_type || CELL_TYPE.TEXT,
    data: array_data || null
  };
  const { type: displayColumnType , data: displayColumnData } = displayColumn;
  const cellValue = getFormulaArrayValue(value, !isArrayFormalColumn(displayColumnType));
  if (!Array.isArray(cellValue) || cellValue.length === 0) return props.renderEmptyFormatter();
  switch(displayColumnType) {
    case CELL_TYPE.TEXT:
    case CELL_TYPE.AUTO_NUMBER:
    case CELL_TYPE.EMAIL:
    case CELL_TYPE.URL: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return (
              <div key={`link-${displayColumnType}-${index}`} className="sql-query-link-item">
                {value}
              </div>
            );
          })}
        </div>
      );
    }
    case CELL_TYPE.NUMBER: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value && value !== 0) return null;
            return <NumberFormatter
              key={`link-${displayColumnType}-${index}`}
              containerClassName="sql-query-link-item"
              data={displayColumnData || {}}
              value={value}
            />;
          })}
        </div>
      );
    }
    case CELL_TYPE.DATE: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value || typeof value !== 'string') return null;
            const { format } = displayColumnData || {};
            return <DateFormatter
              key={`link-${displayColumnType}-${index}`}
              value={value.replace('T', ' ').replace('Z', '')}
              format={format}
              containerClassName="sql-query-link-item"
            />;
          })}
        </div>
      );
    }
    case CELL_TYPE.CTIME: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return <CTimeFormatter
              key={`link-${displayColumnType}-${index}`}
              value={value}
              containerClassName="sql-query-link-item"
            />;
          })}
        </div>
      );
    }
    case CELL_TYPE.MTIME: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return <MTimeFormatter
              key={`link-${displayColumnType}-${index}`}
              value={value}
              containerClassName="sql-query-link-item"
            />;
          })}
        </div>
      );
    }
    case CELL_TYPE.DURATION: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return <div key={`link-${displayColumnType}-${index}`} className="sql-query-link-item">
              {props.getCellValueDisplayString(value, displayColumn)}
            </div>;
          })}
        </div>
      );
    }
    case CELL_TYPE.CREATOR:
    case CELL_TYPE.LAST_MODIFIER: {
      return (
        <div className="dtable-ui cell-formatter-container collaborator-formatter sql-query-collaborator-formatter">
          {cellValue.map((value, index) => {
            if (!value) return null;
            return <CollaboratorItemFormatter
              key={`link-${displayColumnType}-${index}`}
              value={value}
              collaborators={collaborators}
            />;
          })}
        </div>
      );
    }
    case CELL_TYPE.SINGLE_SELECT: {
      if (!cellValue || cellValue.length === 0) return props.renderEmptyFormatter();
      const options = displayColumnData && Array.isArray(displayColumnData.options) ? displayColumnData.options : [];
      return <MultipleSelectFormatter value={cellValue} options={options || []} containerClassName={`sql-query-${displayColumnType}-formatter`} />;
    }
    case CELL_TYPE.MULTIPLE_SELECT: {
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
              <div key={`link-${displayColumnType}-${index}`} className="sql-query-link-item">
                {valueDisplayString}
              </div>
            );
          })}
        </div>
      );
    }
    case CELL_TYPE.COLLABORATOR: {
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
              <div key={`link-${displayColumnType}-${index}`} className="sql-query-link-item">
                {valueDisplayString}
              </div>
            );
          })}
        </div>
      );
    }
    case CELL_TYPE.CHECKBOX: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            return <CheckboxFormatter
              key={`link-${displayColumnType}-${index}`}
              value={Boolean(value)}
              containerClassName={`sql-query-${displayColumnType}-item`}
            />;
          })}
        </div>
      );
    }
    case CELL_TYPE.GEOLOCATION: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return (
              <div key={`link-${displayColumnType}-${index}`} className="sql-query-link-item">
                {props.getCellValueDisplayString(value, displayColumn)}
              </div>
            );
          })}
        </div>
      );
    }
    case CELL_TYPE.LONG_TEXT: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return (
              <LongTextFormatter
                key={`link-${displayColumnType}-${index}`}
                value={value}
                containerClassName={`sql-query-${displayColumnType}-item`}
              />
            );
          })}
        </div>
      );
    }
    case CELL_TYPE.FORMULA:
    case CELL_TYPE.LINK_FORMULA: {
      return (
        <div className={containerClassName}>
          {cellValue.map((value, index) => {
            if (!value) return null;
            return (
              <div key={`link-${displayColumnType}-${index}`} className="sql-query-link-item">
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
              <div key={`link-${displayColumnType}-${index}`} className="sql-query-link-item">
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
              <div key={`link-${displayColumnType}-${index}`} className="sql-query-link-item">
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
  containerClassName: PropTypes.string,
  renderEmptyFormatter: PropTypes.func,
  getOptionColors: PropTypes.func,
  getCellValueDisplayString: PropTypes.func,
};

export default LinkFormatter;
