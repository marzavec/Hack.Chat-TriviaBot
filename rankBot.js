/* global vars */
var wsPath = 'wss://hack.chat/chat-ws';
var channel = 'programming';
var botHandle = 'coderRank#trip';

var sqlHost = 'localhost';
var sqlUser = ''; // UPDATE THIS //
var sqlPass = ''; // UPDATE THIS //
var sqlDb = 'rankbot';
var sqlConnected = false;

var rejoinInterval = 9999999;

/* main functions */
process.title = 'Coder Rank - Hack.Chat Edition';

var mysql = require("mysql");
var sqlCon = mysql.createConnection({
  host     : sqlHost,
  user     : sqlUser,
  password : sqlPass,
  database : sqlDb
});

sqlCon.connect(function(err){
	if(err != undefined && err != ''){
		console.log('SQL Connection Error: ' + err);
	}else{
		sqlConnected = true;
	}
});

var WebSocket = require('ws');
var ws = new WebSocket(wsPath);

ws.onopen = function(){
	if(rejoinInterval != 9999999){
		clearInterval(rejoinInterval);
		rejoinInterval = 9999999;
	}
	setInterval(function(){ send({cmd: 'ping'}); }, 40000);
	send({cmd: 'join', channel: channel, nick: botHandle});
}

ws.onclose = function(){
	clearInterval(cronInterval);
	rejoinInterval = setInterval(function(){ ws = new WebSocket(wsPath); }, 5000);
}

ws.onerror = function(err){
	// Errors? Fuck errors.
}

ws.onmessage = function(message){
	var args = JSON.parse(message.data);
	switch(args.cmd){
		case 'chat':
			rankBot.onMsg(args);
		break;
		case 'onlineSet':
			room.populateUsers(args);
		break;
		case 'onlineAdd':
			room.onJoin(args);
		break;
		case 'onlineRemove':
			room.onLeave(args);
		break;
	}
}

function send(data){
	if(ws && ws.readyState == ws.OPEN){
		ws.send(JSON.stringify(data));
	}
}

function secureAlphaNumeric(str){
	return str.replace(/[^a-z0-9\+\/ _=]/gi,'');
}

function secureNumeric(str){
	return str.replace(/[^0-9\.]/gi,'');
}

function colorize(str, color){
	return '$\\color{' + color + '}{' + str + '}$';
}

/* begin main classes */
var room = {
	currentUsers: [],
	
	populateUsers: function(data){
		data.nicks.forEach(function(newNick){
			room.currentUsers.push({nick: newNick, trip: ''});
		});
	},
	
	onJoin: function(data){
		this.currentUsers.push({nick: data.nick, trip: ''});
	},
	
	onLeave: function(data){
		for(var i = 0; i < this.currentUsers.length; i++) if(this.currentUsers[i].nick == data.nick) this.currentUsers.splice(i, 1);
	},
	
	trackTrip: function(tNick, tTrip){
		for(var i = 0; i < this.currentUsers.length; i++){
			if(this.currentUsers[i].nick == tNick){
				if(this.currentUsers[i].trip != tTrip) this.currentUsers[i].trip = tTrip;
			}
		}
	},
	
	getTrip: function(tNick){
		for(var i = 0; i < this.currentUsers.length; i++){
			if(this.currentUsers[i].nick == tNick && this.currentUsers[i].trip != ''){
				return this.currentUsers[i].trip;
			}
		}
		
		return false;
	},
	
	userIsOnline: function(nick){
		for(var i = 0; i < this.currentUsers.length; i++){
			if(this.currentUsers[i].nick == nick) return true;
		}
		
		return false;
	}
}

