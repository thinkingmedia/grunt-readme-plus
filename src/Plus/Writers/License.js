/**
 * @param Q
 * @param _
 * @param {Plus.Services.Licenses} Licenses
 * @param {Plus.Services.PackageJSON} PackageJSON
 * @param {Plus.Files.Logger} Logger
 * @param Print
 * @ignore
 */
function Module(Q, _, Licenses, PackageJSON, Logger, Print) {

    /**
     * @readme plugins.License
     *
     * License plugin adds the footer to the README for the current license.
     *
     * @memberof Plus.Writers
     *
     * @param {Plus.Engine} engine
     * @param {string} section
     * @param {Object<string,*>} options
     *
     * @constructor
     */
    var License = function (engine, section, options) {
        Logger.debug('Plugin %s: %s', 'License', section);

        var self = this;
        options = _.merge({}, {license: true}, options);

        if (options.license === false) {
            return;
        }

        engine.add_filter(section, function (/**Plus.Files.Markdown*/md) {

            //Logger.info("%s - %1.3f", license.file, license.score);
            var info = self.getLicence();
            if (!info) {
                return md;
            }

            var title = engine.apply_filters('licence:title', 'Licence');
            var desc = engine.apply_filters('license:desc', '<%= title %> is licenced under the <%= name %>.');
            var project = engine.apply_filters('project:title');

            return Q.spread([title, desc, project], function (title, desc, project) {
                md.title = title.trim();
                md.lines = [];
                md.lines.push(_.template(desc)({name: info.name, title: project}));
                if (info.file) {
                    md.lines.push('');
                    md.lines.push(Print('See %s for details.', info.file));
                }
                return md;
            });
        });
    };


    /**
     * @returns {{name: string, url: string, file: string}|null}
     */
    License.prototype.getLicence = function () {
        var fileName = Licenses.getFileName();
        if (!fileName) {
            Logger.error('Project has no licence file. You should disable the licence section.');
            return null;
        }

        var info = Licenses.getLicence(fileName);
        if (!info) {
            // fall back to the package.json (if possible)
            if (PackageJSON.hasPackage()) {
                var type = PackageJSON.getLicenceType();
                info = type && Licenses.getLicenceByType(type);
            }
        }

        return info
            ? {name: info.title, url: info.url, file: fileName}
            : null;
    };

    return License;
}

module.exports = [
    'q',
    'lodash',
    'Plus/Services/Licenses',
    'Plus/Services/PackageJSON',
    'Plus/Files/Logger',
    'Plus/Services/Print',
    Module
];