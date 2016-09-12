'use strict';
let mysql = require('mysql-co');
let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let ProgressBar = require('progress');
let co = require('co');
let barStyle = '[:bar] :current :etas';
module.exports = function(mysql_options, mongodb_options) {
	co(function *() {
		let mysqlconn = mysql.createConnection({
			host: mysql_options.host,
			user: mysql_options.user,
			password: mysql_options.password,
			database: mysql_options.database
		});

		let mongoConn = mongoose.createConnection(mongodb_options.addr + mongodb_options.dbname);
		let tables = (yield mysqlconn.query('show tables'))[0];
		let prefix = 'Tables_in_';
		for(let i=0; i<tables.length; i++) {
			let tableName = tables[i][prefix + mysql_options.database];
			let count = (yield mysqlconn.query(`select count(*) as count from ${tableName}`))[0][0].count;
			let index = 0;
			let rate = 100;

			let dataForSchema = (yield mysqlconn.query(`SELECT * FROM ${tableName} LIMIT 1`))[0][0];
			let schema = {};
			Object.keys(dataForSchema).forEach(function(key) {
				schema[key] = {type: get_format(dataForSchema[key])}
			});
			let mongoose_schema = new Schema(schema);
			let mongoose_model = mongoConn.model(tableName, mongoose_schema);
			let progressBar = new ProgressBar(tableName + ':' + barStyle, {total: count});
			while(index < count) {
				let sql = `SELECT * FROM ${tableName} WHERE id >= (SELECT id FROM ${tableName} LIMIT ${index}, 1) LIMIT 100`;
				let data = (yield mysqlconn.query(sql))[0];
				try{
					yield mongoose_model.create(data);
				} catch(e) {
					if(e) {
						console.log(`transfer failed: ${e}`);
						mysqlconn.end();
						mongoConn.disconnect();
						return;
					}
				}
				progressBar.tick(data.length);
				index += rate;
			}
		}
		console.log('done');
	});
};