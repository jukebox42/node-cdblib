var CDB_Read = require('./../lib/cdblib').CDB_Reader;

// Example 1 - normal select
var reader = new CDB_Read({filepath:__dirname+'/testdb.cdb'}, function(cdb) {
	cdb.find('zoom', function(value){console.log(value);});
});

// Example 2 - cache results
var reader2 = new CDB_Read({filepath:__dirname+'/testdb.cdb',cache:true}, function(cdb) {
	cdb.find('red', function(value){console.log(value);});
});

// Example 3 - snag the 2nd instance of the key
var reader3 = new CDB_Read({filepath:__dirname+'/testdb.cdb'}, function(cdb) {
	cdb.find('red', function(value){console.log(value);},1);
});

// Example 4 - get a bunch
var reader4 = new CDB_Read({filepath:__dirname+'/testdb.cdb'}, function(cdb) {
	cdb.find('zoom', function(value){
		console.log(value);
		cdb.find('red', function(value){
			console.log(value);
			cdb.find('red', function(value){
				console.log(value);
			});
		});
	});
});


