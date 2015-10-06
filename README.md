# mysql2mongo
Transfer data from mysql to mongodb

## Before you start
* node version 0.12 (if you want node@4.0+, see other branches)

## install
```
npm install mysql2mongo@1.0
```

## usage
```js
var translator = require('mysql2mongo');

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
```

## LICENSE
MIT