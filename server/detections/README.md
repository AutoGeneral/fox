# Detections

## EMA based detection

Statistical anomaly detection analysis based on exponential moving average. Read more:

- http://stockcharts.com/articles/mailbag/2014/01/what-is-the-difference-between-moving-average-envelopes-and-keltner-channels.html
- http://stockcharts.com/school/doku.php?id=chart_school:technical_indicators:moving_average_envelopes
- http://www.investopedia.com/articles/trading/08/moving-average-envelope.asp

Envelope is calculated using this formula to let us smooth some data:

```
ema[i] ± ema[i] * envelopKoeff ± percentile / lowValueEnchancer
```

where

- ema[i] - EMA for point `i`
- envelopKoeff - constant envelop coefficient (defined in configuration)
- percentile - percentile Xth (defined in configuration) for the dataset
- lowValueEnchancer - enchancer constant that allows us to increase the size of envelopes for low volume data (defined in configuration)

### Detection configuration

| Property           | Required   | Default  | Description                                                          |
|--------------------|------------|----------|----------------------------------------------------------------------|
| emaInterval        | Number     | 5        | Period of EMA                                                        |
| envelopKoeff       | Number     | 0.33     |                                                                      |
| percentile         | Number < 1 | 0.90     |                                                                      |
| previousValues     | String     | ema      | Method to process previous values. Read about available values below |
| lowValueEnchancer  | Number     | 10       |                                                                      |
| threshold          | Number     |          | Min value when detectection function will be applied. Every value below will be ignored | 
| ignoreHours        | Array<>    | []       | Time period(s) to ignore. Array of two strings or Array of Array of two strings for multiple periods |

#### `previousValues` methods

There are a few different methods to process previous values:

- `average` - get average value
- `ema` - get exponential moving average value
- `secondMax` - get second max value

For example:

```json
{
    "requestsToSuperApp": {
        "description": "Requests To SuperApp",
        "dataSource": "NewRelic",
        "dataSourceQueries": [
            "SELECT count(*) FROM Transaction WHERE appName ='SuperApp' TIMESERIES 30 minutes SINCE 1 day ago"
        ],
        "detection": "EmaBasedDetection.isPointBelowPreviousEnvelopeStrategy",
        "detectionParams": {
            "emaInterval": 5,
            "envelopKoeff": 0.3,
            "previousValues": "secondMax",
            "ignoreHours": [
                "23:00", "01:00"
            ]
        },
        "updateInterval": 1800000
    }
}
```

### Detection methods



## Atlas based detection
