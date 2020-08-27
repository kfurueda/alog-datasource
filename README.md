# Grafana ALog Data Source Plugin

![CI](https://github.com/ALog/ALog-datasource/workflows/CI/badge.svg)

View report data from ALog in your Grafana.

## Install the Data Source
Use the new grafana-cli tool to install ALog-datasource from the commandline:

```
grafana-cli plugins install ALog-datasource
```

The plugin will be installed into your grafana plugins directory; the default is /var/lib/grafana/plugins if you installed the grafana package.

## Configure the Data Source

Accessed from the Grafana main menu, newly installed data sources can be added immediately within the [Data Sources] section.
Next, click the [Add data source] button in the upper right. The data source will be available for selection in the Type select box.
To see a list of installed data sources, click the Plugins item in the main menu. Both core data sources and installed data sources will appear.

## Learn more
- [Build a data source plugin tutorial](https://grafana.com/tutorials/build-a-data-source-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System

## License

Apache License 2.0, see [LICENSE](LICENSE).
