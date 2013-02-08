var fs     = require('fs'),
    util   = require('util'),
	watch  = require('node-watch'),
	bufferpack = require('bufferpack');

var CDB_Read = function(opts, callback) {
	this.opts = {
		mode :            opts.mode || false, //(tmp)
		cache :           opts.cache || false,
		filepath :        opts.filepath || ''
	};

	// keep track of when the file was changed
	this.read_time = (+new Date);
	this.file_changed = this.read_time;

	//make sure the file exists
	var t = this;
	fs.exists(this.opts.filepath, function(exists) {
		if(!exists)
			throw new Error('cdb-read::init - CDB file does not exist.');
		
		watch(t.opts.filepath, function(filename) {
			t.file_changed = (+new Date);
		});
	});

	// if cache is on then preload all the tables length and locations
	// into an index array we do this for speed at the cost of a bit of space.
	// this array will contain 256 rows of [int,int].
	if(this.opts.cache) {
		this.indexes = [];
		cache(this,callback, true);
	} else
		callback(this);
};

// Calculate the hash key
var key_to_hash = function(str) {
	//starting value of the hash is 5381 cause he says so.
	var hash = 5381,
		len = str.length;

	// calculate hash
	for (var i = 0; i < len; i++)
		hash = ((hash << 5) + hash) ^ str.charCodeAt(i) & 0xffffffff;

	return Math.abs(hash);
};

// Read file and get the array of ints from unpacking 8 bytes
var get_ints = function(t, cb, key, offset, start, end, callback) {
	// if the file has been rotated out from under us we need to reload it.
	if(t.file_time != t.read_time) {
		t.read_time = t.file_time;
		t.find(key, cb, offset);
		return;
	}

	var buff = null,
		rs = fs.createReadStream(t.opts.filepath, {start: start, end: end});
	rs.on('data', function(chunk) {
		// append or set the buffer
		if(buff == null)
			buff = chunk;
		else
			buff = Buffer.concat([buff,chunk]);
	});
	rs.on('end', function() {
		if(!buff || !buff.length) {
			callback([0,0]);
		} else {
			// unpack bytes to get [int,int] buffer is in 
			// little endian so unpack will reverse them.
			callback(bufferpack.unpack('<LL', buff));
		}
	});
};

// Get the value of the key from the cdb file.
var get_val = function(t, cb, key, offset, start, end, callback) {
	// if the file has been rotated out from under us we need to reload it.
	if(t.file_time != t.read_time) {
		t.read_time = t.file_time;
		t.find(key, cb, offset);
		return;
	}


	var str = '';
		rs = fs.createReadStream(t.opts.filepath, {start: start, end: end, encoding: 'utf8'});
	// note the utf8 encoding. this prevents us from getting a buffer back
	rs.on('data', function(chunk) {
		str += chunk;
	});
	rs.on('end', function() {
		callback(str);
	});
};

// Get the position and value of the data
var get_pos = function(t, slot_pos, tbl_end, hash, key_str, offset, step, callback) {
	// get data position from table
	get_ints(t, callback, key_str, offset, slot_pos, slot_pos+7, function(ints) {
		var key = ints[0],
			data_pos = ints[1];
				
		//if we dont have the right key then skip out
		if(key != hash) {
			if(slot_pos + 8 < tbl_end)
				get_pos(t, slot_pos + 8, tbl_end, hash, key_str, offset, step, callback);
			else
				callback(false);
			return;
		}

		// get data length from data position
		get_ints(t, callback, key_str, offset, data_pos, data_pos+7, function(ints) {
			var key_len = ints[0],
				data_len = ints[1];

			// if the key length is empty then skip
			if(key_len == 0) {
				if(slot_pos + 8 < tbl_end)
					get_pos(t, slot_pos + 8, tbl_end, hash, key_str, offset, stop, callback);
				else
					callback(false);

				return;
			}

			var key_pos = data_pos + 8;

			// Get the key at the location
			get_val(t, callback, key_str, offset, key_pos, key_pos + key_len - 1, function(str) {
				// if the key does not match then lets check the next location
				if(str != key_str) {
					get_pos(t, slot_pos + 8, tbl_end, hash, key_str, offset, step, callback);
					return;
				}

				data_pos += 8 + key_len;
	
				// get the value at the data location
				get_val(t, callback, key_str, offset, data_pos, data_pos + data_len-1, function(str) {
					// if offset and step is < then get the next value
					if(step < offset) {
						step++;
						get_pos(t, slot_pos + 8, tbl_end, hash, key_str, offset, step, callback);
						return;
					}
					callback(str);
				});
			});
		});	
	});
};

// store the table data in a cache file
var cache = function(t, callback, first) {
	var buff = null,
		rs = fs.createReadStream(t.opts.filepath, {start: 0, end: 2047});
	rs.on('data', function(chunk) {
		if(buff == null)
			buff = chunk;
		else
			buff = Buffer.concat([buff,chunk]);
	});
	rs.on('end', function() {
		var b = new Buffer(8);
		for(var i=0; i < 256; i++) {
			b = new Buffer(8);
			buff.copy(b,0,i << 3);
			if(first)
				t.indexes.push(bufferpack.unpack('<LL', b));
			else
				t.new_indexes.push(bufferpack.unpack('<LL', b));
		}
		if(first)
			callback(t);
	});
};

/**
 * Find the value of the key and pass it into the callback function
 *
 * @param key The string to search for.
 * @param callback The callback function to fire. Returns a string or false.
 * @param offset When searching pass offset number to find_next.
 */
CDB_Read.prototype.find = function(key, callback, offset) {
	var t = this,
		// equate the hash
		hash = key_to_hash(key) & 0xffffffff,
		// equate the table number & 0xff == * 256
		tbl_num = hash & 0xff;

	var get_data = function(ints) {
		var tbl_start = ints[0],
			slot_len = ints[1],
			// calculate the length of the table << 3 == * 8
			tbl_end = tbl_start + slot_len << 3,
			// calculate the slot position >> 8 is / 256 but wont create decimals
			slot_pos = tbl_start + ((hash >> 8) % slot_len) << 3;

		get_pos(t, tbl_start, tbl_end, hash, key, offset, 0, callback);
	};

	if(this.opts.cache)
		// if cache was on indexes will contain table locations
		get_data(this.indexes[tbl_num]);
	else {
		// get table location
		get_ints(t, callback, key, offset, tbl_num << 3, tbl_num << 3+7, function(ints) {
			get_data(ints);
		});
	}
};

/**
 * Find the all the values of the key and pass the array into the callback function
 *
 * @param key The string to search for.
 * @param callback The callback function to fire. Returns an array or false.
 */
CDB_Read.prototype.find_all = function(key, callback) {
	var i = 0,
		t = this,
		vals = [];

	var cb = function(value) {
		if(value !== false) {
			vals.push(value);
			i++;
			t.find(key, cb, i);
		} else
			callback(vals);
	};
	t.find(key, cb);
};

CDB_Read.prototype.destroy = function(callback) {
 //XXX: we need to be able to destroy this class. and the watcher
};

// Export
module.exports = CDB_Read;
