import { DataSource } from './DataSource';
//import { GroongaOptions, GroongaQuery } from './types';
import { GroongaOptions } from './types';
//import { DataQueryRequest, DataSourceInstanceSettings, PluginMeta, toUtc } from '@grafana/data';
import { DataSourceInstanceSettings, PluginMeta } from '@grafana/data';
import { BackendSrv, BackendSrvRequest, setBackendSrv } from '@grafana/runtime';
import { testDatasourceResponse } from './testdata/testDatasource_response';
//import { queryTableResponse } from './testdata/query_table_response';
//import { queryGraphResponse } from 'testdata/query_graph_response';

// for test parameter : change your environment.
const test_id = 41;
const test_timeField = 'eventtime';

//const test_tableName = 'fortigatelogs2';
//const test_aggColumnName = 'action';
//const test_outputColumnName = '_id';

describe('DataSource', () => {
  const instanceSettings: DataSourceInstanceSettings<GroongaOptions> = {
    id: test_id,
    uid: '111',
    type: 'alog-datasource',
    name: 'ALogDataSource',
    url: '/api/datasources/proxy/' + test_id,
    meta: {} as PluginMeta,
    //jsonData: {},
    jsonData: { timeField: test_timeField },
  };
  let ds: DataSource;

  beforeEach(() => {
    ds = new DataSource(instanceSettings);
  });

  // test for testDatasource
  describe('testDatasource', () => {
    describe('with a successful response', () => {
      beforeEach(() => {
        setupBackendSrvForTestDatasource({
          url: '/api/datasources/proxy/' + test_id + '/d/status',
          response: testDatasourceResponse,
        });
      });

      it('should return the success message', async () => {
        const result = await ds.testDatasource();
        expect(result.status).toBe('success');
        expect(result.title).toBe('Success');
      });
    });
    describe('with an authentication error', () => {
      beforeEach(() => {
        setupBackendSrv({
          url: '/api/datasources/proxy/' + test_id + '/d/status',
          response: {
            errors: ['The requested URL or resource could not be found.'],
            error_type: 'not_found',
          },
        });
      });

      it('should return the error message', async () => {
        const result = await ds.testDatasource();
        expect(result.status).toBe('error');
        expect(result.title).toBe('Error');
      });
    });
  });

  /*
  // test for query
  describe('query', () => {
    describe('for a report', () => {
      describe('with a Groonga API response : for table panel', () => {
        beforeEach(() => {
          setupBackendSrv({
            url:
              '/api/datasources/proxy/' +
              test_id +
              '/d/select?' +
              'table=' +
              test_tableName +
              '&filter=between(' +
              test_timeField +
              ',1584230400,1584921600)&limit=10',
            response: queryTableResponse,
          });
        });

        it('should be parsed into data frames', async () => {
          const options = {
            range: {
              from: toUtc('2020-03-15T00:00:00Z'),
              to: toUtc('2020-03-23T00:00:00Z'),
            },
            rangeRaw: {
              from: 'now-4h',
              to: 'now',
            },
            targets: [
              {
                queryText: '',
                table: test_tableName,
                column: '',
                filter: '',
                sortby: '',
                limit: 10,
                aggregateKeyStr: test_aggColumnName,
                aggregateType: '',
                aggregateTarget: '',
                aggregateInterval: '',
              },
            ],
          } as DataQueryRequest<GroongaQuery>;

          const result = await ds.query(options);
          expect(result.data[0].columns[0].text).toBe('Time');
          expect(result.data[0].columns[0].type).toBe('time');
          expect(result.data[0].columns[1].text).toBe('_id');
          expect(result.data[0].columns[1].type).toBe('number');

          expect(result.data[0].rows[0][0]).toBe(1584230400000);
          expect(result.data[0].rows[0][1]).toBe(508967);
          expect(result.data[0].rows[1][0]).toBe(1584230401000);
          expect(result.data[0].rows[1][1]).toBe(508966);
        });
      });

      describe('with a Groonga API response : for graph panel', () => {
        beforeEach(() => {
          setupBackendSrv({
            url:
              '/api/datasources/proxy/' +
              test_id +
              '/d/select?' +
              'table=' +
              test_tableName +
              '&filter=between(' +
              test_timeField +
              ',1584230400,1584921600)&limit=10&drilldowns[A].keys=' +
              test_aggColumnName +
              '&drilldowns[A].output_columns=_nsubrecs,_key&drilldowns[A].calc_types=COUNT&drilldowns[A].limit=10&drilldowns[A].calc_target=' +
              test_outputColumnName +
              '&drilldowns[A].sort_keys=_key',
            response: queryGraphResponse,
          });
        });

        it('should be parsed into data frames', async () => {
          const options = {
            range: {
              from: toUtc('2020-03-15T00:00:00Z'),
              to: toUtc('2020-03-23T00:00:00Z'),
            },
            rangeRaw: {
              from: 'now-4h',
              to: 'now',
            },
            targets: [
              {
                queryText: '',
                table: test_tableName,
                column: test_outputColumnName,
                filter: '',
                sortby: '',
                limit: 10,
                aggregateKeyStr: 'action',
                aggregateType: 'count',
                aggregateTarget: test_outputColumnName,
                aggregateInterval: '',
                refId: 'A',
              },
            ],
          } as DataQueryRequest<GroongaQuery>;

          const result = await ds.query(options);
          expect(result.data[0].target).toBe('accept');
          expect(result.data[0].datapoints[0][0]).toBe(227370);
          expect(result.data[1].target).toBe('add');
          expect(result.data[1].datapoints[0][0]).toBe(7);
          expect(result.data[9].target).toBe('error');
          expect(result.data[9].datapoints[0][0]).toBe(48);
        });
      });
    });
  });
  */
});
function setupBackendSrvForTestDatasource<T>({ url, response }: { url: string; response: T }): void {
  setBackendSrv({
    datasourceRequest(options: BackendSrvRequest): Promise<any> {
      if (options.url === url) {
        return Promise.resolve(response);
      }
      throw new Error(`Unexpected url ${options.url}`);
    },
  } as BackendSrv);
}
function setupBackendSrv<T>({ url, response }: { url: string; response: T }): void {
  setBackendSrv({
    datasourceRequest(options: BackendSrvRequest): Promise<any> {
      if (options.url === url) {
        return Promise.resolve({ data: response });
      }
      throw new Error(`Unexpected url ${options.url}`);
    },
  } as BackendSrv);
}
