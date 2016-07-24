# Hack.Chat-TriviaBot
Trivia bot for https://hack.chat/ with persistent points tracking.

[Update 07/23/2016]
Updated framework for stability & flexibility. Laid ground work for new challenges feature.

# Install
node v5.8.0 or higher required (older versions have not been tested, but likely work).

* `git clone https://github.com/marzavec/Hack.Chat-TriviaBot.git`
* `cd Hack.Chat-TriviaBot`
* `npm install`
* Update ./config/sqlConfig.js with sql credentials.
* Create `rankbot` database.
* Import ./initial_sql.sql file into your database.
* Edit ./config/botConfig.js if needed.
* `sudo node main.js`

or

* `pm2 start main.js`
