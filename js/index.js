$(document).ready(function() {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    autoGrow($("#front")[0]);
    autoGrow($("#back")[0]);

    const db = new DB(function() {
        if (location.hash.substr(1, "access_token=".length) == "access_token=") {
            var accessToken = location.hash.substr("access_token=".length + 1).split('&')[0];
            window.localStorage.setItem("dropbox.token", accessToken);
            $("#sync").trigger("click");
        }

        $("#add").click(function () {
            var front = $("#front").val();
            if (front == "") {
                alert("Front is empty!");
                return;
            }
            var back = $("#back").val();
            if (back == "") {
                alert("Back is empty!");
                return;
            }
            db.add(front, back, function(id) {
                $("#front").val("");
                autoGrow($("#front")[0]);
                $("#back").val("");
                autoGrow($("#back")[0]);
            });
        });

        $("#export").click(function() {
            var cards = new Array();
            db.getLastTimestamp(function(lastTimestamp) {
                db.forEach(0, function(card) {
                    cards.push(card);
                }, function() {
                    var blob = new Blob([JSON.stringify(cards)]);
                    saveAs(blob, "leitner-" + lastTimestamp + ".bk.json");
                });
            });
        });

        $("#import").click(function() {
            $("#file").trigger("click");
        });

        $("#file").change(function() {
            var reader = new FileReader();
            reader.onload = function() {
                const cards = JSON.parse(this.result);
                db.import(cards, function(number) {
                    alert("Imported " + cards.length +  " card(s).");
                });
            }
            reader.readAsText(this.files[0]);
        });

        $("#sync").click(function() {
            db.getLastTimestamp(function(lastTimestamp) {
                var accessToken = window.localStorage.getItem("dropbox.token");
                if (accessToken) {
                    var dbx = new Dropbox.Dropbox({accessToken: accessToken});
                    dbx.filesDownload({path: "/db.timestamp"}).
                        then(function(response) {
                            const reader = new FileReader();
                            reader.addEventListener("loadend", (e) => {
                                const timestamp = parseInt(e.srcElement.result);
                                if (timestamp < lastTimestamp) {
                                    var cards = new Array();
                                    db.forEach(0, function(card) {
                                        cards.push(card);
                                    }, function() {
                                        var blob = new Blob([JSON.stringify(cards)]);
                                        dbx.filesUpload({mode: "overwrite", path: "/leitner-" + lastTimestamp + ".bk.json", contents: blob}).
                                        then(function(response) {
                                            dbx.filesUpload({mode: "overwrite", path: "/db.timestamp", contents: new Blob([lastTimestamp])}).
                                                then(function(response) {
                                                    alert("Synced.");
                                                }).catch(function(error) {
                                                    alert(error);
                                                });
                                        }).catch(function(error) {
                                            alert(error);
                                        });
                                    });
                                } else if (timestamp > lastTimestamp) {
                                    dbx.filesDownload({path: "/leitner-" + timestamp + ".bk.json"}).
                                        then(function(response) {
                                            const reader2 = new FileReader();
                                            reader2.onload = function() {
                                                const cards = JSON.parse(this.result);
                                                db.import(cards, function(number) {
                                                    alert("Synced.");
                                                });
                                            }
                                            reader2.readAsText(response.fileBlob);                                
                                        }).catch(function(error) {
                                            alert(error);
                                        });
                                } else {
                                    alert("Already synced.");
                                }
                            });
                            reader.readAsText(response.fileBlob);
                        }).catch(function(error) {
                            if (error.status == 409) {
                                var cards = new Array();
                                db.forEach(0, function(card) {
                                    cards.push(card);
                                }, function() {
                                    var blob = new Blob([JSON.stringify(cards)]);
                                    dbx.filesUpload({mode: "overwrite", path: "/leitner-" + lastTimestamp + ".bk.json", contents: blob}).
                                    then(function(response) {
                                        dbx.filesUpload({path: "/db.timestamp", contents: new Blob([lastTimestamp])}).
                                            then(function(response) {
                                                alert("Synced.");
                                            }).catch(function(error) {
                                                alert(error);
                                            });
                                    }).catch(function(error) {
                                        alert(error);
                                    });
                                });
                            } else {
                                alert(error);
                            }
                        });
                } else {
                    window.location.href = "https://www.dropbox.com/oauth2/authorize?client_id=70b1bzrin3wd9ub&response_type=token&redirect_uri=https://leitner.misam.ir/";
                }
            });
        });
    });
});
