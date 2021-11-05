export const getImageThumbnailUrl = (url) => {
  let { server } = window.dtable || {};
  let isInternalLink = url.indexOf(server) > -1;
  if (isInternalLink) {
    let imageThumbnailUrl = url.replace('/workspace', '/thumbnail/workspace') + '?size=256';
    return imageThumbnailUrl;
  }
  return url;
};

export const REG_STRING_NUMBER_PARTS = /\d+|\D+/g;

export const REG_NUMBER_DIGIT = /\d/;

export const compareString = (leftString, rightString) => {
  if (!leftString && !rightString) return 0;
  if (!leftString && rightString) return -1;
  if (leftString && !rightString) return 1;
  let leftStringParts = leftString.match(REG_STRING_NUMBER_PARTS),
    rightStringParts = rightString.match(REG_STRING_NUMBER_PARTS);
  let len = Math.min(leftStringParts.length, rightStringParts.length);
  let isDigitPart, leftStringPart, rightStringPart;
  // Loop through each substring part to canCompare the overall strings.
  for (let i = 0; i < len; i++) {
    leftStringPart = leftStringParts[i];
    rightStringPart = rightStringParts[i];
    isDigitPart = REG_NUMBER_DIGIT.test(leftStringPart) && REG_NUMBER_DIGIT.test(rightStringPart);

    if (isDigitPart) {
      leftStringPart = parseInt(leftStringPart, 10);
      rightStringPart = parseInt(rightStringPart, 10);
      if (leftStringPart > rightStringPart) {
        return 1;
      } else if (leftStringPart < rightStringPart) {
        return -1;
      }
    }
    if (leftStringPart !== rightStringPart) {
      return leftString.localeCompare(rightString);
    }
  }
  return leftString.localeCompare(rightString);
};

export const throttle = (func, delay) => {
  let timer = null;
  let startTime = Date.now();
  return function() {
    let curTime = Date.now();
    let remaining = delay - (curTime - startTime);
    let context = this;
    let args = arguments;
    clearTimeout(timer);
    if (remaining <= 0) {
      func.apply(context, args);
      startTime = Date.now();
    } else {
      timer = setTimeout(func, remaining);
    }
  };
};

export function getSelectColumnOptionMap(column) {
  if (!column || !column.data || !Array.isArray(column.data.options)) {
    return {};
  }
  let optionMap = {};
  column.data.options.forEach(option => optionMap[option.id] = true);
  return optionMap;
}
