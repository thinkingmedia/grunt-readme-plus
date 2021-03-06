load([
        'Plus/Engine/Filters',
        'Plus/Engine/Filter',
        'Plus/Engine/Section',
        'collections/multi-map'
    ],
    /**
     * @param {Plus.Engine.Filters} Filters
     * @param {Plus.Engine.Filter} Filter
     * @param {Plus.Engine.Section} Section
     * @param MultiMap
     */
    function (Filters, Filter, Section, MultiMap) {

        /**
         * @type {Plus.Engine.Filters}
         */
        var target;

        beforeEach(function () {
            target = new Filters();
        });

        describe('constructor', function () {
            it('creates a MultiMap', function () {
                target.items.should.be.instanceOf(MultiMap);
            });
        });

        describe('count', function () {
            it('returns the number of items', function () {
                target.count().should.be.equal(0);
                target.add('foo', _.noop);
                target.count().should.be.equal(1);
            });
        });

        describe('beforeRender', function () {
            throws("There are no filters to render.", function () {
                target.beforeRender();
            });
            it('does not throw if there are filters', function () {
                target.add('foo', _.noop);
                target.beforeRender();
            });
        });

        describe('contains', function () {
            it('returns true for found filter group', function () {
                target.add('foo', _.noop);

                target.contains('foo').should.be.ok();
            });
            it('returns false for missing filter group', function () {
                target.contains('bar').should.not.be.ok();
            });
        });

        describe('add', function () {
            throws('invalid name', function () {
                target.add(['foo'], _.noop);
            });
            throws('invalid name', function () {
                target.add('', _.noop);
            });
            it('each filter is grouped by name', function () {
                target.add('foo', _.noop);
                target.add('bar', _.noop);
                target.items.keys().should.be.eql(['foo', 'bar']);
                _.first(target.items.get('foo')).should.be.instanceOf(Filter);
                _.first(target.items.get('bar')).should.be.instanceOf(Filter);
            });
            it('filter is added', function () {
                target.add('foo', _.noop);
                target.contains('foo').should.be.True();
            });
        });

        describe('byPriority', function () {
            throws('invalid argument', function () {
                target.byPriority(null);
            });
            it('returns an empty array if name does not exist', function () {
                var arr = target.byPriority('something');
                arr.should.be.Array().and.be.empty();
            });
            it('sorts filters by priority', function () {
                target.add('foo', _.noop, 70);
                target.add('foo', _.noop, 60);
                target.add('foo', _.noop, 30);
                var arr = target.byPriority('foo');
                arr.should.be.length(3);
                arr[0].priority.should.be.equal(70);
                arr[1].priority.should.be.equal(60);
                arr[2].priority.should.be.equal(30);
            });
        });

        describe('apply', function () {
            throws('invalid argument', function () {
                target.apply(null, null);
            });
            throws('Filters does not contain foo', function () {
                return target.apply('foo');
            });
            promise('returns a promise', function () {
                target.add('foo', _.noop);
                return target.apply('foo');
            });
            promise('returns a promise that resolves to default value for missing filters', function () {
                var p = target.apply('something:else', 99);
                p.should.be.fulfilledWith(99);
                return p;
            });
            promise('returns a promise that resolves a filter', function () {
                target.add('foo', function (value) {
                    value.should.be.equal(99);
                    return 123;
                });
                var p = target.apply('foo', 99);
                p.should.be.fulfilledWith(123);
                return p;
            });
            promise('chains the filter hooks together', function () {
                target.add('foo', function (value) {
                    value.should.be.equal(99);
                    return 123;
                });
                target.add('foo', function (value) {
                    value.should.be.equal(123);
                    return 345;
                });
                var p = target.apply('foo', 99);
                p.should.be.fulfilledWith(345);
                return p;
            });
            promise('chains by sort order', function () {
                // lower priority filters last
                target.add('foo', function (value) {
                    value.should.be.equal(345);
                    return 777;
                }, 1);
                target.add('foo', function (value) {
                    value.should.be.equal(99);
                    return 345;
                }, 99);
                var p = target.apply('foo', 99);
                p.should.be.fulfilledWith(777);
                return p;
            });
        });

        describe('promises', function () {
            it('returns an array for single argument', function () {
                target.add('foo', _.noop);
                var p = target.promises('foo');
                p.should.be.an.Array().and.have.a.length(1);
            });
            it('returns an array for array arguments', function () {
                target.add('foo', _.noop);
                var p = target.promises(['foo', 'bar']);
                p.should.be.an.Array().and.have.a.length(2);
            });
            promise("returns promise that resolve undefined for unknown filters", function () {
                var p = target.promises('foo');
                p.should.be.an.Array();
                p[0].should.be.fulfilledWith(undefined);
                return Q.all(p);
            });
        });

        describe('resolve', function () {
            throws('invalid argument', function () {
                target.resolve(null, _.noop);
            });

            promise('calls the callback', function () {
                target.add('foo', function () {
                    return 99;
                });
                var count = 0;
                var p = target.resolve('foo', function (foo) {
                    foo.should.be.equal(99);
                    count++;
                    return "done";
                });
                p.should.be.fulfilledWith("done");
                p.finally(function () {
                    count.should.be.equal(1);
                });
                return p;
            })
        });

        describe('_get_id', function () {
            it('converts CamelCase to name:space', function () {
                target._get_id('Plus/Filters/UpperCase').should.be.equal('upper:case');
            });
        });

        describe('load', function () {
            throws('Unexpected data from filters.json', function () {
                var l = new Loader();
                l.replace('Plus/filters.json', {});
                target.load(l);
            });
            throws('Filter module should return a filter function.', function () {
                var l = new Loader();
                l.replace('Plus/filters.json', ["Plus/Filters/Foo"]);
                l.replace('Plus/Filters/Foo', {});
                target.load(l);
            });
            it('loads a valid filter', function () {
                var l = new Loader();
                l.replace('Plus/filters.json', ["Plus/Filters/UpperCase"]);
                l.replace('Plus/Filters/UpperCase', function (str) {
                    return str.toUpperCase();
                });
                target.contains('upper:case').should.be.False();
                target.load(l);
                target.contains('upper:case').should.be.True();
            });
        });

        describe('render', function () {
            throws('invalid argument', function () {
                target.render(null);
            });
            throws('invalid argument', function () {
                target.render({});
            });
            promise('returns a promise that resolves to the section', function () {
                var s = new Section('root');
                var promise = target.render(s);
                promise.should.be.a.Promise();
                promise.then(function (/**Plus.Files.Markdown*/md) {
                    md.should.be.an.instanceOf(Section);
                });
                return promise;
            });
        });

    });