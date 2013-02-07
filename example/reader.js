// Import reader
var CDB_Read = require('./../lib/cdblib').CDB_Reader;

var example1 = function() {
	console.log('\nExample 1 - normal select');

	// Example 1 - normal select
	var reader = new CDB_Read({filepath:__dirname+'/../t/testdb.cdb'}, function(cdb) {
		cdb.find('zoom', function(value){
			console.log(value);
			example2();
		});
	});
};

var example2 = function() {
	console.log('\nExample 2 - cache tables');

	// Example 2 - cache tables
	var reader2 = new CDB_Read({filepath:__dirname+'/../t/testdb.cdb',cache:true}, function(cdb) {
		cdb.find('red', function(value){
			console.log(value);
			example3();
		});
	});
};

var example3 = function() {
	console.log('\nExample 3 - snag the 2nd instance of the key');

	// Example 3 - snag the 2nd instance of the key
	var reader3 = new CDB_Read({filepath:__dirname+'/../t/testdb.cdb'}, function(cdb) {
		cdb.find('red', function(value){
			console.log(value);
			example4();
		},1);
	});
};

var example4 = function() {
	console.log('\nExample 4 - snag all the instances of the key');

	// Example 4 - snag all the instances of the key
	var reader4 = new CDB_Read({filepath:__dirname+'/../t/testdb.cdb'}, function(cdb) {
		cdb.find_all('red', function(value){
			console.log(value);
			example5();
		},1);
	});
};

var example5 = function() {
	console.log('\nExample 5 - get a bunch (just an example. staircases are bad)');

	// Example 5 - get a bunch (just an example. staircases are bad)
	var reader5 = new CDB_Read({filepath:__dirname+'/../t/testdb.cdb'}, function(cdb) {
		cdb.find('zoom', function(value){
			console.log(value);
			cdb.find('another', function(value){
				console.log(value);
				cdb.find('one', function(value){
					console.log(value);
					cdb.find('red', function(value){
						console.log(value);
					},1);
				});
			});
		});
	});
};

//run examples
example1();
