import _ from 'lodash';

export const aggTypes = [
  { text: 'None', value: 'none', columnText: '', queryText: '', requiresField: false, isGraphAggType: false },
  {
    text: 'Count',
    value: 'count',
    columnText: '_nsubrecs',
    queryText: 'COUNT',
    requiresField: false,
    isGraphAggType: true,
  },
  {
    text: 'Average',
    value: 'avg',
    columnText: '_avg',
    queryText: 'AVG',
    requiresField: true,
    isGraphAggType: true,
  },
  {
    text: 'Sum',
    value: 'sum',
    columnText: '_sum',
    queryText: 'SUM',
    requiresField: true,
    isGraphAggType: true,
  },
  {
    text: 'Max',
    value: 'max',
    columnText: '_max',
    queryText: 'MAX',
    requiresField: true,
    isGraphAggType: true,
  },
  {
    text: 'Min',
    value: 'min',
    columnText: '_min',
    queryText: 'MIN',
    requiresField: true,
    isGraphAggType: true,
  },
];

export function getAggTypes() {
  return _.filter(aggTypes);
}
export function getAggTypesTextStr(_agg: string): string {
  let aggType = aggTypes.find((aggType: any) => aggType.value === _agg);
  if (aggType === undefined) {
    return '';
  } else {
    return aggType.text;
  }
}
export function getAggTypesColumnStr(_agg: string): string {
  let aggType = aggTypes.find((aggType: any) => aggType.value === _agg);
  if (aggType === undefined) {
    return '';
  } else {
    return aggType.columnText;
  }
}
export function getAggTypesQueryStr(_agg: string): string {
  let aggType = aggTypes.find((aggType: any) => aggType.value === _agg);
  if (aggType === undefined) {
    return '';
  } else {
    return aggType.queryText;
  }
}
export function isGraphAggregateType(_agg: string): boolean {
  let aggType = aggTypes.find((aggType: any) => aggType.value === _agg);
  if (aggType === undefined) {
    return false;
  } else {
    return aggType.isGraphAggType;
  }
}

/*
function getAggType(_agg: string): string {
  switch (_agg) {
    case 'count':
      return 'count';
    case 'min':
      return 'min';
    case 'max':
      return 'max';
    case 'sum':
    default:
      return 'sum';
      break;
  }
}
*/
/*
function getAggTypeStr(_agg: string): string {
  let ret = '';
  switch (_agg) {
    case 'none':
    default:
      break;
    case 'count':
      ret = '_nsubrecs';
      break;
    case 'min':
      ret = '_min';
      break;
    case 'max':
      ret = '_max';
      break;
    case 'avg':
      ret = '_avg';
      break;
    case 'sum':
      ret = '_sum';
      break;
  }
  return ret;
}
function getAggColumnStr(_agg: string): string {
  let ret = '';
  switch (_agg) {
    case 'none':
    default:
      break;
    case 'count':
      ret = 'COUNT';
      break;
    case 'min':
      ret = 'MIN';
      break;
    case 'max':
      ret = 'MAX';
      break;
    case 'avg':
      ret = 'AVG';
      break;
    case 'sum':
      ret = 'SUM';
      break;
  }
  return ret;
}
*/
