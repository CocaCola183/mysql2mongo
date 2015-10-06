var mysql = require('mysql');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var async = require('async');
var fs = require('fs');
var assert = require('assert-plus');
var ProgressBar = require('progress');

var barStyle = '[:bar] :current :etas'; 

module.exports = function(mysql_options, mongodb_options, callback) {
	assert.object(mysql_options, 'mysql_options');
	assert.object(mysql_options, 'mysql_options');


	var connection = mysql.createConnection({
		host: mysql_options.host,
		user: mysql_options.user,
		password: mysql_options.password,
		database: mysql_options.database
	});

	connection.connect(function(err) {
		if(err) {
			console.log('Connect mysql error: ', err.stack);
			connection.end();
			return ;
		}

		console.log('connect mysql success');

		mongoose.connect(mongodb_options.addr + mongodb_options.dbname, function(err) {
			if(err) {
				console.log('connect mongodb error: ', err.stack);
				mongoose.disconnect();
				return ;
			}

			console.log('connect mongodb success');

			connection.query('show tables', function(err, tables) {
				if(err) {
					console.log('mysql run query \'show tables\' failed: ', err);
					connection.end();
					mongoose.disconnect();
					return ;
				}

				var prefix = 'Tables_in_';

				async.eachSeries(tables, function(table, callback){

					var tableName = table[prefix + mysql_options.database];

					var sql = 'select * from ' + tableName;

					connection.query(sql, function(err, rows) {

						if(err) {
							console.log('Transferring ' + tableName+ ' data failed:', err);
							callback(err);
						} 

						var schema = {};

						Object.keys(rows[0]).forEach(function(key) {
							schema[key] = {type: get_format(rows[0][key])}
						});

						var mongoose_schema = new Schema(schema);

						var mongoose_model = mongoose.model(tableName, mongoose_schema);

						var splited_rows = split_array(rows, 100);

						var progressBar = new ProgressBar(tableName + ':' + barStyle, {total: rows.length});

						async.eachSeries(splited_rows, function(rows, callback) {
							mongoose_model.create(rows, function(err) {
  							if(err) {
  								console.log('Transferring ' + tableName + ' data failed:', err);
  								callback(err);
  							} else {
  								progressBar.tick(rows.length);
  								callback();
  							}
  						});
						}, function(err) {
							callback(err);
						});


					});
				}, function(err) {
					connection.end();
					mongoose.disconnect();
					if(!err) console.log('All data has been transferred.');
					return;
				});


			});
		});
	});

};

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