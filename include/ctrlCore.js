/*
	Developer: Marzavec
	Use it as you'd like, but I'd appreciate a mention n_n
*/

ctrlCore = {
  renameable: true,

	help: function(data){
    if(data[1] == '-h'){
      data.socket.say('@' + data.nick + ', what are you fucking stupid or something?');
      return;
    }

    var functionNames = [];
    for(var func in this){
        if(typeof this[func] == "function") {
            functionNames.push(func);
        }
    }
    var reply = '@' + data.nick + ', commands: -' + functionNames.join(' -').trim() + ". Use -h as an argument with any command to get more info.";
    data.socket.say(reply);
  },

  quizme: function(data){
    if(data[1] == '-h'){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'quizme [category], start game. Category defaults to random.');
      return;
    }

    if(typeof data.trip === 'undefined'){
      data.socket.say('@' + data.nick + ', no trip code; no service.');
      return;
    }

    if(triviaEngine.isEngaged){
      data.socket.say('@' + data.nick + ', wait your turn.');
      return;
    }

    triviaEngine.startNew(data, data[1]);
  },

  challenge: function(data){
    if(data[1] == '-h' || typeof data[1] === 'undefined' || data[1] == ''){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'challenge start, generates a unique set of puzzles that will challenge your knowledge of programming, security and cryptology. Correct solutions are worth more points than ordinary trivia & you can earn badges- but the difficulty increases with each stage.');
      return;
    }

    data.socket.say('@' + data.nick + ', the challenge are still being coded, for now just enjoy the trivia.');
  },

  myrank: function(data){
    if(data[1] == '-h'){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'myrank, displays your stats & rank vs other players.');
      return;
    }

    if(typeof data.trip === 'undefined'){
      data.socket.say('@' + data.nick + ', no trip code; no service.');
      return;
    }

		var sqlQuery = "SELECT @rn:=@rn+1 AS `rank`, `trip`, `nick`, `points`, `prof` FROM (SELECT `trip`, `nick`, `points`, `prof` FROM `points` WHERE `bridgeid` = 0 ORDER BY `points` DESC) t1 , (SELECT @rn:=0) t2";

		sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
				data.socket.say("@" + data.nick + ", sql ran into a problem.");
        console.log('SQL Error: ' + err);
        logEngine.add('SQL', err);
				return;
			}

			var found = false;
			var output = '';

			for(var i = 0, j = rows.length; i < j; i++){
				if(rows[i].nick == data.nick && rows[i].trip == data.trip){
					var highest = 0;
					var topCat = "none";
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

			data.socket.say("@" + data.nick + ", " + output);
		});
	},

  mypoints: function(data){
    if(data[1] == '-h'){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'mypoints, displays how many points in each category you have, along with any badges.');
      return;
    }

    var sqlQuery = "SELECT @rn:=@rn+1 AS `rank`, `trip`, `nick`, `points`, `prof` FROM (SELECT `trip`, `nick`, `points`, `prof` FROM `points` WHERE `bridgeid` = 0 ORDER BY `points` DESC) t1 , (SELECT @rn:=0) t2";

    sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
      if(rows.length == 0){
        data.socket.say("@" + data.nick + ", sql ran into a problem.");
        console.log('SQL Error: ' + err);
        logEngine.add('SQL', err);
				return;
      }

      var found = false;
      var output = '';

      for(var i = 0, j = rows.length; i < j; i++){
        if(rows[i].nick == data.nick && rows[i].trip == data.trip){
          var highest = 0;
          var catStr = "";
          rows[i].prof = JSON.parse(rows[i].prof);
          for(var k = 0, l = rows[i].prof.length; k < l; k++){
            catStr += rows[i].prof[k].cat + ' = ' + rows[i].prof[k].points + ', ';
          }
          catStr = catStr.substring(0, catStr.length - 2);
          output = 'Ranked #' + rows[i].rank + ' [' + rows[i].trip + ']' + rows[i].nick + ': ' + catStr + "\n";
          found = true;
        }
      }

      if(found == false) output = 'you are not ranked.';

      data.socket.say("@" + data.nick + ", " + output);
    });
  },

	rankof: function(data){
    if(data[1] == '-h' || typeof data[1] === 'undefined' || data[1] == ''){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'rankof <nick>, looks up target nick stats & rank vs other players.');
      return;
    }

		var sqlQuery = "SELECT @rn:=@rn+1 AS `rank`, `trip`, `nick`, `points`, `prof` FROM (SELECT `trip`, `nick`, `points`, `prof` FROM `points` WHERE `bridgeid` = 0 ORDER BY `points` DESC) t1 , (SELECT @rn:=0) t2";

		sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
        data.socket.say("@" + data.nick + ", sql ran into a problem.");
        console.log('SQL Error: ' + err);
        logEngine.add('SQL', err);
				return;
			}

			var found = false;
			var output = '';

			for(var i = 0, j = rows.length; i < j; i++){
				if(rows[i].nick == data[1]){
					var highest = 0;
					var topCat = "none";
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

			data.socket.say("@" + data.nick + ", " + output);
		});
	},

	leaders: function(data){
    if(data[1] == '-h'){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'leaders, show top coders.');
      return;
    }

		var sqlQuery = "SELECT @rn:=@rn+1 AS `rank`, `trip`, `nick`, `points`, `prof` FROM ( SELECT `trip`, `nick`, `points`, `prof` FROM `points` WHERE `bridgeid` = 0 ORDER BY `points` DESC LIMIT 5) t1 , (SELECT @rn:=0) t2";
		sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
        data.socket.say("@" + data.nick + ", sql ran into a problem.");
        console.log('SQL Error: ' + err);
        logEngine.add('SQL', err);
				return;
			}

			var leaderStr = "";
			for(var i = 0, j = rows.length; i < j; i++){
				var highest = 0;
				var topCat = "none";
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

			data.socket.say("@" + data.nick + ", top coders:\n" + leaderStr);
		});
	},

  losers: function(data, nick, trip){
    if(data[1] == '-h'){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'losers, show bottom coders.');
      return;
    }

		var sqlQuery = "SELECT @rn:=@rn+1 AS `rank`, `trip`, `nick`, `points`, `prof` FROM (SELECT `trip`, `nick`, `points`, `prof` FROM `points` WHERE `bridgeid` = 0 ORDER BY `points` DESC) t1 , (SELECT @rn:=0) t2";
		sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
        data.socket.say("@" + data.nick + ", sql ran into a problem.");
        console.log('SQL Error: ' + err);
        logEngine.add('SQL', err);
				return;
			}

			var loserStr = "";
			for(var i = rows.length - 1, j = rows.length - 6; i > j; i--){
				var highest = 0;
				var topCat = "none";
				rows[i].prof = JSON.parse(rows[i].prof);
				for(var k = 0, l = rows[i].prof.length; k < l; k++){
					if(rows[i].prof[k].points > highest){
						highest = rows[i].prof[k].points;
						topCat = rows[i].prof[k].cat;
					}
				}
				loserStr += 'Ranked #' + rows[i].rank + ' [' + rows[i].trip + ']' + rows[i].nick + ': ' + rows[i].points + " points - top cat: " + topCat + "\n";
			}
			loserStr = loserStr.substring(0, loserStr.length - 1);

			data.socket.say("@" + data.nick + ", worst coders:\n" + loserStr);
		});
	},

	nearme: function(data){
    if(data[1] == '-h'){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'nearme, show coders near your ranking.');
      return;
    }

    if(typeof data.trip === 'undefined'){
      data.socket.say('@' + data.nick + ', no trip code; no service.');
      return;
    }

		var sqlQuery = "SELECT @rn:=@rn+1 AS `rank`, `trip`, `nick`, `points`, `prof` FROM ( SELECT `trip`, `nick`, `points`, `prof` FROM `points` WHERE `bridgeid` = 0 ORDER BY `points` DESC) t1 , (SELECT @rn:=0) t2";
		sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
        data.socket.say("@" + data.nick + ", sql ran into a problem.");
        console.log('SQL Error: ' + err);
        logEngine.add('SQL', err);
				return;
			}

			var output = "";
			var userRow = false;

			for(var i = 0, j = rows.length; i < j; i++){
				if(rows[i].nick == data.nick && rows[i].trip == data.trip) userRow = i;
			}

			if(userRow === false){
				data.socket.say("@" + data.nick + ", you are not ranked.");
				return;
			}

			for(var i = userRow - 2, j = userRow + 2; i < j; i++){
				if(typeof rows[i] !== 'undefined'){
					var highest = 0;
					var topCat = "none";
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

			data.socket.say("@" + data.nick + ", near you:\n" + output);
		});
	},

	categories: function(data){
    if(data[1] == '-h'){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'categories, show available question categories.');
      return;
    }

    if(typeof data.trip === 'undefined'){
      data.socket.say('@' + data.nick + ', no trip code; no service.');
      return;
    }

		var sqlQuery = "SELECT DISTINCT(`cat`) FROM `questions` WHERE 1";
		sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
        data.socket.say("@" + data.nick + ", sql ran into a problem.");
        console.log('SQL Error: ' + err);
        logEngine.add('SQL', err);
				return;
			}

			var catStr = "";
			for(var i = 0, j = rows.length; i < j; i++) catStr += rows[i].cat + ', ';
			catStr = catStr.substring(0, catStr.length - 2);

			data.socket.say("@" + data.nick + ", categories are: " + catStr);
		});
	},

  bridge: function(data){
    if(data[1] == '-h'){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'bridge <nick> <trip>, bridge your current nick with the same nick on a different server.');
      return;
    }

    if(typeof data.trip === 'undefined'){
      data.socket.say('@' + data.nick + ', no trip code; no service.');
      return;
    }

		data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'bridge is disabled.');
	},

	contribute: function(data){
    if(data[1] == '-h'){
      data.socket.say('@' + data.nick + ', ' + botConfig.ctrlChr + 'contribute, this command needs no help- how about you just run it?');
      return;
    }

		data.socket.say("Questions: http://coderrank.marzavec.com/\n     Code: https://github.com/marzavec/Hack.Chat-TriviaBot\n  Hosting: 1LeFfbBUu9Hgpoz7C6CkyyfE2YwHETBC6K (BTC)");
	}
}
