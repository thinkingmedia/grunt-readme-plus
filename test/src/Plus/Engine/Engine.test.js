load([
        'Plus/Engine/Engine',
        'Plus/Engine/Filters',
        'Plus/Engine/Sections',
        'Plus/Files/Markdown'
    ],
    /**
     * @param {Plus.Engine} Engine
     * @param {Plus.Engine.Filters} Filters
     * @param {Plus.Engine.Sections} Sections
     * @param {Plus.Files.Markdown} Markdown
     */
    function (Engine, Filters, Sections, Markdown) {

        /**
         * Creates a test engine with data.
         *
         * @returns {Plus.Engine}
         */
        function CreateEngine() {
            var f = new Filters();
            f.add('test', _.noop);

            var s = new Sections();
            s.append('root');
            s.append('root/header');

            return new Engine(f, s);
        }

        describe('constructor', function () {
            throws('invalid filters', function () {
                var e = new Engine(null, new Sections());
            });
            throws('invalid sections', function () {
                var e = new Engine(new Filters(), null);
            });
        });

        describe('_filterSections', function () {
            it('returns an array of promises', function () {
                var e = CreateEngine();
                var arr = e._filterSections();
                arr.should.be.an.Array();
                arr.should.be.length(2);
                _.each(arr, function (item) {
                    item.should.be.a.Promise();
                });
            });
        });

        describe('engine', function () {
            promise('returns a promise that resolves to Markdown', function () {
                var e = CreateEngine();
                var p = e.render();
                p.should.be.a.Promise();
                return p.then(function (/**Plus.Files.Markdown*/md) {
                    md.should.be.an.instanceOf(Markdown);
                    var str = md.toString();
                    str.should.be.equal('');
                });
            });
        });
    });
