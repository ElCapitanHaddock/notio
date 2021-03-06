
'esversion: 6';

process.env.NODE_ENV = 'production';

//modules
var http = require('http');
http.globalAgent.maxSockets = Infinity;
var path = require('path');
var socketio = require('socket.io');
var express = require('express');
var helmet = require('helmet');
var router = express();
var async = require("async");
router.use(helmet());
router.use(helmet.noCache());

var blackwall = require("blackwall");
var firewall = new blackwall();
var policy = firewall.policy('policy_name', [firewall.rules.rateLimiter], {
    rate: {
        m: 20
    }
});
router.use(firewall.enforce("express", policy));
var sqlinjection = require('sql-injection');
router.use(sqlinjection);
const key = "randomstuff901263476";
var encryptor = require('simple-encryptor')(key);
var server = http.createServer(router);
//perf
var compression = require('compression');
var minify = require('express-minify');
router.use(compression());
router.use(express.compress({filter: function (req, res) { return true;}}));
router.use(minify());

var io = socketio.listen(server);
var fs = require('fs');
var mkdirp = require('mkdirp');
var createFile = require('create-file');
//manipulation
var file = require("file");

var Ddos = require('ddos');
var ddos = new Ddos;
var sanitizer = require('sanitizer');
var inArray = require('in-array');
var cleanArray = require('clean-array');

var toobusy = require('toobusy-js');
router.use(function(req, res, next) {
  if (toobusy()) {
    res.send(503, "<h1 style='font-family:arial'>:P</h1><div><p style='font-family:sans-serif'>Aw, crap. Our server is too busy right now! Reload or check back later.</p>");
  } else {
    next();
  } 
});

//environment
var socks = [];
var users = [];
var userloc = [];
var wselect = [];
var session;
var udir = [];
var ureq = [];
var filecontents;
var bwords = /(<script|\/script>|<iframe|\/iframe>|<frame|\/frame>|onerror)/gi;
var badstuff = /[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi;
///(#|%|&|{|}|\|\/|<|>|\*|\?|$|!|'|"|:|@|\+|`|~|\||\=|)/gi
var dcing = false;
var defaultfonts = ["helvetica", "sans-serif", "times new roman", "monospace", "impact", "palatino linotype", "century gothic"];

//DATABASE
var locallydb = require('locallydb');
var db = new locallydb('./userdb');
var userinfo = db.collection('userinfo');

var maxfile = 500000000; //max string size

//cookie stuff
var uc = {};
var pc = [];
var userc = [];
var passc = [];
var tempc = [];
var tpass = "";
var tuser = "";

/*router.get('/info', function(req, res) {
  res.sendfile('./client/home.html');
});*/

/*var url = require("url");
//get request url
router.use(function(req, res, next) {
  var bits = url.parse(req.url, true);
  var q = bits.pathname;
  //console.log(q);
  //if (q !== "/") {
  //  res.sendfile("./client/notfound.html");
  //}
  //else {
    next();
  //}
});*/

router.use(ddos.express);
router.use(express.bodyParser({limit: '50mb'}));
var cachetime = 86400000*7;
router.use("/", express.static(path.resolve(__dirname, 'client'), { index: 'index.html', maxAge: cachetime, etag: true}));

//io config
io.configure('production', function () {
  io.enable('browser client minification', true);
  io.enable('browser client etag', true);
  io.enable('browser client gzip', true);
  io.set('log level', 1);
  io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);
});

var attempts = [];

