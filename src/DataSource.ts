import _ from 'lodash';

import { DataQueryRequest, DataQueryResponse, DataSourceApi, DataSourceInstanceSettings } from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';
import * as queryDef from './query_def';
import { GroongaOptions, GroongaQuery } from './types';
import { SelectParameters } from './select_parameters';

interface QueryInfo {
  name: string;
  index: number;
  metric: boolean;
}
interface TableDataInfo {
  text: string;
  type: string;
}
interface TableDataFormat {
  columns: TableDataInfo[];
  rows: any[];
}
/*
interface GraphDataFormat {
  target: string;
  datapoints: [any,number]
}
*/
type GraphDataIndexs = {
  time: number;
  metric: number;
  data: number;
};
function pushColumns(_tableDataFormat: TableDataFormat, _text: string, _type: string) {
  // format is { "text": "_id", "type": "number" }
  _tableDataFormat.columns.push({ text: _text, type: _type });
}

export class DataSource extends DataSourceApi<GroongaQuery, GroongaOptions> {
  headers: any;
  withCredentials: boolean;
  url: string;
  name: string;
  index: string;
  timeField: string;

  constructor(instanceSettings: DataSourceInstanceSettings<GroongaOptions>) {
    super(instanceSettings);
    //this.basicAuth = instanceSettings.basicAuth === undefined ? '' : instanceSettings.basicAuth;
    this.withCredentials = instanceSettings.withCredentials !== undefined;
    this.url = instanceSettings.url === undefined ? '' : instanceSettings.url;
    this.name = instanceSettings.name;
    this.index = instanceSettings.database === undefined ? '' : instanceSettings.database;
    const settingsData = instanceSettings.jsonData || ({} as GroongaOptions);
    this.timeField = settingsData.timeField === undefined ? '' : settingsData.timeField;

    this.headers = { 'Content-Type': 'application/json' };
    if (typeof instanceSettings.basicAuth === 'string' && instanceSettings.basicAuth.length > 0) {
      this.headers['Authorization'] = instanceSettings.basicAuth;
    }
  }

  // query API
  async query(options: DataQueryRequest<GroongaQuery>): Promise<DataQueryResponse> {
    let selectParams = new SelectParameters(
      this.timeField,
      options.targets,
      options.range.from.valueOf() / 1000,
      options.range.to.valueOf() / 1000,
      options.intervalMs === undefined ? 1000 : options.intervalMs
    );
    let serializedOptionStr = selectParams.buildQueryParameters();
    /*let queryStatus = 0;
    let tempTableName = 'alog_temp_20200826';
    getBackendSrv()
      //.datasourceRequest({ url: this.url + '/d/select?' + serializedOptionStr })
      .datasourceRequest({ url: this.url + '/d/table_create?name=' + tempTableName + '&flags=TABLE_NO_KEY'})
      .then(result => {
        if (result.status === 200) {
          let res = result.data[1];
          if (res === true) {
            queryStatus = 1;
            getBackendSrv()
              //.datasourceRequest({ url: this.url + '/d/select?' + serializedOptionStr })
              .datasourceRequest({ url: this.url + '/d/table_remove?name=' + tempTableName })
              .then(result => {
                if (result.status === 200) {
                  //return { status: 'success', message: 'Data source is working', title: 'Success' };
                  let res = result.data[1];
                  if (res === true) {
                    queryStatus = 2;
                  }
                }
              });          }
          //return { status: 'success', message: 'Data source is working', title: 'Success' };
        }
      });
    */

    let ret = getBackendSrv()
      //.datasourceRequest({ url: this.url + '/d/select?' + serializedOptionStr })
      .datasourceRequest({ url: this.url + '/d/logical_select?' + serializedOptionStr })
      .then(result => {
        let selects = selectParams.isAggregate(0) ? result.data[1][1] : result.data[1][0];

        if (queryDef.isGraphAggregateType(selectParams.aggs[0].aggType)) {
          return this.createGraphResponse(selects, selectParams);
        } else {
          return this.createTableResponse(selects, selectParams);
        }
      });

    return ret;
    /*
    return (
      getBackendSrv()
        //.datasourceRequest({ url: this.url + '/d/select?' + serializedOptionStr })
        .datasourceRequest({ url: this.url + '/d/logical_select?' + serializedOptionStr })
        .then(result => {
          let selects = selectParams.isAggregate(0) ? result.data[1][1] : result.data[1][0];

          if (queryDef.isGraphAggregateType(selectParams.aggs[0].aggType)) {
            return this.createGraphResponse(selects, selectParams);
          } else {
            return this.createTableResponse(selects, selectParams);
          }
        })
    );
    */
  }

