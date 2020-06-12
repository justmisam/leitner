async function putDB(db) {
    const cacheName = "leitner-v1";
    const cache = await caches.open(cacheName);
    await cache.put("leitner.db", new Response(new Blob([db.export()]), {headers:{"Content-Type": "application/vnd.sqlite3"}}));
}

async function fetchDB(callbackFun) {
    const cacheName = "leitner-v1";
    const cache = await caches.open(cacheName);
    const response = await cache.match("leitner.db");
    if (response) {
        const arrBuffer = await response.arrayBuffer();
        callbackFun(new SQL.Database(new Uint8Array(arrBuffer)));
    } else {
        callbackFun(null);
    }
}

class DB {
    constructor(callbackFun) {
        this.ready = false;
        var config = {
            locateFile: filename => `https://sql-js.github.io/sql.js/dist/${filename}`
        }
        var thisDB = this;
        initSqlJs(config).then(function(SQL) {
            (async() => await fetchDB(function(db) {
                if (db) {
                    thisDB.db = db;
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
            }))();
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
        (async() => await putDB(this.db))();
        window.localStorage.setItem("db.timestamp", timestamp);
    }

    getAll(text, callbackFun, doneFun) {
        if (!this.ready) throw "DB is not ready yet!";
        var query = "SELECT * FROM cards ORDER BY box ASC, id DESC;";
        if (text.length > 0) {
            query = "SELECT * FROM cards WHERE front like '%" + text + "%' OR back like '%" + text + "%' ORDER BY box ASC, id DESC;";
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
