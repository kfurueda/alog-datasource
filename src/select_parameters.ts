import { GroongaQuery } from 'types';
import * as queryDefs from './query_def';

const timekey_alias = 'AGGTIME';

interface AggregateParam {
  refId: string;
  aggType: string;
  aggKeyStr: string;
  aggTarget: string;
  aggInterval: string;
}

export class SelectParameters {
  timeField: string;
  rangeFrom: number;
  rangeTo: number;

  table: string;

  query: string;
  filter: string;
  sortby: string;
  limit: number;
  intervalMs: number;

  aggs: AggregateParam[];

  constructor(
    _timeField: string,
    _groongaQuerys: GroongaQuery[],
    _timeRangeFrom: number,
    _timeRangeTo: number,
    _intervalMs: number
  ) {
    this.rangeFrom = _timeRangeFrom;
    this.rangeTo = _timeRangeTo;
    this.table = _groongaQuerys[0].table;
    this.timeField = _timeField;
    this.query = _groongaQuerys[0].queryText === undefined ? '' : _groongaQuerys[0].queryText;
    this.filter = _groongaQuerys[0].filter;
    this.sortby = _groongaQuerys[0].sortby;
    this.limit = _groongaQuerys[0].limit;

    this.aggs = [];
    _groongaQuerys.forEach((_agg: GroongaQuery) => {
      let agg: AggregateParam = {
        refId: _agg.refId,
        aggType: _agg.aggregateType,
        aggKeyStr: _agg.aggregateKeyStr,
        aggTarget: _agg.aggregateTarget,
        aggInterval: _agg.aggregateInterval === undefined ? '' : _agg.aggregateInterval,
      };
      this.aggs.push(agg);
    });
    this.intervalMs = _intervalMs === undefined ? 1000 : _intervalMs;
  }

  private isEnableAggregate(_index: number) {
    let index = _index < 0 || _index >= this.aggs.length ? 0 : _index;
    let aggQuery = queryDefs.getAggTypesQueryStr(this.aggs[index].aggType);
    return this.isExist(this.aggs[index].aggKeyStr) && aggQuery.length > 0;
  }

  getAggTimeColName(): string {
    return timekey_alias;
  }
  isOnlyAggTimeCol(_index: number): boolean {
    let index = _index < 0 || _index >= this.aggs.length ? 0 : _index;
    return this.aggs[index].aggKeyStr === this.getAggTimeColName();
  }

  isAggregate(_index: number): boolean {
    let index = _index < 0 || _index >= this.aggs.length ? 0 : _index;
    let aggQuery = queryDefs.getAggTypesQueryStr(this.aggs[index].aggType);
    return this.isExist(this.aggs[index].aggKeyStr) && aggQuery.length > 0;
  }

  getQueries(): any {
    return this.splitCsv(this.query);
  }
  getMetrics(_index: number): any {
    let index = _index < 0 || _index >= this.aggs.length ? 0 : _index;
    return this.splitCsv(this.aggs[index].aggKeyStr);
  }

  buildQueryParameters(): string {
    const limitNumDefault = 10; // default
    let bEnableAggregate = this.isEnableAggregate(0);

    // create groonga api parameter
    let serializedOptionStr = '';
    // table : table name
    serializedOptionStr += this.getQueryStr(false, 'logical_table', this.table);
    // filter : time range
    //let timeRange = '';
    if (this.isExist(this.timeField)) {
      serializedOptionStr += this.getQueryStr(true, 'shard_key', this.timeField);
      //timeRange = 'between(' + this.timeField + ',' + this.rangeFrom.toString() + ',' + this.rangeTo.toString() + ')';
      serializedOptionStr += this.getQueryStr(true, 'min', this.rangeFrom.toString());
      serializedOptionStr += this.getQueryStr(true, 'max', this.rangeTo.toString());
    }
    //serializedOptionStr += this.getQueryStr(true, 'filter', timeRange);
    // filter : filter string
    if (this.isExist(this.filter)) {
      //serializedOptionStr += '%26%26' + this.filter.replace(/&/g, '%26');
      serializedOptionStr += this.getQueryStr(true, 'filter', this.filter.replace(/&/g, '%26'));
    }
    // limit : target record num
    if (this.limit !== undefined && this.limit >= 0) {
      let limitNum = bEnableAggregate ? limitNumDefault : this.limit;
      serializedOptionStr += this.getQueryStr(true, 'limit', limitNum);
    }
    // output_columns : output columns (not aggregate)
    if (this.isExist(this.query)) {
      serializedOptionStr += this.getQueryStr(true, 'output_columns', this.query);
    }

    if (!bEnableAggregate) {
      // without aggregate parameters
      // sortby : sort key columns (not aggregate)
      if (this.isExist(this.sortby)) {
        serializedOptionStr += this.getQueryStr(true, 'sortby', this.sortby);
      }
    } else {
      // Drilldown data
      this.aggs.forEach((agg: AggregateParam, index: number) => {
        serializedOptionStr += this.getDrilldownStrs(index);
      });

      //span agg
      if (this.aggs[0].aggInterval !== undefined && this.aggs[0].aggInterval.length > 0) {
        serializedOptionStr += this.getColumnsStr(true, 'stage', 'initial');
        serializedOptionStr += this.getColumnsStr(true, 'type', 'Time');
        let timeKeyStr = this.getTimeClassifyStr(this.aggs[0].aggInterval);
        serializedOptionStr += this.getColumnsStr(true, 'value', timeKeyStr);
      }
    }
    return serializedOptionStr;
  }

