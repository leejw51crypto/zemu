"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var PROTO_PATH = "".concat(__dirname, "/zemu.proto");

var protoLoader = require("@grpc/proto-loader");

var grpc = require("@grpc/grpc-js");

var GRPCRouter = /*#__PURE__*/function () {
  function GRPCRouter(ip, port) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var transport = arguments.length > 3 ? arguments[3] : undefined;
    (0, _classCallCheck2["default"])(this, GRPCRouter);
    this.httpTransport = transport;
    this.serverAddress = "".concat(ip, ":").concat(port);
    this.server = new grpc.Server();
    this.debug_en = false;

    if ("debug" in options) {
      this.debug_en = options.debug;
    }
  }

  (0, _createClass2["default"])(GRPCRouter, [{
    key: "startServer",
    value: function () {
      var _startServer = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var _this = this;

        var self, packageDefinition, rpcDefinition;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                self = this;
                _context.next = 3;
                return protoLoader.load(PROTO_PATH, {
                  keepCase: true,
                  longs: String,
                  enums: String,
                  defaults: true,
                  oneofs: true
                });

              case 3:
                packageDefinition = _context.sent;
                rpcDefinition = grpc.loadPackageDefinition(packageDefinition);
                this.server.addService(rpcDefinition.ledger_go.ZemuCommand.service, {
                  Exchange: function Exchange(call, callback) {
                    var ctx = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : self;
                    ctx.httpTransport.exchange(call.request.command).then(function (response) {
                      if (self.debug_en) {
                        var x = Buffer.from(call.request.command, "hex");
                        x = x.slice(6, 6 + x[5]).toString("ascii");

                        if (x.includes("oasis-")) {
                          console.log(x);
                        }
                      }

                      callback(null, {
                        reply: response
                      });
                    });
                  }
                });
                this.server.bindAsync(this.serverAddress, grpc.ServerCredentials.createInsecure(), // eslint-disable-next-line no-unused-vars
                function (err, port) {
                  if (err != null) {
                    return console.error(err);
                  }

                  console.log("gRPC listening on ".concat(port));

                  _this.server.start();
                });
                console.log("grpc server started on", this.serverAddress);

              case 8:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function startServer() {
        return _startServer.apply(this, arguments);
      }

      return startServer;
    }()
  }, {
    key: "stopServer",
    value: function stopServer() {
      this.server.forceShutdown();
    }
  }]);
  return GRPCRouter;
}();

exports["default"] = GRPCRouter;