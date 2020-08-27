const testDatasourceResponse: any = {
  status: 200,
  statusText: 'OK',
  type: 'basic',
  url: 'http://localhost:3000/api/datasources/proxy/41/d/status',
  redirected: false,
  data: [
    [0, 1597897850.26316, 0.00006127357482910156],
    {
      alloc_count: 4625,
      cache_hit_rate: 47.05592510470559,
      command_version: 1,
      default_command_version: 1,
      max_command_version: 3,
      n_jobs: 0,
      n_queries: 4059,
      start_time: 1596413560,
      starttime: 1596413560,
      uptime: 1484290,
      version: '10.0.4',
    },
  ],
  config: {
    method: 'GET',
    retry: 0,
    url: 'api/datasources/proxy/41/d/status',
    withCredentials: false,
  },
};

export { testDatasourceResponse };
