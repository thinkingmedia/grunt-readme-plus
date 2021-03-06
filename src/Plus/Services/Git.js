/**
 * @param _
 * @param shell
 * @param {Plus.Files.Logger} Logger
 * @ignore
 */
function Module(_, shell, Logger) {

    /**
     * @todo this should be made lazy so it's run only when needed.
     * @memberof Plus.Services
     * @constructor
     */
    var Git = function () {
        if (!shell.which('git')) {
            Logger.error('git command line tool was not found.');
            return;
        }
        var output = shell.exec('git config --local --list', {silent: true}).output.trim();

        this.cache = _.fromPairs(_.compact(_.map(output.split("\n"), function (line) {
            return line.indexOf("=") > 0 ? line.split("=") : undefined;
        })));

        console.log(this.cache);

        if (!this.cache['remote.origin.url']) {
            throw Error('"remote.origin.url" is missing from Git info.');
        }
    };

    /**
     * @returns {string}
     */
    Git.prototype.getBranch = function () {
        return this.getInfo().branch;
    };

    /**
     * @returns {string}
     */
    Git.prototype.getUser = function () {
        return this.getInfo().user;
    };

    /**
     * @returns {string}
     */
    Git.prototype.getRepo = function () {
        return this.getInfo().repo;
    };

    /**
     * Extracts the username/organization and repo name from a GitHub URL address.
     * Uses a simplified approach because Git urls can have a wide range of formats.
     *
     * @returns {{user:string,repo:string,branch:string}|undefined}
     */
    Git.prototype.getInfo = function () {
        var url = (this.cache['remote.origin.url'] || '').trim();

        if (!url || url.indexOf('github.com') === -1) {
            return undefined;
        }

        url = url.trim().toLowerCase().replace("://", ":");
        if (url.indexOf('/') === -1) {
            return undefined;
        }
        var path = url.substr(url.indexOf('/') + 1);
        path = path.replace(/\?.*/, '');
        path = path.replace(/#.*/, '');

        // just get the first 2 levels
        var parts = _.take(_.map(path.split('/'), function (part) {
            return _.endsWith(part, ".git") ? part.substr(0, part.indexOf('.git')) : part;
        }), 2);

        if (parts.length !== 2) {
            // this isn't a valid url
            return undefined;
        }

        if (!parts[0] || !parts[1]) {
            return undefined;
        }

        // assume first 2 levels are username and repo
        // @todo Figure out what branch this is.
        return {
            'user': parts[0],
            'repo': parts[1],
            'branch': 'master'
        };
    };

    return new Git();
}

module.exports = [
    'lodash',
    'shelljs',
    'Plus/Files/Logger',
    Module
];
