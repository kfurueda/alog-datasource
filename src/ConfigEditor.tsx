import React, { ChangeEvent, PureComponent } from 'react';
import { LegacyForms, DataSourceHttpSettings } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { GroongaOptions } from './types';
const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<GroongaOptions> {}
interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onTimeFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      timeField: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

  render() {
    const { options, onOptionsChange } = this.props;
    const { jsonData } = options;

    return (
      <>
        <div className="gf-form-group">
          <div className="gf-form">
            <DataSourceHttpSettings
              defaultUrl={'http://localhost:10041'}
              dataSourceConfig={options}
              showAccessOptions={false}
              onChange={onOptionsChange}
            />
          </div>
        </div>
        <h3 className="page-heading">Groonga Details</h3>
        <div className="gf-form-group">
          <div className="gf-form">
            <FormField
              label="Time field name"
              labelWidth={20}
              inputWidth={20}
              onChange={this.onTimeFieldChange}
              value={jsonData.timeField || ''}
              placeholder=""
            />
          </div>
        </div>
      </>
    );
  }
}
