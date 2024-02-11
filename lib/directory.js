const fsExtra = require('fs-extra');

function makeFolders(list) {
    for (let i = 0; i < list.length; i++) {
        const path = list[i];
        if (fsExtra.existsSync(path)) {
            fsExtra.emptyDirSync(path);
        } else {
            fsExtra.mkdirSync(path);
        }
    }
}


module.exports = { makeFolders };
