# Datasources


## New Relic Insights

Datasource provides an ability to get data from New Relic Insights service

### Global configuration

| Property       | Type   | Description                   |
|----------------|--------|-------------------------------|
| accountId      | Number | New Relic Account ID          |
| apiKey         | String | New Relic Insights API Key    |

### Metric configuration

| Property           | Required | Type          | Description                                             |
|--------------------|----------|---------------|---------------------------------------------------------|
| queries            | yes      | Array<String> | New Relic Insights NRQL queries. First query will be used as a main source of data. All others - as previous periods data                           |

For example:

```
"ExampleMetric": {
  "dataSource": "NewRelicInsights",
  "dataSourceQueries": [
    "SELECT percentile(duration, 90) FROM PageView SINCE 2 days ago UNTIL 1 days ago TIMESERIES 15 minutes",
    "SELECT percentile(duration, 90) FROM PageView SINCE 7 days ago UNTIL 6 days ago TIMESERIES 15 minutes"
  ],
  ...
},

```


## New Relic API

### Global configuration

| Property       | Type   | Description          |
|----------------|--------|----------------------|
| apiKey         | String | New Relic API Key    |


### Metric configuration

You have to define 1+ query objects with those properties

| Property           | Required | Type             | Description                                                    |
|--------------------|----------|------------------|----------------------------------------------------------------|
| type               | yes      | String           | Type of metric. Available values: `server`, `applciation`      |
| metric             | yes      | Array<String>    | Array of metric names (get from New Relic [API explorer](https://rpm.newrelic.com/api/explore). Metrics' values will be sum together if there are more than 1 metric defined|
| value              | yes      | String           | Value type for metric (read [API explorer](https://rpm.newrelic.com/api/explore) to get more info) |
| id                 | yes      | Number           | New Relic server or application ID, get it from their API explorer        |
| period             |          | Number           | The granularity, in seconds, of the returned datapoints        |
| timeframe          | yes      | String           | Relative period to get data for (1 day, 3 weeks, 0.5 hours, etc), read [momentjs docs](http://momentjs.com/docs/#/manipulating/add/) to see possible values  |
| timeframeShift     |          | String           | Time period to shift data back in time (1 day ago, 3 weeks ago, etc) |


```
"ExampleMetric": {
  "dataSource": "NewRelic",
  "dataSourceQueries": [
    {
		"type": "server",
		"metric": ["System/CPU/User/percent", "System/CPU/System/percent"],
		"value": "average_value",
		"id": 25163010,
		"timeframe": "1 day",
		"timeframeShift": "2 day"
	}
  ],
  ...
}

```


## AWS Cloudwatch

### Global configuration

| Property          | Required | Type   | Description                           |
|-------------------|----------|--------|---------------------------------------|
| accessKeyId       | yes      | String | AWS access key ID                     |
| secretAccessKey   | yes      | String | AWS secret access key                 |
| region            |          | String | AWS region code (eg. ap-southeast-2 ) |
| proxy             |          | String | Proxy                                 |

### Metric configuration

You have to define 1+ Cloudwatch query objects within `queries` array with those properties.
Please note that all properties for this metric configuration are started with uppercase letters to be passed directly to AWS API

| Property           | Required | Type             | Description                                                    |
|--------------------|----------|------------------|----------------------------------------------------------------|
| Timeframe          | yes      | String           | Relative period to get data for (1 day, 3 weeks, 0.5 hours, etc), read [momentjs docs](http://momentjs.com/docs/#/manipulating/add/) to see possible values  |
| TimeframeShift     |          | String           | Time period to shift data back in time (1 day ago, 3 weeks ago, etc) |
| MetricName         | yes      | String           | The name of the metric, with or without spaces                 |
| Namespace          | yes      | String           | The namespace of the metric, with or without spaces            |
| Period             |          | Number           | The granularity, in seconds, of the returned datapoints        |
| Statistics         |          | Array<String>    | The metric statistics to return (1 max, [read more](http://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html#Statistic))|
| Dimensions         | yes      | Array<Dimension> | A list of dimensions describing qualities of the metric ([read more](http://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CW_Support_For_AWS.html))
| Unit               | yes      | String           | The specific unit for a given metric                           |

`Dimension` is an object with fields `Name` and `Value`.

Most of the params here are standard for AWS SDK and will be passed directly to it.
As a result you can read more about them [here](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudWatch.html#getMetricStatistics-property)

For example:

```
"RDS-example": {
  "dataSource": "Cloudwatch",
  "dataSourceParams": {
  	"queries": [
		"Timeframe": "1 day",
		"TimeframeShift": "1 week",
		"MetricName": "WriteIOPS",
		"Namespace": "AWS/RDS",
		"Period": 300,
		"Statistics": ["Sum"],
		"Dimensions": [{
		  "Name": "DBInstanceIdentifier",
		  "Value": "rdsInstanceName"
		}],
		"Unit": "Count/Second"
	],
	...
  },
  ...
}

```


## MySQL

Datasource provides an ability to get data from MySQL database

### Global configuration

| Property       | Type   | Description                               |
|----------------|--------|-------------------------------------------|
| host           | String | Database hast address                     |
| user           | String | Database user name                        |
| password       | String | Database user password                    |
| database       | String | Database name                             |


### Metric configuration

You have to define 1+ MySQL query objects within `queries` array with those properties.
Please note that SQL query for each metric should start with "SELECT timestamp as timestamp ...", where first 'timestamp' is a name of of column that contains login attempts time.

| Property           | Required | Type          | Description                                             |
|--------------------|----------|---------------|---------------------------------------------------------|
| query              | yes      | String        | SQL query to retrieve data from database                |
| timeslice          | yes      | Integer       | Time slice in seconds                                    |

For example:

```			
"ExampleMetric": {
  "dataSource": "MySQL",
  "dataSourceQueries": [
  	{
        "query": "SELECT timestamp as timestamp FROM login_history WHERE status!='OK' AND timestamp >= ?",
    	"timeslice": 15
    }
  ],
  ...
},

```