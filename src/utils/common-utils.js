import { CELL_TYPE } from 'dtable-sdk';
import getPreviewContent from 'dtable-ui-component/lib/SimpleLongTextFormatter/normalize-long-text-value';

export const isValidEmail = (email) => {
  const reg = /^[A-Za-zd]+([-_.][A-Za-zd]+)*@([A-Za-zd]+[-.])+[A-Za-zd]{2,6}$/;

  return reg.test(email);
};

export const isArrayFormalColumn = (columnType) => {
  return [
    CELL_TYPE.IMAGE,
    CELL_TYPE.FILE,
    CELL_TYPE.MULTIPLE_SELECT,
    CELL_TYPE.COLLABORATOR
  ].includes(columnType);
};

export const isValidCellValue = (value) => {
  if (value === undefined) return false;
  if (value === null) return false;
  if (value === '') return false;
  if (JSON.stringify(value) === '{}') return false;
  if (JSON.stringify(value) === '[]') return false;
  return true;
};

export const getFormulaArrayValue = (value, isFlat = true) => {
  if (!Array.isArray(value)) return [];
  if (!isFlat) return getTwoDimensionArrayValue(value);
  return value
    .map(item => {
      if (Object.prototype.toString.call(item) !== '[object Object]') {
        return item;
      }
      if (!Object.prototype.hasOwnProperty.call(item, 'display_value')) return item;
      const { display_value } = item;
      if (!Array.isArray(display_value) || display_value.length === 0) return display_value;
      return display_value.map(i => {
        if (Object.prototype.toString.call(i) === '[object Object]') {
          if (!Object.prototype.hasOwnProperty.call(i, 'display_value')) return i;
          const { display_value } = i;
          return display_value;
        }
        return i;
      });
    })
    .flat()
    .filter(item => isValidCellValue(item));
};

const getTwoDimensionArrayValue = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => {
      if (Object.prototype.toString.call(item) !== '[object Object]') {
        return item;
      }
      if (!Object.prototype.hasOwnProperty.call(item, 'display_value')) return item;
      const { display_value } = item;
      if (!Array.isArray(display_value) || display_value.length === 0) return display_value;
      return display_value.map(i => {
        if (Object.prototype.toString.call(i) === '[object Object]') {
          if (!Object.prototype.hasOwnProperty.call(i, 'display_value')) return i;
          const { display_value } = i;
          return display_value;
        }
        return i;
      });
    });
};

export const convertValueToDtableLongTextValue = (value) => {
  const valueType = Object.prototype.toString.call(value);
  if (value && valueType === '[object String]') {
    return getPreviewContent(value);
  }
  if (valueType === '[object Object]') {
    return value;
  }
  return '';
};
