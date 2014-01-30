var express = require('express');
var logfmt = require('logfmt');
var http = require('http');
var socket_io = require('socket.io');
var fs = require('fs');
var schedule = require('node-schedule');

/* global variables */
var port = 1337;
var app = express();
var server = http.createServer(app).listen(port, function(){
    console.log('Express server listening on port %d in %s mode',
            server.address().port, app.settings.env);
});
var io = socket_io.listen(server);

/*  
 *  Set the following variables to
 *  suit your needs.
 *
 */

/* how frequently an image of the data is written to file (0 means never) */
var snapshot_freq = 20; // 180; // <-- 3 minutes in seconds

/* how old the data needs to be before it is flushed (0 means never) */
var destroy_freq = 0; // 259200; // <-- 3 days in seconds

/* a secret password that you can use to delete things remotely */
var destroy_password = 'yeezusisweezus'; // CHANGE THIS


/* data variables */
var saved_data = {};

/* check for a snapshot to load up saved data */
fs.readFile('snapshot.json', 'utf8', function (err, data) {
    if (err) {
        console.log('No snapshot available, ' + err);
        return;
    }
    saved_data = JSON.parse(data);
});

/* express and get requests */
app.get('/', function(req, res) {
  res.write('get request processed on port '+port);
});

app.get('/peasy.js', function(req, res) {
  res.sendfile('peasy.js');
});


app.get('/sha3.js', function(req, res) {
  res.sendfile('sha3.js');
});

/* socket functions */

/* validates the id of an object */
var valid = function(id) {
    return (id.length >= 43);
}

/* recursively merge properties of two objects */
var merge = function(obj1, obj2) {
  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if ( obj2[p].constructor==Object ) {
        obj1[p] = merge(obj1[p], obj2[p]);
      } else {
        obj1[p] = obj2[p];
      }
    } catch(e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];
    }
  }
  obj1[destroy_password] = new Date().getTime(); // give the variable life
  return obj1;
}

/* scans saved items for old ones */
var scan_and_destroy = function() {
    var curr_date = new Date().getTime();
    for (var i in saved_data) {
        p = saved_data[i];
        if (p[destroy_password] &&
            (curr_date - p[destroy_password]) > destroy_freq) {
            console.log('destroying ', p.name, p.id);
            delete saved_data[i];
        }
    }
}

/* writes a snapshot of the data to file */
var take_snapshot = function() {
    fs.writeFile('snapshot.json',
        JSON.stringify(saved_data) , function(){
                console.log('written to file');
            });
}

/* scheduling */
var rule = new schedule.RecurrenceRule();
rule.minute = 0; // do every hour

/* if there is a destroy frequency, set up the scheduler */
if (destroy_freq > 0) {
    schedule.scheduleJob(rule, function(){
        scan_and_destroy();
    });
}

if (snapshot_freq > 0) {
    schedule.scheduleJob(rule, function(){
        take_snapshot();
    });
}

/* socket.io */
io.sockets.on('connection', function (socket) {
	socket.on('save', function (data) {
        console.log('saving: ',data);
        if (valid(data.id)) {
            if (typeof(saved_data[data.id])!='undefined' &&
                saved_data[data.id].name === data.name &&
                saved_data[data.id].password === data.password) {
                /* exists so merge it */
                saved_data[data.id] = merge(saved_data[data.id],data);
            } else if (typeof(saved_data[data.id])=='undefined') {
                /* doesn't exist so make a new one */
                data[destroy_password] = new Date().getTime();
                saved_data[data.id] = data;
            } else {
                /* didn't pass the tests! abort abort */
                return false; 
            }
            /* we updated so let peers who care know about it */
            socket.broadcast.to(data.id).emit('load', data);
        }
    });

    socket.on('load', function (data) {
        console.log('loading: ',data);
        if (valid(data.id)) {
            if (typeof(saved_data[data.id])!='undefined' &&
                typeof(saved_data[data.id].password)!='undefined' &&
                saved_data[data.id].password != data.password) {
                /* wrong password or doesn't exist */
                socket.emit('load',{error:'Database Error'});
            } else {
                /* right password or no password */
                if (data.persistent == true)
                    socket.join(data.id); // send on update

                /* remove the deletion password from being sent to the user */
                var return_data = saved_data[data.id];
                delete return_data[destroy_password];

                socket.emit('load', return_data);
            }
        }
 
    });
}); 
