import { CELL_TYPE, FORMULA_RESULT_TYPE } from 'dtable-sdk';
import { getFormulaArrayValue, convertValueToDtableLongTextValue, isArrayFormalColumn } from './common-utils';

class CellValueUtils {

  constructor({ dtable }) {
    this.dtable = dtable;
  }

  getCollaboratorsName = (collaborators, cellVal) => {
    if (cellVal) {
      let collaboratorsName = [];
      cellVal.forEach((v) => {
        let collaborator = collaborators.find(c => c.email === v);
        if (collaborator) {
          collaboratorsName.push(collaborator.name);
        }
      });
      if (collaboratorsName.length === 0) {
        return null;
      }
      return collaboratorsName.join(', ');
    }
    return '';
  }

  getLongTextDisplayString = (cellValue) => {
    const value = convertValueToDtableLongTextValue(cellValue);
    let { text } = value || {};
    if (!text) return '';
    return text;
  }

  getNumberDisplayString = (cellValue, columnData) => {
    if (Array.isArray(cellValue)) {
      if (cellValue.length === 0) return '';
      return cellValue.map(item => this.dtable.getNumberDisplayString(item, columnData)).join(', ');
    }
    return this.dtable.getNumberDisplayString(cellValue, columnData);
  }

  getDateDisplayString = (cellValue, columnData) => {
    if (Array.isArray(cellValue)) {
      if (cellValue.length === 0) return '';
      const validCellValue = cellValue.filter(item => item && typeof item === 'string');
      return validCellValue.map(item => this.dtable.getDateDisplayString(item.replace('T', ' ').replace('Z', ''), columnData));
    }
    if (!cellValue || typeof cellValue !== 'string') return '';
    return this.dtable.getDateDisplayString(cellValue.replace('T', ' ').replace('Z', ''), columnData);
  }

  getMultipleOptionName = (options, cellVal) => {
    if (!cellVal || !options || !Array.isArray(options)) return null;
    let selectedOptions = options.filter((option) => cellVal.includes(option.id));
    if (selectedOptions.length === 0) return null;
    return selectedOptions.map((option) => option.name).join(', ');
  }

  getFormulaDisplayString = (cellValue, column, { tables = [], collaborators = [] } = {}) => {
    if (!column) return '';
    const { data: columnData } = column;
    if (!columnData) return '';
    const { result_type } = columnData;
    if (result_type === FORMULA_RESULT_TYPE.NUMBER) {
      return this.getNumberDisplayString(cellValue, columnData);
    }
    if (result_type === FORMULA_RESULT_TYPE.DATE) {
      return this.getDateDisplayString(cellValue, columnData);
    }
    if (result_type === FORMULA_RESULT_TYPE.ARRAY) {
      const { array_type, array_data } = columnData;
      if (!array_type && !array_data) return '';
      const arrayColumn = { type: array_type, data: array_data };
      if (!isArrayFormalColumn(array_type) && Array.isArray(cellValue)) {
        if (cellValue.length === 0) return '';
        return cellValue.map((val) => {
          return this.getCellValueDisplayString(val, arrayColumn, { tables, collaborators });
        }).join(', ');
      }
      return this.getCellValueDisplayString(cellValue, arrayColumn, { tables, collaborators });
    }
    if (Object.prototype.toString.call(cellValue) === '[object Boolean]') {
      return cellValue + '';
    }
    if (Array.isArray(cellValue)) {
      return cellValue.join(', ');
    }
    return cellValue;
  }

