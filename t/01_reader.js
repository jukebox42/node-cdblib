var fs = require('fs'),
	CDB_Read = require('./../lib/cdblib').CDB_Reader;

// See testdb.txt if you want to spot check. it is the uncompressed version of the cdb file

exports["Reader Test"] = {
	"Simple success test": function(test) {
		var reader = new CDB_Read({filepath:__dirname+'/testdb.cdb'}, function(cdb) {
			cdb.find('zoom', function(value) {
				test.equal(value, 'Hey, I just met you', 'got correct value');
				test.done();
			});
		});
	},
	"Simple failure test": function(test) {
		var reader = new CDB_Read({filepath:__dirname+'/testdb.cdb'}, function(cdb) {
			cdb.find('nonono', function(value) {
				test.equal(value, false, 'got false value');
				test.done();
			});
		});
	},
	"Cache test": function(test) {
		var reader = new CDB_Read({filepath:__dirname+'/testdb.cdb',cache:true}, function(cdb) {
			cdb.find('red', function(value) {
				test.equal(value, 'this is part two', 'got correct value');
				test.done();
			});
		});
	},
	"Multi keys (get one) test": function(test) {
		var reader = new CDB_Read({filepath:__dirname+'/testdb.cdb'}, function(cdb) {
			cdb.find('red', function(value){
				test.equal(value, 'so call me maybe', 'got correct value');
				test.done();
			},1);
		});
	},
	"Multi keys find all test": function(test) { 
		var reader = new CDB_Read({filepath:__dirname+'/testdb.cdb'}, function(cdb) {
			cdb.find_all('red', function(value) {
				test.equal(value.length, 2,  'got correct size');
				var v = ['this is part two','so call me maybe'];
				for(var i=0; i < 2; i++)
					test.equal(value[i], v[i],  'got correct value');
				test.done();
			});
		});
	},
	"Rotate cdb file test": function(test) {
		fs.createReadStream(__dirname+'/testdb.cdb').pipe(fs.createWriteStream(__dirname+'/rotateddb.cdb'));
		setTimeout(function() {
			var reader = new CDB_Read({filepath:__dirname+'/rotateddb.cdb'}, function(cdb) {
				cdb.find('red', function(value){
					test.equal(value, 'this is part two', 'got correct value');
					fs.createReadStream(__dirname+'/testdb2.cdb').pipe(fs.createWriteStream(__dirname+'/rotateddb.cdb'));
					setTimeout(function() {
						cdb.find('blue', function(value){
							test.equal(value, 'they say robots are coming to tear us apart', 'got correct value');
							reader = false;
							test.done();
						});
					}, 1000);
				});
			});
		}, 1000);
	},
	"Rotate cdb file test with cache": function(test) {
		fs.createReadStream(__dirname+'/testdb.cdb').pipe(fs.createWriteStream(__dirname+'/rotateddb1.cdb'));
		setTimeout(function() {
			var reader = new CDB_Read({filepath:__dirname+'/rotateddb1.cdb', cache:true}, function(cdb) {
				cdb.find('red', function(value){
					test.equal(value, 'this is part two', 'got correct value');
					fs.createReadStream(__dirname+'/testdb2.cdb').pipe(fs.createWriteStream(__dirname+'/rotateddb1.cdb'));
					setTimeout(function() {
						cdb.find('blue', function(value){
							test.equal(value, 'they say robots are coming to tear us apart', 'got correct value');
							test.done();
						});
					}, 1000);
				});
			});
		}, 1000);
	},
	"Rotate cdb file test with cache and multiple lookups": function(test) {
		fs.createReadStream(__dirname+'/testdb.cdb').pipe(fs.createWriteStream(__dirname+'/rotateddb2.cdb'));
		setTimeout(function() {
			var reader = new CDB_Read({filepath:__dirname+'/rotateddb2.cdb', cache:true}, function(cdb) {
				cdb.find('red', function(value){
					test.equal(value, 'this is part two', 'got correct value');
					fs.createReadStream(__dirname+'/testdb2.cdb').pipe(fs.createWriteStream(__dirname+'/rotateddb2.cdb'));
					setTimeout(function() {
						cdb.find('blue', function(value){
							test.equal(value, 'they say robots are coming to tear us apart', 'got correct value');
							cdb.find('keys', function(value){
								test.equal(value, 'they\'ll be landing on earth tommorrow', 'got correct value');
								test.done();
							});
						});
					}, 1000);
				});
			});
		}, 1000);
	}
};