  // tastDatasource API
  async testDatasource() {
    // Implement a health check for your data source.
    return this.doRequest({
      url: this.url + '/d/status',
      method: 'GET',
    }).then((response: any) => {
      if (response.status === 200) {
        return { status: 'success', message: 'Data source is working', title: 'Success' };
      }

      return {
        status: 'error',
        message: `Data source is not working: ${response.message}`,
        title: 'Error',
      };
    });
  }
  private doRequest(options: any) {
    options.withCredentials = this.withCredentials;
    options.headers = this.headers;
    return getBackendSrv().datasourceRequest(options);
  }

  private getTypeStr(_type: string): string {
    switch (_type) {
      case 'Time':
        return 'time';
        break;
      case 'Int8':
      case 'Int16':
      case 'Int32':
      case 'Int64':
      case 'UInt8':
      case 'UInt16':
      case 'UInt32':
      case 'UInt64':
      case 'Float':
        return 'number';
        break;
      default:
        return 'string';
        break;
    }
  }

  // 指定のカラムを探す
  private getColumnIndex(_schema: string[], _colName: string) {
    let colIndex = -1;
    let colName = _colName.trim();

    // 指定されている場合
    if (colName !== '') {
      // 正しい場合はtimeColIndexが-1以外になる
      colIndex = _schema.findIndex((item: any) => item[0] === colName);
    }
    return colIndex;
  }
  // キーとなる時刻情報を探す
  private getKeyColumnIndex(_schema: string[], _timeCol: string) {
    let timeColIndex = -1;
    let colName = _timeCol.trim();

    // キーとなる時刻情報が指定されている場合
    if (colName !== '') {
      // 正しい場合はtimeColIndexが-1以外になる
      timeColIndex = _schema.findIndex((item: any) => item === colName);
    }

    // キーとなる時刻情報が指定されていない場合(指定されたが間違っている場合含む):最初に見つかったTime型のカラムとする
    if (timeColIndex === -1) {
      // 見つかった場合はtimeColIndexが-1以外になる
      timeColIndex = _schema.findIndex((item: any) => item[1] === 'Time');
    }
    return timeColIndex;
  }

  private extractGraphMetrics(
    _gIndexs: GraphDataIndexs,
    _select: any,
    _selectParams: SelectParameters,
    _aggIndex: number
  ) {
    let mets = ['__dummy__'];
    let indexTTemp = -1;
    let schema = _select[1];
    schema.filter((c: any, i: number) => {
      if (_gIndexs.data === -1) {
        _gIndexs.data = i;
      } else if (
        c[0] === _selectParams.getAggTimeColName() ||
        (_selectParams.isOnlyAggTimeCol(_aggIndex) && c[0] === '_key')
      ) {
        _gIndexs.time = i;
      } else if (this.getTypeStr(c[1]) === 'time') {
        indexTTemp = indexTTemp === -1 ? i : indexTTemp;
      } else if (_gIndexs.metric === -1) {
        _gIndexs.metric = i;
      }
    });
    _gIndexs.time = _gIndexs.time === -1 ? indexTTemp : _gIndexs.time;

    if (_gIndexs.metric === -1) {
      mets.push('');
    } else {
      _select.filter((r: any, rowIndex: number) => {
        if (rowIndex >= 2) {
          let m = r[_gIndexs.metric];
          if (!mets.includes(m)) {
            mets.push(m);
          }
        }
      });
    }
    mets.shift();
    mets.sort();
    return mets;
  }

