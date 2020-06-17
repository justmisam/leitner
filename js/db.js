defaultOnsuccess = function(result) {
    console.log(result);
};

defaultOnerror = function(error) {
    alert(error);
    throw error;
};

class DB {
    constructor(onsuccess=defaultOnsuccess, onerror=defaultOnerror) {
        const thisClass = this;
        if (window.indexedDB == null) {
            throw "This browser does not support IndexedDB!"
        }
        let request = window.indexedDB.open("leitner", 1);
        request.onerror = function(event) {
            onerror(event.target.error);
        };
        request.onupgradeneeded = function(event) {
            thisClass.db = event.target.result;
            switch(thisClass.db.version) {
                case 1:
                let objectStore = thisClass.db.createObjectStore("cards", {keyPath: "id", autoIncrement: true});
                objectStore.createIndex("box", "box", {unique: false});
                objectStore.createIndex("timestamp", "timestamp", {unique: false});
                objectStore.createIndex("box_timestamp", ["box", "timestamp"], {unique: false});
                break;
            }
            thisClass.db.onversionchange = function(event) {
                thisClass.db.close();
                alert("A new version of this page is ready. Please reload or close this tab!");
            };
        };
        request.onsuccess = function(event) {
            thisClass.db = event.target.result;
            thisClass.db.onversionchange = function(event) {
                thisClass.db.close();
                alert("A new version of this page is ready. Please reload or close this tab!");
            };
            onsuccess("Opened.");
        };
    }

    add(front, back, onsuccess=defaultOnsuccess, onerror=defaultOnerror) {
        let transaction = this.db.transaction("cards", "readwrite");
        let request = transaction.objectStore("cards").add({
            timestamp: -getNow(),
            box: 1,
            front: front,
            back: back
        });
        request.onerror = function(event) {
            onerror(event.target.error);
        };
        request.onsuccess = function(event) {
            let id = event.target.result;
            onsuccess(id);
        };
        transaction.onabort = function(event) {
            onerror(event.target.error);
        };
    }

