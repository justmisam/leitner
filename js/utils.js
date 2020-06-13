var gconfg = {
    maxBox: 5,
    softDiff: 60*60*3
}

function getNow() {
    return parseInt(Date.now()/1000)
}

function autoGrow(element) {
    element.style.height = "5px";
    element.style.height = (element.scrollHeight) + "px";
}