var game = {
	userID: 0,
	userPoints: 0,
	userProf: "",
	questionTimeout: 0,
	questionID: 0,
	questionPoints: 0,
	questionCat: "",
	questionAnswer: "",
	
	startNew: function(cat){
		this.getUserData();
		
		cat = typeof cat === 'undefined' ? "1" : '`cat` = ' + mysql.escape(secureAlphaNumeric(cat));
		
		var sqlQuery = "SELECT `id`, `points`, `tta`, `cat`, `question`, `answer` FROM `questions` WHERE " + cat + " ORDER BY RAND() LIMIT 1";
		sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
				var sqlQuery = "SELECT `id`, `points`, `tta`, `cat`, `question`, `answer` FROM `questions` WHERE 1 ORDER BY RAND() LIMIT 1";
				sqlCon.query(sqlQuery, function(err, rows){
					if(rows.length == 0){
						rankBot.say("Some code dun fucked up. [STARTNEW 404]");
						return;
					}
					
					game.initializeNewQuestion(rows[0]);
				});
				return;
			}
			
			game.initializeNewQuestion(rows[0]);
		});
	},
	
	getUserData: function(){
		var sqlQuery = "SELECT `id`, `bridgeid`, `points`, `prof` FROM `points` WHERE `nick` = " + mysql.escape(rankBot.engagedWith.nick) + " AND `trip` = " + mysql.escape(rankBot.engagedWith.trip) + " LIMIT 1";
		sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
				var sqlQuery = "INSERT INTO `points` (`id`, `bridgeid`, `trip`, `nick`, `points`, `prof`) VALUES (NULL, '0', " + mysql.escape(rankBot.engagedWith.trip) + ", " + mysql.escape(rankBot.engagedWith.nick) + ", '0', '[]')";
				sqlCon.query(sqlQuery, function(err, rows){
					sqlCon.query("SELECT LAST_INSERT_ID() AS `userID`", function(err, rows){
						game.userID = rows[0].userID;
						game.userPoints = 0;
						game.userProf = [];
					});
				});
				return;
			}
			
			game.userID = rows[0].id;
			if(rows[0].bridgeid != 0) game.userID = rows[0].bridgeid;
			game.userPoints = rows[0].points;
			game.userProf = JSON.parse(rows[0].prof);
		});
	},
	
	initializeNewQuestion: function(data){
		this.questionID = data.id;
		this.questionPoints = data.points;
		this.questionCat = data.cat;
		this.questionAnswer = JSON.parse(data.answer);
		
		rankBot.say("@" + rankBot.engagedWith.nick + "; the category is: " + data.cat + " & for " + colorize(String(data.points), 'green') + " points, " + colorize(data.tta, 'red') + " seconds to answer!\n" + data.question);
		
		this.questionTimeout = setTimeout(function(){ game.questionTimedOut(); }, data.tta * 1000);
	},
	
	gaveAnswer: function(data){
		clearTimeout(this.questionTimeout);
		
		if(data == "pass"){
			this.questionPoints = Math.floor(this.questionPoints * 0.3);
			
			rankBot.say("@" + rankBot.engagedWith.nick + ", no one likes a quitter. . . Lost " + colorize(String(this.questionPoints), 'green') + " points. Total: " + String(game.userPoints - game.questionPoints));
			
			this.failure();
			return;
		}
		
		var correct = false;
		
		for(var i = 0, j = this.questionAnswer.length; i < j; i++) if(data == this.questionAnswer[i]) correct = true;
		
		if(correct){
			rankBot.say("@" + rankBot.engagedWith.nick + ", " + colorize("correct", 'green') + "! Awarded " + colorize(String(this.questionPoints), 'green') + " points. Total: " + String(game.userPoints + game.questionPoints));
			
			this.success();
		}else{
			rankBot.say("@" + rankBot.engagedWith.nick + ", " + colorize("wrong", 'red') + "! Lost " + colorize(String(this.questionPoints), 'red') + " points. Total: " + String(game.userPoints - game.questionPoints));
			
			this.failure();
		}
	},
	
	questionTimedOut: function(){
		rankBot.say("@" + rankBot.engagedWith.nick + ", times up, lost " + colorize(String(this.questionPoints), 'red') + " points. Total: " + String(game.userPoints - game.questionPoints));
		
		this.failure();
	},
	
	success: function(){
		if(this.userProf.length == 0){
			this.userProf.push({ cat: this.questionCat, points: this.questionPoints });
		}else{
			var found = false;
			for(var i = 0, j = this.userProf.length; i < j; i++){
				if(this.userProf[i].cat == this.questionCat){
					found = true;
					this.userProf[i].points += this.questionPoints;
				}
			}
			if(!found) this.userProf.push({ cat: this.questionCat, points: this.questionPoints });
		}
		
		var sqlQuery = "UPDATE `points` SET `points` = `points` + " + this.questionPoints + ", `prof` = " + mysql.escape(JSON.stringify(this.userProf)) + " WHERE `id` = " + String(this.userID);
		sqlCon.query(sqlQuery, function(err, rows){
			sqlCon.query("UPDATE `questions` SET `pass` = `pass` + 1 WHERE `id` = " + String(this.questionID), function(err, rows){ });
		});
		
		rankBot.isQuizing = false;
	},
	
	failure: function(){
		var sqlQuery = "UPDATE `points` SET `points` = `points` - 10 WHERE `id` = " + String(this.userID);
		sqlCon.query(sqlQuery, function(err, rows){
			sqlCon.query("UPDATE `questions` SET `fail` = `fail` + 1 WHERE `id` = " + String(this.questionID), function(err, rows){ });
		});
		
		rankBot.isQuizing = false;
	}
}

