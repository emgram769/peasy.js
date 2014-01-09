/* peasy.js */
/* load some stuff */

var socket;
var key=(Math.random()*1e17).toString(36);

var load_js_lib = function(src, callback) {
    var f = document.createElement('script');
    var loaded;
    f.setAttribute("type","text/javascript");
    f.setAttribute("src", src);
    if (callback) {
        f.onreadystatechange = f.onload = function() {
            if (!loaded) {
                callback(f);
            }
            loaded = true;
        }
    }
    document.getElementsByTagName("head")[0].appendChild(f);
}

var init_peasy = function () {
    load_js_lib("http://192.249.58.243:1337/socket.io/socket.io.js",
    function(){
        socket = io.connect('http://192.249.58.243:1337');
        load_js_lib("http://192.249.58.243:1337/sha3.js", function(){
            if (typeof(start)=="function") {
                socket.on('connect', function() {
                    start();
                });
            }
        });      
    }); 
}

var load = function(name, callback, options) {
    var loadkey = key;
    if (typeof(options)!="undefined" && options.key)
        loadkey = options.key
    
    var id = CryptoJS.SHA3(loadkey+name).toString(CryptoJS.enc.Base64);
    
    var persistent = true;
    if (options && options.persistent)
        persistent = options.persistent
    
    if (callback) {
        socket.on('load', function(data){
            if (data && data.name && data.name == name)
                callback(data.variable);
            else
                callback("Error loading");
        });
    }

    socket.emit('load', {id:id, name:name, persistent:persistent});
}

var loadOnce = load_once = function(name, callback) {
    load(name, callback, {persistent:false});
}

var save = function(name, variable, options) {
    if (typeof(variable)=="undefined") {
        console.log("Saving null variable");
        return;
    }
    var sentkey = key;
    if (options && options.key)
        sentkey = options.key
    
    var id = CryptoJS.SHA3(sentkey+name).toString(CryptoJS.enc.Base64);
    
    if (options && options.password) {
        socket.emit('save', {id:id, name:name, variable:variable,
            password:password});
    } else {
        socket.emit('save', {id:id, name:name, variable:variable});
    }
}

init_peasy();

