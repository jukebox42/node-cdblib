## Constant Database Read in pure javascript. 

A CDB is an associative array mapping strings to values using a hash lookup.

This is a rewrite of D. J. Bernstein's Constant Database program.

More information on CDB here: http://cr.yp.to/cdb.html

## Installation

Through NPM

	npm install node-cdblib

Through Git

	git clone github.com:jukebox42/node-cdblib.git
	cd node-cdblib
	npm install # to install deps

## Example Usage
```javascript
var CDB_Read = require('./../node-cdblib').CDB_Reader;

var reader = new CDB_Read({filepath:CDB_FILE_LOCATION}, function(cdb) {
	cdb.find(KEY, function(value){
		console.log(value);
	});
});
```
## Testing

	npm test

## Documentation
CDB_Reader(opts, callback) - The CDB Reader object. returns a cdb object that has the fund and find_all functions

**Options:**
- filepath (string) - string contains the path to the file (required)
- cache (string) - boolean that when set to true will cache table location and size within the cdb. false by default. setting this will speed up the lookups at a small memory increase (optional)

**note:** if your cdb file gets rotated or updated during the run process cache won't work. this will be fixed eventually.

**CDB Functions:**

find(key,callback,offset) - Finds the first instance of a key and returns the value in the callback. false if the key was not found.

	key (string) - they key to look up the value for
	
	callback (function) - The callback function. will contain one return value(string). false if key was not found
	
	offset (int) - when dealing with CDB files with multiple of the same key tyou can use offset to traverse them. defaults to 0 (optional)

find_all(key, callback) - Finds all instances of a key and returns the array of values in the callback. false if they key was not found.
	
	key (string) - they key to look up the value for
	
	callback (function) - The callback function. will contain one return value(array). false if key was not found.

## Notes
- On init a watcher will monitor the CDB file for changes/replacements and will restart a request if it occurs. This will allow you to replace the CDB file on the fly without pausing or otherwaise haulting the process. Please note that for the moment this feature does not work when cache is true. Future versions will correct this.
- I do plan on adding the ability to write. Haven't got there yet.
- Has not been load tested yet. Getting there.
- Code is fully commented if you get curious.
- May contain bugs. Use at own risk.

## License

**MIT**
