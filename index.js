const mkdirp = require('mkdirp')
const fs = require('fs')
const path = require('path')
const debug = require('debug')('fdfor')

function open(...args) {
	return new Promise((resolve, reject)=>{
		fs.open(...args, (err, fd)=>{
			if (err) reject(err)
			else resolve(fd)
		})
	})
}

function modify(getter) {
	return fd=>{
		let got = getter()
		debug('Getter modifier found result %s from getter.', got)
		if (got instanceof Promise)
			return got.then(()=>fd)
		else if (got.pipe)
			return new Promise((resolve, reject)=>{
				let dest = fs.createWriteStream(null, {fd})
				let out = got.pipe(dest, {end: false})
				debug('Piping from getter to fd')
				out.on('error', ()=>{debug('Error piping'); return reject})
				got.on('end', ()=>{debug('Piping complete'); return resolve(fd)})
			})
	}
}	

module.exports = function makeFiler(dir) {
	mkdirp.sync(dir)
	debug('Making FDs for', dir)

	// name is the desired filename. getter is called with an fd to write
	// the file if it doesn't exist. getter should return a promise which
	// resolves after it is finished writing.
	return function fdfor(name, getter, flags) {
		debug('Getting %s', name)
		let p = path.resolve(dir, name)

		getter = modify(getter)

		// Not every error is recoverable by creating/recreating the file. That
		// said, these other errors should be hit by both opens, and give the same
		// result in both cases.
		return open(p, flags||'r').catch(e=>{
			debug('Running getter for %s', name)
			return open(p, 'w+').then(getter)
		}).then(fd=>{
			debug('Resolved %s with fd %s', name, fd)
			return fd
		})
	}
}
