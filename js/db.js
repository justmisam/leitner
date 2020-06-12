class DB {
    constructor(callbackFun) {
        this.ready = false;
        var config = {
            locateFile: filename => `https://sql-js.github.io/sql.js/dist/${filename}`
        }
        var thisDB = this;
        initSqlJs(config).then(function(SQL) {
            var dbstr = window.localStorage.getItem(gconfg.dbName);
            if (dbstr) {
                thisDB.db = new SQL.Database(toBinArray(dbstr));
                thisDB.db.create_function("POW", function(x, y) {return x ** y;});
                thisDB.ready = true;
                callbackFun();
            } else {
                thisDB.db = new SQL.Database();
                thisDB.db.run("CREATE TABLE cards (\
                    id INTEGER PRIMARY KEY, \
                    timestamp INTEGER, \
                    box INTEGER, \
                    front TEXT, \
                    back TEXT \
                )");
                thisDB.db.create_function("POW", function(x, y) {return x ** y;});
                thisDB.ready = true;
                callbackFun();
            }
        });
    }
    
    get isReady() {
        return this.ready;
    }

    getTimestamp() {
        var timestamp = window.localStorage.getItem("db.timestamp");
        if (timestamp) {
            return parseInt(timestamp);
        } else {
            return 0;
        }
    }

    save(timestamp=getNow()) {
        var dbstr = toBinString(this.db.export());
        window.localStorage.setItem(gconfg.dbName, dbstr);
        window.localStorage.setItem("db.timestamp", timestamp);
    }

    getAll(text, callbackFun, doneFun) {
        if (!this.ready) throw "DB is not ready yet!";
        var query = "SELECT * FROM cards ORDER BY id DESC";
        if (text.length > 0) {
            query = "SELECT * FROM cards WHERE front like '%" + text + "%' OR back like '%" + text + "%' ORDER BY id DESC";
        }
        this.db.each(query,
            function callback(card) {
                callbackFun(card);
            }, function done() {
                doneFun();
            }
        );
    }

    getReview() {
        if (!this.ready) throw "DB is not ready yet!";
        var cards = this.db.exec(
            "SELECT * FROM cards WHERE box < " + (gconfg.maxBox + 1) + " AND (" + getNow() + " - timestamp) >= (POW(2, (box - 1)) * 86400 - " + gconfg.softDiff + ") ORDER BY RANDOM() LIMIT 1;"
        );
        if (cards.length < 1) {
            throw "Nothing to review!"
        }
        return {
            id: cards[0].values[0][0],
            timestamp: cards[0].values[0][1],
            box: cards[0].values[0][2],
            front: cards[0].values[0][3],
            back: cards[0].values[0][4]
        };
    }

    getReviewsCount() {
        if (!this.ready) throw "DB is not ready yet!";
        return this.db.exec(
            "SELECT count(*) FROM cards WHERE box < " + (gconfg.maxBox + 1) + " AND (" + getNow() + " - timestamp) >= (POW(2, (box - 1)) * 86400 - " + gconfg.softDiff + ");"
        )[0].values[0][0]
    }

    get(id) {
        if (!this.ready) throw "DB is not ready yet!";
        var cards = this.db.exec("SELECT * FROM cards WHERE id = " + id);
        if (cards.length < 1) {
            throw "Card not found!"
        }
        return {
            id: cards[0].values[0][0],
            timestamp: cards[0].values[0][1],
            box: cards[0].values[0][2],
            front: cards[0].values[0][3],
            back: cards[0].values[0][4]
        };
    }

    add(front, back) {
        if (!this.ready) throw "DB is not ready yet!";
        this.db.run(
            "INSERT INTO cards(timestamp, box, front, back) VALUES (?, ?, ?, ?)",
            [getNow(), 1, front, back]
        );
    }

    edit(id, front, back) {
        if (!this.ready) throw "DB is not ready yet!";
        this.db.run(
            "UPDATE cards SET front = ?, back = ? WHERE id = ?",
            [front, back, id]
        );
    }

    reset(id) {
        if (!this.ready) throw "DB is not ready yet!";
        this.db.run(
            "UPDATE cards SET timestamp = ?, box = 1 WHERE id = ?",
            [getNow(), id]
        );
    }

    remove(id) {
        if (!this.ready) throw "DB is not ready yet!";
        this.db.exec("DELETE FROM cards WHERE id = " + id);
    }

    increaseBox(id) {
        if (!this.ready) throw "DB is not ready yet!";
        this.db.run(
            "UPDATE cards SET box = box + 1 WHERE id = ? AND BOX < ?",
            [id, gconfg.maxBox + 1]
        );
    }
}