  getCellValueDisplayString = (cellValue, column, {tables = [], collaborators = []} = {}) => {
    const { type, data } = column;
    const newData = data || {};
    switch (type) {
      case CELL_TYPE.GEOLOCATION: {
        if (Array.isArray(cellValue)) {
          if (cellValue.length === 0) return '';
          return cellValue.map(item => this.dtable.getGeolocationDisplayString(item, data)).join(', ');
        }
        return this.dtable.getGeolocationDisplayString(cellValue, data);
      }
      case CELL_TYPE.SINGLE_SELECT: {
        if (!newData) return '';
        const { options } = newData;
        if (!cellValue || !options || !Array.isArray(options)) return '';
        if (Array.isArray(cellValue)) {
          if (cellValue.length === 0) return '';
          const selectedOptions = options.filter((option) => cellValue.includes(option.id));
          if (selectedOptions.length === 0) return '';
          return selectedOptions.map((option) => option.name).join(', ');
        }
        const option = options.find(option => option.id === cellValue);
        return option ? option.name : '';
      }
      case CELL_TYPE.MULTIPLE_SELECT: {
        if (!newData) return '';
        let { options } = newData;
        if (!cellValue || !options || !Array.isArray(options)) return '';
        let selectedOptions = options.filter((option) => cellValue.includes(option.id));
        if (selectedOptions.length === 0) return '';
        return selectedOptions.map((option) => option.name).join(', ');
      }
      case CELL_TYPE.FORMULA:
      case CELL_TYPE.LINK_FORMULA: {
        return this.getFormulaDisplayString(cellValue, column, { tables, collaborators });
      }
      case CELL_TYPE.LONG_TEXT: {
        if (Array.isArray(cellValue)) {
          if (cellValue.length === 0) return '';
          return cellValue.map(item => this.getLongTextDisplayString(item)).join(', ');
        }
        return this.getLongTextDisplayString(cellValue);
      }
      case CELL_TYPE.NUMBER: {
        if (Array.isArray(cellValue)) {
          return cellValue.map(item => this.getNumberDisplayString(item, newData)).join(', ');
        }
        return this.getNumberDisplayString(cellValue, newData);
      }
      case CELL_TYPE.DATE: {
        if (Array.isArray(cellValue)) {
          return cellValue.map(item => this.getDateDisplayString(item, newData)).join(', ');
        }
        return this.getDateDisplayString(cellValue, newData);
      }
      case CELL_TYPE.CTIME:
      case CELL_TYPE.MTIME: {
        const formatObject = { format: 'YYYY-MM-DD HH:mm' };
        if (Array.isArray(cellValue)) {
          return cellValue.map(item => this.getDateDisplayString(item, formatObject)).join(', ');
        }
        return this.getDateDisplayString(cellValue, formatObject);
      }
      case CELL_TYPE.CREATOR:
      case CELL_TYPE.LAST_MODIFIER: {
        if (!cellValue) return '';
        if (Array.isArray(cellValue)) {
          if (cellValue.length === 0) return '';
          return this.getCollaboratorsName(collaborators, cellValue);
        }
        return cellValue === 'anonymous' ? cellValue : this.getCollaboratorsName(collaborators, [cellValue]);
      }
      case CELL_TYPE.COLLABORATOR: {
        return this.getCollaboratorsName(collaborators, cellValue);
      }
      case CELL_TYPE.DURATION: {
        if (!cellValue && cellValue !== 0) return '';
        if (Array.isArray(cellValue)) {
          if (cellValue.length === 0) return '';
          return cellValue.map(item => this.dtable.getDurationDisplayString(item, newData)).join(', ');
        }
        return this.dtable.getDurationDisplayString(cellValue, newData);
      }
      case CELL_TYPE.LINK: {
        if (!Array.isArray(cellValue) || cellValue.length === 0) return '';
        const { data } = column;
        const { display_column_key, array_type, array_data } = data;
        const display_column = {
          key: display_column_key || '0000',
          type: array_type || CELL_TYPE.TEXT,
          data: array_data || null
        };
        return this.getCellValueDisplayString(cellValue, display_column, { tables, collaborators });
      }
      case CELL_TYPE.RATE: {
        if (Array.isArray(cellValue)) {
          if (cellValue.length === 0) return '';
          return cellValue.map(item => item || item === 0).join(', ');
        }
        return cellValue;
      }
      case CELL_TYPE.IMAGE:
      case CELL_TYPE.FILE: {
        return '';
      }
      case FORMULA_RESULT_TYPE.BOOL: {
        return Array.isArray(cellValue) ? cellValue.map(item => item + '').filter(item => item).join(', ') : cellValue + '';
      }
      case FORMULA_RESULT_TYPE.STRING: {
        return Array.isArray(cellValue) ? cellValue.map(item => item).filter(item => item).join(', ') : cellValue;
      }
      default: {
        return Array.isArray(cellValue) ? cellValue.map(item => item + '').filter(item => item).join(', ') : cellValue + '';
      }
    }
  }

