node-winston-context
====================

Contextual logger for Winston, here used for adding per-request context to
server logs:

    var WinstonContext = require('winston-context');
    var logger = require('winston');
    
    // Create a per-request child
    var requestCtx = new WinstonContext(logger, '', {
        requestId: (Math.random()* 1e20).toString(36)
    });

    requestCtx.info('server.init'); // info: server.init requestId=2yn869172v40g

    // User is authenticated, so we add userId
    requestCtx = requestCtx.getContext('', { userId: 42 });

    requestCtx.info('auth.ok'); // info: auth.ok requestId=2yn869172v40g userId=42

    // We now have to log a lot of stuff for this user in a specific place
    var log = requestCtx.getContext('server.system.subsystem');

    log.warn('err', { what: 'User not found' }); // warn: sever.system.subsystem.err requestId=2yn869172v40g userId=24 waht="User not found"


API
---

`ctx = new WinstonContext(logger, [prefix, [meta]])` Creates a new contextual logger.
It mocks `.log` and the per-level helpers set on the original `logger`.

`ctx.log(level, name, meta, [meta, [...,]] callback)` and
`ctx.{silly,debug,verbose,info,warn,error}(name, meta, callback)` (or whatever
else level-names you've given Winston) behave like they use to, except the
added contextual prefix, metadata and allows handling multiple meta-objects.

`ctx.getContext([prefix, [meta]])` gets a contextual logger with the
added prefix/meta-data. May be called recursively. Also of note is that it
computes the complete prefix and meta-data at instantiation and gets a direct
pointer to the parent logger (thus making long inheritance-chains performant).

`WinstonContext.patchWinstonWithGetContext(winstonInstance)` Monkey-patches the
given instance of Winston with a `.getContext()` method that hands out new
contexts as above.


Bugs
----

Plenty! Please [report them](https://github.com/citrix-research/node-winston-context/issues).


License
-------

ISC
