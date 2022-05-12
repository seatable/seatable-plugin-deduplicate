import { CELL_TYPE } from 'dtable-sdk';
import getPreviewContent from 'dtable-ui-component/lib/SimpleLongTextFormatter/normalize-long-text-value';
import { NOT_SUPPORT_COLUMN_TYPES, NOT_DISPLAY_COLUMN_KEYS } from '../constants';

export const isValidEmail = (email) => {
  const reg = /^[A-Za-zd]+([-_.][A-Za-zd]+)*@([A-Za-zd]+[-.])+[A-Za-zd]{2,6}$/;

  return reg.test(email);
};

export const getValueFromPluginConfig = (attribute) => {
  if (window.dtable) {
    return window.dtable[attribute];
  }
  return window.dtablePluginConfig[attribute];
};

export const getValueFromPluginAppConfig = (attribute) => {
  if (window.app) {
    return window.app[attribute];
  }
  return window.dtablePluginConfig[attribute];
};

export const getCellRecordWidth = (column) => {
  let { type, data } = column;
  switch (type) {
    case CELL_TYPE.DATE: {
      let isShowHourAndMinute = data && data.format && data.format.indexOf('HH:mm') > -1;
      return isShowHourAndMinute ? 160 : 100;
    }
    case CELL_TYPE.LONG_TEXT:
    case CELL_TYPE.AUTO_NUMBER:
    case CELL_TYPE.URL:
    case CELL_TYPE.EMAIL: {
      return 200;
    }
    case CELL_TYPE.CHECKBOX: {
      return 80;
    }
    case CELL_TYPE.NUMBER: {
      return 120;
    }
    case CELL_TYPE.CTIME:
    case CELL_TYPE.MTIME: {
      return 170;
    }
    case CELL_TYPE.RATE: {
      const { rate_max_number } = data || {};
      const rateMaxNumber = rate_max_number || 5;
      return 16 * rateMaxNumber + 20;
    }
    case CELL_TYPE.LINK: {
      return 200;
    }
    default: {
      return 160;
    }
  }
};

export const generatorBase64Code = (keyLength = 4) => {
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < keyLength; i++) {
    key += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return key;
};

export const generatorViewId = (views) => {
  let view_id, isUnique = false;
  while (!isUnique) {
    view_id = generatorBase64Code(4);

    // eslint-disable-next-line
    isUnique = views.every(item => {return item._id !== view_id;});
    if (isUnique) {
      break;
    }
  }
  return view_id;
};

export const bytesToSize = bytes => {
  if (typeof(bytes) == 'undefined') return ' ';

  if(bytes < 0) return '--';
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  if (bytes === 0) return bytes + sizes[0];

  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1000)), 10);
  if (i === 0) return bytes + sizes[i];
  return (bytes / (1000 ** i)).toFixed(1) + sizes[i];
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

export const getDisplayColumns = (columns) => {
  if (!Array.isArray(columns) || columns.length === 0) return [];
  return columns.filter(column => {
    const { type, key } = column;
    if (NOT_SUPPORT_COLUMN_TYPES.includes(type)) return false;
    if (NOT_DISPLAY_COLUMN_KEYS.includes(key)) return false;
    return true;
  });
};

export const addClassName = (originClassName, targetClassName) => {
  const originClassNames = originClassName.split(' ');
  if (originClassNames.indexOf(targetClassName) > -1) return originClassName;
  return originClassName + ' ' + targetClassName;
};

export const removeClassName = (originClassName, targetClassName) => {
  let originClassNames = originClassName.split(' ');
  const targetClassNameIndex = originClassNames.indexOf(targetClassName);
  if (targetClassNameIndex < 0) return originClassName;
  originClassNames.splice(targetClassNameIndex, 1);
  return originClassNames.join(' ');
};