  // キーとなる時刻情報が指定されていない場合は最初に見つかったTime型のカラムとする
  // なぜかcfgtidがTimeと判定されるので、その小細工含めておく
  // 見つからない場合は-1が返る
  private createTableColumnHeader(
    _tableDataFormat: TableDataFormat,
    _queryIndexes: QueryInfo[],
    _schema: string[],
    _selectParams: SelectParameters
  ): number {
    let queries = _selectParams.getQueries();
    let metrics = _selectParams.getMetrics(0);

    function isMetricColumn(_colName: string, _metrics: string[] | undefined) {
      if (_metrics === undefined || _metrics.length <= 0) {
        return false;
      }
      return _metrics.findIndex((metric: string) => metric === _colName) !== -1;
    }
    function pushQueryIndexes(index: number) {
      if (index !== -1) {
        _queryIndexes?.push({
          name: _schema[index][0],
          index: index,
          metric: isMetricColumn(_schema[index][0], metrics),
        });
      }
    }

    //_queryIndexes = [];
    // キーとなる時刻情報を探す
    let timeColIndex = this.getKeyColumnIndex(_schema, _selectParams.timeField);
    //let metricColIndex = getColumnIndex(_schema, _metric);
    let timeCol = _selectParams.timeField;
    if (timeColIndex !== -1) {
      pushColumns(_tableDataFormat, 'Time', 'time');
      timeCol = _schema[timeColIndex][0];
      _queryIndexes.push({ name: timeCol, index: timeColIndex, metric: true });
    }
    _tableDataFormat.columns.shift();
    _queryIndexes.shift();

    if (queries === undefined || queries.length <= 0) {
      _schema.forEach((sch: any, index) => {
        if (index !== timeColIndex) {
          pushQueryIndexes(index);
        }
      });
    } else {
      queries?.forEach((colName: any) => {
        let index = this.getColumnIndex(_schema, colName);
        if (index !== timeColIndex) {
          pushQueryIndexes(index);
        }
      });
    }

    _queryIndexes.forEach((queryIndex: any) => {
      let columnName = _schema[queryIndex.index][0];
      if (columnName === timeCol) {
        //timeColIndex = col;
        return;
      }
      let columnTypeStr = this.getTypeStr(_schema[queryIndex.index][1]);
      pushColumns(_tableDataFormat, columnName, columnTypeStr);
    });
    return timeColIndex;
  }
  private createGraphResponse(_selects: any, _selectParams: SelectParameters): any {
    let data = [{ target: '', datapoints: [{}] }];
    data.shift();
    _selectParams.aggs.forEach((agg: any, index: number) => {
      let _select = _selects[agg.refId];

      //let mets = ['__dummy__'];
      let gIndexs: GraphDataIndexs = { time: -1, metric: -1, data: -1 };

      if (_select.length > 1) {
        // 集約キーの検索用の配列作成
        let mets = this.extractGraphMetrics(gIndexs, _select, _selectParams, index);
        // 集約キーをtargetとして保持
        mets.forEach((m: any) => data.push({ target: m, datapoints: [{}] }));

        // 複数Queryを同時に指定する場合
        let bParallel = _selectParams.aggs.length > 1 && gIndexs.metric === -1;
        let indexPtemp = data.findIndex((d: any, i: number) => d.target === '');
        let indexP = bParallel ? (indexPtemp !== -1 ? indexPtemp : 0) : 0;

        _select.filter((row: any, rowIndex: number) => {
          if (rowIndex >= 2) {
            let m = gIndexs.metric !== -1 ? row[gIndexs.metric] : '';
            let t = gIndexs.time !== -1 ? row[gIndexs.time] : 0;
            let d = gIndexs.data !== -1 ? row[gIndexs.data] : 0;
            let i = mets.indexOf(m);
            let index = bParallel ? indexP : i === -1 ? 0 : i;
            data[index].datapoints.push([d, t * 1000]);
          }
        });

        data.forEach((d: any) => {
          d.datapoints.shift();
        });

        if (bParallel) {
          data[indexP].target = agg.aggTarget;
        }
      }
    });
    return { data: data };
  }
  private createTableResponse(_select: any, _selectParams: SelectParameters): any {
    let _schema: string[] = _select[1];
    let queryIndexes = [{ name: '', index: -1, metric: false }];

    // time column
    let timeColIndex = -1;

    let dataT = [];
    let tableData: TableDataFormat = {
      columns: [{ text: 'Time', type: 'time' }],
      rows: [{}],
    };
    dataT.push(tableData);
    timeColIndex = this.createTableColumnHeader(tableData, queryIndexes, _schema, _selectParams);
    for (let row = 2; row < _select.length; row++) {
      // row = 0 is datanum, row = 1 is data format
      var record = _select[row];
      var datapoints = tableData.rows;
      let datas: any = [];

      //for (let col = 0; col < schema.length; col++) {
      queryIndexes.forEach(queryIndex => {
        if (queryIndex.index === timeColIndex) {
          datas.push(record[queryIndex.index] * 1000);
        } else {
          datas.push(record[queryIndex.index]);
        }
      });
      datapoints.push(datas);
    }
    tableData.rows.shift();
    return { data: dataT };
  }
}

