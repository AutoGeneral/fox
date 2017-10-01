# Customisation

## Custom datasources:

- must implement `Datasource` interface described below
- must have name that follows pattern `*.datasource.js`
- must be placed in `server/datasources` folder

```js
const AbstractDatasource = require('./abstract.datasource');

class Datasource extends AbstractDatasource  {

    constructor (Object params)

    static get name (): String

    sendRequest (Any query): Promise<Array<DataPoint>|Error>

}
```

where

```js
class DataPoint {

    value: Any,

    timestamp: Number

}
```

## Custom detections:

- must implement `Detection` interface described below
- must have name that follows pattern `*.detection.js`
- must be placed in `server/detections` folder

```js
class Detection {

    constructor (Object params)

    static get name (): String

}
```

Detection must also implement at least one method that can be used as detection method with these properties:

- Accepts array (1..n) of arrays (0..m) with data points for each query in array.
- Returns array of processed data points:

```js
class ProcessedDataPoint {

    value: Float|Number,

    timestamp: Number,

    isEvent: Boolean,

    lowerEnvelope: Float|Number, // Optional

    upperEnvelope: Float|Number, // Optional

    isIgnored: Boolean // Optional
}
```



## Custom notifications:

- must implement `Notification` interface described below
- must have name that follows pattern `*.notification.js`
- must be placed in `server/notifications` folder

```js
class Notification {

    constructor (Object params)

    static get name (): String

    send (String metricName, Array<Array<DataPoint>> setsOfDatapoints): void

    // Optional
    // If want to use as sheduler notification

    sendRaw (String subject, String htmlBody): void

}
```
