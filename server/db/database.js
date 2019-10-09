'use strict'

var sqlite3 = require('sqlite3').verbose()
var path = require("path")
var dirDB = path.resolve(__dirname, "kadenafaucet.db")

// open kadenafaucet db
let db = new sqlite3.Database(dirDB, sqlite3.OPEN_READWRITE, (err) => {
 if (err) {
   return console.error(err.message);
 }
 console.log('Connected to the kadenafaucet SQlite database.');
});

let create = "create table fingerprints (fingerprint TEXT NOT NULL PRIMARY KEY, date TEXT NOT NULL)";

const insertFP = (fp, date) => {
 db.run(`REPLACE INTO fingerprints (fingerprint, date) VALUES (${JSON.stringify(fp)}, ${JSON.stringify(date)})`)
}

const queryFP = function(fp, callback){
  const sql = `SELECT fingerprint fingerprint,
                   date date
            FROM fingerprints
            WHERE fingerprint  = ?`;
  db.get(sql, [fp], (err, row) => {
   if (err) {
     return console.error(err.message);
   }
   callback(row)
  })
}

module.exports = {
 queryFP: queryFP,
 insertFP: insertFP
}
