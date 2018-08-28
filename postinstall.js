const https = require("follow-redirects").https;
const unzipper = require("unzipper");
const q = require("q");
const fs = require("fs-extra");
const path = require("path");
const uri = require("url");

const releasesUrl = 'https://api.github.com/repos/geeklearningio/gl-docs-theme/releases';

function downloadJson(url, dest) {
    var details = uri.parse(url)
    let deferal = q.defer();
    let content = '';
    let request = https.get({
        protocol: 'https:',
        hostname : details.host,
        path: details.path,
        headers:{
            'Accept' : ' application/vnd.github.v3+json' ,
            'User-Agent' : 'YarnPostInstall'
        }
    }, (response) => {
        response.on("end", () => {
            deferal.resolve(JSON.parse(content));
        }).on('data', function (chunk) {
            content += chunk.toString('utf8');
        });
    }).on("error", (err) => {
        deferal.reject(err);
    });

    return deferal.promise;
}

function downloadFile(url, dest) {
    let deferal = q.defer();
    let file = fs.createWriteStream(dest);
    let request = https.get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
            deferal.resolve();
        });
    }).on("error", (err) => {
        deferal.reject(err);
    });

    return deferal.promise;
}

async function run() {

    var releases = await downloadJson(releasesUrl)
    console.log(releases[0].assets[0].browser_download_url);
    await downloadFile(
        releases[0].assets[0].browser_download_url,
        './gl-template.zip');

    fs.ensureDirSync('./docfx_project/gl-template');

    await fs.createReadStream('./gl-template.zip')
        .pipe(unzipper.Extract({ path: path.join(__dirname, './docfx_project/gl-template') })).promise()
        .then((ok) => console.log('ok'), (err) => console.log('ko', err));
}

run();