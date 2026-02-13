var test = require('test');
var reel = require("test.mod");

test.assert(reel.Hello === "World", 'import string');
test.print('DONE', 'info');