    getLastTimestamp(onsuccess=defaultOnsuccess) {
        let objectStore = this.db.transaction("cards", "readonly").objectStore("cards");
        objectStore.index("timestamp").openCursor().onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                onsuccess(-cursor.value.timestamp);
            } else {
                onsuccess(0);
            }
        }
    }

    forEach(timestamp=0, oneach=defaultOnsuccess, oncomplete=function(){}) {
        let objectStore = this.db.transaction("cards", "readonly").objectStore("cards");
        objectStore.index("timestamp").openCursor(IDBKeyRange.upperBound(-timestamp, true), "prev").onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                let card = cursor.value;
                card.timestamp *= -1;
                oneach(card);
                cursor.continue();
            } else {
                oncomplete();
            }
        }
    }

    search(text, oneach=defaultOnsuccess, oncomplete=function(){}) {
        let objectStore = this.db.transaction("cards", "readonly").objectStore("cards");
        objectStore.index("box_timestamp").openCursor().onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                let card = cursor.value;
                card.timestamp *= -1;
                if (text.length > 0) {
                    if ((card.front + " " + card.back).search(text) >= 0) {
                        oneach(card);
                    }
                } else {
                    oneach(card);
                }
                cursor.continue();
            } else {
                oncomplete();
            }
        }
    }

    findReview(onfind=defaultOnsuccess, oncomplete=null) {
        var i = 0;
        var isFound = false;
        const now = getNow();
        let objectStore = this.db.transaction("cards", "readonly").objectStore("cards");
        objectStore.openCursor().onsuccess = function (event) {
            let cursor = event.target.result;
            if (cursor) {
                let card = cursor.value;
                card.timestamp *= -1;
                let currentDiff = now - card.timestamp;
                let mustDiff = 2 ** (card.box - 1) * 86400 - gconfg.softDiff;
                if (card.box < (gconfg.maxBox + 1) && currentDiff >= mustDiff) {
                    i++;
                    if (!isFound) {
                        isFound = true;
                        onfind(card);
                    }
                    if (oncomplete) cursor.continue();
                } else {
                    cursor.continue();
                }
            } else {
                oncomplete(i);
            }
        }
    }

    get(id, onsuccess=defaultOnsuccess, onerror=defaultOnerror) {
        let objectStore = this.db.transaction("cards", "readonly").objectStore("cards");
        let request = objectStore.get(id);
        request.onerror = function(event) {
            onerror(event.target.error);
        };
        request.onsuccess = function(event) {
            let card = event.target.result;
            if (card) {
                card.timestamp *= -1;
            }
            onsuccess(card);
        };
    }

    edit(id, front, back, onsuccess=defaultOnsuccess, onerror=defaultOnerror) {
        let transaction = this.db.transaction("cards", "readwrite");
        let objectStore = transaction.objectStore("cards");
        let request = objectStore.get(id);
        request.onerror = function(event) {
            onerror(event.target.error);
        };
        request.onsuccess = function(event) {
            let card = event.target.result;
            if (card) {
                card.front = front;
                card.back = back;
                card.timestamp = -getNow();
                let putRequest = objectStore.put(card);
                putRequest.onerror = function(event) {
                    onerror(event.target.error);
                };
                transaction.oncomplete = function(event) {
                    onsuccess("Edited.");
                };
            } else {
                onerror("Card not found!");
            }
        };
        transaction.onabort = function(event) {
            onerror(event.target.error);
        };
    }

    increaseBox(id, onsuccess=defaultOnsuccess, onerror=defaultOnerror) {
        let transaction = this.db.transaction("cards", "readwrite");
        let objectStore = transaction.objectStore("cards");
        let request = objectStore.get(id);
        request.onerror = function(event) {
            onerror(event.target.error);
        };
        request.onsuccess = function(event) {
            let card = event.target.result;
            if (card) {
                if (card.box < 6) {
                    card.box += 1;
                    card.timestamp = -getNow();
                    let putRequest = objectStore.put(card);
                    putRequest.onerror = function(event) {
                        onerror(event.target.error);
                    };
                    transaction.oncomplete = function(event) {
                        onsuccess("Increased.");
                    };
                }
            } else {
                onerror("Card not found!");
            }
        };
        transaction.onabort = function(event) {
            onerror(event.target.error);
        };
    }

    reset(id, onsuccess=defaultOnsuccess, onerror=defaultOnerror) {
        let transaction = this.db.transaction("cards", "readwrite");
        let objectStore = transaction.objectStore("cards");
        let request = objectStore.get(id);
        request.onerror = function(event) {
            onerror(event.target.error);
        };
        request.onsuccess = function(event) {
            let card = event.target.result;
            if (card) {
                card.box = 1;
                card.timestamp = -getNow();
                let putRequest = objectStore.put(card);
                putRequest.onerror = function(event) {
                    onerror(event.target.error);
                };
                transaction.oncomplete = function(event) {
                    onsuccess("Reset.");
                };
            } else {
                onerror("Card not found!");
            }
        };
        transaction.onabort = function(event) {
            onerror(event.target.error);
        };
    }

    remove(id, onsuccess=defaultOnsuccess, onerror=defaultOnerror) {
        let transaction = this.db.transaction("cards", "readwrite");
        let request = transaction.objectStore("cards").delete(id);
        request.onerror = function(event) {
            onerror(event.target.error);
        };
        transaction.onabort = function(event) {
            onerror(event.target.error);
        };
        transaction.oncomplete = function(event) {
            onsuccess("Removed.");
        };
    }

    update(cards, onsuccess=defaultOnsuccess, onerror=defaultOnerror) {
        let transaction = this.db.transaction("cards", "readwrite");
        let objectStore = transaction.objectStore("cards");
        var i = 0;
        for (let card of cards) {
            card.timestamp *= -1;
            let request = objectStore.get(card.id);
            request.onerror = function(event) {
                onerror(event.target.error);
            };
            request.onsuccess = function(event) {
                let oldCard = event.target.result;
                if (oldCard) {
                    if (oldCard.timestamp < card.timestamp) {
                        let putRequest = objectStore.put(card);
                        putRequest.onerror = function(event) {
                            onerror(event.target.error);
                        };
                        putRequest.onsuccess = function(event) {
                            i++;
                            if (i == cards.length) {
                                onsuccess();
                            }
                        }
                    }
                }
            };
        }
        transaction.onabort = function(event) {
            onerror(event.target.error);
        };
    }

    import(cards, onsuccess=defaultOnsuccess, onerror=defaultOnerror) {
        let transaction = this.db.transaction("cards", "readwrite");
        let objectStore = transaction.objectStore("cards");
        let request = objectStore.clear();
        request.onerror = function(event) {
            onerror(event.target.error);
        };
        request.onsuccess = function(event) {
            var i = 0;
            for (let card of cards) {
                card.timestamp *= -1;
                let request = objectStore.put(card);
                request.onerror = function(event) {
                    onerror(event.target.error);
                };
                request.onsuccess = function(event) {
                    i++;
                    if (i == cards.length) {
                        onsuccess();
                    }
                }
            }
        };
        transaction.onabort = function(event) {
            onerror(event.target.error);
        };
    }
}
