$(document).ready(function() {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    const id = parseInt(location.hash.substr(1));

    const db = new DB(function() {
        db.get(id, function(card) {
            if (card) {
                $("#front").val(card.front);
                $("#back").val(card.back);
                $("#reset").text($("#reset").text().replace("#", card.box));
                autoGrow($("#front")[0]);
                autoGrow($("#back")[0]);

                $("#edit").click(function () {
                    var front = $("#front").val();
                    var back = $("#back").val();
                    db.edit(id, front, back, function() {
                        $.snackbar({content: "Edited.", style: "toast"});
                    });
                });
            
                $("#reset").click(function () {
                    db.reset(id, function() {
                        $("#reset").text($("#reset").text().replace("#", 1));
                        $.snackbar({content: "Reset.", style: "toast"});
                    });
                });

                $("#remove").click(function () {
                    db.remove(id, function() {
                        window.location.href = "./index.html";
                    });
                });
            } else {
                alert("Card not found!");
                window.close();
            }
        });
    });
});
