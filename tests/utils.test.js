import { JSDOM } from 'jsdom';
import { getImageThumbnailUrl, compareString, throttle, getSelectColumnOptionMap } from '../src/utils';

const { window } = new JSDOM('<!doctype html><html><body></body></html>');
global.window = window;

test('test getImageThumbnailUrl function', () => {
  window.dtable = {};
  window.dtable.server = 'https://dev.seatable.cn';
  const url1 = 'https://dev.seatable.cn/workspace/3/asset/80ef2a56-690b-474b-8b00-a9535f90857a/images/2021-07/test.png';
  const url2 = 'https://www.baidu.com/img/flexible/logo/pc/result@2.png';
  expect(getImageThumbnailUrl(url1)).toBe('https://dev.seatable.cn/thumbnail/workspace/3/asset/80ef2a56-690b-474b-8b00-a9535f90857a/images/2021-07/test.png?size=256');
  expect(getImageThumbnailUrl(url2)).toBe(url2);
});

test('test compareString function', () => {
  expect(compareString(undefined, undefined)).toBe(0);
  expect(compareString('', '')).toBe(0);
  expect(compareString('', 'test')).toBe(-1);
  expect(compareString('test', '')).toBe(1);
  expect(compareString('abc', 'ABC')).toBe(-1);
  expect(compareString('abc', 'ab')).toBe(1);
  expect(compareString('ab', 'abc')).toBe(-1);
  expect(compareString('123', '120')).toBe(1);
  expect(compareString('120', '123')).toBe(-1);
  expect(compareString('test', 'test')).toBe(0);
});

test('test throttle function', () => {
  const fn = () => {};
  const result = throttle(fn, 100);
  expect(typeof result).toBe('function');
  result();
});

test('test getSelectColumnOptionMap function', () => {
  expect(getSelectColumnOptionMap({})).toEqual({});
  let column = {
    'key': '0000',
    'type': 'single-select',
    'name': 'Name',
    'data': {
      'options': [
        {
          'name': '123',
          'id': '970095',
          'color': '#9860E5',
          'textColor': '#FFFFFF'
        },
        {
          'name': '22',
          'id': '698369',
          'color': '#9F8CF1',
          'textColor': '#FFFFFF'
        },
        {
          'name': '23',
          'id': '492183',
          'color': '#D8FAFF',
          'textColor': '#202428'
        }
      ]
    },
  };
  const result = {
    '970095': true,
    '698369': true,
    '492183': true,
  };
  expect(getSelectColumnOptionMap(column)).toEqual(result);
});

