
//modules
var http = require('http');
var path = require('path');
var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var helmet = require('helmet');
var session = require('express-session');
var router = express();
router.use(helmet());
router.use(session({
  secret: 'My secretively secret secret!597231',
  cookie: {
    httpOnly: true,
    secure: true
  }
}));
var blackwall = require("blackwall");
var firewall = new blackwall();
var policy = firewall.policy('policy_name', [firewall.rules.rateLimiter], {
    rate: {
        m: 20
    }
})
router.use(firewall.enforce("express", policy));
var key = "randomstuff901263476";
var encryptor = require('simple-encryptor')(key);
var server = http.createServer(router);
var io = socketio.listen(server);
var fs = require('fs');
var readline = require('line-by-line');
var mkdirp = require('mkdirp');
var createFile = require('create-file');
var Ddos = require('ddos');
var ddos = new Ddos;
var socks = [];
var users = [];
var userloc = [];
var wselect = [];
var session;
var uread;
var pread;
var ptemp = [];
var utemp = [];
var udir = [];
var ureq = [];
var filecontents;
var bwords = /(<script|\/script>|<iframe|\/iframe>|<frame|\/frame>|onerror)/gi;
var badstuff = /[^a-zA-Z0-9 ]/g;
///(#|%|&|{|}|\|\/|<|>|\*|\?|$|!|'|"|:|@|\+|`|~|\||\=|)/gi
var dcing = false;

//DATABASE
var locallydb = require('locallydb');
var db = new locallydb('./userdb');
var userinfo = db.collection('userinfo');

/*
userinfo.insert([
  {name: "Jeremy", password: "1234"}
]);
*/

router.use(ddos.express);
router.use(express.static(path.resolve(__dirname, 'client')));

