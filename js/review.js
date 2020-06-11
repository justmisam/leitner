function newReview() {
    const db = new DB(function() {
        $(document).ready(function() {
            try {
                var card = db.getReview();
                
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
                    db.increaseBox(card.id);
                    db.save();
                    newReview();
                });
            
                $("#dont").click(function () {
                    db.reset(card.id);
                    db.save();
                    newReview();
                });
            } catch(err) {
                alert(err);
                window.location.href = "./index.html";
            }
        });
    });
}

newReview();
