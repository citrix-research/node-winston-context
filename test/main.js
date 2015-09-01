'use strict';
var expect = require('unexpected').clone();
var sinon = require('sinon');
var Winston = require('winston');
var WinstonSpy = require('winston-spy');
var WinstonContext = require('../index.js');

expect.installPlugin(require('unexpected-sinon'));

/*global describe,beforeEach,it*/

describe('WinstonContext', function () {
    var logger;
    var spy;

    beforeEach(function () {
        spy = sinon.spy();

        logger = new Winston.Logger({
            transports: [new WinstonSpy({ spy: spy })]
        });
    });

    it('Logging with root logger has no prefix nor extra metadata', function () {
        new WinstonContext(logger, 'prefix', {ctx: 1});
        logger.info('test', {meta: true});

        expect(spy, 'was called once');
        expect(spy, 'was called with', 'info', 'test', {meta: true});
    });

    it('Context w. prefix & meta logs prefix & meta', function () {
        var ctx = new WinstonContext(logger, 'prefix', {ctx: 1});
        ctx.info('test', {meta: true});

        expect(spy, 'was called once');
        expect(spy, 'was called with', 'info', 'prefix.test', {ctx: 1, meta: true});
    });

    it('Sibling contexts doesn\'t interfere with eachother', function () {
        var ctx1 = new WinstonContext(logger, '1', {ctx: 1});
        var ctx2 = new WinstonContext(logger, '2', {ctx: 2});

        ctx1.error('ONE', {logger: 1});
        ctx2.error('TWO', {logger: 2});

        expect(spy, 'was called twice');
        expect(spy, 'was called with', 'error', '1.ONE', {ctx: 1, logger: 1});
        expect(spy, 'was called with', 'error', '2.TWO', {ctx: 2, logger: 2});
    });

    it('Grandchild contexts doesn\'t interfere with eachother', function () {
        var child = new WinstonContext(logger, 'child', {child: 1});
        var grandchild = child.getContext('grandchild', {grandchild: 1});

        child.info('1', {meta: 1});
        grandchild.info('2', {meta: 2});

        expect(spy, 'was called twice');
        expect(spy, 'was called with', 'info', 'child.1', {child: 1, meta: 1});
        expect(spy, 'was called with', 'info', 'child.grandchild.2', {child: 1, grandchild: 1, meta: 2});

        // Check they both have the same parent logger
        expect(child._parent, 'to equal', logger);
        expect(grandchild._parent, 'to equal', logger);
    });

    it('Installs .getContext() on winston with .patchWinstonWithGetContext', function () {
        WinstonContext.patchWinstonWithGetContext(logger);

        expect(logger, 'to have property', 'getContext');
        expect(logger.getContext, 'to be a function');

        var ctx = logger.getContext('a', {meta: 1});

        expect(ctx, 'to be a', WinstonContext);
    });

    it('Context with only metadata doesn\'t change name when logging', function () {
        var ctx = new WinstonContext(logger, '', {meta: 1});

        ctx.info('test');

        expect(spy, 'was called once');
        expect(spy, 'was called with', 'info', 'test', {meta: 1});
    });

    it('Context with only name doesn\'t change metadata when logging', function () {
        var ctx = new WinstonContext(logger, 'name');

        ctx.info('test');

        expect(spy, 'was called once');
        expect(spy, 'was called with', 'info', 'name.test');
    });

    it('Context with neither metadata nor name doesn\'t change logger', function () {
        var ctx = new WinstonContext(logger);

        ctx.info('test', {meta: 1});

        expect(spy, 'was called once');
        expect(spy, 'was called with', 'info', 'test', {meta: 1});
    });

    it('Logged metadata overwrites what\'s in the context', function () {
        var ctx = new WinstonContext(logger, null, {meta: 1});

        ctx.info('test', {meta: 2});

        expect(spy, 'was called once');
        expect(spy, 'was called with', 'info', 'test', {meta: 2});
    });

    it('Handles multiple metadata-contexts', function () {
        var ctx = new WinstonContext(logger, null, {a: 1, b: 2, c: 4});

        ctx.info('test', {c: 3}, {d: 4});

        expect(spy, 'was called once');
        expect(spy, 'was called with', 'info', 'test', {a: 1, b: 2, c: 3, d: 4});
    });

    describe('Placeholders', function () {
        it('Handles %s placeholders', function () {
            var ctx = new WinstonContext(logger, null, {a: 1});

            ctx.info('test %s %s %s', {context: 1}, 'foo', 1);

            expect(spy, 'was called once');
            expect(spy, 'was called with', 'info', 'test foo 1 %s', {a: 1, context: 1});
        });

        it('log.info(%s, a, b) -> "a b"', function () {
            var ctx = new WinstonContext(logger);

            ctx.info('%s', {context: 1}, 'a', 'b');

            expect(spy, 'was called once');
            expect(spy, 'was called with', 'info', 'a b', {context: 1});
        });
    });

    it('Doesn\'t break horribly in non-winston logger', function () {
        expect(function () {
            new WinstonContext({log: function () {}}, null, {});
        }, 'not to throw');
    });
});
