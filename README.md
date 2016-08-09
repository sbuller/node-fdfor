# node-fdfor

Have an expensive getter? Need an fd? Use this.

```js
const AppDirectory = require('appdirectory')
const dirs = new AppDirectory({
	appName: 'myAppName',
	appAuthor: 'myName'
})
const fdfor = require('fdfor')(dirs.userCache())

function getReallyBigFile() {}

let foo = fdfor('bigfile.zip', getReallyBigFile, 'r')
foo.then(fd=>console.log("bigfile.zip was downloaded if necessary. fd is open and ready for reading"))
```