/*
//sample
// Grafana response data format : To Grafana Graph panel
graphData_Response_Format = [
{
  target: "sample1",
  datapoints: [
    [622, 1450754160000],
    [365, 1450754220000],
    [522, 1450755160000],
    [465, 1450755220000],
    [422, 1450765160000],
    [765, 1450765220000],
  ]
},
{
  target: "sample2",
  datapoints: [
    [861, 1450754160000],
    [767, 1450754220000],
    [1161, 1450755160000],
    [1267, 1450755220000],
    [1361, 1450765160000],
    [1467, 1450765220000],
  ]
}
];
// Grafana response data format : To Grafana Table/Stat panel
tableData_Response_Format = [
{
  columns: [
    { text: "Time", type: "time" },
    { text: "Country", type: "string" },
    { text: "Number", type: "number" }
  ],
  rows: [
    [1450754160000, "SE", 123],
    [1450754160000, "DE", 231],
    [1450754160000, "US", 321]
  ],
}
];

// Groonga response data : From Groonga
// データ部分:datasourceRequestの戻り値resultのresult.data

// 非集約時
data: Array(2)
  0:Array(3)
    0:0
    1:1596608156.696258
    2:0.0006730556488037109
  1:Array(1)  //データ部分
    0:Array(508963)
      0:Array(1) // Data Count
        0:508961
      1:Array(2) // Data Schema
        0:["_id", "UInt32"]
        1:["action", "ref_f_action"]
      2:Array(2)
        0:100
        1:"pass"
      ・・・
      508962:Array(2)
        0:501000
        1:"pass"

// 集約時
data: Array(2)
  0:Array(3)
    0:0
    1:1596608156.696258
    2:0.0006730556488037109
  1:Array(2)  //データ部分
    0:Array(12)  //非集約データ部分
      0:Array(1) // Data Count
        0:10
      1:Array(1) // Data Schema
        0:["AGGTIME", "UInt64"]
      2:Array(2) // Data本体：2以降Count+1まで
        0:1595862000
      ・・・
      11:Array(2)
        0:1595862000
    1:Array(35445)  //集約データ部分
      A:Array(35545)  //Queryごと
        0:Array(1) // Data Count
          0:35443
        1:Array(1) // Data Schema
          0: ["_sum", "Int64"] // 一つ目に集約結果データ
          1: ["AGGTIME", "UInt64"] // 二つ目にキーとなるTime
          2: ["dstip", "ref_f_dstip"] // 三つ目に集約キーの値
        2: (3) [0, 1595862000, "100.200.100.200"]  // Data本体：2以降Count+1まで
        3: (3) [2151, 1595862000, "200.200.1.45"]
        ・・・
        35544:(3) [89, 1595943000, "40.50.100.60"]

// 集約時(複数Query指定時)
data: Array(2)
  0:Array(3)
    0:0
    1:1596608156.696258
    2:0.0006730556488037109
  1:Array(2)  //データ部分
    0:Array(12)  //非集約データ部分
      0:Array(1) // Data Count
        0:10
      1:Array(1) // Data Schema
        0:["AGGTIME", "UInt64"]
      2:Array(2) // Data本体：2以降Count+1まで
        0:1595862000
      ・・・
      11:Array(2)
        0:1595862000
    1: //集約データ部分
      A:Array(273)  //Queryごと
        0:Array(1) // Data Count
          0:271
        1:Array(1) // Data Schema
          0: ["_sum", "Int64"] // 一つ目に集約結果データ
          1: ["_key", "UInt64"] // 二つ目にキーとなるTime
        2: (2) [1565121, 1595862000]  // Data本体：2以降Count+1まで
        3: (2) [2151501, 1595862000]
        ・・・
        272:(2) [89, 1595943000]
      B:Array(273)  //Queryごと
        0:Array(1) // Data Count
          0:271
        1:Array(1) // Data Schema
          0: ["_sum", "Int64"] // 一つ目に集約結果データ
          1: ["_key", "UInt64"] // 二つ目にキーとなるTime
        2: (2) [958322, 1595862000]  // Data本体：2以降Count+1まで
        3: (2) [234223, 1595862000]
        ・・・
        272:(2) [62629, 1595943000]

*/
