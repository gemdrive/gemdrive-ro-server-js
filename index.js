#!/usr/bin/env node

const http = require('http');
const path = require('path');
const fs = require('fs');

http.createServer(async function(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');

  if (req.method === 'OPTIONS') {
    res.end();
    return;
  }
  else if (req.method !== 'GET') {
    res.statusCode = 405;
    res.write("Method not allowed");
    res.end();
    return;
  }

  const fsRoot = '.';
  const reqPath = req.url;

  if (reqPath.endsWith('remfs.json')) {

    const fsDir = path.join(fsRoot, path.dirname(reqPath));

    let filenames;
    try {
      filenames = await fs.promises.readdir(fsDir);
    }
    catch (e) {
      res.statusCode = 404;
      res.write("Not Found");
      res.end();
      return;
    }

    const remfs = {
      type: 'dir',
      children: {},
    };

    for (const filename of filenames) {
      const childFsPath = path.join(fsDir, filename);

      const stats = await fs.promises.stat(childFsPath);

      remfs.children[filename] = {
        type: stats.isDirectory() ? 'dir' : 'file',
        size: stats.size,
      };
    }

    res.write(JSON.stringify(remfs, null, 2));
    res.end();
  }
  else {

    const fsPath = path.join(fsRoot, reqPath);

    let stats
    try {
      stats = await fs.promises.stat(fsPath);
      res.setHeader('Content-Length', `${stats.size}`);
      stream = fs.createReadStream(fsPath);
      stream.on('error', (e) => {
        res.statusCode = 404;
        res.write("Not Found");
        res.end();
      });
      stream.pipe(res);
    }
    catch (e) {
      res.statusCode = 404;
      res.write("Not Found");
      res.end();
      return;
    }
  }
}).listen(9001);
