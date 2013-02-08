var fs     = require('fs'),
    util   = require('util'),
	bufferpack = require('bufferpack');

// Calculate the hash key
var key_to_hash = function(str) {
	//starting value of the hash is 5381 cause he says so.
	var hash = 5381,
		len = str.length;

	for (var i = 0; i < len; i++)
		hash = ((hash << 5) + hash) ^ str.charCodeAt(i) & 0xffffffff;

	return Math.abs(hash);
};

var CDB_Write = function(opts, callback) {
	opts = {
		overwrite : opts.overwrite || false,
		filepath : opts.filepath || '',
		content : opts.content || ''
	};

	if(!opts.overwrite) {
		//make sure the file exists
		fs.exists(opts.filepath, function(exists) {
			if(!exists)
				throw new Error('cdb-read::init - CDB file does not exist.');
		});
	}

	// ['hash',keylen,vallen]
	var data_ints = [];

	var write_table_hash = function() {

	};

	// dump empty bytes in the table location
	var b = new Buffer(2048);
	fs.writeFile(filepath, b, function(err) {
		write_table_hash();
	}); 
	
	var l = opts.content.length,
		data_lens = {};
	for(var i=0; i < l; i++) {
		// equate the hash
		hash = key_to_hash(opts.content[i][0]) & 0xffffffff,
		// equate the table number & 0xff == * 256
		tbl_num = hash & 0xff;

		data_lens[opts.content[i][0]] = [tbl_num, opts.content[i][0].length,opts.content[i][1].length];
	}
	console.log(data_lens);

	callback();
};

CDB_Writer.prototype.push = function(key, val, callback) {
	var hash = key_to_hash(opts.content[i][0]) & 0xffffffff;
	this.data_ints = [hash, key.length, val.length];
};

module.exports = CDB_Write
