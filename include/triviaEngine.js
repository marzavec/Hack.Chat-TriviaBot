/*
	Developer: Marzavec
	Use it as you'd like, but I'd appreciate a mention n_n
*/

triviaEngine = {
  isEngaged: false,
  currentSocket: null,
  userNick: null,
  userTrip: null,
  userID: 0,
	userPoints: 0,
	userProf: "",
	questionTimeout: 0,
	questionID: 0,
	questionPoints: 0,
	questionCat: "",
	questionAnswer: "",

	startNew: function(data, cat){
    this.isEngaged = true;
    this.currentSocket = data.socket;

		this.getUserData(data.nick, data.trip);

		cat = typeof cat === 'undefined' ? '1' : '`cat` = ' + mysql.escape(secureAlphaNumeric(cat));

		var sqlQuery = "SELECT `id`, `points`, `tta`, `cat`, `question`, `answer` FROM `questions` WHERE " + cat + " ORDER BY RAND() LIMIT 1";
		sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
				var sqlQuery = "SELECT `id`, `points`, `tta`, `cat`, `question`, `answer` FROM `questions` WHERE 1 ORDER BY RAND() LIMIT 1";
				sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
					if(rows.length == 0){
            this.currentSocket.say('There was a problem finding a question.');
            console.log('SQL Error: ' + err);
        		logEngine.add('SQL', err);
						return;
					}

					triviaEngine.initializeNewQuestion(rows[0]);
				});
				return;
			}

			triviaEngine.initializeNewQuestion(rows[0]);
		});
	},

	getUserData: function(userNick, userTrip){
    this.userNick = userNick;
    this.userTrip = userTrip;

		var sqlQuery = "SELECT `id`, `bridgeid`, `points`, `prof` FROM `points` WHERE `nick` = " + mysql.escape(userNick) + " AND `trip` = " + mysql.escape(userTrip) + " LIMIT 1";
		sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
			if(rows.length == 0){
				var sqlQuery = "INSERT INTO `points` (`id`, `bridgeid`, `trip`, `nick`, `points`, `prof`) VALUES (NULL, '0', " + mysql.escape(userTrip) + ", " + mysql.escape(userNick) + ", '0', '[]')";
				sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
					sqlEngine.sqlCon.query("SELECT LAST_INSERT_ID() AS `userID`", function(err, rows){
						triviaEngine.userID = rows[0].userID;
						triviaEngine.userPoints = 0;
						triviaEngine.userProf = [];
					});
				});
				return;
			}

			triviaEngine.userID = rows[0].id;
			if(rows[0].bridgeid != 0) triviaEngine.userID = rows[0].bridgeid;
			triviaEngine.userPoints = rows[0].points;
			triviaEngine.userProf = JSON.parse(rows[0].prof);
		});
	},

	initializeNewQuestion: function(data){
		this.questionID = data.id;
		this.questionPoints = data.points;
		this.questionCat = data.cat;
		this.questionAnswer = JSON.parse(data.answer);

		this.currentSocket.say("@" + this.userNick + "; the category is: " +
                           data.cat + " & for " +
                           colorize(String(data.points), 'green') +
                           " points, " + colorize(data.tta, 'red') +
                           " seconds to answer!\n" + data.question);

		this.questionTimeout = setTimeout(function(){
      triviaEngine.questionTimedOut();
    }, data.tta * 1000);
	},

	gaveAnswer: function(data){
		clearTimeout(this.questionTimeout);

		if(data == "pass"){
			this.questionPoints = Math.floor(this.questionPoints * 0.3);

			this.currentSocket.say("@" + this.userNick + ", no one likes a quitter. . . Lost " + colorize(String(this.questionPoints), 'yellow') + " points. Total: " + String(triviaEngine.userPoints - triviaEngine.questionPoints));

			this.failure();
			return;
		}

		var correct = false;

		for(var i = 0, j = this.questionAnswer.length; i < j; i++) if(data == this.questionAnswer[i]) correct = true;

		if(correct){
			this.currentSocket.say("@" + this.userNick + ", " + colorize("correct", 'green') + "! Awarded " + colorize(String(this.questionPoints), 'green') + " points. Total: " + String(triviaEngine.userPoints + triviaEngine.questionPoints));

			this.success();
		}else{
			this.currentSocket.say("@" + this.userNick + ", " + colorize("wrong", 'red') + "! Lost " + colorize(String(this.questionPoints), 'red') + " points. Total: " + String(triviaEngine.userPoints - triviaEngine.questionPoints));

			this.failure();
		}
	},

	questionTimedOut: function(){
		this.currentSocket.say("@" + this.userNick + ", times up, lost " +
                           colorize(String(this.questionPoints), 'red') +
                           " points. Total: " +
                           String(triviaEngine.userPoints - triviaEngine.questionPoints));

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
		sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
			sqlEngine.sqlCon.query("UPDATE `questions` SET `pass` = `pass` + 1 WHERE `id` = " + String(this.questionID), function(err, rows){ });
		});

		this.clearData();
	},

	failure: function(){
		var sqlQuery = "UPDATE `points` SET `points` = `points` - " + this.questionPoints + " WHERE `id` = " + String(this.userID);
		sqlEngine.sqlCon.query(sqlQuery, function(err, rows){
			sqlEngine.sqlCon.query("UPDATE `questions` SET `fail` = `fail` + 1 WHERE `id` = " + String(this.questionID), function(err, rows){ });
		});

		this.clearData();
	},

  clearData: function(){
    this.isEngaged = false;
    this.currentSocket = null;
    this.userNick = null;
    this.userTrip = null;
    this.userID = 0;
  	this.userPoints = 0;
  	this.userProf = "";
  	this.questionTimeout = 0;
  	this.questionID = 0;
  	this.questionPoints = 0;
  	this.questionCat = "";
  	this.questionAnswer = "";
  }
}
