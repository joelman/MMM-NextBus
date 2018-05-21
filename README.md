# nextbus

This is a module for the [MagicMirror²](https://github.com/MichMich/MagicMirror/).

Todo: Insert description here!

## Using the module

To use this module, add the following configuration block to the modules array in the `config/config.js` file:
```js
var config = {
    modules: [
        {
	module: 'nextbus',
	config: {
	    // see https://gist.github.com/grantland/7cf4097dd9cdf0dfed14 for parameters
	    // command = predictionsForMultiStops
	    query: 'a=mbta&stops=89|2729&stops=89|2703&stops=101|5305&stops=101|5302'
	}
    ]
}
```

## Configuration options

| Option           | Description
|----------------- |-----------
| `query`          | Query string with the agency, and list of routes|stops
