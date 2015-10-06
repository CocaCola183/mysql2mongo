var translator = require('..');

var mysqlOptions = {
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'test'
};

var mongoOptions = {
	addr: 'mongodb://localhost/',
	dbname: 'target'
};

translator(mysqlOptions, mongoOptions);