/*
	Developer: Marzavec
	Use it as you'd like, but I'd appreciate a mention n_n
*/

/* load dependancies */
fileSys = require('fs');
Https = require('https');
WebSocket = require('ws');

/* load configs */
var configList = fileSys.readdirSync('./config/');
configList.forEach(function(conf){
	conf = './config/' + conf;
	if(!fileSys.lstatSync(conf).isDirectory()) require(conf);
});

/* load classes */
var classList = fileSys.readdirSync('./include/');
classList.forEach(function(classFile){
	classFile = './include/' + classFile;
	if(!fileSys.lstatSync(classFile).isDirectory()) require(classFile);
});

/* create log folder */
if(!fileSys.existsSync('./logs')){
	fileSys.mkdirSync('./logs');
}

/* initialize classes */
mysql = require("mysql");
sqlEngine.init();

/* setup & exe */
process.title = 'Coder Rank - v2.0';
enterChannel(botConfig.defaultChan);