io.on('connection', function(socket) {
  ureq.push(0);
  socks.push(socket.id);
  users.push("notlogged");
  userloc.push("notlogged");
  wselect.push("");
  attempts.push(0);
  udir.push([]);
  cleanArray(ureq);
  cleanArray(socks);
  cleanArray(users);
  cleanArray(userloc);
  cleanArray(wselect);
  cleanArray(attempts);
  cleanArray(udir);
  socket.join("anon");
  requestMade(socket.id);
  console.log("ID " + socket.id + " connected.");
  
  //cookies
  uc = {};
  pc = [];
  userc = [];
  passc = [];
  tempc = [];
  tpass = "";
  tuser = "";
  uc = socket.handshake.headers;
  if (uc.cookie !== undefined) {
    pc = uc.cookie.split(";");
    for (var i = 0; i < pc.length; i++) {
      tempc = pc[i].split('=');
      for (var j = 0; j < tempc.length; j++) {
        tempc[j] = tempc[j].replace(/ +?/g, '');
      }
      if (tempc[0] == "user") {
          tuser = tempc[1];
      }
      if (tempc[0] == "pass") {
          tpass = tempc[1];
      }
    }
    tuser = tuser.replace(/''/g, "");
    tpass = tpass.replace(/''/g, "");
    if (tpass !== "" && tuser !== "") {
      socket.emit('cachelog', tuser, tpass);
    }
  }
  
  //disconnect
  socket.on('disconnect', function() {
    console.log("ID " + socks[session] + " disconnected, user " + users[session]);
    requestMade(this.id);
    session = socks.indexOf(this.id).toString();
    users.splice(session);
    userloc.splice(session);
    wselect.splice(session);
    udir.splice(session);
    ureq.splice(session);
    attempts.splice(session);
    socks.splice(session);
    cleanArray(ureq);
    cleanArray(socks);
    cleanArray(users);
    cleanArray(userloc);
    cleanArray(wselect);
    cleanArray(attempts);
    cleanArray(udir);
  });
  
  socket.on('login', function(u, p, signup) {
      requestMade(this.id);
      var session = this.id;
      var thisuser = users[socks.indexOf(session)];
      u = u.replace(/\//g, "");
      u = u.replace(/\\"/g, "");
      u = u.replace(bwords, "");
      p = p.replace(bwords, "");
      p = p.replace(/\//g, "");
      p = p.replace(/\\"/g, "");
      //u = u.replace(badstuff, "");
      u = sanitizer.sanitize(u);
      p = sanitizer.sanitize(p);
      var exists = false;
      var online = false;
      for (var i = 0; i < users.length; i++) {
        if (users[i].toLowerCase() == u.toLowerCase()) {
          online = true;
        }
      }
      attempts[socks.indexOf(session)] += 1;
      if (attempts[socks.indexOf(session)] > 10) { //if too many attempted logins
        console.log("Too many attempts!");
        socket.disconnect();
      }
      if (thisuser === undefined) {
        thisuser = "notlogged";
      }
      if (u.trim().length !== 0 && p.trim().length !== 0 && u.length <= 25 && thisuser == "notlogged") {
        for (var i = 0; i < userinfo.items.length; i++) {
          if (userinfo.items[i].name == u) {
            exists = true;
            break;
          }
        }
        if (!exists && !online && signup && p.length <= 25) {
          userinfo.insert({name: u, password: encryptor.encrypt(p)});
          socket.join("verified");
          socket.emit('newstat', "Account: '" + u + "' was created.");
          socket.emit('success', u);
          users[socks.indexOf(session)] = u;
          //new user directory
          mkdirp('./userdata/' + u + '/documents', function (err) {
            if (err) {
              console.error(err);
            }
            else {
              socket.emit('isnew');
            }
          });
        }
        else if (!exists && signup && p.length > 25) {
          socket.emit("newstat", "Password too big. (25 max)");
        }
        else if (!signup && online) {
          socket.emit("newstat", "User already online!");
        }
        else if (exists && !signup && encryptor.decrypt(userinfo.where({name: u}).items[0].password) == p) {
          socket.join("verified");
          socket.emit('newstat', "Welcome, " + u);
          socket.emit('success', u);
          users[socks.indexOf(session)] = u;
          console.log("User logged in as " + u + ".");
        }
        else if (exists && signup) {
          socket.emit('newstat', "User already exists.");
        }
        else if (userinfo.where({name: u}).items[0] !== undefined) {
          socket.emit('newstat', "Incorrect password!");
        }
        else if (!exists && !signup) {
          socket.emit('newstat', "User does not exist.");
        }
      }
      else if (u.length > 25 && signup) {
        socket.emit('newstat', "Username too long. (25 max)");
      }
      else if (p.length > 25 && signup) {
        socket.emit('newstat', "Password too long. (25 max)");
      }
      else if (online && !signup) {
        socket.emit("newstat", "User is already online!");
      }
      else {
        socket.emit('newstat', "An error occured.");
      }
  });
  
  socket.on('logout', function() {
    requestMade(this.id);
    socket.emit('refresh');
  });

  socket.on('changepass', function(o, n) {
    requestMade(this.id);
    var session = socks.indexOf(this.id);
    var thisuser = users[session];
    o = o.replace(/\//g, "");
    o = o.replace(/\\"/g, "");
    o = o.replace(bwords, "");
    n = n.replace(bwords, "");
    n = n.replace(/\//g, "");
    n = n.replace(/\\"/g, "");
    o = sanitizer.sanitize(o);
    n = sanitizer.sanitize(n);
    if (n.length >= 25) {
      socket.emit("newstat", "Password too long. (25 max)");
    }
	  else if (o == encryptor.decrypt(userinfo.where({name: thisuser}).items[0].password) && thisuser !== "notlogged") {
  	    socket.emit('newstat', "Password changed.");
  	    socket.emit('passchanged');
  	    userinfo.update(userinfo.where({name: thisuser}).items[0].cid, {password: encryptor.encrypt(n)});
	  }
	  else {
	    socket.emit('newstat', "Incorrect password.");
	  }
  });
  
  socket.on('checkdir', function() {
    requestMade(this.id);
    var session = socks.indexOf(this.id);
    var thisuser = users[session];
    file.walkSync("./userdata/" + thisuser + "/documents",  function(path, folders, files) {
        udir[session] = files;
        udir.sort();
        var filedb = new locallydb('./userdata/' + thisuser +  '/filedb');
        var files = filedb.collection('files');
        var ft = files.items;
        var spectags = [];
        var ftags = [];
        ft.sort(compare);
        for (var i = 0; i < ft.length; i++) {
          if (ft[i].tags !== [] && ft[i].tags !== "" && ft[i].tags !== [""] && ft[i].tags !== [''] && ft[i].tags.length > 0) {
            spectags.push(ft[i].tags);
            for (var j = 0; j < ft[i].tags.length; j++) {
              if (!(inArray(ftags, ft[i].tags[j])) && ft[i].tags[j] !== "") {
                ftags.push(ft[i].tags[j]);
              }
            }
          }
        }
        var latest = userinfo.get(userinfo.where({name: thisuser}).items[0].cid).recent;
        socket.emit('returndir', udir[session], ftags, spectags, latest);
    });
  });
  
  //Thanks Web_Designer on SO (sort objects)
  function compare(a,b) {
  if (a.name < b.name)
    return -1;
  if (a.name > b.name)
    return 1;
  return 0;
  }
  
  socket.on('openfile', function(r) {
    requestMade(this.id);
    r = r.replace(bwords, "");
    r = r.replace(/\//g, "");
    r = r.replace(/\\"/g, "");
    r = r.replace(badstuff, "");
    r = sanitizer.sanitize(r);
    var session = socks.indexOf(this.id);
    var thisuser = users[session];
    var mydir = udir[session];
    var oldex;
    if (mydir !== undefined) {
      for (var i = 0; i < mydir.length; i++) {
        if (mydir[i] == r) {
          oldex = true;
          if (mydir[i] !== r) {
            oldex = false;
            socket.emit('newstat', "File not selected");
          }
        }
      }
      if (r.trim().length !== 0) {
        if (thisuser !== "notlogged") {
          fs.readFile('./userdata/' + thisuser + "/documents/" + r, function(err, data) {
            if (err) {
              return err;
            }
            else {
              filecontents = data.toString();
              filecontents = encryptor.decrypt(filecontents);
              var filedb = new locallydb('./userdata/' + thisuser +  '/filedb');
              var files = filedb.collection('files');
              var ftags = files.where({name: r}).items[0].tags;
              var state = files.where({name: r}).items[0].scroll;
              var fontlist = files.where({name: r}).items[0].fonts;
              userinfo.update(userinfo.where({name: thisuser}).items[0].cid, { recent: r });
              wselect[session] = r;
              socket.emit('paste', filecontents, r, ftags, state, fontlist);
            }
          });
        }
      }
    }
  });
  
  socket.on('savefile', function(f, d, auto, s, state, fontlist) {
    requestMade(this.id);
    var session = socks.indexOf(this.id);
    var thisuser = users[session];
    //regex
    f = f.replace(bwords, "");
    f = f.replace(/\//g, "");
    f = f.replace(/\\"/g, "");
    f = f.replace(badstuff, "");
    f = sanitizer.sanitize(f);
    d = d.replace(/<html>/gi, "");
    d = d.replace(/<\/html>/gi, "");
    d = encryptor.encrypt(d);
    var mydir = udir[session];
    var oldex;
    socket.emit('newstat', "File saving...", "mid");
    if (mydir !== undefined) {
      for (var i = 0; i < mydir.length; i++) {
        if (mydir[i] == f) {
          oldex = true;
          break;
        }
      }
      if (f.trim().length !== 0 && oldex && f.length <= 16 && !tooBig()) {
        if (thisuser !== "notlogged") {
          fs.writeFile('./userdata/' + thisuser + "/documents/" + f, d, function(err) {
            if (err) {
                return console.log(err);
            }
            else {
              if (userinfo.where({name: thisuser}).items[0] !== undefined) {
                userinfo.update(userinfo.where({name: thisuser}).items[0].cid, { recent: f });
                var filedb = new locallydb('./userdata/' + thisuser +  '/filedb');
                var files = filedb.collection('files');
                files.update(files.where({name: f}).items[0].cid, { scroll: state, fonts: fontlist });
                socket.emit('newstat', f + " was saved.");
                if (auto) {
                  socket.emit('doneauto', s);
                }
                else {
                  socket.emit('donesave');
                }
              }
            }
          });
        }
      }
      else if (tooBig()) {
        socket.emit('newstat', "File too big to save.");
      }
      else if (f.length > 16) {
        socket.emit('newstat', "File name too long. (16 max)");
      }
      else if (!oldex) {
        socket.emit('newstat', "An error occured.");
      }
    }
  });
  
  socket.on('newfile', function(f, tag, isnew) {
    requestMade(this.id);
    var session = socks.indexOf(this.id);
    var thisuser = users[session];
    f = f.replace(bwords, "");
    f = f.replace(/\//g, "");
    f = f.replace(/\\"/g, "");
    f = f.replace(badstuff, "");
    f = sanitizer.sanitize(f);
    var exists;
    var msg = "";
    fs.readdir('./userdata/' + thisuser + '/documents', function(err, files) {
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
          if (f.trim().length !== 0 && f.length <= 16) {
            if (thisuser !== "notlogged") {
              if (isnew) {
                msg = "Hello. Welcome to m note taker app!";
              }
              else {
                msg = "new note";
              }
              createFile('./userdata/' + thisuser + "/documents/" + f, msg, function (err) {
                if (err) {
                  return err;
                }
                else {
                  if (tag == "All Tags") {
                    tag = "";
                  }
                  var filedb = new locallydb('./userdata/' + thisuser +  '/filedb');
                  var files = filedb.collection('files');
                  files.insert({name: f, tags: [tag], fonts: defaultfonts});
                  userinfo.update(userinfo.where({name: thisuser}).items[0].cid, { recent: f });
                  wselect[session] = f;
                  socket.emit('newstat', "File created.");
                  socket.emit('succesfulnew', f);
                }
              });
            }
          }
          else if (f.length > 16) {
            socket.emit('newstat', "File name too long.");
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
    var session = socks.indexOf(this.id);
    var thisuser = users[session];
    f = f.replace(bwords, "");
    f = f.replace(/\//g, "");
    f = f.replace(/\\"/g, "");
    f = f.replace(badstuff, "");
    name = name.replace(badstuff, "");
    f = sanitizer.sanitize(f);
    name = sanitizer.sanitize(name);
    name.replace(badstuff, "");
    name.replace(bwords, "");
    name.replace(/\//g, "");
    name.replace(/\\"/g, "");
    var mydir = udir[session];
    var oldex;
    var already;
    if (mydir !== undefined) {
      for (var i = 0; i < mydir.length; i++) {
        if (mydir[i] == f) {
          oldex = true;
          if (mydir[i] !== f) {
            oldex = false;
            socket.emit('newstat', "File not selected");
          }
        }
        if (mydir[i] == name && mydir[i] !== f) {
          already = true;
        }
      }
      if (f !== "" && name !== "" && name.length <= 16 && oldex && !already && thisuser != "notlogged") {
        if (f.trim().length !== 0 && name.trim().length !== 0) {
          fs.rename("./userdata/" + thisuser + "/documents/" + f, "./userdata/" + thisuser + "/documents/" + name, function(err) {
            if (err) {
              return console.log(err);
            }
            else {
              socket.emit('select', name);
              socket.emit("newstat", "File renamed.");
              wselect[session] = name;
              var filedb = new locallydb('./userdata/' + thisuser +  '/filedb');
              var files = filedb.collection('files');
              files.update(files.where({name: f}).items[0].cid, {name: name});
            }
          });
        }
      }
      else if (already) {
        socket.emit('newstat', "Name already taken.");
      }
      else if (!oldex) {
        socket.emit("newstat", "File does not exist.");
      }
      else if (name.length > 16) {
        socket.emit("newstat", "File name too long. (16 max)");
      }
      else if (name === "") {
        socket.emit("newstat", "Name cannot be empty.");
      }
    }
  });
  
  socket.on('deletefile', function(f) {
    requestMade(this.id);
    var session = socks.indexOf(this.id);
    var thisuser = users[session];
    f = f.replace(bwords, "");
    f = f.replace(/\//g, "");
    f = f.replace(/\\"/g, "");
    f = f.replace(badstuff, "");
    f = sanitizer.sanitize(f);
    var mydir = udir[session];
    var oldex;
    if (mydir !== undefined) {
      for (var i = 0; i < mydir.length; i++) {
        if (mydir[i] == f) {
          oldex = true;
          if (mydir[i] !== f) {
            oldex = false;
            socket.emit('newstat', "File not selected");
          }
        }
      }
      if (f.trim().length !== 0 && oldex) {
        if (thisuser !== "notlogged") {
          var filedb = new locallydb('./userdata/' + thisuser +  '/filedb');
          var files = filedb.collection('files');
          files.remove(files.where({name: f}).items[0].cid);
          fs.readdir('./userdata/' + thisuser + '/documents', function(err, files) {
            if (err) {
              return err;
            }
            else {
              socket.emit('newstat', f + " was deleted.");
              fs.unlink("./userdata/" + thisuser + "/documents/" + f, function(err) {
               if (err) {
                 return err;
               }
               else {
                  userinfo.update(userinfo.where({name: thisuser}).items[0].cid, { recent: ""});
                  socket.emit('newstat', f + " was deleted.");
                  socket.emit('donedelete');
               }
              });
            }
          });
        }
      }
    }
  });
  
  socket.on('tagup', function(d, f) {
    requestMade(this.id);
    var session = socks.indexOf(this.id);
    var thisuser = users[session];
    f = f.replace(bwords, "");
    f = f.replace(/\//g, "");
    f = f.replace(/\\"/g, "");
    f = f.replace(badstuff, "");
    f = sanitizer.sanitize(f);
    for (var i = 0; i < d.length; i++) {
      d[i] = sanitizer.sanitize(d[i]);
      d[i] = d[i].replace(/\//g, "");
      d[i] = d[i].replace(/\\"/g, "");
      d[i] = d[i].replace(badstuff, "");
      d[i] = d[i].replace(bwords, "");
    }
    d = d.filter(function(elem, index, self) {
      return index == self.indexOf(elem);
    });
    if (f.trim().length !== 0 && thisuser !== "notlogged") {
      var filedb = new locallydb('./userdata/' + thisuser +  '/filedb');
      var files = filedb.collection('files');
      files.update(files.where({name: f}).items[0].cid, {tags: d});
      socket.emit('newstat', "Tags updated.");
      socket.emit('donetag');
      socket.emit('pastetag', d);
    }
    else if (f.trim().length === 0) {
      socket.emit('newstat', "Nothing selected.");
    }
  });

  socket.on('execDebug', function(p) {
    requestMade(this.id);
    p = p.replace(bwords, "");
    p = p.replace(/\//g, "");
    p = p.replace(/\\"/g, "");
    p = p.replace(badstuff, "");
    p = sanitizer.sanitize(p);
    execDebug(p);
  });
  
  function tooBig(string) {
    var size = Buffer.byteLength(string, 'utf8');
    if (size > maxfile) {
      return true;
    }
    if (size < maxfile) {
      return false;
    }
  }
  
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

function execDebug(what) {
  switch(what) {
    case "u":
      console.log(users);
      break;
    case "s":
      console.log(socks);
      break;
    case "all":
      console.log(users);
      console.log(socks);
  }
}

//server.timeout = 0;
server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Server listening at: ", addr.address + ":" + addr.port);
});
