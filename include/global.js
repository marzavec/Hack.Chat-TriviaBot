/*
	Developer: Marzavec
	Use it as you'd like, but I'd appreciate a mention n_n
*/

/* global variables */
chatRoomArray = []; // stores each socket

/* global functions */
function buildNewChat(){
	function chat(){};
	chat.prototype = chatEngine;
	return new chat;
}

enterChannel = function(tChan, tNick){
	var slot = chatRoomArray.push(buildNewChat()) - 1;
	chatRoomArray[slot].init(tChan, tNick);
}

leaveChannel = function(tChan, tNick){
	for(var i = 0, j = chatRoomArray.length; i < j; i++){
		if(typeof tNick === 'undefined'){
			if(typeof chatRoomArray[i] !== 'undefined' &&
				 chatRoomArray[i].myNick != botConfig.defaultNick &&
				 chatRoomArray[i].myChannel == tChan){
				chatRoomArray[i].shutdown();
				chatRoomArray.splice(i, 1);
				i--;
			}
		}else{
			if(chatRoomArray[i].myNick == tNick && chatRoomArray[i].myChannel == tChan){
				chatRoomArray[i].shutdown();
				chatRoomArray.splice(i, 1);
				return;
			}
		}
	}
}

myChannels = function(){
	var toReturn = {};
	for(var i = 0, j = chatRoomArray.length; i < j; i++){
		if(typeof toReturn[chatRoomArray[i].myChannel] === 'undefined'){
			toReturn[chatRoomArray[i].myChannel] = 1;
		}else{
			toReturn[chatRoomArray[i].myChannel]++;
		}
	}
	return toReturn;
}

isInChannel = function(targetChannel){
	var currentChans = myChannels();
	for(chan in currentChans){
		if(chan == targetChannel) return true;
	}
	return false;
}

channelRelay = function(targetChannel, data){
	for(var i = 0, j = chatRoomArray.length; i < j; i++){
		if(chatRoomArray[i].myChannel == targetChannel){
			chatRoomArray[i].say(data);
		}
	}
}

isAuthorized = function(trip, nick, level){
	for(var i = 0, j = authNicks.length; i < j; i++){
		if(authNicks[i].trip == trip && authNicks[i].nick == nick){
			if(authNicks[i].level == level) return true;
			return false;
		}
	}

	return false;
}

isNickBlacklisted = function(nick){
	for(var i = 0, j = nickBlacklist.length; i < j; i++)
		if(nickBlacklist[i] == nick)
			return true;

	return false;
}

secureAlphaNumeric = function(str){
	return str.replace(/[^a-z0-9\+\/ _=]/gi,'');
}

secureNumeric = function(str){
	return str.replace(/[^0-9\.]/gi,'');
}

colorize = function(str, color){
	return '$\\color{' + color + '}{' + str + '}$';
}
