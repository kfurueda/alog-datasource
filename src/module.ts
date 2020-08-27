import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './DataSource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { GroongaQuery, GroongaOptions } from './types';

export const plugin = new DataSourcePlugin<DataSource, GroongaQuery, GroongaOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
