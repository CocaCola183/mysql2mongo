'use strict';
let translator = require('..');

let mysqlOptions = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'test'
};

let mongoOptions = {
	addr: 'mongodb://localhost/',
	dbname: 'target'
};

translator(mysqlOptions, mongoOptions);