  private getTimeClassifyStr(intervalStr: string) {
    let defaultStr = 'time_classify_minute(' + this.timeField + ',1)';
    if (intervalStr === undefined || intervalStr.length <= 0) {
      return defaultStr;
    }

    let ret = 'time_classify_';
    let value = intervalStr.replace(/[^0-9]/g, '');
    let unit = intervalStr.slice(-1);
    switch (unit) {
      case 's':
        ret += 'second';
        break;
      case 'm':
        ret += 'minute';
        break;
      case 'h':
        ret += 'hour';
        break;
      case 'd':
        ret += 'day';
        break;
      case 'w':
        ret += 'week';
        break;
      case 'M':
        ret += 'month';
        break;
      case 'Y':
        ret += 'year';
        break;
      default:
        return defaultStr;
    }
    ret += '(' + this.timeField + ',' + value + ')';
    return ret;
  }

  private getDrilldownStrs(_index: number): string {
    let index = _index < 0 || _index >= this.aggs.length ? 0 : _index;
    let metrics = this.splitCsv(this.aggs[index].aggKeyStr);
    let aggQuery = queryDefs.getAggTypesQueryStr(this.aggs[index].aggType);
    let aggCol = queryDefs.getAggTypesColumnStr(this.aggs[index].aggType);
    let ddStrs = '';
    // aggregate parameters
    ddStrs += this.getDrilldownsStr(index, true, 'keys', this.aggs[index].aggKeyStr);
    ddStrs += this.getDrilldownsStr(index, true, 'output_columns', aggCol);
    if (metrics === undefined || metrics.length <= 1) {
      ddStrs += ',_key';
    } else {
      metrics.forEach(m => (ddStrs += ',_value.' + m));
    }
    //serializedOptionStr += '&drilldowns[' + refId + '].output_columns=_key,_nsubrecs,_max,_min,_sum,_avg';
    //serializedOptionStr += '&drilldowns[' + refId + '].calc_types=COUNT,MAX,MIN,SUM,AVG';
    ddStrs += this.getDrilldownsStr(index, true, 'calc_types', aggQuery);

    let limitNum = 10; // defalut
    if (this.limit !== undefined && this.limit >= 0) {
      limitNum = this.limit;
    }
    ddStrs += this.getDrilldownsStr(index, true, 'limit', limitNum);

    //serializedOptionStr += '&drilldowns[' + refId + '].calc_target=_id';
    if (this.isExist(this.aggs[index].aggTarget)) {
      ddStrs += this.getDrilldownsStr(index, true, 'calc_target', this.aggs[index].aggTarget);
    }

    ddStrs += this.getDrilldownsStr(index, true, 'sort_keys', '');
    if (metrics === undefined || metrics.length <= 1) {
      ddStrs += '_key';
    } else {
      metrics.forEach(m => (ddStrs += '_value.' + m + ','));
      ddStrs += aggCol;
    }
    return ddStrs;
  }

  private getQueryStr(needFirstAmpersand: boolean, paramname: string, paramvalue: any): string {
    return (needFirstAmpersand ? '&' : '') + paramname + '=' + paramvalue;
  }
  private getDrilldownsStr(index: number, needFirstAmpersand: boolean, paramname: string, paramvalue: any): string {
    return (
      (needFirstAmpersand ? '&' : '') + 'drilldowns[' + this.aggs[index].refId + '].' + paramname + '=' + paramvalue
    );
  }

  private getColumnsStr(needFirstAmpersand: boolean, paramname: string, paramvalue: any): string {
    return (
      (needFirstAmpersand ? '&' : '') + 'columns[' + this.getAggTimeColName() + '].' + paramname + '=' + paramvalue
    );
  }

  private isExist(_str?: string) {
    return !(_str === undefined || _str.length <= 0);
  }

  private splitCsv(_csvstr?: string) {
    let arr = _csvstr?.split(',');
    if (arr === undefined || arr?.length <= 0 || (arr?.length === 1 && arr[0].length <= 0)) {
      arr = undefined;
    }
    return arr;
  }
}
