function exportDB() {
    if (db.isReady) {
        var blob = new Blob([db.db.export()]);
        saveAs(blob, "leitner-" + db.getTimestamp() + ".bk.db");
    }
}

function importDB() {
    $("#file").trigger("click");
}

$(document).ready(function() {
    if (location.hash.substr(1, "access_token=".length) == "access_token=") {
        var accessToken = location.hash.substr("access_token=".length + 1).split('&')[0];
        window.localStorage.setItem("dropbox.token", accessToken);
        syncDB();
    }
});

function syncDB() {
    var accessToken = window.localStorage.getItem("dropbox.token");
    if (accessToken) {
        var dbx = new Dropbox.Dropbox({accessToken: accessToken});
        dbx.filesDownload({path: "/db.timestamp"}).
            then(function(response) {
                const reader = new FileReader();
                reader.addEventListener("loadend", (e) => {
                    const timestamp = parseInt(e.srcElement.result);
                    if (timestamp < db.getTimestamp()) {
                        var blob = new Blob([db.db.export()]);
                        dbx.filesUpload({mode: "overwrite", path: "/leitner-" + db.getTimestamp() + ".bk.db", contents: blob}).
                            then(function(response) {
                                dbx.filesUpload({mode: "overwrite", path: "/db.timestamp", contents: new Blob([db.getTimestamp()])}).
                                    then(function(response) {
                                        alert("Synced.");
                                    }).catch(function(error) {
                                        alert(error);
                                    });
                            }).catch(function(error) {
                                alert(error);
                            });
                    } else if (timestamp > db.getTimestamp()) {
                        dbx.filesDownload({path: "/leitner-" + timestamp + ".bk.db"}).
                            then(function(response) {
                                const reader2 = new FileReader();
                                reader2.onload = function() {
                                    var arrayBuffer = this.result;
                                    db.db = new SQL.Database(new Uint8Array(arrayBuffer));
                                    db.save(timestamp);
                                    alert("Synced.");
                                }
                                reader2.readAsArrayBuffer(response.fileBlob);                                
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
                    var blob = new Blob([db.db.export()]);
                    dbx.filesUpload({mode: "overwrite", path: "/leitner-" + db.getTimestamp() + ".bk.db", contents: blob}).
                        then(function(response) {
                            dbx.filesUpload({path: "/db.timestamp", contents: new Blob([db.getTimestamp()])}).
                                then(function(response) {
                                    alert("Synced.");
                                }).catch(function(error) {
                                    alert(error);
                                });
                        }).catch(function(error) {
                            alert(error);
                        });
                } else {
                    alert(error);
                }
            });
    } else {
        window.location.href = "https://www.dropbox.com/oauth2/authorize?client_id=70b1bzrin3wd9ub&response_type=token&redirect_uri=https://leitner.misam.ir/";
    }
}

$(document).ready(function() {
    $("#file").change(function() {
        var timestamp = this.files[0].name.split('.')[0].split('-')[1];
        var reader = new FileReader();
        reader.onload = function() {
            var arrayBuffer = this.result;
            db.db = new SQL.Database(new Uint8Array(arrayBuffer));
            db.save(timestamp);
            alert("Imported.");
        }
        reader.readAsArrayBuffer(this.files[0]);
    });
});
