var mysql = require('mysql');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var async = require('async');
var fs = require('fs');

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'db_guangming'
});

if(!fs.existsSync('./models')) fs.mkdirSync('./models');

connection.connect(function(err) {
  if (err) {
    console.log('Connect mysql error: ' + err.stack);
    return;
  } else {
  	console.log('Connect sueecss', connection.threadId);

  	mongoose.connect('mongodb://localhost/yaoxin', function(err) {
			if(err) {
				console.log('Connect to mongodb://localhost/yaoxin failed');
				process.exit(1);
			} else {
				console.log('Connect to mongdb success');

				connection.query('show tables', function(err, rows) {
		  		if(err) {
		  			console.log('Get tables failed: ', err);
		  			connection.end();
		  		} else {
		  			console.log('Get tables success: ', rows);

		  			async.eachSeries(rows, function(row, callback) {
		  				var table_name = row.Tables_in_db_guangming;
		  				// var sql = 'select * from ' + table_name + ' limit 2';
		  				var sql = 'select * from ' + table_name;
		  				connection.query(sql, function(err, rows) {
		  					if(err) callback(err);
		  					else {
		  						// console.log(rows);
		  						// callback();

		  						/*Add to mongodb*/


		  						/*Generate schema*/
		  						var schema = {};
		  						Object.keys(rows[0]).forEach(function(key) {
		  							schema[key] = {type: get_format(rows[0][key])}
		  						});

		  						var mongoose_schema = new Schema(schema);

		  						var mongoose_model = mongoose.model(row.Tables_in_db_guangming, mongoose_schema);

		  						var splited_rows = split_array(rows, 100);

		  						async.eachSeries(splited_rows, function(rows, callback) {
		  							mongoose_model.create(rows, function(err) {
			  							if(err) {
			  								console.log('Transferring ' + row.Tables_in_db_guangming + ' data failed:', err);
			  								callback(err);
			  							} else {
			  								console.log('Transferring ' + row.Tables_in_db_guangming + ' data success');
			  								callback();
			  							}
			  						});
		  						}, function(err) {
		  							callback(err);
		  						});
		  					}
		  				});
		  			}, function(err) {
		  				if(err) connection.end();
		  				else {
		  					console.log('success');
		  					connection.end();
		  					mongoose.disconnect();
		  				}
		  			});
		  		}
		  	});


			}
		});	
  }
});


function get_format(value) {
	var type = typeof(value);
	return type[0].toUpperCase() + type.substr(1);
}

function split_array(array, num) {
	var new_array = [];
	var i = 0;
	while(i < array.length) {
		new_array.push(array.slice(i, i+num < array.length ? i+num : array.length));
		i += num;
	}
	return new_array;
}