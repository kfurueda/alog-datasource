import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { GroongaOptions, GroongaQuery } from './types';

const { FormField, Select } = LegacyForms;

const aggTypes: Array<SelectableValue<string>> = [
  { label: 'none', value: '' },
  { label: 'count', value: 'count' },
  { label: 'sum', value: 'sum' },
  { label: 'max', value: 'max' },
  { label: 'min', value: 'min' },
  { label: 'avg', value: 'avg' },
];

const intervalTypes: Array<SelectableValue<string>> = [
  { label: 'none', value: '' },
  { label: '10s', value: '10s' },
  { label: '30s', value: '30s' },
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '2h', value: '2h' },
  { label: '6h', value: '6h' },
  { label: '1d', value: '1d' },
  { label: '1w', value: '1w' },
];

type Props = QueryEditorProps<DataSource, GroongaQuery, GroongaOptions>;

export class QueryEditor extends PureComponent<Props> {
  query: GroongaQuery;
  constructor(props: Props) {
    super(props);
    const defaultQuery: Partial<GroongaQuery> = {
      queryText: '',
      interval: '',
      table: '',
      column: '',
      filter: '',
      sortby: '',
      limit: 1000,
      aggregateType: '',
      aggregateKeyStr: '',
      aggregateTarget: '',
      aggregateInterval: '',
    };
    const query = Object.assign({}, defaultQuery, props.query);
    this.query = query;
    this.state = {
      queryText: query.queryText,
      interval: query.interval,
      table: query.table,
      column: query.column,
      filter: query.filter,
      aggregateType: query.aggregateType,
      aggregateKeyStr: query.aggregateKeyStr,
      aggregateTarget: query.aggregateTarget,
      aggregateInterval: query.aggregateInterval,
      limit: query.limit,
    };
  }
  onRunQuery = () => {
    const { query } = this;
    this.props.onChange(query);
    this.props.onRunQuery();
  };
  onTableChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.query.table = value;
    this.setState({ value }, this.onRunQuery);
  };

  onQueryTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.query.queryText = value;
    this.setState({ value }, this.onRunQuery);
  };
  onFilterTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.query.filter = value;
    this.setState({ value }, this.onRunQuery);
  };
  onSortByTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.query.sortby = value;
    this.setState({ value }, this.onRunQuery);
  };
  onLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    this.query.limit = value;
    this.setState({ value }, this.onRunQuery);
  };

  onAggregateKeyStrChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.query.aggregateKeyStr = value;
    this.setState({ value }, this.onRunQuery);
  };
  onAggregateOptionChange = (option: SelectableValue<string>) => {
    const { query } = this;
    const value = option.value ? option.value : '';
    query.aggregateType = value;
    this.setState({ value }, this.onRunQuery);
  };
  onAggregateTargetTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    this.query.aggregateTarget = value;
    this.setState({ value }, this.onRunQuery);
  };
  onAggregateIntervalChange = (option: SelectableValue<string>) => {
    const { query } = this;
    const value = option.value ? option.value : '';
    query.aggregateInterval = value;
    this.setState({ value }, this.onRunQuery);
  };

  render() {
    //const query = defaults(this.props.query, defaultQuery);
    const query = this.props.query;
    const { table, queryText, filter, sortby, limit, aggregateKeyStr, aggregateTarget } = query;

    return (
      <>
        <div className="gf-form-group">
          <div className="gf-form-inline">
            <label className="gf-form-label query-keyword width-7">FROM</label>
            <div className="gf-form">
              <FormField
                labelWidth={8}
                inputWidth={16}
                value={table || ''}
                onChange={this.onTableChange}
                label="Table Name"
                tooltip={<>table name string</>}
              />
            </div>
          </div>
          <div className="gf-form-inline">
            <label className="gf-form-label query-keyword width-7">SELECT</label>
            <div className="gf-form">
              <FormField
                labelWidth={8}
                inputWidth={16}
                value={queryText || ''}
                onChange={this.onQueryTextChange}
                label="Output columns"
                tooltip={<>Output columns : comma separated string. </>}
              />
              <FormField
                labelWidth={8}
                inputWidth={6}
                value={limit || ''}
                onChange={this.onLimitChange}
                label="limit num"
                tooltip={<>limit num</>}
              />
            </div>
          </div>
          <div className="gf-form-inline">
            <label className="gf-form-label query-keyword width-7">WHERE</label>
            <div className="gf-form">
              <FormField
                labelWidth={8}
                inputWidth={16}
                value={filter || ''}
                onChange={this.onFilterTextChange}
                label="Filter string"
                tooltip={<>Filter string. ex : action==_id &gt; 10000 && action='deny'</>}
              />
            </div>
          </div>
          <div className="gf-form-inline">
            <label className="gf-form-label query-keyword width-7">ORDER BY</label>
            <div className="gf-form">
              <FormField
                labelWidth={8}
                inputWidth={16}
                value={sortby || ''}
                onChange={this.onSortByTextChange}
                label="Sort columns"
                tooltip={<>Sort by columns. ex : _id,-app</>}
              />
            </div>
          </div>
          <div className="gf-form-inline">
            <label className="gf-form-label query-keyword width-7">GROUP BY</label>
            <div className="gf-form">
              <FormField
                labelWidth={8}
                inputWidth={12}
                value={aggregateKeyStr || ''}
                onChange={this.onAggregateKeyStrChange}
                label="Key columns"
                tooltip={<>Aggregate key columns string. ex : eventtime,action</>}
              />
              <FormField
                labelWidth={4}
                inputWidth={10}
                label="Type"
                inputEl={
                  <Select
                    options={aggTypes}
                    value={aggTypes.find(
                      (option: any) =>
                        option.value ===
                        (this.props.query.aggregateType === undefined ? 'none' : this.props.query.aggregateType)
                    )}
                    onChange={this.onAggregateOptionChange}
                  />
                }
              />
              <FormField
                labelWidth={6}
                inputWidth={8}
                value={aggregateTarget || ''}
                onChange={this.onAggregateTargetTextChange}
                label="Target"
                tooltip={<>Aggregate target column. ex : _id</>}
              />
              <FormField
                labelWidth={4}
                inputWidth={10}
                label="Interval"
                inputEl={
                  <Select
                    options={intervalTypes}
                    value={intervalTypes.find(
                      (option: any) =>
                        option.value ===
                        (this.props.query.aggregateInterval === undefined ? 'none' : this.props.query.aggregateInterval)
                    )}
                    onChange={this.onAggregateIntervalChange}
                  />
                }
              />
            </div>
          </div>
        </div>
      </>
    );
  }
}
