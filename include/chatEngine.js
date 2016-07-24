/*
	Developer: Marzavec
	Use it as you'd like, but I'd appreciate a mention n_n
*/

chatEngine = {
	ws: 0,
	pingInterval: 0,
	rejoinInterval: 0,
	myChannel: '',
	myNick: '',
	shuttingDown: false,
	onlineUsers: [],
	ignoredUsers: [],

	init: function(channel, nick){
		if(this.shuttingDown) this.shuttingDown = false;

		channel = typeof channel !== 'undefined' ? channel : botConfig.defaultChan;
		nick = typeof nick !== 'undefined' ? nick : botConfig.defaultNick;

		this.myChannel = channel;
		this.myNick = nick;

		this.join();
	},

	join: function(){
		var my = this; // to maintain scope //

		var wsOpts = { rejectUnauthorized: false };
		this.ws = new WebSocket(botConfig.wsPath, wsOpts);

		this.ws.onopen = function(){
			clearInterval(my.rejoinInterval);

			my.send({cmd: 'join',
							 channel: my.myChannel,
							 nick: my.myNick + '#' + botConfig.botPass
						 });

			my.pingInterval = setInterval(function(){
				my.send({cmd: 'ping'});
			}, 40*1000);
		}

		this.ws.onclose = function(){
			if(my.shuttingDown) return;

			clearInterval(my.pingInterval);

			my.rejoinInterval = setTimeout(function(){
				my.join(my.myChannel);
			}, 2000);
		}

		this.ws.onmessage = function(message){
			my.parseMessage(JSON.parse(message.data));
		}
	},

	parseMessage: function(data){
		switch(data.cmd){
			case 'onlineSet':
				for(var i = 0, j = data.nicks.length; i < j; i++)
					this.onlineUsers.push({ nick: data.nicks[i],
																	trip: '' });
			break;
			case 'onlineAdd':
				this.onlineUsers.push({ nick: data.nick,
																trip: '' })
			break;
			case 'onlineRemove':
				for(var i = 0, j = this.onlineUsers.length; i < j; i++){
					if(this.onlineUsers[i].nick == data.nick){
						this.onlineUsers.splice(i, 1);
						return;
					}
				}
			break;
			case 'chat':
				if(this.ignoredUsers.indexOf(data.nick) >= 0 ||
					 data.nick == this.nick){
					return;
				}

				if(data.text.substr(0,1) == botConfig.ctrlChr){
					var cmdArray = data.text.split(' ');
					cmdArray.socket = this;
					cmdArray.nick = data.nick;
					if(typeof data.trip !== 'undefined') cmdArray.trip = data.trip;
					if(typeof ctrlCore[cmdArray[0].substr(1)] == 'function')
						ctrlCore[cmdArray[0].substr(1)](cmdArray);
				}else if(triviaEngine.isEngaged){
					if(data.nick == triviaEngine.userNick && data.trip == triviaEngine.userTrip){
						triviaEngine.gaveAnswer(data.text);
					}
				}
			break;
			case 'info':
				if(data.text.indexOf(' invited you to ') != -1){
					var newChannel = data.text.substr(data.text.indexOf('?') + 1)
					enterChannel(newChannel, this.myNick + '1');
				}else{
					// error and rate limit checking here. one day. . .
				}
			break;
		}
	},

	send: function(data){
		if(this.ws && this.ws.readyState == this.ws.OPEN){
			this.ws.send(JSON.stringify(data));
		}
	},

	say: function(data){
		this.send({cmd: 'chat', text: data});
	},

	userExists: function(nick){
		for(var i = 0, j = this.onlineUsers.length; i < j; i++)
			if(this.onlineUsers[i].nick == nick)
				return true;

		return false;
	},

	userIgnore: function(nick){
		this.ignoredUsers.push(nick);
	},

	shutdown: function(){
		this.shuttingDown = true;
		clearInterval(this.pingInterval);
		this.ws.close();
		clearInterval(this.rejoinInterval);
	}
}