io.on('connection', function(socket) {
  ureq.push(0);
  socks.push(socket.id);
  users.push("notlogged");
  userloc.push("notlogged");
  socket.join("notlogged");
  wselect.push("");
  udir.push([]);
  requestMade(socket.id);
  console.log("ID " + socket.id + " connected.");
  
  //disconnect
  socket.on('disconnect', function() {
    requestMade(this.id);
    session = socks.indexOf(this.id);
    console.log("ID " + socks[session] + " disconnected.");
    socks.splice(session);
    users.splice(session);
    userloc.splice(session);
    wselect.splice(session);
    udir.splice(session);
    ureq.splice(session);
  });
  
  socket.on('login', function(u, p) {
      requestMade(this.id);
      u = u.replace(/\//g, "");
      u = u.replace(/\\"/g, "");
      u = u.replace(bwords, "");
      p = p.replace(bwords, "");
      p = p.replace(/\//g, "");
      p = p.replace(/\\"/g, "");
      u = u.replace('notlogged', "newuser");
      if (u.trim().length != 0 && p.trim().length != 0) {
        session = this.id.toString();
        var exists = false;
        utemp = [];
        ptemp = [];
        uread = new readline('usern.txt');
        uread.on('error', function(err) {
        if (err) {
          return console.log(err);
        }
        });
        uread.on('line', function(line) {
          utemp.push(line);
        });
        uread.on('end', function() {
            for (var i = 0; i < utemp.length; i++) {
              if (utemp[i] == u) {
                exists = true;
              }
            }
            if (exists) {
              pread = new readline('userp.txt');
              pread.on('error', function(err) {
              if (err) {
                return console.log(err);
              }
              });
              pread.on('line', function(line) {
                ptemp.push(line);
              });
              pread.on('end', function() {
                if (ptemp[utemp.indexOf(u)] == p) {
                  socket.emit('newstat', "Logged in as " + u + ".");
                  socket.emit('success');
                  users[socks.indexOf(session)] = u;
                }
                
                else {
                  socket.emit('newstat', "Incorrect password.");
                }
              });
            }
            else if (!exists) {
              fs.appendFile('usern.txt', "\n" + u, function (err) {
                if (err) {
                  return console.log(err);
                }
                else {
                  socket.emit('newstat', "Account: '" + u + "' was created.");
                  socket.emit('success');
                  users[socks.indexOf(session)] = u;
                  //new user directory
                  mkdirp('./userdata/' + u + '/documents', function (err) {
                    if (err) {
                      console.error(err);
                    }
                    else {
                      //create welcome file
                      createFile('./userdata/' + u + '/documents/welcome', 'Hello. Welcome to my note taker app.', function (err) {
                        if (err) {
                          return err;
                        }
                        else {
                          wselect[session] = "welcome";
                          socket.join(u);
                          socket.emit('isnew');
                        }
                      });
                    }
                  });
                }
              });
              fs.appendFile('userp.txt', "\n" + p, function (err) {
                if (err) {
                  return console.log(err);
                }
              });
            }
        });
      }
  });
  socket.on('logout', function() {
    requestMade(this.id);
    session = socks.indexOf(this.id);
    users[session] = "notlogged";
    socket.emit('clear');
    wselect[session] = "";
  });
  
  socket.on('changepass', function(o, n) {
    requestMade(this.id);
    o = o.replace(/\//g, "");
    o = o.replace(/\\"/g, "");
    o = o.replace(bwords, "");
    n = n.replace(bwords, "");
    n = n.replace(/\//g, "");
    n = n.replace(/\\"/g, "");
    session = socks.indexOf(this.id).toString();
    var user = [];
    var pass = [];
    var ur =  new readline('usern.txt');
    ur.on('error', function (err) {
    	return err;
    });
    
    ur.on('line', function (line) {
    	user.push(line);
    });
    
    ur.on('end', function () {
    	var pr =  new readline('userp.txt');
    	pr.on('error', function(err) {
    	  return err;
    	});
    	
    	pr.on('line', function(line) {
    	  pass.push(line);
    	});
    	
    	pr.on('end', function() {
    	  if (o == pass[user.indexOf(users[session])]) {
    	    var tempass = "";
    	    socket.emit('newstat', "Password changed.");
    	    pass[user.indexOf(users[session])] = n;
    	    for (var i = 0; i < pass.length; i++) {
    	      if (i != 0) {
    	        tempass += "\n";
    	      }
    	      tempass += pass[i];
    	    }
    	    fs.writeFile('userp.txt', tempass, function(err) {
    	      if (err) {
    	        return err;
    	      }
    	      else {
    	        socket.emit('passchanged');
    	      }
    	    });
    	  }
    	  else {
    	    socket.emit('newstat', "Incorrect password.");
    	  }
    	});
    });
  });
  
  socket.on('checkdir', function() {
    requestMade(this.id);
    session = socks.indexOf(this.id).toString();
    fs.readdir('./userdata/' + users[session] + '/documents', function(err, files) {
      if (err) {
        return err;
      }
      else {
        udir[session] = files;
        udir.sort();
        socket.emit('returndir', udir[session]);
      }
    });
  });
  socket.on('openfile', function(r) {
    requestMade(this.id);
    r = r.replace(bwords, "");
    r = r.replace(/\//g, "");
    r = r.replace(/\\"/g, "");
    r = r.replace(badstuff, "");
    session = socks.indexOf(this.id);
    if (r.trim().length != 0) {
      if (users[session] != "notlogged") {
        fs.readFile('./userdata/' + users[session] + "/documents/" + r, function(err, data) {
          if (err) {
            return err;
          }
          else {
            filecontents = data.toString();
            filecontents = encryptor.decrypt(filecontents);
            wselect[session] = r;
            socket.emit('paste', filecontents, r);
          }
        });
      }
    }
  });
  socket.on('savefile', function(f, d, auto, s) {
    requestMade(this.id);
    f = f.replace(bwords, "");
    f = f.replace(/\//g, "");
    f = f.replace(/\\"/g, "");
    f = f.replace(badstuff, "");
    d = encryptor.encrypt(d);
    session = socks.indexOf(this.id);
    if (f.trim().length != 0) {
      if (users[session] != "notlogged") {
        socket.emit('newstat', "File saving...");
        fs.writeFile('./userdata/' + users[session] + "/documents/" + f, d, function(err) {
          if (err) {
              return console.log(err);
          }
          else {
            socket.emit('newstat', f + " was saved.");
            if (auto) {
              socket.emit('doneauto', s);
            }
          }
        });
      }
    }
  });
  socket.on('newfile', function(f) {
    requestMade(this.id);
    f = f.replace(bwords, "");
    f = f.replace(/\//g, "");
    f = f.replace(/\\"/g, "");
    f = f.replace(badstuff, "");
    var exists;
    session = socks.indexOf(this.id);
    fs.readdir('./userdata/' + users[session] + '/documents', function(err, files) {
      if (err) {
        return err;
      }
      else {
        for (var i = 0; i < files.length; i++) {
          if (files[i] == f) {
            exists = true;
          }
        }
        if (!exists) {
          if (f.trim().length != 0) {
            if (users[session] != "notlogged") {
              socket.emit('succesfulnew');
              createFile('./userdata/' + users[session] + "/documents/" + f, 'new note', function (err) {
                if (err) {
                  return err;
                }
                else {
                  socket.emit('select', f);
                  wselect[session] = f;
                  socket.emit('newstat', "File created.");
                }
              });
            }
          }
        }
        else if (exists) {
          socket.emit('newstat', "File already exists.");
        }
      }
    });
  });
  
  socket.on('renamefile', function(f, name) {
    requestMade(this.id);
    f = f.replace(bwords, "");
    f = f.replace(/\//g, "");
    f = f.replace(/\\"/g, "");
    f = f.replace(badstuff, "");
    name.replace(badstuff, "");
    session = socks.indexOf(this.id);
    name.replace(bwords, "");
    name.replace(/\//g, "");
    name.replace(/\\"/g, "");
    if (f !== "" && name !== "") {
    if (f.trim().length != 0 && name.trim().length != 0) {
        fs.rename("./userdata/" + users[session] + "/documents/" + f, "./userdata/" + users[session] + "/documents/" + name, function(err) {
          if (err) {
            return console.log(err);
          }
          else {
            socket.emit('select', name);
            wselect[session] = name;
          }
        });
      }
    }
  });
  
  socket.on('deletefile', function(f) {
    requestMade(this.id);
    f = f.replace(bwords, "");
    f = f.replace(/\//g, "");
    f = f.replace(/\\"/g, "");
    f = f.replace(badstuff, "");
    session = socks.indexOf(this.id).toString();
    if (f.trim().length != 0) {
      if (users[session] != "notlogged") {
        fs.readdir('./userdata/' + users[session] + '/documents', function(err, files) {
          if (err) {
            return err;
          }
          else {
            socket.emit('newstat', "'" + f + "' was deleted.");
            fs.unlink("./userdata/" + users[session] + "/documents/" + f, function(err) {
             if (err) {
               return err;
             }
             else {
              fs.readdir('./userdata/' + users[session] + '/documents', function(err, files) {
                if (err) {
                  return err;
                }
                else {
                  fs.readFile('./userdata/' + users[session] + "/documents/" + udir[session], function(err, data) {
                    if (err) {
                      return err;
                    }
                    else {
                      setTimeout(function() {
                        udir = files;
                        udir.sort();
                        socket.emit('paste', data.toString());
                        socket.emit('select', udir[session][0]);
                        wselect[session] = udir[session][0];
                        socket.emit('returndir', udir[session]);
                      }, 50);
                    }
                  });
                }
              });
             }
            });
          }
        });
      }
    }
  });
  function requestMade(id) {
    if (!dcing) {
      session = socks.indexOf(id);
      if (ureq[session] >= 50) {
        dcing = true;
        socket.disconnect();
        setTimeout(function() {
          dcing = false;
        }, 1500);
      }
      ureq[session] += 1;
      setTimeout(function() {
        ureq[session] -= 1;
      }, 1000);
    }
  }

//end
});

//server.timeout = 0;
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Server listening at: ", addr.address + ":" + addr.port);
});
