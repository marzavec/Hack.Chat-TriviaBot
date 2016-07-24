/*
	Developer: Marzavec
	Use it as you'd like, but I'd appreciate a mention n_n
*/

sqlEngine = {
  sqlCon: null,
  sqlConnected: false,

  init: function(){
    this.sqlCon = mysql.createConnection({
      host     : sqlConfig.sqlHost,
      user     : sqlConfig.sqlUser,
      password : sqlConfig.sqlPass,
      database : sqlConfig.sqlDb
    });

    this.sqlCon.connect(function(err){
    	if(err != undefined && err != ''){
    		console.log('SQL Connection Error: ' + err);
    		logEngine.add('SQL', err);
        process.exit(1);
    	}else{
    		this.sqlConnected = true;
    	}
    });
  },

  temp: function(){

  }
}
