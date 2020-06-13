$(document).ready(function() {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    const db = new DB(function() {
        db.findReview(function(card) {
            $("#edit_link").attr("href", $("#edit_link").attr("href").replace("@", card.id));
            $("#front").val(card.front);
            autoGrow($("#front")[0]);
            $("#back").val("");
            autoGrow($("#back")[0]);
            $("#note").val("");
            autoGrow($("#note")[0]);

            $("#back").click(function () {
                $("#back").val(card.back);
                autoGrow($("#back")[0]);
            });

            $("#know").click(function () {
                db.increaseBox(card.id, function() {
                    window.location.replace("./review.html");
                });
            });

            $("#dont").click(function () {
                db.reset(card.id, function() {
                    window.location.replace("./review.html");
                });
            });
        }, function(count) {
            if (count > 0) {
                $("#status").text(count + " card(s) to review!");
            } else {
                alert("Nothing to review!");
                window.location.replace("./index.html");
            }
        });
    });
});
