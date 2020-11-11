window.addEventListener("load", e => {
    registerSW(); 
});

async function registerSW() {
    if ("serviceWorker" in navigator) { 
        try {
            await navigator.serviceWorker.register("./sw.js?v=20200616-4"); 
        } catch (e) {
            alert("ServiceWorker registration failed!");
        }
    }
}
