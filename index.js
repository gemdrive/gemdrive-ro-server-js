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

  if (reqPath.startsWith('/gemdrive/index') && reqPath.endsWith('list.json')) {

    const itemPath = reqPath.slice('/gemdrive/index'.length, reqPath.length - 'list.json'.length);
    const fsDir = path.join(fsRoot, path.dirname(itemPath));

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

    const gemData = {
      children: {},
    };

    for (const filename of filenames) {
      const childFsPath = path.join(fsDir, filename);

      const stats = await fs.promises.stat(childFsPath);

      const name = stats.isDirectory() ? filename + '/' : filename;

      gemData.children[name] = {
        size: stats.size,
        modTime: stats.mtime,
      };
    }

    res.write(JSON.stringify(gemData, null, 2));
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