  getExportRows = (columns, rows, { tables = [], collaborators = [] } = {}) => {
    let columnsKeyNameMap = {};
    Array.isArray(columns) && columns.forEach(column => {
      const { key, name } = column;
      if (key && name) {
        columnsKeyNameMap[key] = column;
      }
    });
    return Array.isArray(rows) ? rows.map(row => {
      let newRow = {};
      Object.keys(columnsKeyNameMap).forEach(key => {
        const column = columnsKeyNameMap[key];
        const { name, type } = column;
        const cellValue = row[key];
        if (type === CELL_TYPE.LONG_TEXT) {
          newRow[name] = convertValueToDtableLongTextValue(cellValue);
        } else if (type === CELL_TYPE.LINK) {
          const validCellValue = getFormulaArrayValue(cellValue);
          newRow[name] = this.getCellValueDisplayString(validCellValue, column, { tables, collaborators });
        } else if (type === CELL_TYPE.FORMULA || type === CELL_TYPE.LINK_FORMULA) {
          const validCellValue = Array.isArray(cellValue) ? getFormulaArrayValue(cellValue) : cellValue;
          const { data } = column;
          const { result_type } = data || {};
          if (Array.isArray(validCellValue)) {
            newRow[name] = this.getCellValueDisplayString(validCellValue, column, { tables, collaborators });
          } else {
            if (result_type === FORMULA_RESULT_TYPE.NUMBER) {
              newRow[name] = validCellValue;
            } else if (result_type === FORMULA_RESULT_TYPE.DATE) {
              let format = 'YYYY-MM-DD';
              if (data && data.format ) {
                format = data.format ;
              }
              format = format.indexOf('HH:mm') > -1 ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD';
              newRow[name] = cellValue && typeof cellValue === 'string' ? this.dtable.getDateDisplayString(cellValue.replace('T', ' ').replace('Z', ''), { format }) : '';
            } else {
              newRow[name] = this.getCellValueDisplayString(validCellValue, column, { tables, collaborators });
            }
          }
        } else if (type === CELL_TYPE.BUTTON) {
          //
        } else {
          newRow[name] = row[key];
        }
      });
      return newRow;
    }) : [];
  }

  getExportColumns = (columns) => {
    if (!Array.isArray(columns)) return [];
    return columns.map(column => {
      const { type } = column;
      if (type === CELL_TYPE.LINK) return { ...column, data: null, type: CELL_TYPE.TEXT };
      if (column.type === CELL_TYPE.LINK_FORMULA || column.type === CELL_TYPE.FORMULA) {
        const { data } = column;
        const { result_type } = data || {};
        if (result_type === FORMULA_RESULT_TYPE.NUMBER) {
          return { ...column, data: { format: data.format, decimal: data.decimal, thousands: data.thousands, precision: data.precision, enable_precision: data.enable_precision } , type: CELL_TYPE.NUMBER };
        }
        if (result_type === FORMULA_RESULT_TYPE.DATE) {
          let format = 'YYYY-MM-DD';
          if (data && data.format ) {
            format = data.format ;
          }
          return { ...column, data: { format }, type: CELL_TYPE.DATE };
        }
        return { ...column, data: null, type: CELL_TYPE.TEXT };
      }
      return column;
    });
  }

}

export default CellValueUtils;
