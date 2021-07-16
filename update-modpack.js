const walk = require('walk')
const path = require('path')
const fs = require('fs')
const sha1File = require("sha1-file");
const { gzip, ungzip } = require('node-gzip');

const source = "online_modpack/overrides"
const sourcefile = "online_modpack/server-manifest.json"
const backupFolder = "pack_updater/manifest_backup"


manifestJson = JSON.parse(fs.readFileSync(sourcefile));
sourceJson = JSON.parse(fs.readFileSync(sourcefile));
//console.log(manifestJson);
manifestJson.files = [];
manifestJson.version = increaseVersion(manifestJson.version)
//console.log(manifestJson);

let walker = walk.walk(source);

function increaseVersion(version) {
  version = version.split(".")
  let major = parseInt(version[0])
  let minor = parseInt(version[1])
  return `${major}.${minor + 1}`;
}

walker.on('file', function (root, fileStats, next) {
  let filePath = path.join(root, fileStats.name);
  let configPath = path.join(path.relative(source, root), fileStats.name)
  manifestJson.files.push(
    {
      path: configPath,
      hash: sha1File.sync(filePath)
    }
  )
  next();
}
);
walker.on("end", async function () {

  
  try{
    fs.unlinkSync(sourcefile);
    fs.unlinkSync("online_modpack/server-manifest.json.gz");
  }catch(e){
    console.error(e);
  }
  
  let json = JSON.stringify(manifestJson, null, '  ');
  let backupPath = path.join(backupFolder, `server-manifest-${sourceJson.version}.json`)
  fs.writeFileSync(sourcefile, json);
  fs.writeFileSync("online_modpack/server-manifest.json.gz", await gzip(json));
  fs.writeFileSync(backupPath, JSON.stringify(sourceJson, null, '  '));
  console.log("all done");
}
);