var rankBot = {
	name: 'coderRank',
	currentUsers: [],
	cmdPre: '-',
	isQuizing: false,
	engagedWith: {},
	
	onMsg: function(data){
		if(data.nick == this.name) return;
		
		if(data.trip == undefined){
			data.trip = '';
		}else{
			room.trackTrip(data.nick, data.trip);
		}
		
		if(!this.isQuizing && data.text.substring(0, 1) != this.cmdPre) return;
		
		data.text = data.text.trim();
		
		var args = data.text.split(' ');
		
		var rootCmd = secureAlphaNumeric(args.splice(0, 1)[0].substr(1).toLowerCase());
		
		data.nick = secureAlphaNumeric(data.nick);
		data.trip = secureAlphaNumeric(data.trip);
		
		if(this.isQuizing && this.engagedWith.nick == data.nick && this.engagedWith.trip == data.trip){
			game.gaveAnswer(data.text);
			return;
		}
		
		if(typeof this[rootCmd] == 'function' && this.canReply(data.nick, data.trip)) this[rootCmd](args, data.nick, data.trip);
	},
	
	canReply: function(nick, trip){
		if(trip == ''){
			this.say("@" + nick + ", no trip; no service.");
			return false;
		}
		
		if(this.isQuizing && nick != this.engagedWith.nick && trip != this.engagedWith.trip){
			this.say("@" + nick + ", wait until me & @" + this.engagedWith.nick + " are done. . .");
			return false;
		}
		
		return true;
	},
	
	outputHelp: function(data, nick, trip){
		this.say("@" + nick + "; use -h with any command for more info.\nCommands: " + this.cmdPre + "help, " + this.cmdPre + "myrank, " + this.cmdPre + "nearme, " + this.cmdPre + "rankof, " + this.cmdPre + "leaders, " + this.cmdPre + "categories, " + this.cmdPre + "quizme " + this.cmdPre + "bridge " + this.cmdPre + "contribute");
	},
	
	h: function(data, nick, trip){
		if(data[0] == '-h'){
			this.say("@" + nick + ", what are you fucking stupid or something?");
			return;
		}
		this.outputHelp(data, nick, trip);
	},
	
	help: function(data, nick, trip){
		if(data[0] == '-h'){
			this.say("@" + nick + ", what are you fucking stupid or something?");
			return;
		}
		
		this.outputHelp(data, nick, trip);
	},
	
	myrank: function(data, nick, trip){
		if(data[0] == '-h'){
			this.say("@" + nick + ", " + this.cmdPre + "myrank, displays your stats & rank vs other players.");
			return;
		}
		
		var sqlQuery = "SELECT @rn:=@rn+1 AS `rank`, `trip`, `nick`, `points`, `prof` FROM (SELECT `trip`, `nick`, `points`, `prof` FROM `points` WHERE `bridgeid` = 0 ORDER BY `points` DESC) t1 , (SELECT @rn:=0) t2";
		
		sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
				rankBot.say("@" + nick + ", sql fuckup [MYRANK 404].");
				return;
			}
			
			var found = false;
			var output = '';
			
			console.log(rows.length);
			for(var i = 0, j = rows.length; i < j; i++){
				if(rows[i].nick == nick && rows[i].trip == trip){
					var highest = 0;
					var topCat = "";
					rows[i].prof = JSON.parse(rows[i].prof);
					for(var k = 0, l = rows[i].prof.length; k < l; k++){
						if(rows[i].prof[k].points > highest){
							highest = rows[i].prof[k].points;
							topCat = rows[i].prof[k].cat;
						}
					}
					output = 'Ranked #' + rows[i].rank + ' [' + rows[i].trip + ']' + rows[i].nick + ': ' + rows[i].points + " points - top cat: " + topCat + "\n";
					found = true;
				}
			}
			
			if(found == false) output = 'you are not ranked.';
			
			rankBot.say("@" + nick + ", " + output);
		});
	},
	
	rankof: function(data, nick, trip){
		if(data[0] == '-h'){
			this.say("@" + nick + ", " + this.cmdPre + "rankof <nick> [trip], looks up target nick stats & rank vs other players.");
			return;
		}
		
		var sqlQuery = "SELECT @rn:=@rn+1 AS `rank`, `trip`, `nick`, `points`, `prof` FROM (SELECT `trip`, `nick`, `points`, `prof` FROM `points` WHERE `bridgeid` = 0 ORDER BY `points` DESC) t1 , (SELECT @rn:=0) t2";
		
		sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
				rankBot.say("@" + nick + ", sql fuckup [MYRANK 404].");
				return;
			}
			
			var found = false;
			var output = '';
			
			for(var i = 0, j = rows.length; i < j; i++){
				if(rows[i].nick == data[0]){
					var highest = 0;
					var topCat = "";
					rows[i].prof = JSON.parse(rows[i].prof);
					for(var k = 0, l = rows[i].prof.length; k < l; k++){
						if(rows[i].prof[k].points > highest){
							highest = rows[i].prof[k].points;
							topCat = rows[i].prof[k].cat;
						}
					}
					output = 'Ranked #' + rows[i].rank + ' [' + rows[i].trip + ']' + rows[i].nick + ': ' + rows[i].points + " points - top cat: " + topCat + "\n";
					found = true;
				}
			}
			
			if(found == false) output = 'user not ranked.';
			
			rankBot.say("@" + nick + ", " + output);
		});
	},
	
	leaders: function(data, nick, trip){
		if(data[0] == '-h'){
			this.say("@" + nick + ", " + this.cmdPre + "leaders, show top coders.");
			return;
		}
		
		var sqlQuery = "SELECT @rn:=@rn+1 AS `rank`, `trip`, `nick`, `points`, `prof` FROM ( SELECT `trip`, `nick`, `points`, `prof` FROM `points` WHERE `bridgeid` = 0 ORDER BY `points` DESC LIMIT 5) t1 , (SELECT @rn:=0) t2";
		sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
				rankBot.say("Some code dun fucked up. [LEADERS 404]");
				return;
			}
			
			var leaderStr = "";
			for(var i = 0, j = rows.length; i < j; i++){
				var highest = 0;
				var topCat = "";
				rows[i].prof = JSON.parse(rows[i].prof);
				for(var k = 0, l = rows[i].prof.length; k < l; k++){
					if(rows[i].prof[k].points > highest){
						highest = rows[i].prof[k].points;
						topCat = rows[i].prof[k].cat;
					}
				}
				leaderStr += 'Ranked #' + rows[i].rank + ' [' + rows[i].trip + ']' + rows[i].nick + ': ' + rows[i].points + " points - top cat: " + topCat + "\n";
			}
			leaderStr = leaderStr.substring(0, leaderStr.length - 1);
			
			rankBot.say("@" + nick + ", top coders:\n" + leaderStr);
		});
	},
	
	nearme: function(data, nick, trip){
		if(data[0] == '-h'){
			this.say("@" + nick + ", " + this.cmdPre + "leaders, show top coders.");
			return;
		}
		
		var sqlQuery = "SELECT @rn:=@rn+1 AS `rank`, `trip`, `nick`, `points`, `prof` FROM ( SELECT `trip`, `nick`, `points`, `prof` FROM `points` WHERE `bridgeid` = 0 ORDER BY `points` DESC) t1 , (SELECT @rn:=0) t2";
		sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
				rankBot.say("Some code dun fucked up. [LEADERS 404]");
				return;
			}
			
			var output = "";
			var userRow = false;
			
			for(var i = 0, j = rows.length; i < j; i++){
				if(rows[i].nick == nick && rows[i].trip == trip) userRow = i;
			}
			
			if(userRow == false){
				rankBot.say("@" + nick + ", you are not ranked.");
				return;
			}
			
			for(var i = userRow - 2, j = userRow + 2; i < j; i++){
				if(typeof rows[i] !== 'undefined'){
					var highest = 0;
					var topCat = "";
					rows[i].prof = JSON.parse(rows[i].prof);
					for(var k = 0, l = rows[i].prof.length; k < l; k++){
						if(rows[i].prof[k].points > highest){
							highest = rows[i].prof[k].points;
							topCat = rows[i].prof[k].cat;
						}
					}
					output += 'Ranked #' + rows[i].rank + ' [' + rows[i].trip + ']' + rows[i].nick + ': ' + rows[i].points + " points - top cat: " + topCat + "\n";
				}
			}
			output = output.substring(0, output.length - 1);
			
			rankBot.say("@" + nick + ", near you:\n" + output);
		});
	},
	
	categories: function(data, nick, trip){
		if(data[0] == '-h'){
			this.say("@" + nick + ", " + this.cmdPre + "categories, show available question categories.");
			return;
		}
		
		var sqlQuery = "SELECT DISTINCT(`cat`) FROM `questions` WHERE 1";
		sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
				rankBot.say("Some code dun fucked up. [CAT 404]");
				return;
			}
			
			var catStr = "";
			for(var i = 0, j = rows.length; i < j; i++) catStr += rows[i].cat + ', ';
			catStr = catStr.substring(0, catStr.length - 2);
			
			rankBot.say("@" + nick + ", available: " + catStr);
		});
	},
	
	quizme: function(data, nick, trip){
		if(data[0] == '-h'){
			this.say("@" + nick + ", " + this.cmdPre + "quizme [category], start game. Category defaults to random.");
			return;
		}
		
		this.isQuizing = true;
		this.engagedWith.nick = nick;
		this.engagedWith.trip = trip;
		game.startNew(data[0]);
	},
	
	bridge: function(data, nick, trip){
		if(data[0] == '-h'){
			this.say("@" + nick + ", " + this.cmdPre + "bridge <nick> <trip>, bridge your current nick with the same nick on a different server.");
			return;
		}
		
		this.say("@" + nick + ", " + this.cmdPre + "bridge is under review.");
	},
	
	contribute: function(data, nick, trip){
		if(data[0] == '-h'){
			this.say("@" + nick + ", " + this.cmdPre + "contribute, this command needs no help- how about you just run it?");
			return;
		}
		
		this.say("Questions: http://coderrank.marzavec.com/\n     Code: https://github.com/marzavec/Hack.Chat-TriviaBot\n  Hosting: 1LeFfbBUu9Hgpoz7C6CkyyfE2YwHETBC6K")
	},
	
	say: function(data){
		send({cmd: 'chat', text: data});
	}
}
